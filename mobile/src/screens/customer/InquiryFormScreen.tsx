import React, { useState } from "react";
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
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import firestore from "@react-native-firebase/firestore";
import ChatService from "../../services/ChatService";

interface Props {
  route: {
    params: {
      artistId: string;
      artistName: string;
      estimatedPrice?: number;
      tattooStyle?: string;
      imageAnalysis?: any;
    };
  };
  navigation: any;
}

interface InquiryData {
  tattooDescription: string;
  preferredSize: "small" | "medium" | "large";
  bodyLocation: string;
  hasAllergies: boolean;
  allergyDetails: string;
  budgetRange: {
    min: number;
    max: number;
  };
  timeline: "asap" | "1month" | "3months" | "flexible";
  availableDays: string[];
  preferredTime: "morning" | "afternoon" | "evening" | "flexible";
  additionalNotes: string;
  contactMethod: "chat" | "phone" | "email";
  phoneNumber?: string;
  email?: string;
}

const InquiryFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { artistId, artistName, estimatedPrice, tattooStyle, imageAnalysis } =
    route.params;

  const [inquiryData, setInquiryData] = useState<InquiryData>({
    tattooDescription: "",
    preferredSize: "medium",
    bodyLocation: "",
    hasAllergies: false,
    allergyDetails: "",
    budgetRange: {
      min: estimatedPrice ? Math.floor(estimatedPrice * 0.8) : 20000,
      max: estimatedPrice ? Math.floor(estimatedPrice * 1.2) : 50000,
    },
    timeline: "flexible",
    availableDays: [],
    preferredTime: "flexible",
    additionalNotes: "",
    contactMethod: "chat",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeOptions = [
    { value: "small", label: "小サイズ", description: "5cm以下" },
    { value: "medium", label: "中サイズ", description: "5-15cm" },
    { value: "large", label: "大サイズ", description: "15cm以上" },
  ];

  const timelineOptions = [
    { value: "asap", label: "できるだけ早く", description: "1-2週間以内" },
    { value: "1month", label: "1ヶ月以内", description: "1ヶ月程度で" },
    { value: "3months", label: "3ヶ月以内", description: "じっくり相談したい" },
    {
      value: "flexible",
      label: "相談して決める",
      description: "時期は柔軟に対応",
    },
  ];

  const dayOptions = [
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
    "日曜日",
  ];

  const timeOptions = [
    { value: "morning", label: "午前中", description: "9:00-12:00" },
    { value: "afternoon", label: "午後", description: "12:00-17:00" },
    { value: "evening", label: "夕方以降", description: "17:00-21:00" },
    { value: "flexible", label: "いつでも", description: "時間は相談で" },
  ];

  const updateInquiryData = (field: keyof InquiryData, value: any) => {
    setInquiryData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDay = (day: string) => {
    setInquiryData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const validateForm = (): boolean => {
    if (!inquiryData.tattooDescription.trim()) {
      Alert.alert("入力エラー", "タトゥーの詳細を入力してください");
      return false;
    }

    if (!inquiryData.bodyLocation.trim()) {
      Alert.alert("入力エラー", "施術部位を入力してください");
      return false;
    }

    if (inquiryData.hasAllergies && !inquiryData.allergyDetails.trim()) {
      Alert.alert("入力エラー", "アレルギーの詳細を入力してください");
      return false;
    }

    if (
      inquiryData.contactMethod === "phone" &&
      !inquiryData.phoneNumber?.trim()
    ) {
      Alert.alert("入力エラー", "電話番号を入力してください");
      return false;
    }

    if (inquiryData.contactMethod === "email" && !inquiryData.email?.trim()) {
      Alert.alert("入力エラー", "メールアドレスを入力してください");
      return false;
    }

    return true;
  };

  const submitInquiry = async () => {
    if (!validateForm() || !userProfile?.uid) return;

    setIsSubmitting(true);

    try {
      // 問い合わせデータを保存
      const inquiryDoc = await firestore()
        .collection("inquiries")
        .add({
          customerId: userProfile.uid,
          artistId,
          inquiryData,
          imageAnalysis: imageAnalysis || null,
          estimatedPrice,
          tattooStyle,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // チャットルームを作成してメッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        userProfile.uid,
        artistId,
        "direct_inquiry",
      );

      // 詳細な問い合わせメッセージを作成
      const inquiryMessage = createInquiryMessage(inquiryData);
      await ChatService.sendMessage(
        roomId,
        userProfile.uid,
        inquiryMessage,
        "text",
      );

      // システムメッセージを追加
      await ChatService.sendSystemMessage(
        roomId,
        "詳細な問い合わせが送信されました。アーティストからの返信をお待ちください。",
      );

      Alert.alert(
        "問い合わせ完了",
        "アーティストに問い合わせを送信しました。チャットで詳細を相談してください。",
        [
          {
            text: "チャットを開く",
            onPress: () => {
              navigation.replace("Chat", {
                roomId,
                context: "direct_inquiry",
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error("Inquiry submission error:", error);
      Alert.alert(
        "エラー",
        "問い合わせの送信に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const createInquiryMessage = (data: InquiryData): string => {
    let message = `【問い合わせ詳細】\n\n`;

    message += `🎨 タトゥー詳細:\n${data.tattooDescription}\n\n`;

    message += `📏 希望サイズ: ${sizeOptions.find((s) => s.value === data.preferredSize)?.label}\n`;
    message += `📍 施術部位: ${data.bodyLocation}\n\n`;

    message += `💰 予算: ¥${data.budgetRange.min.toLocaleString()} - ¥${data.budgetRange.max.toLocaleString()}\n\n`;

    message += `⏰ 希望時期: ${timelineOptions.find((t) => t.value === data.timeline)?.label}\n`;

    if (data.availableDays.length > 0) {
      message += `📅 都合の良い曜日: ${data.availableDays.join(", ")}\n`;
    }

    message += `🕐 希望時間帯: ${timeOptions.find((t) => t.value === data.preferredTime)?.label}\n\n`;

    if (data.hasAllergies) {
      message += `⚠️ アレルギー情報:\n${data.allergyDetails}\n\n`;
    }

    if (data.additionalNotes) {
      message += `📝 その他の要望:\n${data.additionalNotes}\n\n`;
    }

    message += `📞 希望連絡方法: ${
      data.contactMethod === "chat"
        ? "チャット"
        : data.contactMethod === "phone"
          ? `電話 (${data.phoneNumber})`
          : `メール (${data.email})`
    }`;

    if (estimatedPrice) {
      message += `\n\n💡 AI見積もり: ¥${estimatedPrice.toLocaleString()}`;
    }

    if (tattooStyle) {
      message += `\n🎨 検出スタイル: ${tattooStyle}`;
    }

    return message;
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
          <Text style={styles.title}>詳細問い合わせ</Text>
        </View>

        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artistName}</Text>
          {estimatedPrice && (
            <Text style={styles.estimatedPrice}>
              AI見積もり: ¥{estimatedPrice.toLocaleString()}
            </Text>
          )}
          {tattooStyle && (
            <Text style={styles.detectedStyle}>
              検出スタイル: {tattooStyle}
            </Text>
          )}
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* タトゥー詳細 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>タトゥー詳細 *</Text>
            <TextInput
              style={styles.textArea}
              value={inquiryData.tattooDescription}
              onChangeText={(text) =>
                updateInquiryData("tattooDescription", text)
              }
              placeholder="希望するタトゥーについて詳しく説明してください（デザイン、イメージ、参考資料など）"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* サイズ選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>希望サイズ *</Text>
            <View style={styles.optionsContainer}>
              {sizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    inquiryData.preferredSize === option.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    updateInquiryData("preferredSize", option.value)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      inquiryData.preferredSize === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 施術部位 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>施術部位 *</Text>
            <TextInput
              style={styles.textInput}
              value={inquiryData.bodyLocation}
              onChangeText={(text) => updateInquiryData("bodyLocation", text)}
              placeholder="例：右腕、背中、胸など"
              placeholderTextColor="#666"
            />
          </View>

          {/* 予算範囲 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>予算範囲</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>最低</Text>
                <TextInput
                  style={styles.priceInput}
                  value={inquiryData.budgetRange.min.toString()}
                  onChangeText={(text) =>
                    updateInquiryData("budgetRange", {
                      ...inquiryData.budgetRange,
                      min: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="20000"
                  placeholderTextColor="#666"
                />
                <Text style={styles.currency}>円</Text>
              </View>

              <Text style={styles.budgetSeparator}>〜</Text>

              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>最高</Text>
                <TextInput
                  style={styles.priceInput}
                  value={inquiryData.budgetRange.max.toString()}
                  onChangeText={(text) =>
                    updateInquiryData("budgetRange", {
                      ...inquiryData.budgetRange,
                      max: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="50000"
                  placeholderTextColor="#666"
                />
                <Text style={styles.currency}>円</Text>
              </View>
            </View>
          </View>

          {/* 希望時期 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>希望時期</Text>
            <View style={styles.optionsContainer}>
              {timelineOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    inquiryData.timeline === option.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() => updateInquiryData("timeline", option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      inquiryData.timeline === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 都合の良い曜日 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              都合の良い曜日（複数選択可）
            </Text>
            <View style={styles.daysContainer}>
              {dayOptions.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    inquiryData.availableDays.includes(day) &&
                      styles.selectedDay,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      inquiryData.availableDays.includes(day) &&
                        styles.selectedDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 希望時間帯 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>希望時間帯</Text>
            <View style={styles.optionsContainer}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    inquiryData.preferredTime === option.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    updateInquiryData("preferredTime", option.value)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      inquiryData.preferredTime === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* アレルギー情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              アレルギー・健康上の注意事項
            </Text>
            <View style={styles.allergyContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  updateInquiryData("hasAllergies", !inquiryData.hasAllergies)
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    inquiryData.hasAllergies && styles.checkedCheckbox,
                  ]}
                >
                  {inquiryData.hasAllergies && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  アレルギーまたは健康上の注意事項があります
                </Text>
              </TouchableOpacity>

              {inquiryData.hasAllergies && (
                <TextInput
                  style={[styles.textArea, { marginTop: 12 }]}
                  value={inquiryData.allergyDetails}
                  onChangeText={(text) =>
                    updateInquiryData("allergyDetails", text)
                  }
                  placeholder="詳細をお聞かせください（金属アレルギー、薬物アレルギー、皮膚の状態など）"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              )}
            </View>
          </View>

          {/* その他要望 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>その他の要望・質問</Text>
            <TextInput
              style={styles.textArea}
              value={inquiryData.additionalNotes}
              onChangeText={(text) =>
                updateInquiryData("additionalNotes", text)
              }
              placeholder="色の希望、特別な要望、質問など何でもお書きください"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 連絡方法 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>希望連絡方法</Text>
            <View style={styles.contactMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.contactMethod,
                  inquiryData.contactMethod === "chat" &&
                    styles.selectedContactMethod,
                ]}
                onPress={() => updateInquiryData("contactMethod", "chat")}
              >
                <Text
                  style={[
                    styles.contactMethodText,
                    inquiryData.contactMethod === "chat" &&
                      styles.selectedContactMethodText,
                  ]}
                >
                  💬 アプリ内チャット（推奨）
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactMethod,
                  inquiryData.contactMethod === "phone" &&
                    styles.selectedContactMethod,
                ]}
                onPress={() => updateInquiryData("contactMethod", "phone")}
              >
                <Text
                  style={[
                    styles.contactMethodText,
                    inquiryData.contactMethod === "phone" &&
                      styles.selectedContactMethodText,
                  ]}
                >
                  📞 電話
                </Text>
              </TouchableOpacity>

              {inquiryData.contactMethod === "phone" && (
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  value={inquiryData.phoneNumber || ""}
                  onChangeText={(text) =>
                    updateInquiryData("phoneNumber", text)
                  }
                  placeholder="電話番号を入力してください"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={submitInquiry}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "送信中..." : "問い合わせを送信"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  artistInfo: {
    backgroundColor: "#2a2a2a",
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
  },
  artistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 4,
  },
  estimatedPrice: {
    fontSize: 14,
    color: "#4ade80",
    marginBottom: 4,
  },
  detectedStyle: {
    fontSize: 14,
    color: "#aaa",
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
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
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
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
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedOption: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  optionText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  optionDescription: {
    fontSize: 12,
    color: "#aaa",
  },
  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  budgetInput: {
    flex: 1,
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    textAlign: "center",
    minWidth: 100,
  },
  currency: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  budgetSeparator: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 20,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedDay: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  dayText: {
    fontSize: 14,
    color: "#ccc",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  allergyContainer: {
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCheckbox: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  contactMethodContainer: {
    gap: 8,
  },
  contactMethod: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedContactMethod: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  contactMethodText: {
    fontSize: 16,
    color: "#ccc",
  },
  selectedContactMethodText: {
    color: "#fff",
    fontWeight: "bold",
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

export default InquiryFormScreen;
