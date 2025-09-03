import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Button, Avatar, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockArtists, currentUser } from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "system";
  isRead: boolean;
}

interface ChatUIScreenProps {
  route: {
    params: {
      artistId: string;
    };
  };
  onBack?: () => void;
  onArtistPress?: (artistId: string) => void;
}

export const ChatUIScreen: React.FC<ChatUIScreenProps> = ({
  route,
  onBack,
  onArtistPress,
}) => {
  const { artistId } = route.params;
  const artist = mockArtists.find((a) => a.id === artistId);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: artistId,
      senderName: artist?.name || "アーティスト",
      senderAvatar: artist?.avatar,
      content:
        "こんにちは！お問い合わせありがとうございます。どのようなタトゥーをお考えでしょうか？",
      timestamp: new Date(Date.now() - 3600000),
      type: "text",
      isRead: true,
    },
    {
      id: "2",
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content:
        "龍のデザインに興味があります。背中に入れたいと思っているのですが、どのくらいの価格帯になりますでしょうか？",
      timestamp: new Date(Date.now() - 3300000),
      type: "text",
      isRead: true,
    },
    {
      id: "3",
      senderId: artistId,
      senderName: artist?.name || "アーティスト",
      senderAvatar: artist?.avatar,
      content:
        "龍のデザインですね！サイズや詳細によって変わりますが、背中一面でしたら20-30万円程度になります。まずはカウンセリングでご相談させていただければと思います。",
      timestamp: new Date(Date.now() - 3000000),
      type: "text",
      isRead: true,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: inputText.trim(),
      timestamp: new Date(),
      type: "text",
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate artist typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      // Simulate artist response
      const responses = [
        "ありがとうございます。詳細について相談させていただきましょう。",
        "かしこまりました。お時間のある時にスタジオまでお越しください。",
        "そちらの件について、詳しくお話しさせていただきたいと思います。",
        "ご質問ありがとうございます。詳細をご説明いたします。",
      ];

      const artistResponse: Message = {
        id: (Date.now() + 1).toString(),
        senderId: artistId,
        senderName: artist?.name || "アーティスト",
        senderAvatar: artist?.avatar,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        type: "text",
        isRead: false,
      };

      setMessages((prev) => [...prev, artistResponse]);
    }, 2000);
  };

  const handleImageUpload = () => {
    Alert.alert("画像送信", "画像を選択してください", [
      { text: "キャンセル", style: "cancel" },
      { text: "カメラ", onPress: () => mockImageSend("camera") },
      { text: "ライブラリ", onPress: () => mockImageSend("library") },
    ]);
  };

  const mockImageSend = (source: string) => {
    setToastMessage(
      `${source === "camera" ? "カメラ" : "ライブラリ"}から画像を送信しました`,
    );
    setShowToast(true);

    const imageMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: "📷 画像を送信しました",
      timestamp: new Date(),
      type: "image",
      isRead: false,
    };

    setMessages((prev) => [...prev, imageMessage]);
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const quickReplies = [
    "料金について教えてください",
    "予約可能日を確認したいです",
    "カウンセリングを希望します",
    "ポートフォリオを拝見したいです",
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser
            ? styles.messageContainerSent
            : styles.messageContainerReceived,
        ]}
      >
        {!isCurrentUser && (
          <Avatar
            imageUrl={item.senderAvatar}
            name={item.senderName}
            size="small"
            style={styles.messageAvatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.messageBubbleSent
              : styles.messageBubbleReceived,
            item.type === "image" && styles.messageBubbleImage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser
                ? styles.messageTextSent
                : styles.messageTextReceived,
            ]}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isCurrentUser
                ? styles.messageTimeSent
                : styles.messageTimeReceived,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <Avatar
          imageUrl={artist?.avatar}
          name={artist?.name || "アーティスト"}
          size="small"
          style={styles.messageAvatar}
        />
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  const renderQuickReplies = () => (
    <View style={styles.quickRepliesContainer}>
      <Text style={styles.quickRepliesTitle}>よく使う質問</Text>
      <View style={styles.quickReplies}>
        {quickReplies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReplyButton}
            onPress={() => handleQuickReply(reply)}
          >
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!artist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            アーティストが見つかりませんでした
          </Text>
          <Button title="戻る" onPress={onBack} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.artistInfo}
            onPress={() => onArtistPress?.(artist.id)}
          >
            <Avatar
              imageUrl={artist.avatar}
              name={artist.name}
              size="medium"
              showBadge={artist.isVerified}
            />
            <View style={styles.artistDetails}>
              <Text style={styles.artistName}>{artist.name}</Text>
              <Text style={styles.artistStatus}>オンライン</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerAction}>
            <Text style={styles.headerActionIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Quick Replies */}
        {renderQuickReplies()}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleImageUpload}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="メッセージを入力..."
            placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() && styles.sendButtonActive,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Text
              style={[
                styles.sendIcon,
                inputText.trim() && styles.sendIconActive,
              ]}
            >
              ➤
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
        position="top"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignTokens.spacing[6],
  },
  errorText: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[6],
    textAlign: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing[3],
  },
  backIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  artistInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  artistDetails: {
    marginLeft: DesignTokens.spacing[3],
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  artistStatus: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.neon,
    marginTop: 2,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionIcon: {
    fontSize: 16,
  },

  // Messages
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: DesignTokens.spacing[4],
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: DesignTokens.spacing[1],
    paddingHorizontal: DesignTokens.spacing[4],
  },
  messageContainerSent: {
    justifyContent: "flex-end",
  },
  messageContainerReceived: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginRight: DesignTokens.spacing[2],
    alignSelf: "flex-end",
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.lg,
  },
  messageBubbleSent: {
    backgroundColor: DesignTokens.colors.primary[500],
    marginLeft: DesignTokens.spacing[8],
  },
  messageBubbleReceived: {
    backgroundColor: DesignTokens.colors.dark.surface,
    marginRight: DesignTokens.spacing[8],
  },
  messageBubbleImage: {
    backgroundColor: DesignTokens.colors.dark.elevated,
  },
  messageText: {
    fontSize: DesignTokens.typography.sizes.md,
    lineHeight: 20,
  },
  messageTextSent: {
    color: DesignTokens.colors.dark.text.primary,
  },
  messageTextReceived: {
    color: DesignTokens.colors.dark.text.primary,
  },
  messageTime: {
    fontSize: DesignTokens.typography.sizes.xs,
    marginTop: DesignTokens.spacing[1],
    alignSelf: "flex-end",
  },
  messageTimeSent: {
    color: DesignTokens.colors.dark.text.secondary,
  },
  messageTimeReceived: {
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: "row",
    marginVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[4],
  },
  typingBubble: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    marginRight: DesignTokens.spacing[8],
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.colors.dark.text.tertiary,
  },
  typingDot1: {
    animationDelay: "0ms",
  },
  typingDot2: {
    animationDelay: "150ms",
  },
  typingDot3: {
    animationDelay: "300ms",
  },

  // Quick Replies
  quickRepliesContainer: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  quickRepliesTitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[2],
    fontWeight: DesignTokens.typography.weights.medium,
  },
  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[2],
  },
  quickReplyButton: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },
  quickReplyText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
  },

  // Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
    gap: DesignTokens.spacing[3],
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  attachIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.secondary,
  },
  textInput: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    maxHeight: 100,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.text.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: DesignTokens.colors.primary[500],
  },
  sendIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.secondary,
  },
  sendIconActive: {
    color: DesignTokens.colors.dark.text.primary,
  },
});

export default ChatUIScreen;
