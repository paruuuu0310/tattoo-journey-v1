import firestore from "@react-native-firebase/firestore";
import ReviewService, { ReviewSummary } from "./ReviewService";
import { User } from "../types";

export interface ArtistScoreMetrics {
  overallRating: number;
  totalReviews: number;
  categoryScores: {
    technical: number;
    communication: number;
    cleanliness: number;
    atmosphere: number;
    value: number;
  };
  verifiedReviewsRatio: number;
  responsiveness: number; // レビューへの返信率
  responseTime: number; // 平均返信時間（時間単位）
  completionRate: number; // 予約完了率
  repeatCustomerRate: number; // リピーター率
  scoreHistory: ScoreHistoryEntry[];
  lastUpdated: Date;
}

export interface ScoreHistoryEntry {
  date: Date;
  score: number;
  reviewCount: number;
  trigger:
    | "review_added"
    | "review_updated"
    | "booking_completed"
    | "manual_update";
}

export interface ArtistRankingInfo {
  overallRank: number;
  categoryRanks: {
    technical: number;
    communication: number;
    cleanliness: number;
    atmosphere: number;
    value: number;
  };
  regionRank: number; // 地域内順位
  totalArtists: number;
  regionArtists: number;
}

export class ArtistScoreService {
  private static instance: ArtistScoreService;

  private constructor() {}

  public static getInstance(): ArtistScoreService {
    if (!ArtistScoreService.instance) {
      ArtistScoreService.instance = new ArtistScoreService();
    }
    return ArtistScoreService.instance;
  }

  /**
   * アーティストのスコアを自動更新
   */
  async updateArtistScore(
    artistId: string,
    trigger: ScoreHistoryEntry["trigger"] = "manual_update",
  ): Promise<ArtistScoreMetrics> {
    try {
      // Updating artist score

      // 並行してデータを取得
      const [reviewSummary, responsiveData, bookingData, currentScore] =
        await Promise.all([
          ReviewService.getReviewSummary(artistId),
          this.calculateResponsiveness(artistId),
          this.calculateBookingMetrics(artistId),
          this.getCurrentScore(artistId),
        ]);

      // 新しいスコアメトリクスを計算
      const newMetrics = await this.calculateScoreMetrics(
        artistId,
        reviewSummary,
        responsiveData,
        bookingData,
        currentScore,
      );

      // スコア履歴を更新
      const updatedHistory = this.updateScoreHistory(
        currentScore?.scoreHistory || [],
        newMetrics.overallRating,
        reviewSummary.totalReviews,
        trigger,
      );

      const finalMetrics: ArtistScoreMetrics = {
        ...newMetrics,
        scoreHistory: updatedHistory,
        lastUpdated: new Date(),
      };

      // Firestoreに保存
      await this.saveArtistScore(artistId, finalMetrics);

      // ランキング情報を更新
      await this.updateRankings(artistId);

      // Artist score updated successfully
      return finalMetrics;
    } catch (error) {
      console.error("Error updating artist score:", error);
      throw error;
    }
  }

