import firestore from "@react-native-firebase/firestore";
import { User } from "../types";

export interface Review {
  id: string;
  customerId: string;
  artistId: string;
  bookingId: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  categories: ReviewCategories;
  isAnonymous: boolean;
  helpfulVotes: number;
  reportCount: number;
  isVerified: boolean;
  response?: ArtistResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCategories {
  technical: number; // 技術力 (1-5)
  communication: number; // コミュニケーション (1-5)
  cleanliness: number; // 清潔感 (1-5)
  atmosphere: number; // 雰囲気 (1-5)
  value: number; // コストパフォーマンス (1-5)
}

export interface ArtistResponse {
  message: string;
  createdAt: Date;
  isPublic: boolean;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  categoryAverages: ReviewCategories;
  ratingDistribution: Record<number, number>; // rating -> count
  recentReviews: Review[];
  verifiedReviewsCount: number;
}

export interface ReviewFilters {
  rating?: number;
  hasComment?: boolean;
  hasImages?: boolean;
  isVerified?: boolean;
  categories?: Partial<ReviewCategories>;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ReviewService {
  private static instance: ReviewService;

  private constructor() {}

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * レビューを作成
   */
  async createReview(
    customerId: string,
    artistId: string,
    bookingId: string,
    reviewData: {
      rating: number;
      comment?: string;
      images?: string[];
      categories: ReviewCategories;
      isAnonymous?: boolean;
    },
  ): Promise<string> {
    try {
      // 既存のレビューをチェック
      const existingReview = await this.getReviewByBooking(
        bookingId,
        customerId,
      );
      if (existingReview) {
        throw new Error("This booking has already been reviewed");
      }

      // 予約が完了しているかチェック
      const bookingDoc = await firestore()
        .collection("confirmedBookings")
        .where("bookingRequestId", "==", bookingId)
        .where("customerId", "==", customerId)
        .where("status", "==", "completed")
        .get();

      if (bookingDoc.empty) {
        throw new Error("Booking not found or not completed");
      }

      const review: Omit<Review, "id"> = {
        customerId,
        artistId,
        bookingId,
        rating: Math.max(1, Math.min(5, reviewData.rating)),
        comment: reviewData.comment,
        images: reviewData.images || [],
        categories: this.validateCategories(reviewData.categories),
        isAnonymous: reviewData.isAnonymous || false,
        helpfulVotes: 0,
        reportCount: 0,
        isVerified: true, // Always verified for completed bookings
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await firestore().collection("reviews").add(review);

      // アーティストの評価を更新
      await this.updateArtistRating(artistId);

      return docRef.id;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }

  /**
   * レビューを更新（作成から30日以内のみ）
   */
  async updateReview(
    reviewId: string,
    customerId: string,
    updates: {
      rating?: number;
      comment?: string;
      images?: string[];
      categories?: ReviewCategories;
    },
  ): Promise<void> {
    try {
      const reviewDoc = await firestore()
        .collection("reviews")
        .doc(reviewId)
        .get();

      if (!reviewDoc.exists) {
        throw new Error("Review not found");
      }

      const review = reviewDoc.data() as Review;

      if (review.customerId !== customerId) {
        throw new Error("Unauthorized: Not the review author");
      }

      // 30日以内の編集制限チェック
      const daysSinceCreation =
        (new Date().getTime() - review.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 30) {
        throw new Error("Review can only be edited within 30 days of creation");
      }

      const updateData: Partial<Review> = {
        updatedAt: new Date(),
      };

      if (updates.rating !== undefined) {
        updateData.rating = Math.max(1, Math.min(5, updates.rating));
      }

      if (updates.comment !== undefined) {
        updateData.comment = updates.comment;
      }

      if (updates.images !== undefined) {
        updateData.images = updates.images;
      }

      if (updates.categories !== undefined) {
        updateData.categories = this.validateCategories(updates.categories);
      }

      await firestore().collection("reviews").doc(reviewId).update(updateData);

      // レーティングが変更された場合、アーティストの評価を更新
      if (updates.rating !== undefined || updates.categories !== undefined) {
        try {
          const ArtistScoreService = (await import("./ArtistScoreService"))
            .default;
          await ArtistScoreService.onReviewUpdated(review.artistId);
        } catch (error) {
          console.error(
            "Error updating artist score after review update:",
            error,
          );
        }
      }
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  }

  /**
   * アーティストのレビューを取得
   */
  async getArtistReviews(
    artistId: string,
    filters?: ReviewFilters,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Review[]> {
    try {
      let query = firestore()
        .collection("reviews")
        .where("artistId", "==", artistId)
        .orderBy("createdAt", "desc");

      // フィルターを適用
      if (filters?.rating) {
        query = query.where("rating", "==", filters.rating);
      }

      if (filters?.isVerified !== undefined) {
        query = query.where("isVerified", "==", filters.isVerified);
      }

      if (filters?.dateFrom) {
        query = query.where("createdAt", ">=", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.where("createdAt", "<=", filters.dateTo);
      }

      const snapshot = await query.limit(limit).offset(offset).get();

      const reviews: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          response: data.response
            ? {
                ...data.response,
                createdAt: data.response.createdAt.toDate(),
              }
            : undefined,
        } as Review);
      });

      // クライアントサイドでの追加フィルタリング
      let filteredReviews = reviews;

      if (filters?.hasComment) {
        filteredReviews = filteredReviews.filter(
          (r) => r.comment && r.comment.trim().length > 0,
        );
      }

      if (filters?.hasImages) {
        filteredReviews = filteredReviews.filter(
          (r) => r.images && r.images.length > 0,
        );
      }

      return filteredReviews;
    } catch (error) {
      console.error("Error getting artist reviews:", error);
      return [];
    }
  }

  /**
   * カスタマーのレビューを取得
   */
  async getCustomerReviews(customerId: string): Promise<Review[]> {
    try {
      const snapshot = await firestore()
        .collection("reviews")
        .where("customerId", "==", customerId)
        .orderBy("createdAt", "desc")
        .get();

      const reviews: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          response: data.response
            ? {
                ...data.response,
                createdAt: data.response.createdAt.toDate(),
              }
            : undefined,
        } as Review);
      });

