import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import BookingService, {
  BookingRequest,
  BookingResponse,
} from "../../services/BookingService";
import ChatService from "../../services/ChatService";

interface Props {
  route: {
    params: {
      bookingId: string;
      roomId: string;
    };
  };
  navigation: any;
}

interface BookingAction {
  type: "accept" | "decline" | "counter_offer" | "request_info" | "cancel";
  label: string;
  color: string;
  icon: string;
}

const BookingChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { bookingId, roomId } = route.params;

  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<BookingAction | null>(
    null,
  );
  const [responseMessage, setResponseMessage] = useState<string>("");

  const isArtist = userProfile?.userType === "artist";
  const isCustomer = userProfile?.userType === "customer";

  const actions: BookingAction[] = [
    {
      type: "accept",
      label: "承認",
      color: "#4ade80",
      icon: "✅",
    },
    {
      type: "decline",
      label: "お断り",
      color: "#ef4444",
      icon: "❌",
    },
    {
      type: "counter_offer",
      label: "代替案提示",
      color: "#facc15",
      icon: "🔄",
    },
    {
      type: "request_info",
      label: "詳細確認",
      color: "#3b82f6",
      icon: "❓",
    },
    {
      type: "cancel",
      label: "キャンセル",
      color: "#ef4444",
      icon: "❌",
    },
  ];

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async (): Promise<void> => {
    try {
      setIsLoading(true);

      const bookings = await BookingService.getUserBookings(
        userProfile?.uid || "",
        userProfile?.userType || "customer",
      );

      const currentBooking = bookings.find((b) => b.id === bookingId);
      if (currentBooking) {
        setBooking(currentBooking);
      }
    } catch (error) {
      console.error("Error loading booking details:", error);
      Alert.alert("エラー", "予約詳細の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: BookingAction): void => {
    setSelectedAction(action);
    setShowActionModal(true);
  };

  const executeAction = async (): Promise<void> => {
    if (!selectedAction || !booking || !userProfile?.uid) return;

    try {
      switch (selectedAction.type) {
        case "accept":
          await handleAccept();
          break;
        case "decline":
          await handleDecline();
          break;
        case "counter_offer":
          await handleCounterOffer();
          break;
        case "request_info":
          await handleRequestInfo();
          break;
        case "cancel":
          await handleCancel();
          break;
      }

      setShowActionModal(false);
      setResponseMessage("");
      await loadBookingDetails();
    } catch (error) {
      console.error("Error executing action:", error);
      Alert.alert("エラー", "操作に失敗しました");
    }
  };

  const handleAccept = async (): Promise<void> => {
    if (!booking || !userProfile?.uid) return;

    const response: Omit<BookingResponse, "id" | "responderId" | "createdAt"> =
      {
        responseType: "accept",
        message:
          responseMessage ||
          "ご予約を承認いたします。詳細を相談させていただきます。",
      };

    await BookingService.respondToBookingRequest(
      booking.id,
      userProfile.uid,
      response,
    );
    Alert.alert("完了", "予約を承認しました");
  };

  const handleDecline = async (): Promise<void> => {
    if (!booking || !userProfile?.uid) return;

    const response: Omit<BookingResponse, "id" | "responderId" | "createdAt"> =
      {
        responseType: "decline",
        message:
          responseMessage || "申し訳ございませんが、ご希望にお応えできません。",
      };

    await BookingService.respondToBookingRequest(
      booking.id,
      userProfile.uid,
      response,
    );
    Alert.alert("完了", "予約をお断りしました");
  };

  const handleCounterOffer = async (): Promise<void> => {
    if (!booking || !userProfile?.uid) return;

    // 代替案提示の詳細入力画面に遷移
    navigation.navigate("CounterOfferScreen", {
      bookingId: booking.id,
      roomId,
      originalRequest: booking,
    });
    setShowActionModal(false);
  };

  const handleRequestInfo = async (): Promise<void> => {
    if (!booking || !userProfile?.uid) return;

    const response: Omit<BookingResponse, "id" | "responderId" | "createdAt"> =
      {
        responseType: "request_info",
        message: responseMessage || "詳細についてお聞かせください。",
      };

    await BookingService.respondToBookingRequest(
      booking.id,
      userProfile.uid,
      response,
    );
    Alert.alert("完了", "詳細確認メッセージを送信しました");
  };

  const handleCancel = async (): Promise<void> => {
    if (!booking || !userProfile?.uid) return;

    Alert.alert("予約キャンセル", "本当にキャンセルしますか？", [
      { text: "いいえ", style: "cancel" },
      {
        text: "キャンセル",
        style: "destructive",
        onPress: async () => {
          await BookingService.cancelBooking(
            booking.id,
            userProfile.uid,
            responseMessage || "ユーザーによりキャンセルされました",
          );
          Alert.alert("完了", "予約をキャンセルしました");
          setShowActionModal(false);
        },
      },
    ]);
  };

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

  const getAvailableActions = (): BookingAction[] => {
    if (!booking) return [];

    const { status } = booking;
    const userIsParticipant =
      booking.customerId === userProfile?.uid ||
      booking.artistId === userProfile?.uid;

    if (!userIsParticipant) return [];

    switch (status) {
      case "pending":
        return isArtist ? actions.slice(0, 4) : [actions[4]]; // アーティスト: 承認/お断り/代替案/詳細確認, 顧客: キャンセル
      case "negotiating":
        return actions;
      case "accepted":
        return [actions[4]]; // キャンセルのみ
      case "confirmed":
        return [actions[4]]; // キャンセルのみ
      default:
        return [];
    }
  };

  const renderBookingDetails = (): JSX.Element => {
    if (!booking) return <View />;

    return (
      <View style={styles.bookingDetails}>
        <View style={styles.statusHeader}>
          <Text style={styles.bookingTitle}>予約詳細</Text>
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

        <View style={styles.detailsContent}>
          <Text style={styles.detailLabel}>タトゥー内容:</Text>
          <Text style={styles.detailValue}>{booking.tattooDescription}</Text>

          <Text style={styles.detailLabel}>部位:</Text>
          <Text style={styles.detailValue}>{booking.bodyLocation}</Text>

          <Text style={styles.detailLabel}>希望日時:</Text>
          <Text style={styles.detailValue}>
            {booking.preferredDate.toLocaleString("ja-JP")}
          </Text>

          <Text style={styles.detailLabel}>予想時間:</Text>
          <Text style={styles.detailValue}>{booking.estimatedDuration}分</Text>

          <Text style={styles.detailLabel}>予算範囲:</Text>
          <Text style={styles.detailValue}>
            ¥{booking.budgetRange.min.toLocaleString()} - ¥
            {booking.budgetRange.max.toLocaleString()}
          </Text>

          {booking.hasAllergies && booking.allergyDetails && (
            <>
              <Text style={styles.detailLabel}>アレルギー情報:</Text>
              <Text style={styles.detailValue}>{booking.allergyDetails}</Text>
            </>
          )}

          {booking.additionalNotes && (
            <>
              <Text style={styles.detailLabel}>追加メモ:</Text>
              <Text style={styles.detailValue}>{booking.additionalNotes}</Text>
            </>
          )}
        </View>

        {booking.responses.length > 0 && (
          <View style={styles.responsesSection}>
            <Text style={styles.responsesTitle}>応答履歴</Text>
            {booking.responses.map((response, index) => (
              <View key={index} style={styles.responseItem}>
                <Text style={styles.responseType}>
                  {response.responseType === "accept" && "✅ 承認"}
                  {response.responseType === "decline" && "❌ お断り"}
                  {response.responseType === "counter_offer" && "🔄 代替案"}
                  {response.responseType === "request_info" && "❓ 詳細確認"}
                </Text>
                <Text style={styles.responseMessage}>{response.message}</Text>
                <Text style={styles.responseDate}>
                  {response.createdAt.toLocaleString("ja-JP")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = (): JSX.Element => {
    const availableActions = getAvailableActions();

    if (availableActions.length === 0) return <View />;

    return (
      <View style={styles.actionButtons}>
        <Text style={styles.actionTitle}>予約操作</Text>
        <View style={styles.buttonGrid}>
          {availableActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleAction(action)}
            >
              <Text style={styles.actionButtonIcon}>{action.icon}</Text>
              <Text style={styles.actionButtonText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>予約詳細を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>予約調整</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderBookingDetails()}
        {renderActionButtons()}
      </ScrollView>

      {/* アクション実行モーダル */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedAction?.icon} {selectedAction?.label}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalInstruction}>
              {selectedAction?.type === "accept" &&
                "予約を承認しますか？メッセージを追加できます。"}
              {selectedAction?.type === "decline" &&
                "お断りの理由をお聞かせください。"}
              {selectedAction?.type === "request_info" &&
                "確認したい内容を入力してください。"}
              {selectedAction?.type === "cancel" &&
                "キャンセル理由を入力してください。"}
            </Text>

            {selectedAction?.type !== "counter_offer" && (
              <View style={styles.messageInput}>
                <Text style={styles.inputLabel}>メッセージ</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={responseMessage}
                  onChangeText={setResponseMessage}
                  placeholder="メッセージを入力してください"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.executeButton,
                  { backgroundColor: selectedAction?.color || "#ff6b6b" },
                ]}
                onPress={executeAction}
              >
                <Text style={styles.executeButtonText}>実行</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  bookingDetails: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
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
  detailsContent: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  responsesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  responseItem: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseType: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  responseMessage: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 12,
    color: "#888",
  },
  actionButtons: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minWidth: "48%",
    marginBottom: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalInstruction: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 20,
    lineHeight: 22,
  },
  messageInput: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  executeButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  executeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BookingChatScreen;
