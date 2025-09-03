/**
 * 🌟 ENHANCED REVIEW SCREEN
 * 最適化されたレビュー投稿・表示統合画面
 *
 * 特徴:
 * - 統一されたデザインシステム
 * - 直感的なUXフロー
 * - アニメーション効果
 * - レスポンシブデザイン
 */

import React, { useState, useEffect } from "react";
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
  Animated,
  Modal,
} from "react-native";
import { Button, Avatar, Tag, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import {
  mockArtists,
  mockReviews,
  currentUser,
  Review,
  Artist,
} from "../../../mocks/fixtures";
import ReviewListView from "./ReviewListView";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  artistId?: string;
  bookingId?: string;
  mode?: "create" | "list" | "detail";
  onBack?: () => void;
  onComplete?: () => void;
}

interface ReviewFormData {
  overallRating: number;
  categoryRatings: {
    technical: number;
    service: number;
    cleanliness: number;
    atmosphere: number;
    value: number;
  };
  comment: string;
  photos: string[];
  isAnonymous: boolean;
  wouldRecommend: boolean;
}

const EnhancedReviewScreen: React.FC<Props> = ({
  artistId = "artist-1",
  bookingId = "booking-1",
  mode = "create",
  onBack,
  onComplete,
}) => {
  const artist = mockArtists.find((a) => a.id === artistId) || mockArtists[0];
  const [currentMode, setCurrentMode] = useState(mode);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState<ReviewFormData>({
    overallRating: 0,
    categoryRatings: {
      technical: 0,
      service: 0,
      cleanliness: 0,
      atmosphere: 0,
      value: 0,
    },
    comment: "",
    photos: [],
    isAnonymous: false,
    wouldRecommend: false,
  });

  // アニメーション
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));

  useEffect(() => {
    // 画面遷移アニメーション
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentMode]);

  const categories = [
    {
      key: "technical" as const,
      label: "技術力",
      icon: "🎨",
      description: "施術の技術とクオリティ",
    },
    {
      key: "service" as const,
      label: "サービス",
      icon: "😊",
      description: "スタッフの対応と接客",
    },
    {
      key: "cleanliness" as const,
      label: "清潔感",
      icon: "✨",
      description: "スタジオの清潔さ",
    },
    {
      key: "atmosphere" as const,
      label: "雰囲気",
      icon: "🌟",
      description: "居心地の良さ",
    },
    {
      key: "value" as const,
      label: "コスパ",
      icon: "💰",
      description: "料金に対する満足度",
    },
  ];

  const handleRatingPress = (
    category: keyof ReviewFormData["categoryRatings"] | "overall",
    rating: number,
  ) => {
    if (category === "overall") {
      setFormData((prev) => ({ ...prev, overallRating: rating }));
    } else {
      setFormData((prev) => ({
        ...prev,
        categoryRatings: {
          ...prev.categoryRatings,
          [category]: rating,
        },
      }));
    }
  };

  const handlePhotoUpload = () => {
    Alert.alert("写真を追加", "タトゥーの完成写真を追加しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "カメラ", onPress: () => mockPhotoUpload("camera") },
      { text: "ライブラリ", onPress: () => mockPhotoUpload("library") },
    ]);
  };

  const mockPhotoUpload = (source: string) => {
    const newPhoto = `https://picsum.photos/300/400?random=${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
    }));

    setToastMessage(`写真を追加しました`);
    setShowToast(true);
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (formData.overallRating === 0) {
      setToastMessage("総合評価を選択してください");
      setShowToast(true);
      return false;
    }

    if (formData.comment.trim().length < 10) {
      setToastMessage("コメントは10文字以上入力してください");
      setShowToast(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setToastMessage("レビューを投稿しました！ありがとうございます 🎉");
      setShowToast(true);

      setTimeout(() => {
        onComplete?.();
        onBack?.();
      }, 1500);
    } catch (error) {
      setToastMessage("投稿に失敗しました。もう一度お試しください");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnimatedStarRating = (
    rating: number,
    onPress: (rating: number) => void,
    size: "small" | "medium" | "large" = "medium",
  ) => {
    const starSize = size === "large" ? 40 : size === "medium" ? 32 : 24;
    const spacing = size === "large" ? 8 : 4;

    return (
      <View style={[styles.starRating, { gap: spacing }]}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= rating;

          return (
            <TouchableOpacity
              key={star}
              onPress={() => onPress(star)}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Animated.Text
                style={[
                  styles.starText,
                  {
                    fontSize: starSize,
                    color: isActive
                      ? DesignTokens.colors.accent.gold
                      : DesignTokens.colors.dark.text.tertiary,
                    transform: [
                      {
                        scale: isActive ? 1.1 : 1,
                      },
                    ],
                  },
                ]}
              >
                ★
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>
          {currentMode === "create" ? "レビュー投稿" : "レビュー一覧"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {currentMode === "create"
            ? "体験を評価してください"
            : `${artist.name}のレビュー`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.modeSwitch}
        onPress={() =>
          setCurrentMode(currentMode === "create" ? "list" : "create")
        }
      >
        <Text style={styles.modeSwitchText}>
          {currentMode === "create" ? "📋" : "✏️"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderArtistCard = () => (
    <View style={styles.artistCard}>
      <Avatar
        imageUrl={artist.avatar}
        name={artist.name}
        size="large"
        showBadge={artist.isVerified}
      />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.artistStudio}>{artist.studioName}</Text>
        <View style={styles.artistStats}>
          <Text style={styles.artistRating}>⭐ {artist.rating.toFixed(1)}</Text>
          <Text style={styles.artistReviews}>
            {artist.reviewCount}件のレビュー
          </Text>
        </View>
      </View>
    </View>
  );

  const renderOverallRating = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>総合評価</Text>
      <View style={styles.overallRatingContainer}>
        {renderAnimatedStarRating(
          formData.overallRating,
          (rating) => handleRatingPress("overall", rating),
          "large",
        )}
        <Text style={styles.ratingValue}>
          {formData.overallRating > 0
            ? `${formData.overallRating}.0`
            : "未評価"}
        </Text>
        <Text style={styles.ratingDescription}>
          {formData.overallRating === 0 && "星をタップして評価"}
          {formData.overallRating === 1 && "期待を下回りました"}
          {formData.overallRating === 2 && "やや不満でした"}
          {formData.overallRating === 3 && "普通でした"}
          {formData.overallRating === 4 && "満足しました"}
          {formData.overallRating === 5 && "大変満足しました！"}
        </Text>
      </View>
    </View>
  );

  const renderCategoryRatings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>項目別評価</Text>
      <Text style={styles.sectionDescription}>
        各項目を5段階で評価してください
      </Text>

      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <View key={category.key} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
            </View>

            <View style={styles.categoryRating}>
              {renderAnimatedStarRating(
                formData.categoryRatings[category.key],
                (rating) => handleRatingPress(category.key, rating),
                "small",
              )}
              <Text style={styles.categoryRatingValue}>
                {formData.categoryRatings[category.key] || "-"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCommentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>詳しい感想</Text>
      <TextInput
        style={styles.commentInput}
        placeholder="体験した感想を詳しく教えてください。他のお客様の参考になります。(10文字以上)"
        placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
        value={formData.comment}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, comment: text }))
        }
        multiline
        maxLength={1000}
        textAlignVertical="top"
      />
      <View style={styles.commentFooter}>
        <Text style={styles.characterCount}>
          {formData.comment.length}/1000文字
        </Text>
        <Text
          style={[
            styles.commentStatus,
            formData.comment.length >= 10
              ? styles.commentStatusValid
              : styles.commentStatusInvalid,
          ]}
        >
          {formData.comment.length >= 10 ? "✓ 入力完了" : "最低10文字必要"}
        </Text>
      </View>
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>写真を追加（任意）</Text>
      <Text style={styles.sectionDescription}>
        完成したタトゥーの写真を追加すると、他のお客様の参考になります
      </Text>

      <View style={styles.photoGrid}>
        {formData.photos.map((photo, index) => (
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

        {formData.photos.length < 5 && (
          <TouchableOpacity
            style={styles.photoAddButton}
            onPress={handlePhotoUpload}
          >
            <Text style={styles.photoAddIcon}>📷</Text>
            <Text style={styles.photoAddText}>写真追加</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderOptionsSection = () => (
    <View style={styles.section}>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() =>
            setFormData((prev) => ({
              ...prev,
              wouldRecommend: !prev.wouldRecommend,
            }))
          }
        >
          <View
            style={[
              styles.checkbox,
              formData.wouldRecommend && styles.checkboxActive,
            ]}
          >
            {formData.wouldRecommend && (
              <Text style={styles.checkboxIcon}>✓</Text>
            )}
          </View>
          <Text style={styles.optionLabel}>
            このアーティストを友人におすすめしますか？
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() =>
            setFormData((prev) => ({ ...prev, isAnonymous: !prev.isAnonymous }))
          }
        >
          <View
            style={[
              styles.checkbox,
              formData.isAnonymous && styles.checkboxActive,
            ]}
          >
            {formData.isAnonymous && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.optionLabel}>匿名でレビューを投稿する</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSubmitButton = () => {
    const isValid = formData.overallRating > 0 && formData.comment.length >= 10;

    return (
      <View style={styles.submitSection}>
        <Button
          title={isSubmitting ? "投稿中..." : "レビューを投稿"}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          variant="primary"
          size="large"
          fullWidth
        />
        <Text style={styles.submitNote}>
          投稿後30日以内であれば編集可能です
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderHeader()}
        {renderArtistCard()}

        {currentMode === "create" ? (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {renderOverallRating()}
            {renderCategoryRatings()}
            {renderCommentSection()}
            {renderPhotoSection()}
            {renderOptionsSection()}
            {renderSubmitButton()}
          </ScrollView>
        ) : (
          <ReviewListView artist={artist} onBack={onBack} />
        )}
      </Animated.View>

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
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    ...DesignTokens.shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: DesignTokens.spacing[4],
  },
  headerTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },
  modeSwitch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.primary[500] + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  modeSwitchText: {
    fontSize: 20,
  },

  // Artist Card
  artistCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[5],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  artistInfo: {
    marginLeft: DesignTokens.spacing[4],
    flex: 1,
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
  artistStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DesignTokens.spacing[2],
    gap: DesignTokens.spacing[4],
  },
  artistRating: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  artistReviews: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  sectionDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[4],
    lineHeight: 20,
  },

  // Overall Rating
  overallRatingContainer: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[4],
  },
  ratingValue: {
    fontSize: DesignTokens.typography.sizes["3xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
    marginTop: DesignTokens.spacing[3],
  },
  ratingDescription: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: DesignTokens.spacing[2],
    textAlign: "center",
  },

  // Star Rating
  starRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  starButton: {
    padding: DesignTokens.spacing[1],
  },
  starText: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Category Ratings
  categoryGrid: {
    gap: DesignTokens.spacing[3],
  },
  categoryCard: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[3],
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: DesignTokens.spacing[3],
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  categoryDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },
  categoryRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryRatingValue: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
    minWidth: 20,
    textAlign: "center",
  },

  // Comment Section
  commentInput: {
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
  commentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: DesignTokens.spacing[2],
  },
  characterCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  commentStatus: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  commentStatusValid: {
    color: DesignTokens.colors.success,
  },
  commentStatusInvalid: {
    color: DesignTokens.colors.warning,
  },

  // Photo Section
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
    backgroundColor: DesignTokens.colors.error,
    alignItems: "center",
    justifyContent: "center",
    ...DesignTokens.shadows.base,
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

  // Options Section
  optionsContainer: {
    gap: DesignTokens.spacing[4],
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.background,
  },
  checkboxActive: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderColor: DesignTokens.colors.primary[500],
  },
  checkboxIcon: {
    color: DesignTokens.colors.dark.text.primary,
    fontSize: 16,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  optionLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    flex: 1,
  },

  // Submit Section
  submitSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  submitNote: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    marginTop: DesignTokens.spacing[3],
  },
});

export default EnhancedReviewScreen;
