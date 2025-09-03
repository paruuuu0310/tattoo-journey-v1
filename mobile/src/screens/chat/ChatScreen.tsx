import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ChatService, { ChatMessage, ChatRoom } from "../../services/ChatService";

interface Props {
  route: {
    params: {
      artistId?: string;
      roomId?: string;
      context?: "matching" | "direct_inquiry" | "booking";
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const {
    artistId,
    roomId: initialRoomId,
    context = "direct_inquiry",
  } = route.params;

  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserName, setOtherUserName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribers = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (userProfile?.uid) {
      initializeChat();

      // オンライン状態を設定
      ChatService.setUserOnlineStatus(userProfile.uid, true);
    }

    return () => {
      // クリーンアップ
      unsubscribers.current.forEach((unsubscribe) => unsubscribe());

      if (userProfile?.uid) {
        ChatService.setUserOnlineStatus(userProfile.uid, false);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userProfile?.uid, artistId, initialRoomId]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);

      let currentRoomId = initialRoomId;

      if (!currentRoomId && artistId && userProfile?.uid) {
        // 新しいチャットルームを作成
        currentRoomId = await ChatService.getOrCreateChatRoom(
          userProfile.uid,
          artistId,
          context,
        );
      }

      if (currentRoomId) {
        setRoomId(currentRoomId);

        // メッセージ履歴を取得
        const messageHistory =
          await ChatService.getMessageHistory(currentRoomId);
        setMessages(messageHistory);

        // リアルタイムメッセージリスニング開始
        const messageUnsubscriber = ChatService.subscribeToMessages(
          currentRoomId,
          (newMessage) => {
            setMessages((prev) => {
              // 重複チェック
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;

              const updated = [...prev, newMessage];

              // 自動スクロール
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);

              return updated;
            });

            // 自分のメッセージでなければ既読にする
            if (newMessage.senderId !== userProfile?.uid && userProfile?.uid) {
              ChatService.markMessagesAsRead(currentRoomId!, userProfile.uid);
            }
          },
          (error) => {
            console.error("Message subscription error:", error);
            Alert.alert("エラー", "メッセージの受信に失敗しました");
          },
        );

        // タイピング状態のリスニング
        const typingUnsubscriber = ChatService.subscribeToTypingStatus(
          currentRoomId,
          userProfile?.uid || "",
          (isTyping, userId) => {
            setOtherUserTyping(isTyping);
          },
        );

        // 相手のオンライン状態を監視
        const otherUserId = currentRoomId
          .split("_")
          .find((id) => id !== userProfile?.uid);
        if (otherUserId) {
          const presenceUnsubscriber = ChatService.subscribeToUserPresence(
            otherUserId,
            (isOnline, lastSeen) => {
              setOtherUserOnline(isOnline);
            },
          );
          unsubscribers.current.push(presenceUnsubscriber);

          // 相手の名前を取得
          // （実際の実装では Firestore から取得）
          setOtherUserName("アーティスト");
        }

        unsubscribers.current.push(messageUnsubscriber, typingUnsubscriber);

        // 既読にする
        if (userProfile?.uid) {
          await ChatService.markMessagesAsRead(currentRoomId, userProfile.uid);
        }
      }
    } catch (error) {
      console.error("Chat initialization error:", error);
      Alert.alert("エラー", "チャットの初期化に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !roomId || !userProfile?.uid || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      await ChatService.sendMessage(roomId, userProfile.uid, messageText);

      // タイピング状態をクリア
      await ChatService.setTypingStatus(roomId, userProfile.uid, false);
      setIsTyping(false);
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("エラー", "メッセージの送信に失敗しました");
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!roomId || !userProfile?.uid) return;

    // タイピング状態の管理
    if (!isTyping && text.trim()) {
      setIsTyping(true);
      ChatService.setTypingStatus(roomId, userProfile.uid, true);
    }

    // タイピング停止タイマー
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (roomId && userProfile?.uid) {
        ChatService.setTypingStatus(roomId, userProfile.uid, false);
        setIsTyping(false);
      }
    }, 2000);
  };

  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === userProfile?.uid;
    const isSystemMessage = item.type === "system";

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <Text style={styles.systemMessageTime}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {item.type === "booking_request" && (
            <View style={styles.bookingRequestHeader}>
              <Text style={styles.bookingRequestHeaderText}>
                📅 予約リクエスト
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>

          {item.metadata?.priceQuote && (
            <View style={styles.priceQuoteContainer}>
              <Text style={styles.priceQuoteText}>
                見積もり: ¥{item.metadata.priceQuote.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatMessageTime(item.timestamp)}
            </Text>

            {isMyMessage && (
              <View style={styles.messageStatus}>
                <Text style={styles.messageStatusText}>
                  {item.read ? "既読" : "未読"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>{otherUserName}が入力中...</Text>
          <ActivityIndicator size="small" color="#aaa" />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>チャットを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUserName}</Text>
            <Text style={styles.headerStatus}>
              {otherUserOnline ? "オンライン" : "最終ログイン時刻"}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* メッセージリスト */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {renderTypingIndicator()}

        {/* 入力エリア */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="メッセージを入力..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>送信</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    color: "#ff6b6b",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerStatus: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    color: "#aaa",
    fontSize: 20,
    fontWeight: "bold",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  myMessageBubble: {
    backgroundColor: "#ff6b6b",
  },
  otherMessageBubble: {
    backgroundColor: "#333",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  systemMessageText: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemMessageTime: {
    color: "#666",
    fontSize: 10,
    marginTop: 4,
  },
  bookingRequestHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  bookingRequestHeaderText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#fff",
  },
  priceQuoteContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  priceQuoteText: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "bold",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: "#aaa",
  },
  messageStatus: {
    marginLeft: 8,
  },
  messageStatusText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  typingText: {
    color: "#aaa",
    fontSize: 12,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    paddingTop: 8,
    backgroundColor: "#2a2a2a",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    backgroundColor: "#666",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;
