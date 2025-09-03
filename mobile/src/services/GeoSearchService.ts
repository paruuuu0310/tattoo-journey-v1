import firestore from "@react-native-firebase/firestore";
import LocationService, { LocationCoordinates } from "./LocationService";
import { User } from "../types";

export interface GeoSearchOptions {
  center: LocationCoordinates;
  radiusKm: number;
  limit?: number;
  sortBy?: "distance" | "rating" | "popularity";
  filters?: {
    minRating?: number;
    maxPrice?: number;
    styles?: string[];
    verified?: boolean;
  };
}

export interface GeoSearchResult {
  artist: User;
  distance: number;
  bearing: number; // 方角（度）
}

export interface SearchArea {
  northeast: LocationCoordinates;
  southwest: LocationCoordinates;
  center: LocationCoordinates;
  radius: number;
}

export class GeoSearchService {
  private static instance: GeoSearchService;

  private constructor() {}

  public static getInstance(): GeoSearchService {
    if (!GeoSearchService.instance) {
      GeoSearchService.instance = new GeoSearchService();
    }
    return GeoSearchService.instance;
  }

  /**
   * 地理的範囲内のアーティストを検索
   */
  async searchArtistsInArea(
    options: GeoSearchOptions,
  ): Promise<GeoSearchResult[]> {
    try {
      // 1. 検索エリアの境界を計算
      const searchArea = this.calculateSearchArea(
        options.center,
        options.radiusKm,
      );

      // 2. Firestoreから大まかな範囲のアーティストを取得
      const artists = await this.getArtistsInBoundingBox(
        searchArea,
        options.filters,
      );

      // 3. 正確な距離計算と範囲内フィルタリング
      const results = this.filterAndCalculateDistances(artists, options);

      // 4. ソートと制限適用
      const sortedResults = this.sortResults(
        results,
        options.sortBy || "distance",
      );

      return options.limit
        ? sortedResults.slice(0, options.limit)
        : sortedResults;
    } catch (error) {
      console.error("Error in geo search:", error);
      return [];
    }
  }

  /**
   * 現在地から最も近いアーティストを取得
   */
  async findNearestArtists(
    center: LocationCoordinates,
    count: number = 10,
    maxRadius: number = 50,
  ): Promise<GeoSearchResult[]> {
    const options: GeoSearchOptions = {
      center,
      radiusKm: maxRadius,
      limit: count,
      sortBy: "distance",
    };

    return this.searchArtistsInArea(options);
  }

  /**
   * 特定のスタイルに特化したアーティストを地理的に検索
   */
  async findArtistsByStyle(
    center: LocationCoordinates,
    style: string,
    radiusKm: number = 30,
  ): Promise<GeoSearchResult[]> {
    const options: GeoSearchOptions = {
      center,
      radiusKm,
      filters: {
        styles: [style],
      },
      sortBy: "rating",
    };

    return this.searchArtistsInArea(options);
  }

  /**
   * 検索エリアの境界を計算
   */
  private calculateSearchArea(
    center: LocationCoordinates,
    radiusKm: number,
  ): SearchArea {
    // 1度あたりの距離（大体）
    const latDegreeKm = 111; // 緯度1度 ≈ 111km
    const lonDegreeKm = 111 * Math.cos((center.latitude * Math.PI) / 180); // 経度は緯度によって変化

    const latDelta = radiusKm / latDegreeKm;
    const lonDelta = radiusKm / lonDegreeKm;

    return {
      northeast: {
        latitude: center.latitude + latDelta,
        longitude: center.longitude + lonDelta,
      },
      southwest: {
        latitude: center.latitude - latDelta,
        longitude: center.longitude - lonDelta,
      },
      center,
      radius: radiusKm,
    };
  }

  /**
   * バウンディングボックス内のアーティストを取得
   */
  private async getArtistsInBoundingBox(
    area: SearchArea,
    filters?: GeoSearchOptions["filters"],
  ): Promise<User[]> {
    try {
      let query = firestore()
        .collection("users")
        .where("userType", "==", "artist")
        .where("profile.location.latitude", ">=", area.southwest.latitude)
        .where("profile.location.latitude", "<=", area.northeast.latitude);

      // フィルターを適用
      if (filters?.verified) {
        query = query.where("profile.artistInfo.verified", "==", true);
      }

      if (filters?.minRating) {
        query = query.where(
          "profile.artistInfo.rating",
          ">=",
          filters.minRating,
        );
      }

      const snapshot = await query.get();

      const artists: User[] = [];

      snapshot.forEach((doc) => {
        const artist = { uid: doc.id, ...doc.data() } as User;

        // 経度の範囲チェック（Firestoreでは複合クエリに制限があるため）
        if (
          artist.profile?.location?.longitude &&
          artist.profile.location.longitude >= area.southwest.longitude &&
          artist.profile.location.longitude <= area.northeast.longitude
        ) {
          // 追加フィルターをチェック
          if (this.matchesFilters(artist, filters)) {
            artists.push(artist);
          }
        }
      });

      return artists;
    } catch (error) {
      console.error("Error getting artists in bounding box:", error);
      return [];
    }
  }

