import analytics from "@react-native-firebase/analytics";
import { Platform } from "react-native";

export interface UserProperties {
  user_type: "customer" | "artist" | "admin";
  registration_date: string;
  location_city?: string;
  location_prefecture?: string;
  preferred_styles?: string[];
  total_bookings?: number;
  total_reviews?: number;
  app_version: string;
  platform: string;
}

export interface BookingEvent {
  booking_id: string;
  artist_id: string;
  customer_id: string;
  booking_type: "consultation" | "tattoo_session" | "touch_up";
  estimated_duration: number;
  estimated_price: number;
  tattoo_style?: string;
  tattoo_size?: "small" | "medium" | "large" | "extra_large";
  body_placement?: string;
}

export interface SearchEvent {
  search_term: string;
  search_type: "artist" | "style" | "location";
  results_count: number;
  filters_applied: string[];
  location_enabled: boolean;
}

export interface ReviewEvent {
  review_id: string;
  artist_id: string;
  customer_id: string;
  overall_rating: number;
  category_ratings: Record<string, number>;
  has_comment: boolean;
  has_images: boolean;
  is_anonymous: boolean;
}

export interface MatchingEvent {
  algorithm_version: string;
  uploaded_image_id?: string;
  matching_score: number;
  top_matches_count: number;
  filters_applied: string[];
  ai_analysis_confidence: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized: boolean = false;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Analytics サービスの初期化
   */
  async initialize(userId?: string): Promise<void> {
    try {
      // Initializing Firebase Analytics

      // Analytics の有効化
      await analytics().setAnalyticsCollectionEnabled(true);

      // ユーザーIDの設定
      if (userId) {
        await this.setUserId(userId);
      }

      // アプリの基本情報を設定
      await this.setDefaultUserProperties();

      this.isInitialized = true;
      // Firebase Analytics initialized successfully

      // アプリ起動イベントをログ
      await this.logAppOpen();
    } catch (error) {
      console.error("Error initializing Firebase Analytics:", error);
      throw error;
    }
  }

  /**
   * ユーザーIDの設定
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await analytics().setUserId(userId);
      this.userId = userId;
      // Analytics User ID set
    } catch (error) {
      console.error("Error setting Analytics User ID:", error);
    }
  }

  /**
   * ユーザープロパティの設定
   */
  async setUserProperties(properties: Partial<UserProperties>): Promise<void> {
    try {
      // Firebase Analytics のカスタムユーザープロパティとして設定
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined && value !== null) {
          // 配列は文字列として保存
          const analyticsValue = Array.isArray(value)
            ? value.join(",")
            : String(value);
          await analytics().setUserProperty(key, analyticsValue);
        }
      }

