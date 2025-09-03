import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import BookingService, { BookingRequest } from "../../services/BookingService";

interface Props {
  route: {
    params: {
      booking: BookingRequest;
      proposedDate?: Date;
      proposedPrice?: number;
      proposedDuration?: number;
    };
  };
  navigation: any;
}

interface ConfirmationDetails {
  finalDate: Date;
  finalPrice: number;
  finalDuration: number;
  specialInstructions?: string;
  depositRequired?: boolean;
  depositAmount?: number;
}

const BookingConfirmationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { booking, proposedDate, proposedPrice, proposedDuration } =
    route.params;

  const [confirmationDetails, setConfirmationDetails] =
    useState<ConfirmationDetails>({
      finalDate: proposedDate || booking.preferredDate,
      finalPrice: proposedPrice || booking.estimatedPrice,
      finalDuration: proposedDuration || booking.estimatedDuration,
      depositRequired: false,
      depositAmount: 0,
    });

  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const isArtist = userProfile?.userType === "artist";

  const handleConfirmBooking = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    setIsConfirming(true);

    try {
      await BookingService.confirmBooking(
        booking.id,
        confirmationDetails.finalDate,
        confirmationDetails.finalPrice,
        confirmationDetails.finalDuration,
      );

      Alert.alert(
        "予約確定完了",
        "お客様の予約が正式に確定いたしました。\n\nお客様とアーティストの双方に確認メールが送信されました。",
        [
          {
            text: "予約管理に戻る",
            onPress: () => navigation.navigate("BookingStatus"),
          },
        ],
      );
    } catch (error) {
      console.error("Booking confirmation error:", error);
      Alert.alert("エラー", "予約確定に失敗しました。もう一度お試しください。");
    } finally {
      setIsConfirming(false);
      setShowConfirmModal(false);
    }
  };

  const calculateDeposit = (): number => {
    return Math.floor(confirmationDetails.finalPrice * 0.3); // 30%のデポジット
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else {
      return `${mins}分`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>予約確定</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 予約概要 */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>🎨 予約内容確認</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>タトゥー詳細:</Text>
            <Text style={styles.summaryValue}>{booking.tattooDescription}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>施術部位:</Text>
            <Text style={styles.summaryValue}>{booking.bodyLocation}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>希望サイズ:</Text>
            <Text style={styles.summaryValue}>
              {booking.preferredSize === "small"
                ? "小サイズ (5cm以下)"
                : booking.preferredSize === "medium"
                  ? "中サイズ (5-15cm)"
                  : "大サイズ (15cm以上)"}
            </Text>
          </View>
        </View>

        {/* 確定詳細 */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>📅 確定内容</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>施術日時</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {formatDate(confirmationDetails.finalDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>所要時間</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {formatDuration(confirmationDetails.finalDuration)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>料金</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.priceValue}>
                ¥{confirmationDetails.finalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* デポジット情報 */}
          <View style={styles.depositInfo}>
            <Text style={styles.depositTitle}>💳 支払い情報</Text>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>当日支払い:</Text>
              <Text style={styles.depositValue}>
                ¥{confirmationDetails.finalPrice.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.depositNote}>
              ※ 支払いは施術当日に現金またはカードでお支払いください。
            </Text>
          </View>
        </View>

        {/* アレルギー情報 */}
        {booking.hasAllergies && booking.allergyDetails && (
          <View style={styles.allergyCard}>
            <Text style={styles.cardTitle}>⚠️ アレルギー・注意事項</Text>
            <Text style={styles.allergyText}>{booking.allergyDetails}</Text>
          </View>
        )}

        {/* 追加メモ */}
        {booking.additionalNotes && (
          <View style={styles.notesCard}>
            <Text style={styles.cardTitle}>📝 追加メモ</Text>
            <Text style={styles.notesText}>{booking.additionalNotes}</Text>
          </View>
        )}

        {/* 重要事項 */}
        <View style={styles.importantCard}>
          <Text style={styles.cardTitle}>📋 重要事項</Text>
          <View style={styles.importantList}>
            <Text style={styles.importantItem}>
              •
              予約日時の24時間前までにキャンセルの場合、キャンセル料は発生しません
            </Text>
            <Text style={styles.importantItem}>
              • 当日キャンセルの場合、料金の50%をキャンセル料としていただきます
            </Text>
            <Text style={styles.importantItem}>
              • 施術前にアフターケア説明を実施いたします
            </Text>
            <Text style={styles.importantItem}>
              • 未成年者の場合、保護者の同意書が必要です
            </Text>
            <Text style={styles.importantItem}>
              • 体調不良の場合は無理をせず、日程変更をご相談ください
            </Text>
          </View>
        </View>

        {/* 確定ボタン */}
        {isArtist && booking.status === "accepted" && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              isConfirming && styles.disabledButton,
            ]}
            onPress={() => setShowConfirmModal(true)}
            disabled={isConfirming}
          >
            <Text style={styles.confirmButtonText}>
              {isConfirming ? "確定処理中..." : "🎉 予約を正式確定する"}
            </Text>
          </TouchableOpacity>
        )}

        {!isArtist && (
          <View style={styles.customerNotice}>
            <Text style={styles.customerNoticeText}>
              アーティストによる最終確認をお待ちください。
              確定後、詳細なご案内をお送りいたします。
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 確認モーダル */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>予約確定の最終確認</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>
              以下の内容で予約を正式に確定しますか？
              {"\n\n"}
              確定後の変更は双方の合意が必要になります。
            </Text>

            <View style={styles.finalSummary}>
              <Text style={styles.finalSummaryTitle}>確定内容</Text>
              <Text style={styles.finalSummaryItem}>
                📅 日時: {formatDate(confirmationDetails.finalDate)}
              </Text>
              <Text style={styles.finalSummaryItem}>
                ⏱️ 時間: {formatDuration(confirmationDetails.finalDuration)}
              </Text>
              <Text style={styles.finalSummaryItem}>
                💰 料金: ¥{confirmationDetails.finalPrice.toLocaleString()}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  isConfirming && styles.disabledButton,
                ]}
                onPress={handleConfirmBooking}
                disabled={isConfirming}
              >
                <Text style={styles.confirmModalButtonText}>
                  {isConfirming ? "処理中..." : "確定する"}
                </Text>
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
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b6b",
  },
  detailsCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  allergyCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#facc15",
  },
  notesCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  importantCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    color: "#fff",
    marginTop: 2,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 8,
  },
  detailValueContainer: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
  },
  detailValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 18,
    color: "#4ade80",
    fontWeight: "bold",
  },
  depositInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  depositTitle: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "bold",
    marginBottom: 8,
  },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  depositLabel: {
    fontSize: 14,
    color: "#ccc",
  },
  depositValue: {
    fontSize: 16,
    color: "#4ade80",
    fontWeight: "bold",
  },
  depositNote: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginTop: 8,
  },
  allergyText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  importantList: {
    gap: 8,
  },
  importantItem: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  customerNotice: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  customerNoticeText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 24,
  },
  finalSummary: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  finalSummaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  finalSummaryItem: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingBottom: 20,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmModalButton: {
    flex: 1,
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BookingConfirmationScreen;
