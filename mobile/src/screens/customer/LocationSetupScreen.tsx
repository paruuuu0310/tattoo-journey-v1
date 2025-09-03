import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocation } from "../../contexts/LocationContext";
import LocationService from "../../services/LocationService";

interface Props {
  navigation: any;
  onLocationSet?: (location: { latitude: number; longitude: number }) => void;
}

const LocationSetupScreen: React.FC<Props> = ({
  navigation,
  onLocationSet,
}) => {
  const {
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
  } = useLocation();

  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(
    null,
  );

  const prefectures = [
    { name: "東京都", coordinates: { latitude: 35.6762, longitude: 139.6503 } },
    { name: "大阪府", coordinates: { latitude: 34.6937, longitude: 135.5023 } },
    {
      name: "神奈川県",
      coordinates: { latitude: 35.4478, longitude: 139.6425 },
    },
    { name: "愛知県", coordinates: { latitude: 35.1815, longitude: 136.9066 } },
    { name: "福岡県", coordinates: { latitude: 33.6064, longitude: 130.4183 } },
    { name: "北海道", coordinates: { latitude: 43.2203, longitude: 142.8635 } },
    { name: "兵庫県", coordinates: { latitude: 34.6913, longitude: 135.183 } },
    { name: "京都府", coordinates: { latitude: 35.0116, longitude: 135.7681 } },
    { name: "埼玉県", coordinates: { latitude: 35.8617, longitude: 139.6455 } },
    { name: "千葉県", coordinates: { latitude: 35.6074, longitude: 140.1065 } },
  ];

  useEffect(() => {
    if (currentLocation && onLocationSet) {
      onLocationSet(currentLocation.coordinates);
    }
  }, [currentLocation, onLocationSet]);

  const handleGetCurrentLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    await requestLocation();
  };

  const handleManualSelection = (prefecture: (typeof prefectures)[0]) => {
    setSelectedPrefecture(prefecture.name);
    if (onLocationSet) {
      onLocationSet(prefecture.coordinates);
    }

    Alert.alert(
      "位置設定完了",
      `${prefecture.name}を選択しました。この地域のタトゥーアーティストを検索します。`,
      [
        {
          text: "OK",
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const getLocationStatus = () => {
    if (isLoading) return "loading";
    if (error) return "error";
    if (currentLocation) return "success";
    if (!hasPermission) return "permission_needed";
    return "initial";
  };

  const renderLocationStatus = () => {
    const status = getLocationStatus();

    switch (status) {
      case "loading":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.statusText}>位置情報を取得中...</Text>
            <Text style={styles.statusSubText}>
              精確な位置を取得するまでお待ちください
            </Text>
          </View>
        );

      case "error":
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>位置情報の取得に失敗しました</Text>
            <Text style={styles.errorSubText}>{error?.message}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                clearError();
                handleGetCurrentLocation();
              }}
            >
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        );

      case "success":
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>位置情報を取得しました</Text>
            <Text style={styles.locationText}>
              {currentLocation?.address?.formattedAddress || "取得した位置"}
            </Text>
            <Text style={styles.accuracyText}>
              精度:{" "}
              {currentLocation
                ? LocationService.getAccuracyLevel(currentLocation.accuracy)
                : ""}
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("ImageUpload");
                }
              }}
            >
              <Text style={styles.continueButtonText}>この位置で検索する</Text>
            </TouchableOpacity>
          </View>
        );

      case "permission_needed":
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.warningIcon}>🔐</Text>
            <Text style={styles.warningText}>位置情報の許可が必要です</Text>
            <Text style={styles.warningSubText}>
              最適なタトゥーアーティストを見つけるために位置情報を使用します
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>位置情報を許可</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.defaultIcon}>📍</Text>
            <Text style={styles.defaultText}>位置情報を設定してください</Text>
            <Text style={styles.defaultSubText}>
              近くのタトゥーアーティストを検索するために必要です
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>位置情報の設定</Text>
          <Text style={styles.subtitle}>
            あなたの近くにいる最適なタトゥーアーティストを見つけましょう
          </Text>
        </View>

        {renderLocationStatus()}

        <View style={styles.optionsSection}>
          <Text style={styles.optionsTitle}>位置情報の設定方法を選択</Text>

          {!isManualMode ? (
            <View style={styles.automaticSection}>
              <TouchableOpacity
                style={styles.automaticButton}
                onPress={handleGetCurrentLocation}
                disabled={isLoading}
              >
                <Text style={styles.automaticButtonIcon}>🎯</Text>
                <Text style={styles.automaticButtonText}>現在地を自動取得</Text>
                <Text style={styles.automaticButtonSubtext}>
                  GPS使用（推奨）
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualModeButton}
                onPress={() => setIsManualMode(true)}
              >
                <Text style={styles.manualModeButtonText}>
                  手動で地域を選択
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.manualSection}>
              <TouchableOpacity
                style={styles.backToAutoButton}
                onPress={() => setIsManualMode(false)}
              >
                <Text style={styles.backToAutoButtonText}>
                  ← 自動取得に戻る
                </Text>
              </TouchableOpacity>

              <Text style={styles.manualTitle}>お住まいの都道府県を選択</Text>

              <View style={styles.prefecturesList}>
                {prefectures.map((prefecture, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.prefectureButton,
                      selectedPrefecture === prefecture.name &&
                        styles.selectedPrefecture,
                    ]}
                    onPress={() => handleManualSelection(prefecture)}
                  >
                    <Text
                      style={[
                        styles.prefectureButtonText,
                        selectedPrefecture === prefecture.name &&
                          styles.selectedPrefectureText,
                      ]}
                    >
                      {prefecture.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>位置情報について</Text>
          <Text style={styles.infoText}>
            • 位置情報は近くのアーティスト検索にのみ使用されます{"\n"}•
            個人情報は安全に保護されます{"\n"}• いつでも設定から変更できます
            {"\n"}• 位置情報の共有はオプションです
          </Text>
        </View>

        {currentLocation && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>
              取得した位置情報（デバッグ用）
            </Text>
            <Text style={styles.debugText}>
              緯度: {currentLocation.coordinates.latitude.toFixed(6)}
              {"\n"}
              経度: {currentLocation.coordinates.longitude.toFixed(6)}
              {"\n"}
              精度: {currentLocation.accuracy}m{"\n"}
              取得時刻:{" "}
              {new Date(currentLocation.timestamp).toLocaleString("ja-JP")}
            </Text>
            {isWatching && (
              <TouchableOpacity
                style={styles.stopWatchingButton}
                onPress={stopWatching}
              >
                <Text style={styles.stopWatchingButtonText}>
                  位置監視を停止
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    lineHeight: 22,
  },
  statusContainer: {
    alignItems: "center",
    padding: 30,
    margin: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
  },
  statusText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
  },
  statusSubText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 18,
    color: "#ff6b6b",
    marginTop: 12,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  successIcon: {
    fontSize: 48,
  },
  successText: {
    fontSize: 18,
    color: "#4ade80",
    marginTop: 12,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: "#4ade80",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningIcon: {
    fontSize: 48,
  },
  warningText: {
    fontSize: 18,
    color: "#facc15",
    marginTop: 12,
    marginBottom: 8,
  },
  warningSubText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: "#facc15",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "bold",
  },
  defaultIcon: {
    fontSize: 48,
  },
  defaultText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
  },
  defaultSubText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  optionsSection: {
    padding: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  automaticSection: {
    alignItems: "center",
  },
  automaticButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  automaticButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  automaticButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  automaticButtonSubtext: {
    fontSize: 14,
    color: "#ff6b6b",
  },
  manualModeButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  manualModeButtonText: {
    color: "#aaa",
    fontSize: 14,
  },
  manualSection: {
    marginTop: 10,
  },
  backToAutoButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backToAutoButtonText: {
    color: "#ff6b6b",
    fontSize: 14,
  },
  manualTitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
  },
  prefecturesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prefectureButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedPrefecture: {
    backgroundColor: "#ff6b6b",
  },
  prefectureButtonText: {
    color: "#ccc",
    fontSize: 14,
  },
  selectedPrefectureText: {
    color: "#fff",
    fontWeight: "bold",
  },
  infoSection: {
    margin: 20,
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4ade80",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  debugSection: {
    margin: 20,
    padding: 16,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#facc15",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 12,
  },
  stopWatchingButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  stopWatchingButtonText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default LocationSetupScreen;
