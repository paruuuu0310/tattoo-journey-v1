/**
 * 📋 REVIEW LIST VIEW COMPONENT
 * レビュー一覧表示コンポーネント（EnhancedReviewScreenで使用）
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { Avatar, Tag, Button, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockReviews, Artist } from "../../../mocks/fixtures";

interface Props {
  artist: Artist;
  onBack?: () => void;
}

interface ReviewItemProps {
  review: any;
  onReply?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onReply,
  onHelpful,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              {
                fontSize: size,
                color:
                  star <= rating
                    ? DesignTokens.colors.accent.gold
                    : DesignTokens.colors.dark.text.tertiary,
              },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Animated.View style={[styles.reviewItem, { opacity: fadeAnim }]}>
      {/* レビューヘッダー */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>匿名ユーザー</Text>
          <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
        </View>
        <View style={styles.ratingInfo}>
          {renderStars(review.rating, 18)}
          <Text style={styles.ratingValue}>{review.rating}/5</Text>
        </View>
      </View>

      {/* 検証済みバッジ */}
      <View style={styles.verifiedBadge}>
        <Text style={styles.verifiedText}>✓ 予約確認済み</Text>
      </View>

      {/* レビューコメント */}
      <Text style={styles.reviewComment}>{review.comment}</Text>

      {/* レビュー写真 */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosContainer}
        >
          {review.photos.map((photo: string, index: number) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.reviewPhoto}
            />
          ))}
        </ScrollView>
      )}

      {/* レビューアクション */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => onHelpful?.(review.id)}
        >
          <Text style={styles.helpfulText}>👍 参考になった</Text>
          <Text style={styles.helpfulCount}>(12)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => onReply?.(review.id)}
        >
          <Text style={styles.replyText}>💬 返信</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const ReviewListView: React.FC<Props> = ({ artist, onBack }) => {
  const [reviews, setReviews] = useState(mockReviews);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // レビュー統計の計算
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
    percentage:
      totalReviews > 0
        ? (reviews.filter((review) => review.rating === rating).length /
            totalReviews) *
          100
        : 0,
  }));

  const filteredReviews = filterRating
    ? reviews.filter((review) => review.rating === filterRating)
    : reviews;

  const handleReply = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setShowReplyModal(true);
    setReplyText("");
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      setToastMessage("返信を投稿しました");
      setShowToast(true);
      setShowReplyModal(false);
      setReplyText("");
      setSelectedReviewId(null);
    }
  };

  const handleHelpful = (reviewId: string) => {
    setToastMessage("参考になったを押しました");
    setShowToast(true);
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      {/* 総合評価 */}
      <View style={styles.summaryHeader}>
        <View style={styles.overallRating}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.star,
                  {
                    fontSize: 20,
                    color:
                      star <= averageRating
                        ? DesignTokens.colors.accent.gold
                        : DesignTokens.colors.dark.text.tertiary,
                  },
                ]}
              >
                ★
              </Text>
            ))}
          </View>
          <Text style={styles.totalReviews}>{totalReviews}件のレビュー</Text>
        </View>

        {/* 評価分布 */}
        <View style={styles.ratingDistribution}>
          <Text style={styles.distributionTitle}>評価分布</Text>
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <TouchableOpacity
              key={rating}
              style={styles.distributionRow}
              onPress={() =>
                setFilterRating(filterRating === rating ? null : rating)
              }
            >
              <Text style={styles.distributionRating}>{rating}★</Text>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor:
                        filterRating === rating
                          ? DesignTokens.colors.primary[500]
                          : DesignTokens.colors.accent.gold,
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* フィルターリセット */}
      {filterRating && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setFilterRating(null)}
        >
          <Text style={styles.clearFilterText}>× フィルターをクリア</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>レビューがありません</Text>
      <Text style={styles.emptyStateDescription}>
        {filterRating
          ? `${filterRating}★のレビューが見つかりませんでした`
          : "まだレビューが投稿されていません"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー情報 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>レビュー一覧</Text>
        <Text style={styles.headerSubtitle}>{artist.name}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* サマリーカード */}
        {renderSummaryCard()}

        {/* レビュー一覧 */}
        <View style={styles.reviewsList}>
          {filteredReviews.length > 0
            ? filteredReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onReply={handleReply}
                  onHelpful={handleHelpful}
                />
              ))
            : renderEmptyState()}
        </View>
      </ScrollView>

      {/* 返信モーダル */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>レビューに返信</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReplyModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.replyInstruction}>
              お客様のレビューに対する感謝の気持ちや追加情報をお伝えください
            </Text>

            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="返信メッセージを入力してください"
              placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
              multiline
              numberOfLines={6}
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {replyText.length}/500文字
            </Text>

            <Button
              title="返信を投稿"
              onPress={handleSubmitReply}
              disabled={!replyText.trim()}
              variant="primary"
              size="large"
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
        position="bottom"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  headerTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    marginTop: 2,
  },

  content: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[6],
  },
  summaryHeader: {
    flexDirection: "row",
    marginBottom: DesignTokens.spacing[4],
  },
  overallRating: {
    flex: 1,
    alignItems: "center",
    paddingRight: DesignTokens.spacing[6],
  },
  averageRating: {
    fontSize: DesignTokens.typography.sizes["4xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
    marginBottom: DesignTokens.spacing[2],
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: DesignTokens.spacing[2],
  },
  star: {
    marginHorizontal: 1,
  },
  totalReviews: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Rating Distribution
  ratingDistribution: {
    flex: 1,
  },
  distributionTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  distributionRating: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    width: 30,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: DesignTokens.colors.dark.border,
    borderRadius: 4,
    marginHorizontal: DesignTokens.spacing[2],
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    width: 25,
    textAlign: "right",
  },

  clearFilterButton: {
    alignSelf: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.primary[500] + "20",
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[500],
  },
  clearFilterText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Reviews List
  reviewsList: {
    paddingHorizontal: DesignTokens.spacing[6],
    gap: DesignTokens.spacing[4],
  },

  // Review Item
  reviewItem: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    marginBottom: DesignTokens.spacing[3],
    ...DesignTokens.shadows.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: DesignTokens.spacing[3],
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },
  ratingInfo: {
    alignItems: "flex-end",
  },
  ratingValue: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.gold,
    fontWeight: DesignTokens.typography.weights.bold,
    marginTop: 2,
  },

  verifiedBadge: {
    alignSelf: "flex-start",
    backgroundColor: DesignTokens.colors.success,
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: 4,
    marginBottom: DesignTokens.spacing[3],
  },
  verifiedText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },

  reviewComment: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    lineHeight: 22,
    marginBottom: DesignTokens.spacing[3],
  },

  photosContainer: {
    marginBottom: DesignTokens.spacing[3],
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: DesignTokens.radius.lg,
    marginRight: DesignTokens.spacing[2],
    backgroundColor: DesignTokens.colors.dark.background,
  },

  reviewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  helpfulText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginRight: DesignTokens.spacing[1],
  },
  helpfulCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.tertiary,
  },
  replyButton: {
    paddingVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.primary[500] + "20",
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[500] + "50",
  },
  replyText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[12],
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: DesignTokens.spacing[4],
  },
  emptyStateTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  emptyStateDescription: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  modalContent: {
    flex: 1,
    padding: DesignTokens.spacing[6],
  },
  replyInstruction: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 22,
    marginBottom: DesignTokens.spacing[6],
  },
  replyInput: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: DesignTokens.spacing[2],
  },
  characterCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "right",
    marginBottom: DesignTokens.spacing[6],
  },
});

export default ReviewListView;
