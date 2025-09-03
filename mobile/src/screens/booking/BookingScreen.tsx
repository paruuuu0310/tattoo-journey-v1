import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { Button, Avatar, Tag, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockArtists, mockDesigns, currentUser } from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BookingScreenProps {
  route: {
    params: {
      artistId: string;
      designId?: string;
    };
  };
  onBack?: () => void;
  onBookingComplete?: (bookingId: string) => void;
}

type BookingStep =
  | "select_service"
  | "select_datetime"
  | "confirm_details"
  | "pending_approval"
  | "confirmed";

interface BookingDetails {
  serviceType: string;
  designId?: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes: string;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  route,
  onBack,
  onBookingComplete,
}) => {
  const { artistId, designId } = route.params;
  const artist = mockArtists.find((a) => a.id === artistId);
  const design = designId
    ? mockDesigns.find((d) => d.id === designId)
    : undefined;

  const [currentStep, setCurrentStep] = useState<BookingStep>("select_service");
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    serviceType: design ? "design_tattoo" : "",
    designId: designId,
    date: "",
    time: "",
    duration: 0,
    price: 0,
    notes: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const serviceTypes = [
    { id: "consultation", name: "カウンセリング", duration: 1, price: 0 },
    {
      id: "design_tattoo",
      name: "デザインタトゥー",
      duration: 4,
      price: 80000,
    },
    {
      id: "custom_tattoo",
      name: "オリジナルタトゥー",
      duration: 6,
      price: 120000,
    },
    { id: "cover_up", name: "カバーアップ", duration: 5, price: 100000 },
  ];

  const availableDates = [
    "2024-04-15",
    "2024-04-18",
    "2024-04-22",
    "2024-04-25",
    "2024-04-29",
  ];

  const availableTimes = ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

  const stepTitles = {
    select_service: "サービス選択",
    select_datetime: "日時選択",
    confirm_details: "詳細確認",
    pending_approval: "承認待ち",
    confirmed: "予約確定",
  };

  const handleServiceSelect = (serviceType: any) => {
    setBookingDetails((prev) => ({
      ...prev,
      serviceType: serviceType.id,
      duration: serviceType.duration,
      price: serviceType.price,
    }));
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case "select_service":
        if (!bookingDetails.serviceType) {
          setToastMessage("サービスを選択してください");
          setShowToast(true);
          return;
        }
        setCurrentStep("select_datetime");
        break;
      case "select_datetime":
        if (!bookingDetails.date || !bookingDetails.time) {
          setToastMessage("日時を選択してください");
          setShowToast(true);
          return;
        }
        setCurrentStep("confirm_details");
        break;
      case "confirm_details":
        handleBookingSubmit();
        break;
    }
  };

  const handleBookingSubmit = () => {
    setCurrentStep("pending_approval");
    setToastMessage("予約リクエストを送信しました");
    setShowToast(true);

    // Simulate approval process
    setTimeout(() => {
      setCurrentStep("confirmed");
      setToastMessage("予約が確定しました！");
      setShowToast(true);

      // Call completion callback
      onBookingComplete?.("booking-" + Date.now());
    }, 3000);
  };

  const renderProgressIndicator = () => {
    const steps = ["select_service", "select_datetime", "confirm_details"];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                index <= currentIndex && styles.progressDotActive,
                index < currentIndex && styles.progressDotCompleted,
              ]}
            >
              <Text
                style={[
                  styles.progressDotText,
                  index <= currentIndex && styles.progressDotTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  index < currentIndex && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderServiceSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>サービスを選択してください</Text>

      {design && (
        <View style={styles.selectedDesignCard}>
          <Text style={styles.selectedDesignTitle}>選択中のデザイン</Text>
          <View style={styles.designInfo}>
            <Text style={styles.designName}>{design.title}</Text>
            <Text style={styles.designStyle}>{design.style}</Text>
          </View>
        </View>
      )}

      <View style={styles.servicesContainer}>
        {serviceTypes.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              bookingDetails.serviceType === service.id &&
                styles.serviceCardActive,
            ]}
            onPress={() => handleServiceSelect(service)}
          >
            <Text
              style={[
                styles.serviceName,
                bookingDetails.serviceType === service.id &&
                  styles.serviceNameActive,
              ]}
            >
              {service.name}
            </Text>
            <Text style={styles.serviceDuration}>
              所要時間: {service.duration}時間
            </Text>
            <Text style={styles.servicePrice}>
              {service.price === 0
                ? "無料"
                : `¥${service.price.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateTimeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>日時を選択してください</Text>

      <View style={styles.dateTimeSection}>
        <Text style={styles.sectionTitle}>日付選択</Text>
        <View style={styles.dateGrid}>
          {availableDates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateButton,
                bookingDetails.date === date && styles.dateButtonActive,
              ]}
              onPress={() => setBookingDetails((prev) => ({ ...prev, date }))}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  bookingDetails.date === date && styles.dateButtonTextActive,
                ]}
              >
                {new Date(date).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {bookingDetails.date && (
        <View style={styles.dateTimeSection}>
          <Text style={styles.sectionTitle}>時間選択</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  bookingDetails.time === time && styles.timeButtonActive,
                ]}
                onPress={() => setBookingDetails((prev) => ({ ...prev, time }))}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    bookingDetails.time === time && styles.timeButtonTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {bookingDetails.date && bookingDetails.time && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>備考・要望</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="特別な要望やアレルギー情報などがあれば記入してください"
            placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
            value={bookingDetails.notes}
            onChangeText={(text) =>
              setBookingDetails((prev) => ({ ...prev, notes: text }))
            }
            multiline
            maxLength={500}
          />
        </View>
      )}
    </View>
  );

  const renderConfirmation = () => {
    const selectedService = serviceTypes.find(
      (s) => s.id === bookingDetails.serviceType,
    );

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>予約内容の確認</Text>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>アーティスト</Text>
            <View style={styles.artistConfirmation}>
              <Avatar
                imageUrl={artist.avatar}
                name={artist.name}
                size="medium"
                showBadge={artist.isVerified}
              />
              <View style={styles.artistConfirmationInfo}>
                <Text style={styles.artistConfirmationName}>{artist.name}</Text>
                <Text style={styles.artistConfirmationStudio}>
                  {artist.studioName || "個人アーティスト"}
                </Text>
              </View>
            </View>
          </View>

          {design && (
            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>デザイン</Text>
              <Text style={styles.confirmationValue}>{design.title}</Text>
            </View>
          )}

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>サービス</Text>
            <Text style={styles.confirmationValue}>
              {selectedService?.name}
            </Text>
          </View>

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>日時</Text>
            <Text style={styles.confirmationValue}>
              {new Date(bookingDetails.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}{" "}
              {bookingDetails.time}
            </Text>
          </View>

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>所要時間</Text>
            <Text style={styles.confirmationValue}>
              {bookingDetails.duration}時間
            </Text>
          </View>

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>料金</Text>
            <Text style={styles.confirmationPrice}>
              {bookingDetails.price === 0
                ? "無料"
                : `¥${bookingDetails.price.toLocaleString()}`}
            </Text>
          </View>

          {bookingDetails.notes && (
            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>備考</Text>
              <Text style={styles.confirmationValue}>
                {bookingDetails.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ 予約確定後のキャンセルは24時間前までとなります
          </Text>
        </View>
      </View>
    );
  };

  const renderPendingApproval = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIcon}>
        <Text style={styles.statusEmoji}>⏳</Text>
      </View>
      <Text style={styles.statusTitle}>承認待ち</Text>
      <Text style={styles.statusMessage}>
        アーティストが予約内容を確認中です。{"\n"}
        通常24時間以内に返答いたします。
      </Text>

      <View style={styles.pendingActions}>
        <Button
          title="チャットで相談"
          onPress={() => {}}
          variant="secondary"
          size="large"
          style={styles.pendingActionButton}
        />
      </View>
    </View>
  );

  const renderConfirmed = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIcon}>
        <Text style={styles.statusEmoji}>✅</Text>
      </View>
      <Text style={styles.statusTitle}>予約確定</Text>
      <Text style={styles.statusMessage}>
        予約が確定しました！{"\n"}
        当日はお気をつけてお越しください。
      </Text>

      <View style={styles.confirmedDetails}>
        <Text style={styles.confirmedDate}>
          {new Date(bookingDetails.date).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}{" "}
          {bookingDetails.time}
        </Text>
        <Text style={styles.confirmedArtist}>{artist.name}</Text>
        <Text style={styles.confirmedStudio}>
          {artist.studioName || "個人アーティスト"}
        </Text>
      </View>

      <View style={styles.confirmedActions}>
        <Button
          title="カレンダーに追加"
          onPress={() => {
            setToastMessage("カレンダーに追加しました");
            setShowToast(true);
          }}
          variant="secondary"
          size="large"
          style={styles.confirmedActionButton}
        />
        <Button
          title="完了"
          onPress={onBack}
          variant="primary"
          size="large"
          style={styles.confirmedActionButton}
        />
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "select_service":
        return renderServiceSelection();
      case "select_datetime":
        return renderDateTimeSelection();
      case "confirm_details":
        return renderConfirmation();
      case "pending_approval":
        return renderPendingApproval();
      case "confirmed":
        return renderConfirmed();
      default:
        return renderServiceSelection();
    }
  };

  const canGoBack = ["select_datetime", "confirm_details"].includes(
    currentStep,
  );
  const showNextButton = [
    "select_service",
    "select_datetime",
    "confirm_details",
  ].includes(currentStep);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>予約</Text>
          <Text style={styles.headerSubtitle}>{stepTitles[currentStep]}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {["select_service", "select_datetime", "confirm_details"].includes(
        currentStep,
      ) && renderProgressIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Bottom Actions */}
      {showNextButton && (
        <View style={styles.bottomActions}>
          {canGoBack && (
            <Button
              title="戻る"
              onPress={() => {
                if (currentStep === "select_datetime")
                  setCurrentStep("select_service");
                if (currentStep === "confirm_details")
                  setCurrentStep("select_datetime");
              }}
              variant="secondary"
              size="large"
              style={styles.backActionButton}
            />
          )}
          <Button
            title={currentStep === "confirm_details" ? "予約する" : "次へ"}
            onPress={handleNextStep}
            variant="primary"
            size="large"
            style={
              canGoBack ? styles.nextActionButton : styles.fullActionButton
            }
          />
        </View>
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
        position="bottom"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
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
  },
  backIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[6],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.dark.surface,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    borderColor: DesignTokens.colors.primary[500],
    backgroundColor: DesignTokens.colors.primary[500],
  },
  progressDotCompleted: {
    backgroundColor: DesignTokens.colors.accent.neon,
    borderColor: DesignTokens.colors.accent.neon,
  },
  progressDotText: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.secondary,
  },
  progressDotTextActive: {
    color: DesignTokens.colors.dark.text.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: DesignTokens.colors.dark.border,
    marginHorizontal: DesignTokens.spacing[2],
  },
  progressLineActive: {
    backgroundColor: DesignTokens.colors.accent.neon,
  },

  // Content
  content: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
  },
  stepTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[6],
    textAlign: "center",
  },

  // Service Selection
  selectedDesignCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[6],
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[500],
  },
  selectedDesignTitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.semibold,
    marginBottom: DesignTokens.spacing[2],
  },
  designInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  designName: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  designStyle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  servicesContainer: {
    gap: DesignTokens.spacing[3],
  },
  serviceCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.border,
  },
  serviceCardActive: {
    borderColor: DesignTokens.colors.primary[500],
    backgroundColor: DesignTokens.colors.primary[500] + "10",
  },
  serviceName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  serviceNameActive: {
    color: DesignTokens.colors.primary[500],
  },
  serviceDuration: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[1],
  },
  servicePrice: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
  },

  // Date Time Selection
  dateTimeSection: {
    marginBottom: DesignTokens.spacing[6],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[3],
  },
  dateButton: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minWidth: 80,
    alignItems: "center",
  },
  dateButtonActive: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderColor: DesignTokens.colors.primary[500],
  },
  dateButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  dateButtonTextActive: {
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[3],
  },
  timeButton: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minWidth: 70,
    alignItems: "center",
  },
  timeButtonActive: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderColor: DesignTokens.colors.primary[500],
  },
  timeButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  timeButtonTextActive: {
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  notesSection: {
    marginTop: DesignTokens.spacing[4],
  },
  notesInput: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Confirmation
  confirmationCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    marginBottom: DesignTokens.spacing[4],
  },
  confirmationSection: {
    marginBottom: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  confirmationLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[2],
    fontWeight: DesignTokens.typography.weights.medium,
  },
  confirmationValue: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  confirmationPrice: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.accent.gold,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  artistConfirmation: {
    flexDirection: "row",
    alignItems: "center",
  },
  artistConfirmationInfo: {
    marginLeft: DesignTokens.spacing[3],
  },
  artistConfirmationName: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  artistConfirmationStudio: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  warningCard: {
    backgroundColor: DesignTokens.colors.accent.gold + "20",
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    borderWidth: 1,
    borderColor: DesignTokens.colors.accent.gold + "50",
  },
  warningText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.gold,
    textAlign: "center",
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Status Screens
  statusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  statusIcon: {
    marginBottom: DesignTokens.spacing[4],
  },
  statusEmoji: {
    fontSize: 64,
  },
  statusTitle: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  statusMessage: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: DesignTokens.spacing[8],
  },
  pendingActions: {
    width: "100%",
  },
  pendingActionButton: {
    width: "100%",
  },
  confirmedDetails: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing[8],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
  },
  confirmedDate: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.primary[500],
    marginBottom: DesignTokens.spacing[2],
  },
  confirmedArtist: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  confirmedStudio: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  confirmedActions: {
    flexDirection: "row",
    width: "100%",
    gap: DesignTokens.spacing[3],
  },
  confirmedActionButton: {
    flex: 1,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
    gap: DesignTokens.spacing[3],
  },
  backActionButton: {
    flex: 1,
  },
  nextActionButton: {
    flex: 2,
  },
  fullActionButton: {
    flex: 1,
  },
});

export default BookingScreen;
