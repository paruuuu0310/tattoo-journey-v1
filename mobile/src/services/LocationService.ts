import Geolocation from "@react-native-community/geolocation";
import { PermissionsAndroid, Platform, Alert } from "react-native";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coordinates: LocationCoordinates;
  accuracy: number;
  timestamp: number;
  address?: {
    city?: string;
    prefecture?: string;
    country?: string;
    formattedAddress?: string;
  };
}

export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationInfo | null = null;
  private watchId: number | null = null;
  private isWatching = false;

  private constructor() {
    this.configureGeolocation();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Geolocationの設定
   */
  private configureGeolocation(): void {
    if (Platform.OS === "ios") {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: "whenInUse",
      });
    }
  }

  /**
   * 位置情報の権限をリクエスト
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "位置情報の許可",
            message:
              "最適なタトゥーアーティストを見つけるために位置情報が必要です",
            buttonNeutral: "後で決める",
            buttonNegative: "キャンセル",
            buttonPositive: "許可",
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Location permission granted
          return true;
        } else {
          // Location permission denied
          return false;
        }
      }

      // iOSの場合は自動的に権限がリクエストされる
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }

  /**
   * 現在地を一回だけ取得
   */
  async getCurrentLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const locationInfo: LocationInfo = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            accuracy: position.coords.accuracy || 0,
            timestamp: position.timestamp,
          };

          this.currentLocation = locationInfo;
          resolve(locationInfo);
        },
        (error) => {
          const locationError: LocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code),
          };
          reject(locationError);
        },
        options,
      );
    });
  }

  /**
   * 位置情報の継続的な監視を開始
   */
  startWatchingLocation(
    onLocationUpdate: (location: LocationInfo) => void,
    onError: (error: LocationError) => void,
  ): void {
    if (this.isWatching) {
      // Already watching location
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
      distanceFilter: 100, // 100m移動したら更新
    };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const locationInfo: LocationInfo = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
        };

        this.currentLocation = locationInfo;
        onLocationUpdate(locationInfo);
      },
      (error) => {
        const locationError: LocationError = {
          code: error.code,
          message: this.getErrorMessage(error.code),
        };
        onError(locationError);
      },
      options,
    );

    this.isWatching = true;
    // Started watching location
  }

  /**
   * 位置情報の監視を停止
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
      // Stopped watching location
    }
  }

  /**
   * 最後に取得した位置情報を返す
   */
  getLastKnownLocation(): LocationInfo | null {
    return this.currentLocation;
  }

  /**
   * 2点間の距離を計算（Haversine公式）
   */
  calculateDistance(
    from: LocationCoordinates,
    to: LocationCoordinates,
  ): number {
    const R = 6371; // 地球の半径（km）

    const dLat = this.deg2rad(to.latitude - from.latitude);
    const dLon = this.deg2rad(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.latitude)) *
        Math.cos(this.deg2rad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 小数点2桁で丸める
  }

  /**
   * 指定した範囲内にいるかチェック
   */
  isWithinRange(
    center: LocationCoordinates,
    target: LocationCoordinates,
    radiusKm: number,
  ): boolean {
    const distance = this.calculateDistance(center, target);
    return distance <= radiusKm;
  }

  /**
   * 緯度経度から大まかな住所を推定（簡易版）
   */
  async estimateAddress(coordinates: LocationCoordinates): Promise<string> {
    // 実際のアプリでは逆ジオコーディングAPIを使用
    // ここでは日本の主要都市の大まかな範囲で判定
    const { latitude, longitude } = coordinates;

    // 東京周辺
    if (
      latitude >= 35.5 &&
      latitude <= 36.0 &&
      longitude >= 139.5 &&
      longitude <= 140.0
    ) {
      return "東京都";
    }
    // 大阪周辺
    else if (
      latitude >= 34.5 &&
      latitude <= 35.0 &&
      longitude >= 135.3 &&
      longitude <= 135.7
    ) {
      return "大阪府";
    }
    // 名古屋周辺
    else if (
      latitude >= 35.0 &&
      latitude <= 35.4 &&
      longitude >= 136.7 &&
      longitude <= 137.0
    ) {
      return "愛知県";
    }
    // 福岡周辺
    else if (
      latitude >= 33.4 &&
      latitude <= 33.8 &&
      longitude >= 130.2 &&
      longitude <= 130.6
    ) {
      return "福岡県";
    }
    // 札幌周辺
    else if (
      latitude >= 42.9 &&
      latitude <= 43.3 &&
      longitude >= 141.1 &&
      longitude <= 141.6
    ) {
      return "北海道";
    }
    // その他
    else {
      return "日本";
    }
  }

  /**
   * 位置情報エラーメッセージの取得
   */
  private getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 1:
        return "位置情報の使用が許可されていません。設定から位置情報を有効にしてください。";
      case 2:
        return "位置情報を取得できませんでした。ネットワーク接続を確認してください。";
      case 3:
        return "位置情報の取得がタイムアウトしました。もう一度お試しください。";
      default:
        return "位置情報の取得中にエラーが発生しました。";
    }
  }

  /**
   * 度をラジアンに変換
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 位置情報サービスが利用可能かチェック
   */
  async isLocationServiceEnabled(): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      return hasPermission;
    } catch (error) {
      console.error("Error checking location service:", error);
      return false;
    }
  }

  /**
   * 位置情報設定画面を開く（Android）
   */
  openLocationSettings(): void {
    if (Platform.OS === "android") {
      Alert.alert(
        "位置情報が無効です",
        "設定画面を開いて位置情報を有効にしてください",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "設定を開く",
            onPress: () => {
              // 実際の実装では react-native-android-open-settings などを使用
              // Open location settings
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "位置情報が無効です",
        "設定アプリから位置情報を有効にしてください",
        [{ text: "OK" }],
      );
    }
  }

  /**
   * 位置情報の精度レベルを文字列で取得
   */
  getAccuracyLevel(accuracy: number): string {
    if (accuracy <= 5) return "非常に高い";
    if (accuracy <= 20) return "高い";
    if (accuracy <= 100) return "中程度";
    if (accuracy <= 1000) return "低い";
    return "非常に低い";
  }

  /**
   * キャッシュされた位置情報をクリア
   */
  clearLocationCache(): void {
    this.currentLocation = null;
    // Location cache cleared
  }

  /**
   * デバッグ用：模擬位置データを設定
   */
  setMockLocation(coordinates: LocationCoordinates): void {
    if (__DEV__) {
      this.currentLocation = {
        coordinates,
        accuracy: 5,
        timestamp: Date.now(),
      };
      // Mock location set
    }
  }
}

export default LocationService.getInstance();