      return reviews;
    } catch (error) {
      console.error("Error getting customer reviews:", error);
      return [];
    }
  }

  /**
   * 特定の予約のレビューを取得
   */
  async getReviewByBooking(
    bookingId: string,
    customerId: string,
  ): Promise<Review | null> {
    try {
      const snapshot = await firestore()
        .collection("reviews")
        .where("bookingId", "==", bookingId)
        .where("customerId", "==", customerId)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        response: data.response
          ? {
              ...data.response,
              createdAt: data.response.createdAt.toDate(),
            }
          : undefined,
      } as Review;
    } catch (error) {
      console.error("Error getting review by booking:", error);
      return null;
    }
  }

  /**
   * アーティストのレビュー要約を取得
   */
  async getReviewSummary(artistId: string): Promise<ReviewSummary> {
    try {
      const snapshot = await firestore()
        .collection("reviews")
        .where("artistId", "==", artistId)
        .get();

      if (snapshot.empty) {
        return {
          totalReviews: 0,
          averageRating: 0,
          categoryAverages: {
            technical: 0,
            communication: 0,
            cleanliness: 0,
            atmosphere: 0,
            value: 0,
          },
          ratingDistribution: {},
          recentReviews: [],
          verifiedReviewsCount: 0,
        };
      }

      const reviews: Review[] = [];
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      let totalRating = 0;
      let totalTechnical = 0;
      let totalCommunication = 0;
      let totalCleanliness = 0;
      let totalAtmosphere = 0;
      let totalValue = 0;
      let verifiedCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const review: Review = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          response: data.response
            ? {
                ...data.response,
                createdAt: data.response.createdAt.toDate(),
              }
            : undefined,
        } as Review;

        reviews.push(review);
        totalRating += review.rating;
        ratingDistribution[review.rating]++;

        if (review.categories) {
          totalTechnical += review.categories.technical;
          totalCommunication += review.categories.communication;
          totalCleanliness += review.categories.cleanliness;
          totalAtmosphere += review.categories.atmosphere;
          totalValue += review.categories.value;
        }

        if (review.isVerified) {
          verifiedCount++;
        }
      });

      const totalReviews = reviews.length;
      const recentReviews = reviews
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      return {
        totalReviews,
        averageRating: totalReviews > 0 ? totalRating / totalReviews : 0,
        categoryAverages: {
          technical: totalReviews > 0 ? totalTechnical / totalReviews : 0,
          communication:
            totalReviews > 0 ? totalCommunication / totalReviews : 0,
          cleanliness: totalReviews > 0 ? totalCleanliness / totalReviews : 0,
          atmosphere: totalReviews > 0 ? totalAtmosphere / totalReviews : 0,
          value: totalReviews > 0 ? totalValue / totalReviews : 0,
        },
        ratingDistribution,
        recentReviews,
        verifiedReviewsCount: verifiedCount,
      };
    } catch (error) {
      console.error("Error getting review summary:", error);
      throw error;
    }
  }

  /**
   * アーティストがレビューに返信
   */
  async respondToReview(
    reviewId: string,
    artistId: string,
    response: string,
    isPublic: boolean = true,
  ): Promise<void> {
    try {
      const reviewDoc = await firestore()
        .collection("reviews")
        .doc(reviewId)
        .get();

      if (!reviewDoc.exists) {
        throw new Error("Review not found");
      }

      const review = reviewDoc.data() as Review;

      if (review.artistId !== artistId) {
        throw new Error("Unauthorized: Not the reviewed artist");
      }

      const artistResponse: ArtistResponse = {
        message: response,
        createdAt: new Date(),
        isPublic,
      };

      await firestore().collection("reviews").doc(reviewId).update({
        response: artistResponse,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error responding to review:", error);
      throw error;
    }
  }

  /**
   * レビューの有用性投票
   */
  async voteHelpful(
    reviewId: string,
    userId: string,
    isHelpful: boolean,
  ): Promise<void> {
    try {
      const voteDoc = firestore()
        .collection("reviewVotes")
        .doc(`${reviewId}_${userId}`);

      const existingVote = await voteDoc.get();

      if (existingVote.exists) {
        const voteData = existingVote.data();
        if (voteData?.isHelpful === isHelpful) {
          return; // 同じ投票は無効
        }
      }

      // トランザクションで投票と集計を更新
      await firestore().runTransaction(async (transaction) => {
        const reviewDoc = firestore().collection("reviews").doc(reviewId);
        const reviewSnapshot = await transaction.get(reviewDoc);

        if (!reviewSnapshot.exists) {
          throw new Error("Review not found");
        }

        let helpfulVotes = reviewSnapshot.data()?.helpfulVotes || 0;

        if (existingVote.exists) {
          const oldVote = existingVote.data();
          if (oldVote?.isHelpful) {
            helpfulVotes -= 1;
          }
        }

        if (isHelpful) {
          helpfulVotes += 1;
        }

        transaction.set(voteDoc, {
          userId,
          reviewId,
          isHelpful,
          createdAt: new Date(),
        });

        transaction.update(reviewDoc, {
          helpfulVotes: Math.max(0, helpfulVotes),
        });
      });
    } catch (error) {
      console.error("Error voting for review:", error);
      throw error;
    }
  }

  /**
   * アーティストの評価を更新
   */
  private async updateArtistRating(artistId: string): Promise<void> {
    try {
      // ArtistScoreServiceを使用して包括的なスコア更新を実行
      const ArtistScoreService = (await import("./ArtistScoreService")).default;
      await ArtistScoreService.onReviewAdded(artistId);
    } catch (error) {
      console.error("Error updating artist rating:", error);
      // 評価更新エラーは致命的でないので、ログのみ
    }
  }

  /**
   * カテゴリー評価を検証
   */
  private validateCategories(categories: ReviewCategories): ReviewCategories {
    return {
      technical: Math.max(1, Math.min(5, categories.technical)),
      communication: Math.max(1, Math.min(5, categories.communication)),
      cleanliness: Math.max(1, Math.min(5, categories.cleanliness)),
      atmosphere: Math.max(1, Math.min(5, categories.atmosphere)),
      value: Math.max(1, Math.min(5, categories.value)),
    };
  }

  /**
   * レビューを報告
   */
  async reportReview(
    reviewId: string,
    reporterId: string,
    reason: string,
    description?: string,
  ): Promise<void> {
    try {
      await firestore()
        .collection("reviewReports")
        .add({
          reviewId,
          reporterId,
          reason,
          description: description || "",
          status: "pending",
          createdAt: new Date(),
        });

      // 報告カウントを増加
      await firestore()
        .collection("reviews")
        .doc(reviewId)
        .update({
          reportCount: firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error("Error reporting review:", error);
      throw error;
    }
  }
}

export default ReviewService.getInstance();
