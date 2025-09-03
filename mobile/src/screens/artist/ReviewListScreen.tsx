import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ReviewService, {
  Review,
  ReviewSummary,
  ReviewFilters,
} from "../../services/ReviewService";

interface Props {
  route: {
    params: {
      artistId?: string;
    };
  };
  navigation: any;
}

interface ReviewCardProps {
  review: Review;
  onReply: (review: Review) => void;
  onVoteHelpful: (reviewId: string, isHelpful: boolean) => void;
  showArtistReply?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onReply,
  onVoteHelpful,
  showArtistReply = true,
}) => {
  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, color: i <= rating ? "#ff6b6b" : "#333" },
          ]}
        >
          ★
        </Text>,
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      technical: "技術力",
      communication: "コミュニケーション",
      cleanliness: "清潔感",
      atmosphere: "雰囲気",
      value: "コストパフォーマンス",
    };
    return labels[category] || category;
  };

  return (
    <View style={styles.reviewCard}>
      {/* レビューヘッダー */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.isAnonymous ? "匿名ユーザー" : "ユーザー"}
          </Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(review.rating, 20)}
          <Text style={styles.ratingValue}>{review.rating}/5</Text>
        </View>
      </View>

      {/* 検証済みバッジ */}
      {review.isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ 予約確認済み</Text>
        </View>
      )}

      {/* カテゴリー別評価 */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>詳細評価</Text>
        <View style={styles.categoriesGrid}>
          {Object.entries(review.categories).map(([category, rating]) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>
                {getCategoryLabel(category)}
              </Text>
              {renderStars(rating, 12)}
              <Text style={styles.categoryRating}>{rating}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* コメント */}
      {review.comment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>{review.comment}</Text>
        </View>
      )}

      {/* アーティストの返信 */}
      {showArtistReply && review.response && (
        <View style={styles.artistResponse}>
          <Text style={styles.responseLabel}>アーティストからの返信</Text>
          <Text style={styles.responseText}>{review.response.message}</Text>
          <Text style={styles.responseDate}>
            {formatDate(review.response.createdAt)}
          </Text>
        </View>
      )}

      {/* アクションボタン */}
      <View style={styles.reviewActions}>
        {!review.response && showArtistReply && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => onReply(review)}
          >
            <Text style={styles.replyButtonText}>💬 返信する</Text>
          </TouchableOpacity>
        )}

        <View style={styles.helpfulContainer}>
          <TouchableOpacity
            style={styles.helpfulButton}
            onPress={() => onVoteHelpful(review.id, true)}
          >
            <Text style={styles.helpfulText}>👍 参考になった</Text>
          </TouchableOpacity>
          <Text style={styles.helpfulCount}>({review.helpfulVotes})</Text>
        </View>
      </View>
    </View>
  );
};

const ReviewListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { artistId } = route.params || {};
  const targetArtistId = artistId || userProfile?.uid;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const isOwner = userProfile?.uid === targetArtistId;

  useEffect(() => {
    if (targetArtistId) {
      loadReviews();
      loadReviewSummary();
    }
  }, [targetArtistId, filters]);

  const loadReviews = async (): Promise<void> => {
    if (!targetArtistId) return;

    try {
      setIsLoading(true);
      const reviewsData = await ReviewService.getArtistReviews(
        targetArtistId,
        filters,
      );
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
      Alert.alert("エラー", "レビューの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewSummary = async (): Promise<void> => {
    if (!targetArtistId) return;

    try {
      const summary = await ReviewService.getReviewSummary(targetArtistId);
      setReviewSummary(summary);
    } catch (error) {
      console.error("Error loading review summary:", error);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadReviews(), loadReviewSummary()]);
    setRefreshing(false);
  };

  const handleReply = (review: Review): void => {
    setSelectedReview(review);
    setReplyText("");
    setShowReplyModal(true);
  };

  const submitReply = async (): Promise<void> => {
    if (!selectedReview || !replyText.trim() || !targetArtistId) return;

    setIsSubmittingReply(true);
    try {
      await ReviewService.respondToReview(
        selectedReview.id,
        targetArtistId,
        replyText.trim(),
      );

      setShowReplyModal(false);
      setSelectedReview(null);
      setReplyText("");
      await loadReviews(); // レビューを再読み込み

      Alert.alert("返信完了", "レビューへの返信が投稿されました");
    } catch (error) {
      console.error("Error submitting reply:", error);
      Alert.alert("エラー", "返信の投稿に失敗しました");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleVoteHelpful = async (
    reviewId: string,
    isHelpful: boolean,
  ): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      await ReviewService.voteHelpful(reviewId, userProfile.uid, isHelpful);
      await loadReviews(); // レビューを再読み込み
    } catch (error) {
      console.error("Error voting helpful:", error);
      Alert.alert("エラー", "投票に失敗しました");
    }
  };

  const applyFilter = (rating?: number): void => {
    setFilters({ rating });
    setShowFilterModal(false);
  };

  const renderRatingDistribution = () => {
    if (!reviewSummary) return null;

    return (
      <View style={styles.ratingDistribution}>
        <Text style={styles.distributionTitle}>評価分布</Text>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewSummary.ratingDistribution[rating] || 0;
          const percentage =
            reviewSummary.totalReviews > 0
              ? (count / reviewSummary.totalReviews) * 100
              : 0;

          return (
            <TouchableOpacity
              key={rating}
              style={styles.distributionRow}
              onPress={() => applyFilter(rating)}
            >
              <Text style={styles.distributionRating}>{rating}★</Text>
              <View style={styles.distributionBar}>
                <View
                  style={[styles.distributionFill, { width: `${percentage}%` }]}
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
        <Text style={styles.title}>レビュー</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>🔍 フィルター</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* レビュー要約 */}
        {reviewSummary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.overallRating}>
                <Text style={styles.averageRating}>
                  {reviewSummary.averageRating.toFixed(1)}
                </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Text
                      key={i}
                      style={[
                        styles.star,
                        {
                          color:
                            i <= reviewSummary.averageRating
                              ? "#ff6b6b"
                              : "#333",
                        },
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.totalReviews}>
                  {reviewSummary.totalReviews}件のレビュー
                </Text>
              </View>
              {renderRatingDistribution()}
            </View>

            {/* カテゴリー別平均 */}
            <View style={styles.categoryAverages}>
              <Text style={styles.categoryAveragesTitle}>カテゴリー別評価</Text>
              <View style={styles.categoryAveragesGrid}>
                {Object.entries(reviewSummary.categoryAverages).map(
                  ([category, average]) => (
                    <View key={category} style={styles.categoryAverage}>
                      <Text style={styles.categoryAverageLabel}>
                        {category === "technical"
                          ? "技術力"
                          : category === "communication"
                            ? "コミュニケーション"
                            : category === "cleanliness"
                              ? "清潔感"
                              : category === "atmosphere"
                                ? "雰囲気"
                                : "コストパフォーマンス"}
                      </Text>
                      <Text style={styles.categoryAverageValue}>
                        {average.toFixed(1)}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          </View>
        )}

        {/* レビューリスト */}
        <View style={styles.reviewsList}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={handleReply}
                onVoteHelpful={handleVoteHelpful}
                showArtistReply={isOwner}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isLoading
                  ? "レビューを読み込み中..."
                  : "まだレビューがありません"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* フィルターモーダル */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>フィルター</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContent}>
            <Text style={styles.filterSectionTitle}>評価で絞り込み</Text>
            {[5, 4, 3, 2, 1, 0].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.filterOption}
                onPress={() => applyFilter(rating === 0 ? undefined : rating)}
              >
                <Text style={styles.filterOptionText}>
                  {rating === 0 ? "すべて表示" : `${rating}★`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* 返信モーダル */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>レビューに返信</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReplyModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.replyContent}>
            <Text style={styles.replyInstruction}>
              お客様のレビューに対する感謝の気持ちや追加情報を返信できます
            </Text>

            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="返信メッセージを入力してください"
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {replyText.length}/500文字
            </Text>

            <TouchableOpacity
              style={[
                styles.submitReplyButton,
                isSubmittingReply && styles.disabledButton,
              ]}
              onPress={submitReply}
              disabled={isSubmittingReply || !replyText.trim()}
            >
              <Text style={styles.submitReplyButtonText}>
                {isSubmittingReply ? "送信中..." : "返信を投稿"}
              </Text>
            </TouchableOpacity>
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
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  filterButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  overallRating: {
    flex: 1,
    alignItems: "center",
    marginRight: 20,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  star: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  totalReviews: {
    fontSize: 14,
    color: "#aaa",
  },
  ratingDistribution: {
    flex: 1,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionRating: {
    color: "#fff",
    fontSize: 12,
    width: 30,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: "100%",
    backgroundColor: "#ff6b6b",
    borderRadius: 4,
  },
  distributionCount: {
    color: "#aaa",
    fontSize: 12,
    width: 20,
    textAlign: "right",
  },
  categoryAverages: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 20,
  },
  categoryAveragesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  categoryAveragesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryAverage: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minWidth: "30%",
  },
  categoryAverageLabel: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryAverageValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#aaa",
  },
  ratingContainer: {
    alignItems: "flex-end",
  },
  ratingValue: {
    fontSize: 14,
    color: "#ff6b6b",
    fontWeight: "bold",
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#aaa",
    marginBottom: 8,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryItem: {
    backgroundColor: "#333",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    minWidth: "30%",
  },
  categoryLabel: {
    fontSize: 10,
    color: "#aaa",
    marginBottom: 2,
  },
  categoryRating: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "bold",
    marginTop: 2,
  },
  commentContainer: {
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  artistResponse: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "bold",
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 10,
    color: "#aaa",
  },
  reviewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  replyButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  helpfulContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpfulButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  helpfulText: {
    color: "#aaa",
    fontSize: 12,
  },
  helpfulCount: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#aaa",
    fontSize: 16,
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
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  filterOption: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  filterOptionText: {
    color: "#fff",
    fontSize: 16,
  },
  replyContent: {
    flex: 1,
    padding: 20,
  },
  replyInstruction: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
    marginBottom: 20,
  },
  replyInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginBottom: 20,
  },
  submitReplyButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  submitReplyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReviewListScreen;
