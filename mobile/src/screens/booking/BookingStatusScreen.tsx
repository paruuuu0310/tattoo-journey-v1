import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import BookingService, { BookingRequest } from "../../services/BookingService";
import ChatService from "../../services/ChatService";

interface Props {
  navigation: any;
}

interface BookingStatusProps {
  booking: BookingRequest;
  onPress: (booking: BookingRequest) => void;
}

const BookingCard: React.FC<BookingStatusProps> = ({ booking, onPress }) => {
  const getStatusColor = (status: BookingRequest["status"]): string => {
    const colors = {
      pending: "#facc15",
      accepted: "#4ade80",
      declined: "#ef4444",
      negotiating: "#3b82f6",
      confirmed: "#10b981",
      completed: "#6b7280",
      cancelled: "#ef4444",
    };
    return colors[status];
  };

  const getStatusLabel = (status: BookingRequest["status"]): string => {
    const labels = {
      pending: "承認待ち",
      accepted: "承認済み",
      declined: "お断り",
      negotiating: "調整中",
      confirmed: "確定済み",
      completed: "完了",
      cancelled: "キャンセル",
    };
    return labels[status];
  };

  const getStatusIcon = (status: BookingRequest["status"]): string => {
    const icons = {
      pending: "⏳",
      accepted: "✅",
      declined: "❌",
      negotiating: "🔄",
      confirmed: "🎉",
      completed: "✨",
      cancelled: "❌",
    };
    return icons[status];
  };

  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => onPress(booking)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{getStatusIcon(booking.status)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.bookingDate}>
          {booking.createdAt.toLocaleDateString("ja-JP")}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.tattooDescription} numberOfLines={2}>
          {booking.tattooDescription}
        </Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>部位:</Text>
          <Text style={styles.detailValue}>{booking.bodyLocation}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>希望日時:</Text>
          <Text style={styles.detailValue}>
            {booking.preferredDate.toLocaleDateString("ja-JP")}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>予算:</Text>
          <Text style={styles.detailValue}>
            ¥{booking.budgetRange.min.toLocaleString()} - ¥
            {booking.budgetRange.max.toLocaleString()}
          </Text>
        </View>

        {booking.responses.length > 0 && (
          <View style={styles.responseIndicator}>
            <Text style={styles.responseCount}>
              💬 {booking.responses.length}件の返信
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.updatedAt}>
          更新: {booking.updatedAt.toLocaleString("ja-JP")}
        </Text>
        <Text style={styles.viewDetails}>詳細を見る →</Text>
      </View>
    </TouchableOpacity>
  );
};

const BookingStatusScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const isArtist = userProfile?.userType === "artist";
  const isCustomer = userProfile?.userType === "customer";

  useEffect(() => {
    if (userProfile?.uid) {
      loadBookings();
    }
  }, [userProfile]);

  const loadBookings = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      setIsLoading(true);
      const userBookings = await BookingService.getUserBookings(
        userProfile.uid,
        userProfile.userType || "customer",
      );
      setBookings(userBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      Alert.alert("エラー", "予約情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleBookingPress = async (booking: BookingRequest): Promise<void> => {
    try {
      // チャットルームを取得または作成
      const roomId = await ChatService.getOrCreateChatRoom(
        booking.customerId,
        booking.artistId,
        "booking",
      );

      navigation.navigate("BookingChat", {
        bookingId: booking.id,
        roomId,
      });
    } catch (error) {
      console.error("Error navigating to booking chat:", error);
      Alert.alert("エラー", "チャット画面の表示に失敗しました");
    }
  };

  const getFilteredBookings = (): BookingRequest[] => {
    switch (filter) {
      case "active":
        return bookings.filter((b) =>
          ["pending", "accepted", "negotiating", "confirmed"].includes(
            b.status,
          ),
        );
      case "completed":
        return bookings.filter((b) =>
          ["completed", "cancelled", "declined"].includes(b.status),
        );
      default:
        return bookings;
    }
  };

  const getEmptyMessage = (): string => {
    if (filter === "active") {
      return isArtist
        ? "アクティブな予約リクエストはありません"
        : "アクティブな予約はありません";
    }
    if (filter === "completed") {
      return "完了した予約はありません";
    }
    return isArtist ? "予約リクエストはありません" : "予約履歴はありません";
  };

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isArtist ? "予約管理" : "予約履歴"}</Text>
      </View>

      {/* フィルターボタン */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.activeFilterButton,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "all" && styles.activeFilterButtonText,
            ]}
          >
            すべて ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "active" && styles.activeFilterButton,
          ]}
          onPress={() => setFilter("active")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "active" && styles.activeFilterButtonText,
            ]}
          >
            進行中 (
            {
              bookings.filter((b) =>
                ["pending", "accepted", "negotiating", "confirmed"].includes(
                  b.status,
                ),
              ).length
            }
            )
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "completed" && styles.activeFilterButton,
          ]}
          onPress={() => setFilter("completed")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "completed" && styles.activeFilterButtonText,
            ]}
          >
            完了 (
            {
              bookings.filter((b) =>
                ["completed", "cancelled", "declined"].includes(b.status),
              ).length
            }
            )
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={handleBookingPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            {isCustomer && bookings.length === 0 && (
              <TouchableOpacity
                style={styles.findArtistButton}
                onPress={() => navigation.navigate("ImageUpload")}
              >
                <Text style={styles.findArtistButtonText}>
                  アーティストを探す
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#ff6b6b",
  },
  filterButtonText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingDate: {
    color: "#aaa",
    fontSize: 12,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tattooDescription: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    color: "#aaa",
    fontSize: 14,
    width: 80,
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  responseIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  responseCount: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  updatedAt: {
    color: "#666",
    fontSize: 11,
  },
  viewDetails: {
    color: "#ff6b6b",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  findArtistButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  findArtistButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BookingStatusScreen;
