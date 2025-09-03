import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { useAuth } from "../../contexts/AuthContext";
import BookingService, {
  BookingRequest,
  BookingResponse,
} from "../../services/BookingService";

interface Props {
  route: {
    params: {
      bookingId: string;
      roomId: string;
      originalRequest: BookingRequest;
    };
  };
  navigation: any;
}

interface CounterOfferData {
  proposedDate: Date;
  proposedPrice: number;
  proposedDuration: number;
  message: string;
  alternativeDates: Date[];
  priceReason: string;
  scheduleNotes: string;
}

const CounterOfferScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { bookingId, roomId, originalRequest } = route.params;

  const [counterOffer, setCounterOffer] = useState<CounterOfferData>({
    proposedDate: new Date(originalRequest.preferredDate),
    proposedPrice: originalRequest.estimatedPrice,
    proposedDuration: originalRequest.estimatedDuration,
    message: "",
    alternativeDates: [],
    priceReason: "",
    scheduleNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showAlternativePicker, setShowAlternativePicker] =
    useState<boolean>(false);
  const [alternativeIndex, setAlternativeIndex] = useState<number>(0);

  const updateCounterOffer = (
    field: keyof CounterOfferData,
    value: any,
  ): void => {
    setCounterOffer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addAlternativeDate = (): void => {
    if (counterOffer.alternativeDates.length < 3) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      setCounterOffer((prev) => ({
        ...prev,
        alternativeDates: [...prev.alternativeDates, newDate],
      }));
    }
  };

  const removeAlternativeDate = (index: number): void => {
    setCounterOffer((prev) => ({
      ...prev,
      alternativeDates: prev.alternativeDates.filter((_, i) => i !== index),
    }));
  };

  const updateAlternativeDate = (index: number, date: Date): void => {
    setCounterOffer((prev) => ({
      ...prev,
      alternativeDates: prev.alternativeDates.map((d, i) =>
        i === index ? date : d,
      ),
    }));
  };

  const validateForm = (): boolean => {
    if (!counterOffer.message.trim()) {
      Alert.alert("入力エラー", "メッセージを入力してください");
      return false;
    }

    if (counterOffer.proposedPrice <= 0) {
      Alert.alert("入力エラー", "料金を正しく入力してください");
      return false;
    }

    if (counterOffer.proposedDuration <= 0) {
      Alert.alert("入力エラー", "所要時間を正しく入力してください");
      return false;
    }

    const now = new Date();
    if (counterOffer.proposedDate <= now) {
      Alert.alert("入力エラー", "日時は現在より後の時間を選択してください");
      return false;
    }

    return true;
  };

  const submitCounterOffer = async (): Promise<void> => {
    if (!validateForm() || !userProfile?.uid) return;

    setIsSubmitting(true);

    try {
      const response: Omit<
        BookingResponse,
        "id" | "responderId" | "createdAt"
      > = {
        responseType: "counter_offer",
        proposedDate: counterOffer.proposedDate,
        proposedPrice: counterOffer.proposedPrice,
        proposedDuration: counterOffer.proposedDuration,
        message: counterOffer.message,
      };

      await BookingService.respondToBookingRequest(
        bookingId,
        userProfile.uid,
        response,
      );

      // 代替案の詳細情報を別途保存
      if (
        counterOffer.alternativeDates.length > 0 ||
        counterOffer.priceReason ||
        counterOffer.scheduleNotes
      ) {
        await BookingService.saveCounterOfferDetails(bookingId, {
          alternativeDates: counterOffer.alternativeDates,
          priceReason: counterOffer.priceReason,
          scheduleNotes: counterOffer.scheduleNotes,
        });
      }

      Alert.alert(
        "代替案送信完了",
        "代替案を送信しました。お客様からの返答をお待ちください。",
        [
          {
            text: "チャットに戻る",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("Counter offer submission error:", error);
      Alert.alert(
        "エラー",
        "代替案の送信に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>代替案提示</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 元の予約リクエスト情報 */}
          <View style={styles.originalRequestCard}>
            <Text style={styles.cardTitle}>元の予約内容</Text>
            <View style={styles.requestDetails}>
              <Text style={styles.detailLabel}>内容:</Text>
              <Text style={styles.detailValue}>
                {originalRequest.tattooDescription}
              </Text>

              <Text style={styles.detailLabel}>希望日時:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(originalRequest.preferredDate)}
              </Text>

              <Text style={styles.detailLabel}>予想時間:</Text>
              <Text style={styles.detailValue}>
                {originalRequest.estimatedDuration}分
              </Text>

              <Text style={styles.detailLabel}>予算範囲:</Text>
              <Text style={styles.detailValue}>
                ¥{originalRequest.budgetRange.min.toLocaleString()} - ¥
                {originalRequest.budgetRange.max.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* 提案日時 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>提案日時 *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDateTime(counterOffer.proposedDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 代替日時 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>代替日時（最大3つまで）</Text>
            {counterOffer.alternativeDates.map((date, index) => (
              <View key={index} style={styles.alternativeDateContainer}>
                <TouchableOpacity
                  style={styles.alternativeDateButton}
                  onPress={() => {
                    setAlternativeIndex(index);
                    setShowAlternativePicker(true);
                  }}
                >
                  <Text style={styles.alternativeDateText}>
                    {formatDateTime(date)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeAlternativeDate(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {counterOffer.alternativeDates.length < 3 && (
              <TouchableOpacity
                style={styles.addDateButton}
                onPress={addAlternativeDate}
              >
                <Text style={styles.addDateButtonText}>+ 代替日時を追加</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 提案料金 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>提案料金 *</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                value={counterOffer.proposedPrice.toString()}
                onChangeText={(text) =>
                  updateCounterOffer("proposedPrice", parseInt(text) || 0)
                }
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#666"
              />
              <Text style={styles.currency}>円</Text>
            </View>

            <TextInput
              style={styles.textInput}
              value={counterOffer.priceReason}
              onChangeText={(text) => updateCounterOffer("priceReason", text)}
              placeholder="料金設定の理由（オプション）"
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* 所要時間 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>所要時間 *</Text>
            <View style={styles.durationInputContainer}>
              <TextInput
                style={styles.durationInput}
                value={counterOffer.proposedDuration.toString()}
                onChangeText={(text) =>
                  updateCounterOffer("proposedDuration", parseInt(text) || 0)
                }
                keyboardType="numeric"
                placeholder="120"
                placeholderTextColor="#666"
              />
              <Text style={styles.durationUnit}>分</Text>
            </View>
          </View>

          {/* スケジュール注意事項 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>スケジュール注意事項</Text>
            <TextInput
              style={styles.textArea}
              value={counterOffer.scheduleNotes}
              onChangeText={(text) => updateCounterOffer("scheduleNotes", text)}
              placeholder="スケジュールに関する注意事項があれば記載してください"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* メッセージ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>お客様へのメッセージ *</Text>
            <TextInput
              style={styles.textArea}
              value={counterOffer.message}
              onChangeText={(text) => updateCounterOffer("message", text)}
              placeholder="代替案についての説明や、お客様へのメッセージを入力してください"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={submitCounterOffer}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "送信中..." : "代替案を送信"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 提案日時選択 */}
        <DatePicker
          modal
          open={showDatePicker}
          date={counterOffer.proposedDate}
          mode="datetime"
          locale="ja"
          title="提案日時を選択"
          confirmText="確定"
          cancelText="キャンセル"
          onConfirm={(date) => {
            setShowDatePicker(false);
            updateCounterOffer("proposedDate", date);
          }}
          onCancel={() => setShowDatePicker(false)}
          minimumDate={new Date()}
        />

        {/* 代替日時選択 */}
        <DatePicker
          modal
          open={showAlternativePicker}
          date={counterOffer.alternativeDates[alternativeIndex] || new Date()}
          mode="datetime"
          locale="ja"
          title="代替日時を選択"
          confirmText="確定"
          cancelText="キャンセル"
          onConfirm={(date) => {
            setShowAlternativePicker(false);
            updateAlternativeDate(alternativeIndex, date);
          }}
          onCancel={() => setShowAlternativePicker(false)}
          minimumDate={new Date()}
        />
      </KeyboardAvoidingView>
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
  originalRequestCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b6b",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  requestDetails: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  alternativeDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  alternativeDateButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  alternativeDateText: {
    color: "#ccc",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "#ef4444",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addDateButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#666",
  },
  addDateButtonText: {
    color: "#aaa",
    fontSize: 14,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
    textAlign: "right",
  },
  currency: {
    color: "#aaa",
    fontSize: 16,
    marginLeft: 8,
  },
  durationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 16,
  },
  durationInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
    textAlign: "right",
  },
  durationUnit: {
    color: "#aaa",
    fontSize: 16,
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 60,
    textAlignVertical: "top",
  },
  textArea: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CounterOfferScreen;
