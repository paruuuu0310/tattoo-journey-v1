import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import LocationService, {
  LocationInfo,
  LocationError,
  LocationCoordinates,
} from "../services/LocationService";
import { Alert } from "react-native";

interface LocationContextType {
  currentLocation: LocationInfo | null;
  isLoading: boolean;
  error: LocationError | null;
  hasPermission: boolean;
  isWatching: boolean;

  // Methods
  requestLocation: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
  calculateDistanceToLocation: (target: LocationCoordinates) => number | null;
  isWithinRange: (target: LocationCoordinates, radiusKm: number) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    // アプリ起動時に権限チェック
    checkLocationPermission();

    return () => {
      // クリーンアップ
      if (isWatching) {
        LocationService.stopWatchingLocation();
      }
    };
  }, []);

  const checkLocationPermission = async () => {
    try {
      const isEnabled = await LocationService.isLocationServiceEnabled();
      setHasPermission(isEnabled);

      // 既に取得済みの位置情報があれば設定
      const lastLocation = LocationService.getLastKnownLocation();
      if (lastLocation) {
        setCurrentLocation(lastLocation);
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const requestLocation = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await LocationService.requestLocationPermission();
      setHasPermission(hasPermission);

      if (!hasPermission) {
        throw new Error("位置情報の使用が許可されていません");
      }

      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);

      // 住所情報の推定を追加
      try {
        const estimatedAddress = await LocationService.estimateAddress(
          location.coordinates,
        );
        setCurrentLocation((prev) =>
          prev
            ? {
                ...prev,
                address: {
                  formattedAddress: estimatedAddress,
                },
              }
            : null,
        );
      } catch (addressError) {
        // Address estimation failed, but location was obtained
      }
    } catch (error) {
      const locationError = error as LocationError;
      setError(locationError);
      console.error("Location request failed:", locationError);

      // ユーザーフレンドリーなエラーメッセージを表示
      Alert.alert("位置情報エラー", locationError.message, [
        { text: "OK" },
        ...(locationError.code === 1
          ? [
              {
                text: "設定を開く",
                onPress: () => LocationService.openLocationSettings(),
              },
            ]
          : []),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startWatching = (): void => {
    if (isWatching || !hasPermission) return;

    setIsWatching(true);

    LocationService.startWatchingLocation(
      (location: LocationInfo) => {
        setCurrentLocation(location);
        setError(null);

        // リアルタイムで住所情報も更新
        LocationService.estimateAddress(location.coordinates)
          .then((address) => {
            setCurrentLocation((prev) =>
              prev
                ? {
                    ...prev,
                    address: { formattedAddress: address },
                  }
                : null,
            );
          })
          .catch(() => {
            // 住所取得失敗は無視
          });
      },
      (error: LocationError) => {
        setError(error);
        setIsWatching(false);
        console.error("Location watching error:", error);
      },
    );
  };

  const stopWatching = (): void => {
    LocationService.stopWatchingLocation();
    setIsWatching(false);
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await LocationService.requestLocationPermission();
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          "位置情報が必要です",
          "最適なタトゥーアーティストを見つけるために位置情報が必要です。設定から許可してください。",
          [
            { text: "キャンセル" },
            {
              text: "設定を開く",
              onPress: () => LocationService.openLocationSettings(),
            },
          ],
        );
      }

      return granted;
    } catch (error) {
      console.error("Permission request failed:", error);
      return false;
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const calculateDistanceToLocation = (
    target: LocationCoordinates,
  ): number | null => {
    if (!currentLocation) return null;

    return LocationService.calculateDistance(
      currentLocation.coordinates,
      target,
    );
  };

  const isWithinRange = (
    target: LocationCoordinates,
    radiusKm: number,
  ): boolean => {
    if (!currentLocation) return false;

    return LocationService.isWithinRange(
      currentLocation.coordinates,
      target,
      radiusKm,
    );
  };

  const contextValue: LocationContextType = {
    currentLocation,
    isLoading,
    error,
    hasPermission,
    isWatching,

    requestLocation,
    startWatching,
    stopWatching,
    requestPermission,
    clearError,
    calculateDistanceToLocation,
    isWithinRange,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};

// デバッグ用フック
export const useLocationDebug = () => {
  const location = useLocation();

  const setMockTokyo = () => {
    LocationService.setMockLocation({
      latitude: 35.6762,
      longitude: 139.6503,
    });
  };

  const setMockOsaka = () => {
    LocationService.setMockLocation({
      latitude: 34.6937,
      longitude: 135.5023,
    });
  };

  const clearCache = () => {
    LocationService.clearLocationCache();
  };

  return {
    ...location,
    setMockTokyo,
    setMockOsaka,
    clearCache,
  };
};

export default LocationContext;
