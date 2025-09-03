import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  Image,
  Switch,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ReviewService, { ReviewCategories } from "../../services/ReviewService";
import BookingService from "../../services/BookingService";
import { User } from "../../types";

interface Props {
  route: {
    params: {
      bookingId: string;
      artistId: string;
      artistName?: string;
    };
  };
  navigation: any;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  interactive?: boolean;
  label?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 32,
  interactive = true,
  label,
}) => {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && onRatingChange(i)}
          disabled={!interactive}
          style={styles.starButton}
        >
          <Text
            style={[
              styles.star,
              { fontSize: size, color: i <= rating ? "#ff6b6b" : "#333" },
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  return (
    <View style={styles.starRatingContainer}>
      {label && <Text style={styles.starLabel}>{label}</Text>}
      <View style={styles.starsRow}>
        {renderStars()}
        {interactive && (
          <Text style={styles.ratingText}>
            {rating > 0 ? `${rating}/5` : "未評価"}
          </Text>
        )}
      </View>
    </View>
  );
};

const ReviewCreateScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { bookingId, artistId, artistName } = route.params;

  const [artist, setArtist] = useState<User | null>(null);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [categories, setCategories] = useState<ReviewCategories>({
    technical: 0,
    communication: 0,
    cleanliness: 0,
    atmosphere: 0,
    value: 0,
  });
  const [comment, setComment] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadArtistInfo();
    checkExistingReview();
  }, []);

  const loadArtistInfo = async (): Promise<void> => {
    try {
      // アーティスト情報を取得（実際の実装では FirestoreからUser情報を取得）
      // 簡略化のため、基本情報のみ設定
      setArtist({
        uid: artistId,
        displayName: artistName || "Unknown Artist",
        email: "",
        userType: "artist",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error loading artist info:", error);
    }
  };

  const checkExistingReview = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      const existingReview = await ReviewService.getReviewByBooking(
        bookingId,
        userProfile.uid,
      );
      if (existingReview) {
        Alert.alert(
          "レビュー済み",
          "この予約に対するレビューは既に投稿されています。",
          [
            {
              text: "レビューを見る",
              onPress: () =>
                navigation.replace("ReviewDetail", {
                  reviewId: existingReview.id,
                }),
            },
            {
              text: "戻る",
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  };

  const updateCategoryRating = (
    category: keyof ReviewCategories,
    rating: number,
  ): void => {
    setCategories((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const validateForm = (): boolean => {
    if (overallRating === 0) {
      Alert.alert("入力エラー", "総合評価を選択してください");
      return false;
    }

    const categoryRatings = Object.values(categories);
    if (categoryRatings.some((rating) => rating === 0)) {
      Alert.alert("入力エラー", "すべてのカテゴリーを評価してください");
      return false;
    }

    if (comment.trim().length === 0) {
      Alert.alert("入力エラー", "コメントを入力してください");
      return false;
    }

    if (comment.trim().length < 10) {
      Alert.alert("入力エラー", "コメントは10文字以上入力してください");
      return false;
    }

    return true;
  };

  const submitReview = async (): Promise<void> => {
    if (!validateForm() || !userProfile?.uid) return;

    setIsSubmitting(true);

    try {
      await ReviewService.createReview(userProfile.uid, artistId, bookingId, {
        rating: overallRating,
        comment: comment.trim(),
        images,
        categories,
        isAnonymous,
      });

      Alert.alert(
        "レビュー投稿完了",
        "レビューが正常に投稿されました。ありがとうございます！",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("BookingStatus"),
          },
        ],
      );
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert(
        "エラー",
        "レビューの投稿に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: keyof ReviewCategories): string => {
    const labels = {
      technical: "技術力",
      communication: "コミュニケーション",
      cleanliness: "清潔感",
      atmosphere: "雰囲気",
      value: "コストパフォーマンス",
    };
    return labels[category];
  };

  const getCategoryDescription = (category: keyof ReviewCategories): string => {
    const descriptions = {
      technical: "技術の高さ、仕上がりの満足度",
      communication: "相談のしやすさ、説明の分かりやすさ",
      cleanliness: "スタジオや道具の清潔さ",
      atmosphere: "スタジオの雰囲気、リラックスできたか",
      value: "料金に対する満足度",
    };
    return descriptions[category];
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
        <Text style={styles.title}>レビューを投稿</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* アーティスト情報 */}
        {artist && (
          <View style={styles.artistCard}>
            <Text style={styles.artistName}>{artist.displayName}</Text>
            <Text style={styles.artistLabel}>に対するレビューを投稿します</Text>
          </View>
        )}

        {/* 総合評価 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>総合評価 *</Text>
          <StarRating
            rating={overallRating}
            onRatingChange={setOverallRating}
            size={40}
            label="全体的な満足度をお聞かせください"
          />
        </View>

        {/* カテゴリー別評価 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細評価 *</Text>
          <Text style={styles.sectionDescription}>
            各項目について5段階で評価してください
          </Text>

          {(Object.keys(categories) as Array<keyof ReviewCategories>).map(
            (category) => (
              <View key={category} style={styles.categoryRating}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {getCategoryLabel(category)}
                  </Text>
                  <Text style={styles.categoryDescription}>
                    {getCategoryDescription(category)}
                  </Text>
                </View>
                <StarRating
                  rating={categories[category]}
                  onRatingChange={(rating) =>
                    updateCategoryRating(category, rating)
                  }
                  size={28}
                />
              </View>
            ),
          )}
        </View>

        {/* コメント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>コメント *</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="具体的な感想やアドバイス、他のお客様へのメッセージなどをお書きください（10文字以上）"
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
          <Text style={styles.characterCount}>{comment.length}/1000文字</Text>
        </View>

        {/* 写真添付 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>写真を添付（任意）</Text>
          <TouchableOpacity style={styles.imageUploadButton}>
            <Text style={styles.imageUploadText}>📷 写真を追加</Text>
            <Text style={styles.imageUploadDescription}>
              完成したタトゥーの写真を追加できます
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((imageUri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 匿名オプション */}
        <View style={styles.section}>
          <View style={styles.anonymousContainer}>
            <View style={styles.anonymousInfo}>
              <Text style={styles.anonymousTitle}>匿名で投稿</Text>
              <Text style={styles.anonymousDescription}>
                名前を表示せずにレビューを投稿します
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: "#333", true: "#ff6b6b" }}
              thumbColor={isAnonymous ? "#fff" : "#aaa"}
            />
          </View>
        </View>

        {/* 投稿ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={submitReview}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "投稿中..." : "レビューを投稿"}
          </Text>
        </TouchableOpacity>

        {/* 注意事項 */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>📋 投稿に関する注意事項</Text>
          <Text style={styles.noticeText}>
            • レビューは投稿後30日以内であれば編集可能です{"\n"}•
            不適切な内容は管理者により削除される場合があります{"\n"}•
            完了した予約に対してのみレビューを投稿できます{"\n"}•
            投稿されたレビューはアーティストの評価に反映されます
          </Text>
        </View>
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
  artistCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  artistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 4,
  },
  artistLabel: {
    fontSize: 14,
    color: "#aaa",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 16,
  },
  starRatingContainer: {
    marginBottom: 8,
  },
  starLabel: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starButton: {
    marginRight: 4,
  },
  star: {
    fontSize: 32,
  },
  ratingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#aaa",
  },
  categoryRating: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: "#aaa",
  },
  commentInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 8,
  },
  imageUploadButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    alignItems: "center",
  },
  imageUploadText: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "bold",
    marginBottom: 4,
  },
  imageUploadDescription: {
    fontSize: 12,
    color: "#aaa",
  },
  imagePreview: {
    marginRight: 12,
    position: "relative",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  anonymousContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
  },
  anonymousInfo: {
    flex: 1,
    marginRight: 16,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  anonymousDescription: {
    fontSize: 12,
    color: "#aaa",
  },
  submitButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  noticeSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#facc15",
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 18,
  },
});

export default ReviewCreateScreen;
