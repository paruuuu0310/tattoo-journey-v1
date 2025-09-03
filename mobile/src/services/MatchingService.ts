import firestore from "@react-native-firebase/firestore";
import ImageAnalysisService from "./ImageAnalysisService";
import LocationService from "./LocationService";
import { AIAnalysisResult, User, PortfolioItem } from "../types";
import { ErrorHandler, ServiceErrorResponse } from "../utils/ErrorHandler";

export interface MatchingCriteria {
  customerAnalysis: AIAnalysisResult;
  maxDistance: number;
  budgetRange: {
    min: number;
    max: number;
  };
  customerLocation: {
    latitude: number;
    longitude: number;
  };
  preferredStyles?: string[];
}

export interface ArtistMatch {
  artist: User;
  matchScore: number;
  breakdown: {
    designScore: number; // 40%
    artistScore: number; // 30%
    priceScore: number; // 20%
    distanceScore: number; // 10%
  };
  compatibility: number;
  distance: number;
  estimatedPrice: number;
  topPortfolioMatches: PortfolioItem[];
  matchReasons: string[];
}

export class MatchingService {
  private static instance: MatchingService;

  private constructor() {}

  public static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  /**
   * メインのマッチング関数
   */
  async findMatchingArtists(
    criteria: MatchingCriteria,
  ): Promise<ArtistMatch[]> {
    try {
      // 1. エリア内のアーティストを取得
      const nearbyArtists = await this.findNearbyArtists(
        criteria.customerLocation,
        criteria.maxDistance,
      );

      // 2. 各アーティストのマッチングスコアを計算
      const matches: ArtistMatch[] = [];

      for (const artist of nearbyArtists) {
        const match = await this.calculateArtistMatch(artist, criteria);
        if (match.matchScore > 0.2) {
          // 最低スコアフィルタ
          matches.push(match);
        }
      }

      // 3. スコア順にソート
      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        service: "MatchingService",
        method: "findMatchingArtists",
        context: "artist_matching",
      });
      return [];
    }
  }

  /**
   * 個別アーティストのマッチング計算
   */
  private async calculateArtistMatch(
    artist: User,
    criteria: MatchingCriteria,
  ): Promise<ArtistMatch> {
    // デザインスコア計算 (40%)
    const designScore = await this.calculateDesignScore(
      artist.uid,
      criteria.customerAnalysis,
    );

    // アーティストスコア計算 (30%)
    const artistScore = this.calculateArtistScore(artist);

    // 料金スコア計算 (20%)
    const priceScore = this.calculatePriceScore(artist, criteria.budgetRange);

    // 距離スコア計算 (10%)
    const distance = this.calculateDistance(
      criteria.customerLocation,
      artist.profile.location,
    );
    const distanceScore = this.calculateDistanceScore(
      distance,
      criteria.maxDistance,
    );

    // 最終マッチングスコア計算
    const matchScore =
      designScore * 0.4 +
      artistScore * 0.3 +
      priceScore * 0.2 +
      distanceScore * 0.1;

    // ポートフォリオの互換性分析
    const portfolioMatches =
      await ImageAnalysisService.analyzePortfolioCompatibility(
        criteria.customerAnalysis,
        artist.uid,
      );

    // 料金見積もり
    const estimatedPrice = this.estimatePrice(
      artist,
      criteria.customerAnalysis,
    );

    // マッチ理由の生成
    const matchReasons = this.generateMatchReasons(
      { designScore, artistScore, priceScore, distanceScore },
      artist,
      criteria.customerAnalysis,
    );

    return {
      artist,
      matchScore: Math.min(matchScore, 1.0),
      breakdown: {
        designScore,
        artistScore,
        priceScore,
        distanceScore,
      },
      compatibility:
        portfolioMatches.length > 0 ? portfolioMatches[0].matchScore : 0,
      distance,
      estimatedPrice,
      topPortfolioMatches: portfolioMatches
        .slice(0, 3)
        .map((pm) => pm.portfolioItem),
      matchReasons,
    };
  }

  /**
   * デザインスコア計算 (40%)
   */
  private async calculateDesignScore(
    artistId: string,
    customerAnalysis: AIAnalysisResult,
  ): Promise<number> {
    try {
      // アーティストのポートフォリオを取得
      const portfolioSnapshot = await firestore()
        .collection("portfolioItems")
        .where("artistId", "==", artistId)
        .limit(20)
        .get();

      if (portfolioSnapshot.empty) return 0;

      let totalScore = 0;
      let validItems = 0;

      // 各ポートフォリオアイテムとの互換性を計算
      for (const doc of portfolioSnapshot.docs) {
        const portfolioItem = doc.data() as PortfolioItem;

        if (portfolioItem.aiAnalysis) {
          const comparison = ImageAnalysisService.compareAnalyses(
            customerAnalysis,
            portfolioItem.aiAnalysis,
          );
          totalScore += comparison.overallCompatibility;
          validItems++;
        }
      }

      if (validItems === 0) return 0;

      // 平均スコアを計算
      const averageScore = totalScore / validItems;

      // スタイル特化ボーナス
      const styleBonus = await this.calculateStyleBonus(
        artistId,
        customerAnalysis.style,
      );

      return Math.min(averageScore + styleBonus, 1.0);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        service: "MatchingService",
        method: "calculateDesignScore",
        context: "design_score_calculation",
        artistId: artistId,
      });
      return 0;
    }
  }

  /**
   * スタイル特化ボーナス計算
   */
  private async calculateStyleBonus(
    artistId: string,
    customerStyle: string,
  ): Promise<number> {
    try {
      const specialtiesSnapshot = await firestore()
        .collection("specialtyStyles")
        .where("artistId", "==", artistId)
        .where("styleName", "==", customerStyle)
        .where("isActive", "==", true)
        .get();

      if (!specialtiesSnapshot.empty) {
        const specialty = specialtiesSnapshot.docs[0].data();
        const proficiencyBonus = (specialty.proficiencyLevel - 1) * 0.05; // 1-5レベル → 0-0.2ボーナス
        const experienceBonus = Math.min(specialty.experienceYears * 0.01, 0.1); // 経験年数ボーナス

        return proficiencyBonus + experienceBonus;
      }

      return 0;
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        service: "MatchingService",
        method: "calculateStyleBonus",
        context: "style_bonus_calculation",
        artistId: artistId,
      });
      return 0;
    }
  }

  /**
   * アーティストスコア計算 (30%)
   */
  private calculateArtistScore(artist: User): number {
    const artistInfo = artist.profile?.artistInfo;
    if (!artistInfo) return 0;

    // 評価スコア (0-1)
    const ratingScore = artistInfo.rating ? artistInfo.rating / 5.0 : 0;

    // レビュー数による信頼度 (多いほど良い、最大0.2)
    const reviewCount = artistInfo.totalReviews || 0;
    const reviewBonus = Math.min(reviewCount * 0.01, 0.2);

    // 経験年数による信頼度 (最大0.2)
    const experienceBonus = Math.min(artistInfo.experienceYears * 0.02, 0.2);

    // ポートフォリオ数による信頼度 (最大0.1)
    const portfolioBonus = Math.min(
      (artistInfo.portfolioCount || 0) * 0.01,
      0.1,
    );

    // 認証済みボーナス
    const verificationBonus = artistInfo.verified ? 0.1 : 0;

    return Math.min(
      ratingScore * 0.5 +
        reviewBonus +
        experienceBonus +
        portfolioBonus +
        verificationBonus,
      1.0,
    );
  }

  /**
   * 料金スコア計算 (20%)
   */
  private calculatePriceScore(
    artist: User,
    budgetRange: { min: number; max: number },
  ): number {
    const artistInfo = artist.profile?.artistInfo;
    if (!artistInfo?.priceRange) return 0.5; // デフォルト値

    // アーティストの平均料金を算出
    const artistAvgPrice =
      ((artistInfo.priceRange.small || 0) +
        (artistInfo.priceRange.medium || 0) +
        (artistInfo.priceRange.large || 0)) /
      3;

    if (artistAvgPrice === 0) return 0.5;

    const budgetMid = (budgetRange.min + budgetRange.max) / 2;

    // 予算内なら高スコア
    if (
      artistAvgPrice >= budgetRange.min &&
      artistAvgPrice <= budgetRange.max
    ) {
      // 予算中央に近いほど高スコア
      const deviation =
        Math.abs(artistAvgPrice - budgetMid) /
        (budgetRange.max - budgetRange.min);
      return 1.0 - deviation * 0.3;
    }

    // 予算オーバーまたは大幅に安い場合はペナルティ
    const deviation = Math.abs(artistAvgPrice - budgetMid) / budgetMid;
    return Math.max(1.0 - deviation, 0);
  }

  /**
   * 距離スコア計算 (10%)
   */
  private calculateDistanceScore(
    distance: number,
    maxDistance: number,
  ): number {
    if (distance > maxDistance) return 0;

    // 距離が近いほど高スコア
    return 1.0 - distance / maxDistance;
  }

  /**
   * 近隣アーティスト検索
   */
  private async findNearbyArtists(
    customerLocation: { latitude: number; longitude: number },
    maxDistanceKm: number,
  ): Promise<User[]> {
    try {
      // Geofireやより高度な地理的クエリが理想だが、
      // シンプルな実装として全アーティストを取得してフィルタ
      const artistsSnapshot = await firestore()
        .collection("users")
        .where("userType", "==", "artist")
        .get();

      const nearbyArtists: User[] = [];

      artistsSnapshot.forEach((doc) => {
        const artist = { uid: doc.id, ...doc.data() } as User;

        if (
          artist.profile?.location?.latitude &&
          artist.profile?.location?.longitude
        ) {
          const distance = this.calculateDistance(customerLocation, {
            latitude: artist.profile.location.latitude,
            longitude: artist.profile.location.longitude,
          });

          if (distance <= maxDistanceKm) {
            nearbyArtists.push(artist);
          }
        }
      });

      return nearbyArtists;
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        service: "MatchingService",
        method: "findNearbyArtists",
        context: "location_search",
      });
      return [];
    }
  }

  /**
   * 距離計算（LocationServiceを使用）
   */
  private calculateDistance(
    pos1: { latitude: number; longitude: number },
    pos2: { latitude: number; longitude: number },
  ): number {
    return LocationService.calculateDistance(pos1, pos2);
  }

  /**
   * 料金見積もり
   */
  private estimatePrice(
    artist: User,
    customerAnalysis: AIAnalysisResult,
  ): number {
    const artistInfo = artist.profile?.artistInfo;
    if (!artistInfo?.priceRange) return 0;

    // 複雑さに基づく料金決定
    switch (customerAnalysis.complexity) {
      case "シンプル":
        return artistInfo.priceRange.small || artistInfo.hourlyRate || 15000;
      case "中程度":
        return (
          artistInfo.priceRange.medium || artistInfo.hourlyRate * 2 || 30000
        );
      case "複雑":
        return (
          artistInfo.priceRange.large || artistInfo.hourlyRate * 4 || 60000
        );
      default:
        return artistInfo.priceRange.medium || 30000;
    }
  }

  /**
   * マッチ理由生成
   */
  private generateMatchReasons(
    breakdown: {
      designScore: number;
      artistScore: number;
      priceScore: number;
      distanceScore: number;
    },
    artist: User,
    customerAnalysis: AIAnalysisResult,
  ): string[] {
    const reasons: string[] = [];

    // デザインマッチ
    if (breakdown.designScore > 0.8) {
      reasons.push("あなたの希望するデザインスタイルに非常にマッチしています");
    } else if (breakdown.designScore > 0.6) {
      reasons.push("デザインスタイルの相性が良好です");
    }

    // アーティストスキル
    if (breakdown.artistScore > 0.8) {
      reasons.push("高評価で経験豊富なアーティストです");
    } else if (breakdown.artistScore > 0.6) {
      reasons.push("技術力と経験を兼ね備えたアーティストです");
    }

    // 料金適合
    if (breakdown.priceScore > 0.8) {
      reasons.push("ご予算に最適な価格設定です");
    } else if (breakdown.priceScore > 0.6) {
      reasons.push("予算内での施術が可能です");
    }

    // 距離
    if (breakdown.distanceScore > 0.8) {
      reasons.push("アクセスしやすい立地にあります");
    }

    // スタイル特化
    const artistInfo = artist.profile?.artistInfo;
    if (artistInfo?.specialties?.includes(customerAnalysis.style)) {
      reasons.push(`${customerAnalysis.style}を得意とするアーティストです`);
    }

    return reasons.slice(0, 3); // 最大3つの理由
  }

  /**
   * マッチング履歴の保存
   */
  async saveMatchingHistory(
    customerId: string,
    criteria: MatchingCriteria,
    matches: ArtistMatch[],
  ): Promise<void> {
    try {
      await firestore()
        .collection("matchingHistory")
        .add({
          customerId,
          criteria: {
            ...criteria,
            customerAnalysis: {
              style: criteria.customerAnalysis.style,
              complexity: criteria.customerAnalysis.complexity,
              isColorful: criteria.customerAnalysis.isColorful,
              motifs: criteria.customerAnalysis.motifs,
              confidence: criteria.customerAnalysis.confidence,
            },
          },
          matchCount: matches.length,
          topMatches: matches.slice(0, 10).map((match) => ({
            artistId: match.artist.uid,
            matchScore: match.matchScore,
            breakdown: match.breakdown,
          })),
          createdAt: new Date(),
        });
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        service: "MatchingService",
        method: "saveMatchingHistory",
        context: "history_save",
        userId: customerId,
      });
    }
  }
}

export default MatchingService.getInstance();
