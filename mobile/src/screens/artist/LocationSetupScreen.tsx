import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import GoogleMapsService, { MapRegion } from "../../services/GoogleMapsService";
import firestore from "@react-native-firebase/firestore";

interface Props {
  navigation: any;
}

interface StudioLocation {
  latitude: number;
  longitude: number;
  address: string;
  studioName?: string;
  description?: string;
}

const LocationSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { location, hasLocationPermission, requestLocationPermission } =
    useLocation();

  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: location?.latitude || 35.6762,
    longitude: location?.longitude || 139.6503,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [studioLocation, setStudioLocation] = useState<StudioLocation>({
    latitude: userProfile?.location?.latitude || mapRegion.latitude,
    longitude: userProfile?.location?.longitude || mapRegion.longitude,
    address: userProfile?.location?.address || "",
    studioName: userProfile?.location?.studioName || "",
    description: userProfile?.location?.description || "",
  });

  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    initializeLocation();
  }, [location, hasLocationPermission]);

  useEffect(() => {
    if (userProfile?.location) {
      const { latitude, longitude, address, studioName, description } =
        userProfile.location;
      setStudioLocation({
        latitude: latitude || mapRegion.latitude,
        longitude: longitude || mapRegion.longitude,
        address: address || "",
        studioName: studioName || "",
        description: description || "",
      });

      setMapRegion({
        latitude: latitude || mapRegion.latitude,
        longitude: longitude || mapRegion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userProfile]);

  const initializeLocation = async (): Promise<void> => {
    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          "位置情報が必要です",
          "スタジオの場所を設定するために位置情報へのアクセスを許可してください。",
          [
            { text: "キャンセル", style: "cancel" },
            { text: "設定", onPress: () => requestLocationPermission() },
          ],
        );
        return;
      }
    }

    if (location && !userProfile?.location) {
      const region = GoogleMapsService.createMapRegion(
        location.latitude,
        location.longitude,
        0.01,
        0.01,
      );
      setMapRegion(region);

      // 現在位置の住所を取得
      try {
        const address = await GoogleMapsService.getAddressFromCoordinates(
          location.latitude,
          location.longitude,
        );
        setStudioLocation((prev) => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
          address,
        }));
      } catch (error) {
        console.error("Error getting address:", error);
      }
    }
  };

  const handleMapPress = async (event: any): Promise<void> => {
    const coordinate = event.nativeEvent.coordinate;
    setStudioLocation((prev) => ({
      ...prev,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));

    // 座標から住所を取得
    try {
      const address = await GoogleMapsService.getAddressFromCoordinates(
        coordinate.latitude,
        coordinate.longitude,
      );
      setStudioLocation((prev) => ({ ...prev, address }));
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
    }
  };

  const handleMarkerDragEnd = async (event: any): Promise<void> => {
    const coordinate = event.nativeEvent.coordinate;
    setIsDragging(false);

    setStudioLocation((prev) => ({
      ...prev,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));

    // ドラッグ終了後に住所を取得
    try {
      const address = await GoogleMapsService.getAddressFromCoordinates(
        coordinate.latitude,
        coordinate.longitude,
      );
      setStudioLocation((prev) => ({ ...prev, address }));
    } catch (error) {
      console.error("Error getting address from drag:", error);
    }
  };

  const searchByAddress = async (): Promise<void> => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const coordinates =
        await GoogleMapsService.getCoordinatesFromAddress(searchAddress);

      if (coordinates) {
        const region = GoogleMapsService.createMapRegion(
          coordinates.latitude,
          coordinates.longitude,
          0.01,
          0.01,
        );
        setMapRegion(region);

        setStudioLocation((prev) => ({
          ...prev,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: searchAddress,
        }));
      } else {
        Alert.alert("検索エラー", "指定された住所が見つかりませんでした。");
      }
    } catch (error) {
      console.error("Error searching address:", error);
      Alert.alert("検索エラー", "住所の検索に失敗しました。");
    } finally {
      setIsSearching(false);
    }
  };

  const useCurrentLocation = async (): Promise<void> => {
    if (!location) {
      Alert.alert("エラー", "現在位置を取得できません。");
      return;
    }

    const region = GoogleMapsService.createMapRegion(
      location.latitude,
      location.longitude,
      0.01,
      0.01,
    );
    setMapRegion(region);

    try {
      const address = await GoogleMapsService.getAddressFromCoordinates(
        location.latitude,
        location.longitude,
      );
      setStudioLocation({
        ...studioLocation,
        latitude: location.latitude,
        longitude: location.longitude,
        address,
      });
    } catch (error) {
      console.error("Error getting current location address:", error);
      setStudioLocation({
        ...studioLocation,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  const saveLocation = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    if (!studioLocation.latitude || !studioLocation.longitude) {
      Alert.alert("エラー", "スタジオの場所を選択してください。");
      return;
    }

    setIsSaving(true);
    try {
      const locationData = {
        latitude: studioLocation.latitude,
        longitude: studioLocation.longitude,
        address: studioLocation.address,
        studioName: studioLocation.studioName,
        description: studioLocation.description,
        updatedAt: new Date(),
      };

      // Firestoreに保存
      await firestore().collection("users").doc(userProfile.uid).update({
        location: locationData,
      });

      // ローカルの状態を更新
      await updateUserProfile({
        location: locationData,
      });

      Alert.alert("保存完了", "スタジオの位置情報が保存されました。", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("エラー", "位置情報の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocationField = (
    field: keyof StudioLocation,
    value: string,
  ): void => {
    setStudioLocation((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        <Text style={styles.title}>スタジオ位置設定</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={saveLocation}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "保存中..." : "保存"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 住所検索 */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>住所から検索</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchAddress}
              onChangeText={setSearchAddress}
              placeholder="住所を入力してください"
              placeholderTextColor="#666"
              onSubmitEditing={searchByAddress}
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                isSearching && styles.disabledButton,
              ]}
              onPress={searchByAddress}
              disabled={isSearching}
            >
              <Text style={styles.searchButtonText}>
                {isSearching ? "検索中..." : "検索"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={useCurrentLocation}
          >
            <Text style={styles.currentLocationButtonText}>
              📍 現在地を使用
            </Text>
          </TouchableOpacity>
        </View>

        {/* 地図 */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>地図上でピンを移動して調整</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={{
                  latitude: studioLocation.latitude,
                  longitude: studioLocation.longitude,
                }}
                draggable
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleMarkerDragEnd}
                title="スタジオ位置"
                description={studioLocation.address || "住所未設定"}
              />
            </MapView>

            {isDragging && (
              <View style={styles.draggingOverlay}>
                <Text style={styles.draggingText}>ピンを移動中...</Text>
              </View>
            )}
          </View>
        </View>

        {/* スタジオ情報入力 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>スタジオ情報</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>住所 *</Text>
            <TextInput
              style={styles.textInput}
              value={studioLocation.address}
              onChangeText={(text) => updateLocationField("address", text)}
              placeholder="自動取得された住所を確認・編集"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>スタジオ名</Text>
            <TextInput
              style={styles.textInput}
              value={studioLocation.studioName}
              onChangeText={(text) => updateLocationField("studioName", text)}
              placeholder="例: Tokyo Ink Studio"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>説明・備考</Text>
            <TextInput
              style={styles.textArea}
              value={studioLocation.description}
              onChangeText={(text) => updateLocationField("description", text)}
              placeholder="アクセス方法や目印などの説明"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 位置情報表示 */}
        <View style={styles.coordinatesSection}>
          <Text style={styles.sectionTitle}>座標情報</Text>
          <Text style={styles.coordinatesText}>
            緯度: {studioLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinatesText}>
            経度: {studioLocation.longitude.toFixed(6)}
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
  saveButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  currentLocationButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  currentLocationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  draggingOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 8,
    padding: 12,
  },
  draggingText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  infoSection: {
    padding: 20,
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  coordinatesSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  coordinatesText: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 4,
  },
});

export default LocationSetupScreen;
