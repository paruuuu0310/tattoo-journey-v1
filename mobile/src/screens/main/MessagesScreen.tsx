import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Avatar, Tag } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockArtists, currentUser } from "../../../mocks/fixtures";

interface ChatPreview {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  chatType: "inquiry" | "booking" | "general";
}

interface MessagesScreenProps {
  onChatPress?: (artistId: string) => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onChatPress }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "unread" | "booking"
  >("all");

  // Mock chat data
  const [chats] = useState<ChatPreview[]>([
    {
      id: "chat-1",
      participantId: "artist-1",
      participantName: "TAKESHI",
      participantAvatar: "https://picsum.photos/100/100?random=10",
      lastMessage: "龍のデザインですね！サイズや詳細によって変わりますが...",
      lastMessageTime: new Date(Date.now() - 300000), // 5 minutes ago
      unreadCount: 2,
      isOnline: true,
      chatType: "booking",
    },
    {
      id: "chat-2",
      participantId: "artist-2",
      participantName: "YUKI",
      participantAvatar: "https://picsum.photos/100/100?random=11",
      lastMessage: "ありがとうございました！また何かあればお声がけください。",
      lastMessageTime: new Date(Date.now() - 7200000), // 2 hours ago
      unreadCount: 0,
      isOnline: false,
      chatType: "general",
    },
  ]);

  const filters = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "booking", label: "予約関連" },
  ];

  const filteredChats = chats.filter((chat) => {
    // Search filter
    if (searchText.trim()) {
      const matchesSearch =
        chat.participantName.toLowerCase().includes(searchText.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchText.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Type filter
    switch (selectedFilter) {
      case "unread":
        return chat.unreadCount > 0;
      case "booking":
        return chat.chatType === "booking";
      default:
        return true;
    }
  });

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  const getChatTypeColor = (type: ChatPreview["chatType"]) => {
    switch (type) {
      case "booking":
        return DesignTokens.colors.primary[500];
      case "inquiry":
        return DesignTokens.colors.accent.gold;
      default:
        return DesignTokens.colors.dark.text.secondary;
    }
  };

  const getChatTypeLabel = (type: ChatPreview["chatType"]) => {
    switch (type) {
      case "booking":
        return "予約";
      case "inquiry":
        return "問い合わせ";
      default:
        return "";
    }
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onChatPress?.(item.participantId)}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          imageUrl={item.participantAvatar}
          name={item.participantName}
          size="large"
        />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.participantName}>{item.participantName}</Text>
          <View style={styles.chatMeta}>
            {item.chatType !== "general" && (
              <View
                style={[
                  styles.chatTypeBadge,
                  { backgroundColor: getChatTypeColor(item.chatType) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.chatTypeText,
                    { color: getChatTypeColor(item.chatType) },
                  ]}
                >
                  {getChatTypeLabel(item.chatType)}
                </Text>
              </View>
            )}
            <Text style={styles.messageTime}>
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>
        </View>

        <View style={styles.messagePreview}>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>メッセージがありません</Text>
      <Text style={styles.emptyMessage}>
        アーティストとの会話がここに表示されます
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>メッセージ</Text>
        <Text style={styles.headerSubtitle}>
          {filteredChats.length}件のチャット
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="メッセージを検索..."
          placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <Tag
            key={filter.key}
            label={filter.label}
            selected={selectedFilter === filter.key}
            onPress={() => setSelectedFilter(filter.key as any)}
            variant={selectedFilter === filter.key ? "accent" : "default"}
            size="small"
            style={styles.filterTag}
          />
        ))}
      </View>

      {/* Chat List */}
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },

  // Header
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  headerTitle: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
  },
  searchInput: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },

  // Filters
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
  },
  filterTag: {
    marginBottom: 0,
  },

  // Chat List
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  avatarContainer: {
    position: "relative",
    marginRight: DesignTokens.spacing[4],
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DesignTokens.colors.accent.neon,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.background,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[1],
  },
  participantName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  chatTypeBadge: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  chatTypeText: {
    fontSize: DesignTokens.typography.sizes.xs,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  messageTime: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
  },
  messagePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  lastMessage: {
    flex: 1,
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 18,
    marginRight: DesignTokens.spacing[3],
  },
  unreadBadge: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: DesignTokens.radius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: DesignTokens.typography.sizes.xs,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: DesignTokens.spacing[4],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  emptyMessage: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default MessagesScreen;
