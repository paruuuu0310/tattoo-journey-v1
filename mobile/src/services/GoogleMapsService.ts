import { Platform, Linking, Alert } from "react-native";
import Geolocation from "react-native-geolocation-service";
import { User } from "../types";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  type: "artist" | "customer" | "current_location";
  artistInfo?: User;
}

export interface DirectionsRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  mode?: "driving" | "walking" | "transit" | "bicycling";
}

export interface DirectionsResult {
  routes: Route[];
  status: string;
}

interface Route {
  legs: Leg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
}

interface Leg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  start_address: string;
  end_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  steps: Step[];
}

interface Step {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  polyline: {
    points: string;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private readonly GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY || "YOUR_API_KEY";

  private constructor() {}

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * 現在位置を取得
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  /**
   * 地図の初期領域を生成
   */
  createMapRegion(
    latitude: number,
    longitude: number,
    latitudeDelta: number = 0.01,
    longitudeDelta: number = 0.01,
  ): MapRegion {
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  /**
   * アーティストマーカーを生成
   */
  createArtistMarkers(artists: User[]): MapMarker[] {
    return artists
      .filter(
        (artist) => artist.location?.latitude && artist.location?.longitude,
      )
      .map((artist) => ({
        id: artist.uid,
        coordinate: {
          latitude: artist.location!.latitude,
          longitude: artist.location!.longitude,
        },
        title: artist.displayName || "Unknown Artist",
        description:
          artist.artistInfo?.specialties?.join(", ") || "タトゥーアーティスト",
        type: "artist",
        artistInfo: artist,
      }));
  }

  /**
   * 現在位置マーカーを生成
   */
  createCurrentLocationMarker(latitude: number, longitude: number): MapMarker {
    return {
      id: "current_location",
      coordinate: {
        latitude,
        longitude,
      },
      title: "現在地",
      description: "あなたの現在位置",
      type: "current_location",
    };
  }

  /**
   * 2点間の距離を計算（メートル単位）
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 距離をフォーマットして表示
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * 指定範囲内のアーティストをフィルタリング
   */
  filterArtistsWithinRadius(
    artists: User[],
    centerLat: number,
    centerLon: number,
    radiusInMeters: number,
  ): User[] {
    return artists.filter((artist) => {
      if (!artist.location?.latitude || !artist.location?.longitude) {
        return false;
      }

      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        artist.location.latitude,
        artist.location.longitude,
      );

      return distance <= radiusInMeters;
    });
  }

  /**
   * Google Directions API を使用してルートを取得
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    try {
      const { origin, destination, mode = "driving" } = request;
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `mode=${mode}&` +
        `key=${this.GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Directions API error: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error getting directions:", error);
      throw error;
    }
  }

  /**
   * ポリラインポイントをデコード
   */
  decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  /**
   * 外部のGoogle Mapsアプリで経路を開く
   */
  async openDirectionsInMaps(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    destinationName?: string,
  ): Promise<void> {
    const destination = destinationName
      ? encodeURIComponent(destinationName)
      : `${destLat},${destLon}`;

    const url = Platform.select({
      ios: `maps://app?daddr=${destination}&saddr=${originLat},${originLon}`,
      android: `google.navigation:q=${destination}&mode=d`,
    });

    const supported = await Linking.canOpenURL(url!);

    if (supported) {
      await Linking.openURL(url!);
    } else {
      // フォールバックとしてウェブ版Google Mapsを開く
      const webUrl = `https://www.google.com/maps/dir/${originLat},${originLon}/${destLat},${destLon}`;
      await Linking.openURL(webUrl);
    }
  }

  /**
   * 座標から住所を取得（Reverse Geocoding）
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `latlng=${latitude},${longitude}&` +
        `key=${this.GOOGLE_MAPS_API_KEY}&` +
        `language=ja`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return "住所不明";
      }
    } catch (error) {
      console.error("Error getting address:", error);
      return "住所不明";
    }
  }

  /**
   * 住所から座標を取得（Forward Geocoding）
   */
  async getCoordinatesFromAddress(
    address: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodedAddress}&` +
        `key=${this.GOOGLE_MAPS_API_KEY}&` +
        `language=ja`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting coordinates:", error);
      return null;
    }
  }

  /**
   * 複数点を含む地図領域を計算
   */
  calculateRegionForMarkers(markers: MapMarker[]): MapRegion {
    if (markers.length === 0) {
      return {
        latitude: 35.6762, // Tokyo default
        longitude: 139.6503,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    if (markers.length === 1) {
      return {
        latitude: markers[0].coordinate.latitude,
        longitude: markers[0].coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const coordinates = markers.map((marker) => marker.coordinate);
    const minLatitude = Math.min(...coordinates.map((coord) => coord.latitude));
    const maxLatitude = Math.max(...coordinates.map((coord) => coord.latitude));
    const minLongitude = Math.min(
      ...coordinates.map((coord) => coord.longitude),
    );
    const maxLongitude = Math.max(
      ...coordinates.map((coord) => coord.longitude),
    );

    const latitudeDelta = (maxLatitude - minLatitude) * 1.5; // Add 50% padding
    const longitudeDelta = (maxLongitude - minLongitude) * 1.5;

    return {
      latitude: (minLatitude + maxLatitude) / 2,
      longitude: (minLongitude + maxLongitude) / 2,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    };
  }

  /**
   * 地図のスナップショット取得用URL生成
   */
  generateStaticMapUrl(
    center: { latitude: number; longitude: number },
    zoom: number = 15,
    size: { width: number; height: number } = { width: 400, height: 300 },
    markers?: MapMarker[],
  ): string {
    let url =
      `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.latitude},${center.longitude}&` +
      `zoom=${zoom}&` +
      `size=${size.width}x${size.height}&` +
      `key=${this.GOOGLE_MAPS_API_KEY}`;

    if (markers && markers.length > 0) {
      markers.forEach((marker, index) => {
        const color = marker.type === "artist" ? "red" : "blue";
        const label = marker.type === "artist" ? "A" : "C";
        url += `&markers=color:${color}|label:${label}|${marker.coordinate.latitude},${marker.coordinate.longitude}`;
      });
    }

    return url;
  }
}

export default GoogleMapsService.getInstance();
