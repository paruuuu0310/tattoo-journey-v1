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
  Image,
} from "react-native";
import { Button, Avatar, Tag, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockArtists, currentUser } from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ReviewSubmissionScreenProps {
  route: {
    params: {
      artistId: string;
      bookingId: string;
    };
  };
  onBack?: () => void;
  onReviewSubmitted?: () => void;
}

interface ReviewData {
  overallRating: number;
  skillRating: number;
  serviceRating: number;
  cleanlinessRating: number;
  valueRating: number;
  reviewText: string;
  photos: string[];
  isAnonymous: boolean;
  wouldRecommend: boolean;
}

export const ReviewSubmissionScreen: React.FC<ReviewSubmissionScreenProps> = ({
  route,
  onBack,
  onReviewSubmitted,
}) => {
  const { artistId, bookingId } = route.params;
  const artist = mockArtists.find((a) => a.id === artistId);

  const [reviewData, setReviewData] = useState<ReviewData>({
    overallRating: 0,
    skillRating: 0,
    serviceRating: 0,
    cleanlinessRating: 0,
    valueRating: 0,
    reviewText: "",
    photos: [],
    isAnonymous: false,
    wouldRecommend: false,
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const ratingCategories = [
    { key: "skillRating" as keyof ReviewData, label: "技術力", icon: "🎨" },
    {
      key: "serviceRating" as keyof ReviewData,
      label: "接客・サービス",
      icon: "😊",
    },
    {
      key: "cleanlinessRating" as keyof ReviewData,
      label: "清潔感",
      icon: "✨",
    },
    {
      key: "valueRating" as keyof ReviewData,
      label: "コストパフォーマンス",
      icon: "💰",
    },
  ];

  const handleRatingPress = (category: keyof ReviewData, rating: number) => {
    setReviewData((prev) => ({
      ...prev,
      [category]: rating,
      ...(category !== "overallRating" && {
        overallRating: calculateOverallRating({
          ...prev,
          [category]: rating,
        }),
      }),
    }));
  };

  const calculateOverallRating = (data: ReviewData) => {
    const ratings = [
      data.skillRating,
      data.serviceRating,
      data.cleanlinessRating,
      data.valueRating,
    ];
    const validRatings = ratings.filter((r) => r > 0);
    if (validRatings.length === 0) return 0;
    return Math.round(
      validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length,
    );
  };

  const handlePhotoUpload = () => {
    Alert.alert("写真を追加", "完成したタトゥーの写真を追加してください", [
      { text: "キャンセル", style: "cancel" },
      { text: "カメラ", onPress: () => mockPhotoUpload("camera") },
      { text: "ライブラリ", onPress: () => mockPhotoUpload("library") },
    ]);
  };

  const mockPhotoUpload = (source: string) => {
    const newPhotoUrl = `https://picsum.photos/300/400?random=${Date.now()}`;
    setReviewData((prev) => ({
      ...prev,
      photos: [...prev.photos, newPhotoUrl],
    }));

    setToastMessage(
      `${source === "camera" ? "カメラ" : "ライブラリ"}から写真を追加しました`,
    );
    setShowToast(true);
  };

  const removePhoto = (index: number) => {
    setReviewData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitReview = async () => {
    if (reviewData.overallRating === 0) {
      setToastMessage("総合評価を入力してください");
      setShowToast(true);
      return;
    }

    if (!reviewData.reviewText.trim()) {
      setToastMessage("レビューコメントを入力してください");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setToastMessage("レビューを投稿しました。ありがとうございます！");
      setShowToast(true);

      setTimeout(() => {
        onReviewSubmitted?.();
        onBack?.();
      }, 1500);
    } catch (error) {
      setToastMessage("レビューの投稿に失敗しました");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void,
    size: "small" | "large" = "small",
  ) => {
    const starSize = size === "large" ? 32 : 24;

    return (
      <View style={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Text
              style={[
                styles.starText,
                { fontSize: starSize },
                star <= rating && styles.starTextActive,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOverallRating = () => (
    <View style={styles.overallRatingContainer}>
      <Text style={styles.sectionTitle}>総合評価</Text>
      <View style={styles.overallRatingContent}>
        {renderStarRating(
          reviewData.overallRating,
          (rating) => handleRatingPress("overallRating", rating),
          "large",
        )}
        <Text style={styles.overallRatingText}>
          {reviewData.overallRating > 0
            ? `${reviewData.overallRating}.0`
            : "未評価"}
        </Text>
      </View>
      <Text style={styles.overallRatingDescription}>
        {reviewData.overallRating === 0 && "星をタップして評価してください"}
        {reviewData.overallRating === 1 && "期待を下回りました"}
        {reviewData.overallRating === 2 && "やや不満でした"}
        {reviewData.overallRating === 3 && "普通でした"}
        {reviewData.overallRating === 4 && "満足できました"}
        {reviewData.overallRating === 5 && "大変満足でした！"}
      </Text>
    </View>
  );

  const renderDetailedRatings = () => (
    <View style={styles.detailedRatingsContainer}>
      <Text style={styles.sectionTitle}>詳細評価</Text>
      {ratingCategories.map((category) => (
        <View key={category.key} style={styles.ratingCategory}>
          <View style={styles.ratingCategoryHeader}>
            <Text style={styles.ratingCategoryIcon}>{category.icon}</Text>
            <Text style={styles.ratingCategoryLabel}>{category.label}</Text>
          </View>
          {renderStarRating(reviewData[category.key] as number, (rating) =>
            handleRatingPress(category.key, rating),
          )}
        </View>
      ))}
    </View>
  );

  const renderReviewText = () => (
    <View style={styles.reviewTextContainer}>
      <Text style={styles.sectionTitle}>レビューコメント</Text>
      <TextInput
        style={styles.reviewTextInput}
        placeholder="体験した感想を詳しく教えてください。他のお客様の参考になります。"
        placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
        value={reviewData.reviewText}
        onChangeText={(text) =>
          setReviewData((prev) => ({ ...prev, reviewText: text }))
        }
        multiline
        maxLength={1000}
        textAlignVertical="top"
      />
      <Text style={styles.characterCount}>
        {reviewData.reviewText.length}/1000文字
      </Text>
    </View>
  );

  const renderPhotoUpload = () => (
    <View style={styles.photoUploadContainer}>
      <Text style={styles.sectionTitle}>写真を追加（任意）</Text>
      <Text style={styles.photoUploadDescription}>
        完成したタトゥーの写真を追加すると、他のお客様の参考になります
      </Text>

      <View style={styles.photoGrid}>
        {reviewData.photos.map((photo, index) => (
          <View key={index} style={styles.photoItem}>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.photoRemoveButton}
              onPress={() => removePhoto(index)}
            >
              <Text style={styles.photoRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {reviewData.photos.length < 3 && (
          <TouchableOpacity
            style={styles.photoAddButton}
            onPress={handlePhotoUpload}
          >
            <Text style={styles.photoAddIcon}>📷</Text>
            <Text style={styles.photoAddText}>写真を追加</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() =>
          setReviewData((prev) => ({
            ...prev,
            wouldRecommend: !prev.wouldRecommend,
          }))
        }
      >
        <View style={styles.optionCheckbox}>
          {reviewData.wouldRecommend && (
            <Text style={styles.optionCheckboxText}>✓</Text>
          )}
        </View>
        <Text style={styles.optionLabel}>
          このアーティストを他の人におすすめしますか？
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionItem}
        onPress={() =>
          setReviewData((prev) => ({ ...prev, isAnonymous: !prev.isAnonymous }))
        }
      >
        <View style={styles.optionCheckbox}>
          {reviewData.isAnonymous && (
            <Text style={styles.optionCheckboxText}>✓</Text>
          )}
        </View>
        <Text style={styles.optionLabel}>匿名でレビューを投稿する</Text>
      </TouchableOpacity>
    </View>
  );

  const canSubmit =
    reviewData.overallRating > 0 && reviewData.reviewText.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>レビュー投稿</Text>
          <Text style={styles.headerSubtitle}>体験を評価してください</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Artist Info */}
      <View style={styles.artistInfo}>
        <Avatar
          imageUrl={artist.avatar}
          name={artist.name}
          size="large"
          showBadge={artist.isVerified}
        />
        <View style={styles.artistDetails}>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistStudio}>
            {artist.studioName || "個人アーティスト"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOverallRating()}
        {renderDetailedRatings()}
        {renderReviewText()}
        {renderPhotoUpload()}
        {renderOptions()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={isSubmitting ? "投稿中..." : "レビューを投稿"}
          onPress={handleSubmitReview}
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>

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

  // Artist Info
  artistInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[5],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  artistDetails: {
    marginLeft: DesignTokens.spacing[4],
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  artistStudio: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.primary[500],
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },

  // Overall Rating
  overallRatingContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  overallRatingContent: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing[3],
  },
  overallRatingText: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
    marginTop: DesignTokens.spacing[3],
  },
  overallRatingDescription: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
  },

  // Star Rating
  starRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[1],
  },
  starButton: {
    padding: DesignTokens.spacing[1],
  },
  starText: {
    color: DesignTokens.colors.dark.text.tertiary,
  },
  starTextActive: {
    color: DesignTokens.colors.accent.gold,
  },

  // Detailed Ratings
  detailedRatingsContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  ratingCategory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  ratingCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ratingCategoryIcon: {
    fontSize: 20,
    marginRight: DesignTokens.spacing[3],
  },
  ratingCategoryLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Review Text
  reviewTextContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  reviewTextInput: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "right",
    marginTop: DesignTokens.spacing[2],
  },

  // Photo Upload
  photoUploadContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  photoUploadDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[4],
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[3],
  },
  photoItem: {
    position: "relative",
    width: 80,
    height: 80,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  photoRemoveButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignTokens.colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: {
    color: DesignTokens.colors.dark.text.primary,
    fontSize: 16,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  photoAddButton: {
    width: 80,
    height: 80,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DesignTokens.colors.dark.background,
  },
  photoAddIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoAddText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
  },

  // Options
  optionsContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[6],
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.background,
  },
  optionCheckboxText: {
    color: DesignTokens.colors.primary[500],
    fontSize: 16,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  optionLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    flex: 1,
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
});

export default ReviewSubmissionScreen;
