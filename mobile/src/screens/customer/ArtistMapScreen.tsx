import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import GoogleMapsService, {
  MapRegion,
  MapMarker,
} from "../../services/GoogleMapsService";
import GeoSearchService from "../../services/GeoSearchService";
import { User } from "../../types";

interface Props {
  route: {
    params: {
      searchRadius?: number;
      artistResults?: User[];
      focusLocation?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  navigation: any;
}

const ArtistMapScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { location, hasLocationPermission, requestLocationPermission } =
    useLocation();
  const {
    searchRadius = 5000,
    artistResults,
    focusLocation,
  } = route.params || {};

  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: focusLocation?.latitude || location?.latitude || 35.6762,
    longitude: focusLocation?.longitude || location?.longitude || 139.6503,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [artists, setArtists] = useState<User[]>(artistResults || []);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<User | null>(null);
  const [showArtistModal, setShowArtistModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentRadius, setCurrentRadius] = useState<number>(searchRadius);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeMap();
  }, [location, hasLocationPermission]);

  useEffect(() => {
    if (artists.length > 0) {
      updateMapMarkers();
    }
  }, [artists, location]);

  const initializeMap = async (): Promise<void> => {
    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          "位置情報が必要です",
          "アーティストを地図で表示するために位置情報へのアクセスを許可してください。",
          [
            { text: "キャンセル", style: "cancel" },
            { text: "設定", onPress: () => requestLocationPermission() },
          ],
        );
        return;
      }
    }

    if (location) {
      const region = GoogleMapsService.createMapRegion(
        location.latitude,
        location.longitude,
        0.02,
        0.02,
      );
      setMapRegion(region);

      // 初期データがない場合は周辺のアーティストを検索
      if (!artistResults || artistResults.length === 0) {
        await searchNearbyArtists();
      }
    }
  };

  const updateMapMarkers = (): void => {
    const artistMarkers = GoogleMapsService.createArtistMarkers(artists);
    const allMarkers = [...artistMarkers];

    if (location) {
      const currentLocationMarker =
        GoogleMapsService.createCurrentLocationMarker(
          location.latitude,
          location.longitude,
        );
      allMarkers.push(currentLocationMarker);
    }

    setMarkers(allMarkers);

    // マーカーが複数ある場合、すべてが表示されるように地図を調整
    if (allMarkers.length > 1) {
      const region = GoogleMapsService.calculateRegionForMarkers(allMarkers);
      setMapRegion(region);
    }
  };

  const searchNearbyArtists = async (): Promise<void> => {
    if (!location) return;

    setIsLoading(true);
    try {
      const nearbyArtists = await GeoSearchService.searchArtistsNearLocation(
        location.latitude,
        location.longitude,
        currentRadius,
      );

      setArtists(nearbyArtists);
    } catch (error) {
      console.error("Error searching nearby artists:", error);
      Alert.alert("エラー", "周辺のアーティスト検索に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (marker: MapMarker): void => {
    if (marker.type === "artist" && marker.artistInfo) {
      setSelectedArtist(marker.artistInfo);
      setShowArtistModal(true);
    }
  };

  const handleGetDirections = async (): Promise<void> => {
    if (!selectedArtist?.location || !location) return;

    try {
      await GoogleMapsService.openDirectionsInMaps(
        location.latitude,
        location.longitude,
        selectedArtist.location.latitude,
        selectedArtist.location.longitude,
        selectedArtist.displayName || "タトゥーアーティスト",
      );
    } catch (error) {
      console.error("Error opening directions:", error);
      Alert.alert("エラー", "マップアプリを開けませんでした");
    }
  };

  const handleViewProfile = (): void => {
    if (selectedArtist) {
      setShowArtistModal(false);
      navigation.navigate("ArtistProfile", { artistId: selectedArtist.uid });
    }
  };

  const handleSendInquiry = (): void => {
    if (selectedArtist) {
      setShowArtistModal(false);
      navigation.navigate("InquiryForm", {
        artistId: selectedArtist.uid,
        artistName: selectedArtist.displayName,
      });
    }
  };

  const changeSearchRadius = (newRadius: number): void => {
    setCurrentRadius(newRadius);
    setIsLoading(true);

    // 新しい半径でアーティストを再検索
    setTimeout(async () => {
      if (location) {
        try {
          const nearbyArtists =
            await GeoSearchService.searchArtistsNearLocation(
              location.latitude,
              location.longitude,
              newRadius,
            );
          setArtists(nearbyArtists);
        } catch (error) {
          console.error("Error searching with new radius:", error);
        }
      }
      setIsLoading(false);
    }, 500);
  };

  const formatDistance = (artist: User): string => {
    if (!location || !artist.location) return "";

    const distance = GoogleMapsService.calculateDistance(
      location.latitude,
      location.longitude,
      artist.location.latitude,
      artist.location.longitude,
    );

    return GoogleMapsService.formatDistance(distance);
  };

  const getMarkerImage = (markerType: "artist" | "current_location"): any => {
    // カスタムマーカー画像を返す（実装時に画像ファイルを追加）
    return markerType === "artist"
      ? require("../../assets/artist-marker.png")
      : undefined;
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
        <Text style={styles.title}>アーティスト地図</Text>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate("RecommendationList")}
        >
          <Text style={styles.listButtonText}>一覧</Text>
        </TouchableOpacity>
      </View>

      {/* 検索半径選択 */}
      <View style={styles.radiusContainer}>
        <Text style={styles.radiusLabel}>検索範囲:</Text>
        <View style={styles.radiusButtons}>
          {[1000, 3000, 5000, 10000].map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusButton,
                currentRadius === radius && styles.activeRadiusButton,
              ]}
              onPress={() => changeSearchRadius(radius)}
            >
              <Text
                style={[
                  styles.radiusButtonText,
                  currentRadius === radius && styles.activeRadiusButtonText,
                ]}
              >
                {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => handleMarkerPress(marker)}
              image={
                marker.type !== "current_location"
                  ? getMarkerImage(marker.type)
                  : undefined
              }
            >
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{marker.title}</Text>
                  <Text style={styles.calloutDescription}>
                    {marker.description}
                  </Text>
                  {marker.type === "artist" && marker.artistInfo && (
                    <Text style={styles.calloutDistance}>
                      📍 {formatDistance(marker.artistInfo)}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.loadingText}>検索中...</Text>
          </View>
        )}

        {/* 検索結果カウント */}
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>
            {artists.length}件のアーティストが見つかりました
          </Text>
        </View>
      </View>

      {/* アーティスト詳細モーダル */}
      <Modal
        visible={showArtistModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>アーティスト詳細</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowArtistModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {selectedArtist && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.artistHeader}>
                {selectedArtist.profileImage && (
                  <Image
                    source={{ uri: selectedArtist.profileImage }}
                    style={styles.artistImage}
                  />
                )}
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>
                    {selectedArtist.displayName || "Unknown Artist"}
                  </Text>
                  <Text style={styles.artistDistance}>
                    📍 {formatDistance(selectedArtist)}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>
                      ⭐{" "}
                      {selectedArtist.artistInfo?.rating?.toFixed(1) || "N/A"}
                    </Text>
                    <Text style={styles.reviewCount}>
                      ({selectedArtist.artistInfo?.reviewCount || 0}件)
                    </Text>
                  </View>
                </View>
              </View>

              {selectedArtist.artistInfo?.specialties && (
                <View style={styles.specialtiesContainer}>
                  <Text style={styles.sectionTitle}>得意スタイル</Text>
                  <View style={styles.specialtiesTags}>
                    {selectedArtist.artistInfo.specialties.map(
                      (specialty, index) => (
                        <View key={index} style={styles.specialtyTag}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {selectedArtist.artistInfo?.bio && (
                <View style={styles.bioContainer}>
                  <Text style={styles.sectionTitle}>プロフィール</Text>
                  <Text style={styles.bioText}>
                    {selectedArtist.artistInfo.bio}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={handleGetDirections}
                >
                  <Text style={styles.directionsButtonText}>🗺️ 道順を見る</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleViewProfile}
                >
                  <Text style={styles.profileButtonText}>👤 プロフィール</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inquiryButton}
                  onPress={handleSendInquiry}
                >
                  <Text style={styles.inquiryButtonText}>💬 問い合わせ</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
  listButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  listButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  radiusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  radiusLabel: {
    color: "#aaa",
    fontSize: 14,
    marginRight: 12,
  },
  radiusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  radiusButton: {
    backgroundColor: "#333",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  activeRadiusButton: {
    backgroundColor: "#ff6b6b",
  },
  radiusButtonText: {
    color: "#aaa",
    fontSize: 12,
  },
  activeRadiusButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  resultCount: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 8,
    padding: 8,
  },
  resultCountText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  calloutContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    maxWidth: 200,
  },
  calloutTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  calloutDescription: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },
  calloutDistance: {
    color: "#ff6b6b",
    fontSize: 11,
    fontWeight: "600",
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  artistHeader: {
    flexDirection: "row",
    marginBottom: 24,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  artistInfo: {
    flex: 1,
    justifyContent: "center",
  },
  artistName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  artistDistance: {
    fontSize: 14,
    color: "#ff6b6b",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "600",
  },
  reviewCount: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 4,
  },
  specialtiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 8,
  },
  specialtiesTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  specialtyText: {
    color: "#fff",
    fontSize: 12,
  },
  bioContainer: {
    marginBottom: 24,
  },
  bioText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    gap: 12,
    paddingBottom: 24,
  },
  directionsButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  directionsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileButton: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  inquiryButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  inquiryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ArtistMapScreen;