      // User properties set
    } catch (error) {
      console.error("Error setting user properties:", error);
    }
  }

  /**
   * デフォルトユーザープロパティの設定
   */
  private async setDefaultUserProperties(): Promise<void> {
    try {
      await analytics().setUserProperty("platform", Platform.OS);
      await analytics().setUserProperty("app_version", "2.0.0"); // 実際のバージョンを設定
    } catch (error) {
      console.error("Error setting default user properties:", error);
    }
  }

  // === アプリライフサイクルイベント ===

  /**
   * アプリ起動イベント
   */
  async logAppOpen(): Promise<void> {
    try {
      await analytics().logEvent("app_open", {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging app open:", error);
    }
  }

  /**
   * 画面表示イベント
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error("Error logging screen view:", error);
    }
  }

  // === 認証・ユーザー管理イベント ===

  /**
   * ユーザー登録イベント
   */
  async logUserRegistration(
    userType: "customer" | "artist",
    method: string = "email",
  ): Promise<void> {
    try {
      await analytics().logEvent("sign_up", {
        method: method,
        user_type: userType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging user registration:", error);
    }
  }

  /**
   * ログインイベント
   */
  async logUserLogin(method: string = "email"): Promise<void> {
    try {
      await analytics().logEvent("login", {
        method: method,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging user login:", error);
    }
  }

  // === 検索・マッチングイベント ===

  /**
   * 検索イベント
   */
  async logSearch(searchData: SearchEvent): Promise<void> {
    try {
      await analytics().logEvent("search", {
        search_term: searchData.search_term,
        search_type: searchData.search_type,
        results_count: searchData.results_count,
        filters_applied: searchData.filters_applied.join(","),
        location_enabled: searchData.location_enabled,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging search:", error);
    }
  }

  /**
   * AI マッチングイベント
   */
  async logAIMatching(matchingData: MatchingEvent): Promise<void> {
    try {
      await analytics().logEvent("ai_matching_performed", {
        algorithm_version: matchingData.algorithm_version,
        uploaded_image_id: matchingData.uploaded_image_id || "",
        matching_score: matchingData.matching_score,
        top_matches_count: matchingData.top_matches_count,
        filters_applied: matchingData.filters_applied.join(","),
        ai_analysis_confidence: matchingData.ai_analysis_confidence,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging AI matching:", error);
    }
  }

  /**
   * アーティストプロフィール表示
   */
  async logArtistProfileView(
    artistId: string,
    fromScreen: string,
  ): Promise<void> {
    try {
      await analytics().logEvent("view_artist_profile", {
        artist_id: artistId,
        from_screen: fromScreen,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging artist profile view:", error);
    }
  }

  // === 予約関連イベント ===

  /**
   * 予約リクエスト送信
   */
  async logBookingRequest(bookingData: BookingEvent): Promise<void> {
    try {
      await analytics().logEvent("booking_request_sent", {
        booking_id: bookingData.booking_id,
        artist_id: bookingData.artist_id,
        customer_id: bookingData.customer_id,
        booking_type: bookingData.booking_type,
        estimated_duration: bookingData.estimated_duration,
        estimated_price: bookingData.estimated_price,
        tattoo_style: bookingData.tattoo_style || "",
        tattoo_size: bookingData.tattoo_size || "",
        body_placement: bookingData.body_placement || "",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging booking request:", error);
    }
  }

  /**
   * 予約確定
   */
  async logBookingConfirmed(
    bookingId: string,
    artistId: string,
  ): Promise<void> {
    try {
      await analytics().logEvent("booking_confirmed", {
        booking_id: bookingId,
        artist_id: artistId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging booking confirmed:", error);
    }
  }

  /**
   * 予約キャンセル
   */
  async logBookingCancelled(
    bookingId: string,
    cancelledBy: "customer" | "artist",
    reason: string,
  ): Promise<void> {
    try {
      await analytics().logEvent("booking_cancelled", {
        booking_id: bookingId,
        cancelled_by: cancelledBy,
        reason: reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging booking cancelled:", error);
    }
  }

  /**
   * 予約完了
   */
  async logBookingCompleted(
    bookingId: string,
    duration: number,
  ): Promise<void> {
    try {
      await analytics().logEvent("booking_completed", {
        booking_id: bookingId,
        actual_duration: duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging booking completed:", error);
    }
  }

  // === レビュー・評価イベント ===

  /**
   * レビュー投稿
   */
  async logReviewSubmitted(reviewData: ReviewEvent): Promise<void> {
    try {
      await analytics().logEvent("review_submitted", {
        review_id: reviewData.review_id,
        artist_id: reviewData.artist_id,
        customer_id: reviewData.customer_id,
        overall_rating: reviewData.overall_rating,
        has_comment: reviewData.has_comment,
        has_images: reviewData.has_images,
        is_anonymous: reviewData.is_anonymous,
        timestamp: new Date().toISOString(),
      });

      // カテゴリー別評価も個別にログ
      for (const [category, rating] of Object.entries(
        reviewData.category_ratings,
      )) {
        await analytics().logEvent("review_category_rating", {
          review_id: reviewData.review_id,
          category: category,
          rating: rating,
        });
      }
    } catch (error) {
      console.error("Error logging review submission:", error);
    }
  }

  /**
   * レビューに対する「参考になった」投票
   */
  async logReviewHelpfulVote(
    reviewId: string,
    isHelpful: boolean,
  ): Promise<void> {
    try {
      await analytics().logEvent("review_helpful_vote", {
        review_id: reviewId,
        is_helpful: isHelpful,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging helpful vote:", error);
    }
  }

  // === チャット・コミュニケーションイベント ===

  /**
   * メッセージ送信
   */
  async logMessageSent(
    roomId: string,
    messageType: "text" | "image" | "booking_offer" | "system",
  ): Promise<void> {
    try {
      await analytics().logEvent("message_sent", {
        room_id: roomId,
        message_type: messageType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging message sent:", error);
    }
  }

  /**
   * 代替案提示
   */
  async logCounterOfferSent(
    bookingId: string,
    offerType: "date" | "price" | "both",
  ): Promise<void> {
    try {
      await analytics().logEvent("counter_offer_sent", {
        booking_id: bookingId,
        offer_type: offerType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging counter offer:", error);
    }
  }

  // === エラー・パフォーマンスイベント ===

  /**
   * エラーイベント
   */
  async logError(
    errorType: string,
    errorMessage: string,
    screen?: string,
    userId?: string,
  ): Promise<void> {
    try {
      await analytics().logEvent("app_error", {
        error_type: errorType,
        error_message: errorMessage.substring(0, 100), // 長すぎるメッセージを制限
        screen: screen || "unknown",
        user_id: userId || this.userId || "anonymous",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging error event:", error);
    }
  }

  /**
   * パフォーマンス測定の開始
   */
  async startPerformanceTrace(traceName: string): Promise<any> {
    try {
      const trace = await analytics().startTrace(traceName);
      return trace;
    } catch (error) {
      console.error("Error starting performance trace:", error);
      return null;
    }
  }

  // === AI・機械学習イベント ===

  /**
   * AI 画像解析イベント
   */
  async logAIImageAnalysis(
    imageId: string,
    analysisResults: Record<string, any>,
    confidence: number,
  ): Promise<void> {
    try {
      await analytics().logEvent("ai_image_analysis", {
        image_id: imageId,
        detected_styles: Object.keys(analysisResults.styles || {}).join(","),
        detected_colors: Object.keys(analysisResults.colors || {}).join(","),
        complexity_score: analysisResults.complexity || 0,
        confidence_score: confidence,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging AI image analysis:", error);
    }
  }

  // === カスタムイベント ===

  /**
   * カスタムイベントのログ
   */
  async logCustomEvent(
    eventName: string,
    parameters: Record<string, any>,
  ): Promise<void> {
    try {
      // Firebase Analytics のパラメータ制限に合わせて調整
      const sanitizedParams: Record<string, any> = {};

      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null) {
          // 文字列の長さ制限 (100文字)
          if (typeof value === "string" && value.length > 100) {
            sanitizedParams[key] = value.substring(0, 100);
          } else {
            sanitizedParams[key] = value;
          }
        }
      }

      await analytics().logEvent(eventName, sanitizedParams);
    } catch (error) {
      console.error("Error logging custom event:", error);
    }
  }

  // === 開発・デバッグ用メソッド ===

  /**
   * Analytics が有効かどうかを確認
   */
  isAnalyticsEnabled(): boolean {
    return this.isInitialized;
  }

  /**
   * Analytics の無効化（GDPR対応等）
   */
  async disableAnalytics(): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(false);
      // Firebase Analytics disabled
    } catch (error) {
      console.error("Error disabling analytics:", error);
    }
  }

  /**
   * Analytics の有効化
   */
  async enableAnalytics(): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(true);
      // Firebase Analytics enabled
    } catch (error) {
      console.error("Error enabling analytics:", error);
    }
  }

  /**
   * デバッグビューの有効化
   */
  async enableDebugView(): Promise<void> {
    try {
      if (__DEV__) {
        // デバッグモードでのみ有効
        // Analytics debug view enabled
      }
    } catch (error) {
      console.error("Error enabling debug view:", error);
    }
  }
}

// Analytics のヘルパー関数
export const AnalyticsHelpers = {
  // 収益イベント（将来的な課金機能用）
  logRevenue: async (
    value: number,
    currency: string = "JPY",
    itemId?: string,
  ) => {
    try {
      await analytics().logEvent("purchase", {
        value: value,
        currency: currency,
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging revenue:", error);
    }
  },

  // エンゲージメント時間の測定
  logEngagement: async (screen: string, duration: number) => {
    try {
      await analytics().logEvent("engagement_time", {
        screen: screen,
        duration: duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging engagement:", error);
    }
  },

  // 機能使用状況の追跡
  logFeatureUsage: async (featureName: string, action: string) => {
    try {
      await analytics().logEvent("feature_usage", {
        feature_name: featureName,
        action: action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging feature usage:", error);
    }
  },
};

export default AnalyticsService.getInstance();
