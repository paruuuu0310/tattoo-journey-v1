import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ChatService, { ChatRoom } from "../../services/ChatService";

interface Props {
  navigation: any;
}

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile?.uid) {
      initializeChatList();

      // オンライン状態を設定
      ChatService.setUserOnlineStatus(userProfile.uid, true);
    }

    return () => {
      if (userProfile?.uid) {
        ChatService.setUserOnlineStatus(userProfile.uid, false);
      }
    };
  }, [userProfile?.uid]);

  const initializeChatList = async () => {
    if (!userProfile?.uid) return;

    setIsLoading(true);

    try {
      // 初期の未読数を取得
      const unreadCount = await ChatService.getUnreadCount(userProfile.uid);
      setTotalUnreadCount(unreadCount);

      // リアルタイムでチャットルームを監視
      const unsubscribe = ChatService.subscribeToUserChatRooms(
        userProfile.uid,
        (rooms) => {
          setChatRooms(rooms);

          // 未読数を計算
          const totalUnread = rooms.reduce((total, room) => {
            return total + (room.unreadCount[userProfile.uid] || 0);
          }, 0);
          setTotalUnreadCount(totalUnread);

          setIsLoading(false);
        },
        (error) => {
          console.error("Chat rooms subscription error:", error);
          Alert.alert("エラー", "チャット一覧の取得に失敗しました");
          setIsLoading(false);
        },
      );

      // クリーンアップのためにunsubscribeを保存
      return unsubscribe;
    } catch (error) {
      console.error("Chat list initialization error:", error);
      setIsLoading(false);
    }
  };

  const navigateToChat = (room: ChatRoom) => {
    navigation.navigate("Chat", {
      roomId: room.id,
      context: room.metadata?.context || "direct_inquiry",
    });
  };

  const formatLastMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}分前`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}時間前`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}日前`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getOtherParticipantName = (room: ChatRoom): string => {
    if (userProfile?.userType === "customer") {
      return room.metadata?.artistName || "アーティスト";
    } else {
      return room.metadata?.customerName || "お客様";
    }
  };

  const getContextDisplay = (
    context?: string,
  ): { text: string; color: string } => {
    switch (context) {
      case "matching":
        return { text: "マッチング", color: "#4ade80" };
      case "booking":
        return { text: "予約相談", color: "#facc15" };
      case "direct_inquiry":
      default:
        return { text: "問い合わせ", color: "#3b82f6" };
    }
  };

  const truncateMessage = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const unreadCount = item.unreadCount[userProfile?.uid || ""] || 0;
    const otherParticipantName = getOtherParticipantName(item);
    const lastMessageText =
      item.lastMessage?.text || "まだメッセージがありません";
    const contextDisplay = getContextDisplay(item.metadata?.context);

    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => navigateToChat(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherParticipantName.charAt(0)}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatRoomContent}>
          <View style={styles.chatRoomHeader}>
            <Text style={styles.participantName}>{otherParticipantName}</Text>

            <View style={styles.headerRight}>
              <View
                style={[
                  styles.contextBadge,
                  { backgroundColor: contextDisplay.color + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.contextBadgeText,
                    { color: contextDisplay.color },
                  ]}
                >
                  {contextDisplay.text}
                </Text>
              </View>

              {item.lastMessageTime && (
                <Text style={styles.lastMessageTime}>
                  {formatLastMessageTime(item.lastMessageTime)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.lastMessageContainer}>
            <Text
              style={[
                styles.lastMessageText,
                unreadCount > 0 && styles.unreadMessageText,
              ]}
            >
              {item.lastMessage?.type === "system" && "🤖 "}
              {item.lastMessage?.type === "booking_request" && "📅 "}
              {truncateMessage(lastMessageText)}
            </Text>
          </View>

          {item.metadata?.estimatedPrice && (
            <View style={styles.priceInfo}>
              <Text style={styles.priceInfoText}>
                見積もり: ¥{item.metadata.estimatedPrice.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>チャット一覧を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>メッセージ</Text>
        {totalUnreadCount > 0 && (
          <View style={styles.totalUnreadBadge}>
            <Text style={styles.totalUnreadText}>
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </Text>
          </View>
        )}
      </View>

      {chatRooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
          <Text style={styles.emptyStateText}>まだチャットがありません</Text>
          <Text style={styles.emptyStateSubtext}>
            {userProfile?.userType === "customer"
              ? "アーティストを検索して問い合わせしてみましょう"
              : "お客様からの問い合わせをお待ちください"}
          </Text>

          {userProfile?.userType === "customer" && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate("ImageUpload")}
            >
              <Text style={styles.searchButtonText}>アーティストを探す</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id}
          style={styles.chatRoomsList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  totalUnreadBadge: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  totalUnreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  searchButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatRoomsList: {
    flex: 1,
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff6b6b",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  chatRoomContent: {
    flex: 1,
  },
  chatRoomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  contextBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  contextBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  lastMessageTime: {
    fontSize: 12,
    color: "#aaa",
  },
  lastMessageContainer: {
    marginBottom: 4,
  },
  lastMessageText: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 18,
  },
  unreadMessageText: {
    color: "#fff",
    fontWeight: "500",
  },
  priceInfo: {
    marginTop: 4,
  },
  priceInfoText: {
    fontSize: 12,
    color: "#4ade80",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#333",
    marginLeft: 78,
  },
});

export default ChatListScreen;