  /**
   * アーティストがフィルター条件に合致するかチェック
   */
  private matchesFilters(
    artist: User,
    filters?: GeoSearchOptions["filters"],
  ): boolean {
    if (!filters) return true;

    const artistInfo = artist.profile?.artistInfo;
    if (!artistInfo) return false;

    // 最大価格フィルター
    if (filters.maxPrice) {
      const avgPrice = this.calculateAveragePrice(artistInfo);
      if (avgPrice > filters.maxPrice) return false;
    }

    // スタイルフィルター
    if (filters.styles && filters.styles.length > 0) {
      const artistStyles = artistInfo.specialties || [];
      const hasMatchingStyle = filters.styles.some((style) =>
        artistStyles.includes(style),
      );
      if (!hasMatchingStyle) return false;
    }

    return true;
  }

  /**
   * アーティストの平均価格を計算
   */
  private calculateAveragePrice(artistInfo: any): number {
    const priceRange = artistInfo.priceRange;
    if (!priceRange) return 0;

    const prices = [
      priceRange.small || 0,
      priceRange.medium || 0,
      priceRange.large || 0,
    ].filter((price) => price > 0);

    return prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;
  }

  /**
   * 距離計算とフィルタリング
   */
  private filterAndCalculateDistances(
    artists: User[],
    options: GeoSearchOptions,
  ): GeoSearchResult[] {
    const results: GeoSearchResult[] = [];

    for (const artist of artists) {
      if (
        !artist.profile?.location?.latitude ||
        !artist.profile?.location?.longitude
      ) {
        continue;
      }

      const artistLocation: LocationCoordinates = {
        latitude: artist.profile.location.latitude,
        longitude: artist.profile.location.longitude,
      };

      // 正確な距離を計算
      const distance = LocationService.calculateDistance(
        options.center,
        artistLocation,
      );

      // 範囲内チェック
      if (distance <= options.radiusKm) {
        // 方角を計算
        const bearing = this.calculateBearing(options.center, artistLocation);

        results.push({
          artist,
          distance,
          bearing,
        });
      }
    }

    return results;
  }

  /**
   * 結果をソート
   */
  private sortResults(
    results: GeoSearchResult[],
    sortBy: string,
  ): GeoSearchResult[] {
    return results.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance;

        case "rating":
          const ratingA = a.artist.profile?.artistInfo?.rating || 0;
          const ratingB = b.artist.profile?.artistInfo?.rating || 0;
          return ratingB - ratingA;

        case "popularity":
          const reviewsA = a.artist.profile?.artistInfo?.totalReviews || 0;
          const reviewsB = b.artist.profile?.artistInfo?.totalReviews || 0;
          return reviewsB - reviewsA;

        default:
          return a.distance - b.distance;
      }
    });
  }

  /**
   * 2点間の方角を計算（北を0度とした角度）
   */
  private calculateBearing(
    from: LocationCoordinates,
    to: LocationCoordinates,
  ): number {
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // 0-360度に正規化
  }

  /**
   * 方角を文字列に変換
   */
  getBearingText(bearing: number): string {
    const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * 距離を人間が読みやすい形式に変換
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  /**
   * 検索統計を取得
   */
  async getSearchStats(center: LocationCoordinates): Promise<{
    total: number;
    within5km: number;
    within10km: number;
    within30km: number;
    topStyles: string[];
  }> {
    try {
      const results30km = await this.searchArtistsInArea({
        center,
        radiusKm: 30,
      });

      const within5km = results30km.filter((r) => r.distance <= 5).length;
      const within10km = results30km.filter((r) => r.distance <= 10).length;

      // 人気スタイルを集計
      const styleCounts: Record<string, number> = {};
      results30km.forEach((result) => {
        const styles = result.artist.profile?.artistInfo?.specialties || [];
        styles.forEach((style) => {
          styleCounts[style] = (styleCounts[style] || 0) + 1;
        });
      });

      const topStyles = Object.entries(styleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([style]) => style);

      return {
        total: results30km.length,
        within5km,
        within10km,
        within30km: results30km.length,
        topStyles,
      };
    } catch (error) {
      console.error("Error getting search stats:", error);
      return {
        total: 0,
        within5km: 0,
        within10km: 0,
        within30km: 0,
        topStyles: [],
      };
    }
  }

  /**
   * 検索履歴を保存
   */
  async saveSearchHistory(
    userId: string,
    searchOptions: GeoSearchOptions,
    resultCount: number,
  ): Promise<void> {
    try {
      await firestore()
        .collection("geoSearchHistory")
        .add({
          userId,
          searchOptions: {
            center: searchOptions.center,
            radiusKm: searchOptions.radiusKm,
            sortBy: searchOptions.sortBy,
            filters: searchOptions.filters,
          },
          resultCount,
          createdAt: new Date(),
        });
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  }
}

export default GeoSearchService.getInstance();