  /**
   * 現在のスコア情報を取得
   */
  async getCurrentScore(artistId: string): Promise<ArtistScoreMetrics | null> {
    try {
      const doc = await firestore()
        .collection("artistScores")
        .doc(artistId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        lastUpdated: data?.lastUpdated?.toDate() || new Date(),
        scoreHistory:
          data?.scoreHistory?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date(),
          })) || [],
      } as ArtistScoreMetrics;
    } catch (error) {
      console.error("Error getting current score:", error);
      return null;
    }
  }

  /**
   * アーティストのランキング情報を取得
   */
  async getArtistRanking(artistId: string): Promise<ArtistRankingInfo> {
    try {
      const doc = await firestore()
        .collection("artistRankings")
        .doc(artistId)
        .get();

      if (!doc.exists) {
        // デフォルト値を返す
        return {
          overallRank: 0,
          categoryRanks: {
            technical: 0,
            communication: 0,
            cleanliness: 0,
            atmosphere: 0,
            value: 0,
          },
          regionRank: 0,
          totalArtists: 0,
          regionArtists: 0,
        };
      }

      return doc.data() as ArtistRankingInfo;
    } catch (error) {
      console.error("Error getting artist ranking:", error);
      throw error;
    }
  }

  /**
   * スコアメトリクスを計算
   */
  private async calculateScoreMetrics(
    artistId: string,
    reviewSummary: ReviewSummary,
    responsiveData: { responsiveness: number; responseTime: number },
    bookingData: { completionRate: number; repeatCustomerRate: number },
    currentScore: ArtistScoreMetrics | null,
  ): Promise<Omit<ArtistScoreMetrics, "scoreHistory" | "lastUpdated">> {
    // 基本評価（レビューベース）
    const baseRating = reviewSummary.averageRating;
    const verifiedRatio =
      reviewSummary.totalReviews > 0
        ? reviewSummary.verifiedReviewsCount / reviewSummary.totalReviews
        : 0;

    // 重み付きスコア計算
    // レビュー評価: 60%, レスポンシブ性: 15%, 予約完了率: 15%, リピート率: 10%
    const weightedScore =
      baseRating * 0.6 +
      responsiveData.responsiveness * 5 * 0.15 +
      bookingData.completionRate * 5 * 0.15 +
      bookingData.repeatCustomerRate * 5 * 0.1;

    // 最終的なoverallRatingは1-5の範囲に正規化
    const overallRating = Math.max(1, Math.min(5, weightedScore));

    return {
      overallRating,
      totalReviews: reviewSummary.totalReviews,
      categoryScores: reviewSummary.categoryAverages,
      verifiedReviewsRatio: verifiedRatio,
      responsiveness: responsiveData.responsiveness,
      responseTime: responsiveData.responseTime,
      completionRate: bookingData.completionRate,
      repeatCustomerRate: bookingData.repeatCustomerRate,
    };
  }

  /**
   * レスポンシブ性を計算（レビューへの返信率と時間）
   */
  private async calculateResponsiveness(artistId: string): Promise<{
    responsiveness: number;
    responseTime: number;
  }> {
    try {
      const reviewsSnapshot = await firestore()
        .collection("reviews")
        .where("artistId", "==", artistId)
        .orderBy("createdAt", "desc")
        .limit(50) // 直近50件で計算
        .get();

      if (reviewsSnapshot.empty) {
        return { responsiveness: 0, responseTime: 0 };
      }

      let totalReviews = 0;
      let reviewsWithResponse = 0;
      let totalResponseTime = 0;

      reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        totalReviews++;

        if (review.response && review.response.createdAt) {
          reviewsWithResponse++;

          const reviewDate = review.createdAt.toDate();
          const responseDate = review.response.createdAt.toDate();
          const responseTimeHours =
            (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

          totalResponseTime += responseTimeHours;
        }
      });

      const responsiveness =
        totalReviews > 0 ? reviewsWithResponse / totalReviews : 0;
      const avgResponseTime =
        reviewsWithResponse > 0 ? totalResponseTime / reviewsWithResponse : 0;

      return {
        responsiveness,
        responseTime: avgResponseTime,
      };
    } catch (error) {
      console.error("Error calculating responsiveness:", error);
      return { responsiveness: 0, responseTime: 0 };
    }
  }

  /**
   * 予約関連メトリクスを計算
   */
  private async calculateBookingMetrics(artistId: string): Promise<{
    completionRate: number;
    repeatCustomerRate: number;
  }> {
    try {
      // 過去3ヶ月のデータを対象とする
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const bookingsSnapshot = await firestore()
        .collection("confirmedBookings")
        .where("artistId", "==", artistId)
        .where("createdAt", ">=", threeMonthsAgo)
        .get();

      if (bookingsSnapshot.empty) {
        return { completionRate: 0, repeatCustomerRate: 0 };
      }

      let totalBookings = 0;
      let completedBookings = 0;
      const customerCounts: Record<string, number> = {};

      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        totalBookings++;

        if (booking.status === "completed") {
          completedBookings++;
        }

        // リピーター率計算用
        if (booking.customerId) {
          customerCounts[booking.customerId] =
            (customerCounts[booking.customerId] || 0) + 1;
        }
      });

      // 予約完了率
      const completionRate =
        totalBookings > 0 ? completedBookings / totalBookings : 0;

      // リピーター率（2回以上予約した顧客の割合）
      const uniqueCustomers = Object.keys(customerCounts).length;
      const repeatCustomers = Object.values(customerCounts).filter(
        (count) => count > 1,
      ).length;
      const repeatCustomerRate =
        uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0;

      return {
        completionRate,
        repeatCustomerRate,
      };
    } catch (error) {
      console.error("Error calculating booking metrics:", error);
      return { completionRate: 0, repeatCustomerRate: 0 };
    }
  }

  /**
   * スコア履歴を更新
   */
  private updateScoreHistory(
    currentHistory: ScoreHistoryEntry[],
    newScore: number,
    reviewCount: number,
    trigger: ScoreHistoryEntry["trigger"],
  ): ScoreHistoryEntry[] {
    const newEntry: ScoreHistoryEntry = {
      date: new Date(),
      score: newScore,
      reviewCount,
      trigger,
    };

    // 新しいエントリを追加し、最新30件のみ保持
    const updatedHistory = [newEntry, ...currentHistory].slice(0, 30);
    return updatedHistory;
  }

  /**
   * スコアをFirestoreに保存
   */
  private async saveArtistScore(
    artistId: string,
    metrics: ArtistScoreMetrics,
  ): Promise<void> {
    try {
      // artistScoresコレクションに保存
      await firestore().collection("artistScores").doc(artistId).set(metrics);

      // usersコレクションのartistInfoも更新
      await firestore().collection("users").doc(artistId).update({
        "artistInfo.rating": metrics.overallRating,
        "artistInfo.reviewCount": metrics.totalReviews,
        "artistInfo.categoryRatings": metrics.categoryScores,
        "artistInfo.verifiedReviewsRatio": metrics.verifiedReviewsRatio,
        "artistInfo.completionRate": metrics.completionRate,
        "artistInfo.responseTime": metrics.responseTime,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving artist score:", error);
      throw error;
    }
  }

  /**
   * アーティストのランキングを更新（バッチ処理）
   */
  private async updateRankings(artistId: string): Promise<void> {
    try {
      // 現在のアーティストの情報を取得
      const currentArtist = await this.getCurrentScore(artistId);
      if (!currentArtist) return;

      // 全アーティストのスコアを取得してランキング計算
      const allArtistsSnapshot = await firestore()
        .collection("artistScores")
        .orderBy("overallRating", "desc")
        .get();

      if (allArtistsSnapshot.empty) return;

      const allArtists = allArtistsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as ArtistScoreMetrics),
      }));

      // 全体ランキングを計算
      const overallRank =
        allArtists.findIndex((artist) => artist.id === artistId) + 1;

      // カテゴリー別ランキングを計算
      const categoryRanks = {
        technical: this.calculateCategoryRank(
          allArtists,
          artistId,
          "technical",
        ),
        communication: this.calculateCategoryRank(
          allArtists,
          artistId,
          "communication",
        ),
        cleanliness: this.calculateCategoryRank(
          allArtists,
          artistId,
          "cleanliness",
        ),
        atmosphere: this.calculateCategoryRank(
          allArtists,
          artistId,
          "atmosphere",
        ),
        value: this.calculateCategoryRank(allArtists, artistId, "value"),
      };

      // Future implementation: Regional ranking (requires location data)
      const regionRank = 0;
      const regionArtists = 0;

      const rankingInfo: ArtistRankingInfo = {
        overallRank,
        categoryRanks,
        regionRank,
        totalArtists: allArtists.length,
        regionArtists,
      };

      // ランキング情報を保存
      await firestore()
        .collection("artistRankings")
        .doc(artistId)
        .set(rankingInfo);
    } catch (error) {
      console.error("Error updating rankings:", error);
      // ランキング更新エラーは致命的でないため、ログのみ
    }
  }

  /**
   * カテゴリー別ランキングを計算
   */
  private calculateCategoryRank(
    allArtists: (ArtistScoreMetrics & { id: string })[],
    targetArtistId: string,
    category: keyof ArtistScoreMetrics["categoryScores"],
  ): number {
    const sortedArtists = allArtists
      .filter((artist) => artist.categoryScores[category] > 0)
      .sort((a, b) => b.categoryScores[category] - a.categoryScores[category]);

    return (
      sortedArtists.findIndex((artist) => artist.id === targetArtistId) + 1
    );
  }

  /**
   * すべてのアーティストのスコアを一括更新（管理者機能）
   */
  async updateAllArtistScores(): Promise<void> {
    try {
      // Starting bulk artist score update

      // アーティストタイプのユーザーを取得
      const artistsSnapshot = await firestore()
        .collection("users")
        .where("userType", "==", "artist")
        .get();

      const updatePromises = artistsSnapshot.docs.map((doc) =>
        this.updateArtistScore(doc.id, "manual_update"),
      );

      // 並行処理でスコア更新（10件ずつバッチ処理）
      const batchSize = 10;
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        const batch = updatePromises.slice(i, i + batchSize);
        await Promise.allSettled(batch);

        // レート制限対策で少し待機
        if (i + batchSize < updatePromises.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Bulk artist score update completed
    } catch (error) {
      console.error("Error updating all artist scores:", error);
      throw error;
    }
  }

  /**
   * レビュー投稿後の自動スコア更新をトリガー
   */
  async onReviewAdded(artistId: string): Promise<void> {
    try {
      await this.updateArtistScore(artistId, "review_added");
    } catch (error) {
      console.error("Error triggering score update on review added:", error);
    }
  }

  /**
   * レビュー更新後の自動スコア更新をトリガー
   */
  async onReviewUpdated(artistId: string): Promise<void> {
    try {
      await this.updateArtistScore(artistId, "review_updated");
    } catch (error) {
      console.error("Error triggering score update on review updated:", error);
    }
  }

  /**
   * 予約完了後の自動スコア更新をトリガー
   */
  async onBookingCompleted(artistId: string): Promise<void> {
    try {
      await this.updateArtistScore(artistId, "booking_completed");
    } catch (error) {
      console.error(
        "Error triggering score update on booking completed:",
        error,
      );
    }
  }
}

export default ArtistScoreService.getInstance();
