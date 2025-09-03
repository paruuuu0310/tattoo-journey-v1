import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import GoogleVisionService from "../../services/GoogleVisionService";
import { AIAnalysisResult } from "../../types";

interface UploadedImage {
  id: string;
  uri: string;
  downloadUrl: string;
  analysis?: AIAnalysisResult;
  isAnalyzing?: boolean;
}

const ImageUploadScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<AIAnalysisResult | null>(null);

  const selectImageSource = () => {
    Alert.alert("画像を選択", "どこから画像を選択しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "カメラで撮影", onPress: () => openCamera() },
      { text: "フォトライブラリ", onPress: () => openImageLibrary() },
    ]);
  };

  const openCamera = () => {
    const options = {
      mediaType: "photo" as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) return;

      if (response.assets && response.assets[0]) {
        uploadImage(response.assets[0]);
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: "photo" as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5, // 最大5枚まで選択可能
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) return;

      if (response.assets) {
        response.assets.forEach((asset) => uploadImage(asset));
      }
    });
  };

  const uploadImage = async (imageAsset: any) => {
    if (!userProfile?.uid) return;

    setIsUploading(true);

    try {
      const fileName = `customer-uploads/${userProfile.uid}/${Date.now()}.jpg`;
      const reference = storage().ref(fileName);

      // 画像をFirebase Storageにアップロード
      await reference.putFile(imageAsset.uri);
      const downloadURL = await reference.getDownloadURL();

      const newImage: UploadedImage = {
        id: Date.now().toString(),
        uri: imageAsset.uri,
        downloadUrl: downloadURL,
        isAnalyzing: true,
      };

      setImages((prev) => [...prev, newImage]);

      // AI画像解析を実行
      analyzeImage(newImage);

      Alert.alert(
        "成功",
        "画像がアップロードされました。AI分析を実行中です...",
      );
    } catch (error) {
      Alert.alert("エラー", "画像のアップロードに失敗しました");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeImage = async (image: UploadedImage) => {
    try {
      // Base64に変換
      const base64 = await GoogleVisionService.convertImageToBase64(image.uri);

      // AI解析実行
      const analysis = await GoogleVisionService.analyzeImage(base64);

      // 解析結果をFirestoreに保存
      await firestore().collection("imageAnalyses").add({
        customerId: userProfile?.uid,
        imageUrl: image.downloadUrl,
        analysis,
        createdAt: new Date(),
      });

      // 状態を更新
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, analysis, isAnalyzing: false } : img,
        ),
      );
    } catch (error) {
      console.error("Analysis error:", error);

      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, isAnalyzing: false } : img,
        ),
      );

      Alert.alert("分析エラー", "AI画像分析に失敗しました");
    }
  };

  const deleteImage = async (image: UploadedImage) => {
    Alert.alert("削除確認", "この画像を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            // Firebase Storageから削除
            await storage().refFromURL(image.downloadUrl).delete();

            // 状態から削除
            setImages((prev) => prev.filter((img) => img.id !== image.id));

            Alert.alert("成功", "画像が削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Delete error:", error);
          }
        },
      },
    ]);
  };

  const viewAnalysis = (analysis: AIAnalysisResult) => {
    setSelectedAnalysis(analysis);
    setAnalysisModalVisible(true);
  };

  const renderColorPalette = (colors: string[]) => (
    <View style={styles.colorPalette}>
      {colors.slice(0, 5).map((color, index) => (
        <View
          key={index}
          style={[styles.colorSwatch, { backgroundColor: color }]}
        />
      ))}
    </View>
  );

  const renderImageCard = (image: UploadedImage) => (
    <View key={image.id} style={styles.imageCard}>
      <Image source={{ uri: image.uri }} style={styles.uploadedImage} />

      {image.isAnalyzing && (
        <View style={styles.analysisOverlay}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.analysisText}>AI分析中...</Text>
        </View>
      )}

      {image.analysis && (
        <View style={styles.analysisPreview}>
          <Text style={styles.analysisTitle}>AI分析結果</Text>
          <Text style={styles.styleText}>スタイル: {image.analysis.style}</Text>
          <Text style={styles.complexityText}>
            複雑さ: {image.analysis.complexity}
          </Text>
          <Text style={styles.confidenceText}>
            信頼度: {Math.round(image.analysis.confidence * 100)}%
          </Text>

          {image.analysis.colorPalette.length > 0 && (
            <>
              <Text style={styles.colorTitle}>カラーパレット:</Text>
              {renderColorPalette(image.analysis.colorPalette)}
            </>
          )}

          {image.analysis.motifs.length > 0 && (
            <View style={styles.motifsContainer}>
              <Text style={styles.motifsTitle}>モチーフ:</Text>
              <View style={styles.motifsList}>
                {image.analysis.motifs.slice(0, 3).map((motif, index) => (
                  <View key={index} style={styles.motifTag}>
                    <Text style={styles.motifText}>{motif}</Text>
                  </View>
                ))}
                {image.analysis.motifs.length > 3 && (
                  <Text style={styles.moreMotifs}>
                    +{image.analysis.motifs.length - 3}
                  </Text>
                )}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => viewAnalysis(image.analysis!)}
          >
            <Text style={styles.viewDetailsText}>詳細を見る</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteImageButton}
        onPress={() => deleteImage(image)}
      >
        <Text style={styles.deleteImageText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>希望デザイン画像</Text>
        <Text style={styles.subtitle}>
          タトゥーの参考画像をアップロードしてAI分析を受けましょう
        </Text>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={selectImageSource}
        disabled={isUploading}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading ? "アップロード中..." : "+ 画像を追加"}
        </Text>
      </TouchableOpacity>

      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>画像がまだありません</Text>
          <Text style={styles.emptyStateSubtext}>
            上のボタンから希望のデザイン画像を追加してください
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.imagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {images.map(renderImageCard)}
        </ScrollView>
      )}

      {/* 分析詳細モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={analysisModalVisible}
        onRequestClose={() => setAnalysisModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>AI分析詳細結果</Text>

              {selectedAnalysis && (
                <>
                  <View style={styles.analysisSection}>
                    <Text style={styles.sectionTitle}>基本情報</Text>
                    <Text style={styles.analysisDetail}>
                      検出スタイル: {selectedAnalysis.style}
                    </Text>
                    <Text style={styles.analysisDetail}>
                      複雑さレベル: {selectedAnalysis.complexity}
                    </Text>
                    <Text style={styles.analysisDetail}>
                      カラフルさ:{" "}
                      {selectedAnalysis.isColorful ? "カラフル" : "モノトーン"}
                    </Text>
                    <Text style={styles.analysisDetail}>
                      分析信頼度:{" "}
                      {Math.round(selectedAnalysis.confidence * 100)}%
                    </Text>
                  </View>

                  {selectedAnalysis.colorPalette.length > 0 && (
                    <View style={styles.analysisSection}>
                      <Text style={styles.sectionTitle}>カラーパレット</Text>
                      {renderColorPalette(selectedAnalysis.colorPalette)}
                    </View>
                  )}

                  {selectedAnalysis.motifs.length > 0 && (
                    <View style={styles.analysisSection}>
                      <Text style={styles.sectionTitle}>
                        検出されたモチーフ
                      </Text>
                      <View style={styles.allMotifsList}>
                        {selectedAnalysis.motifs.map((motif, index) => (
                          <View key={index} style={styles.motifTag}>
                            <Text style={styles.motifText}>{motif}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.analysisSection}>
                    <Text style={styles.sectionTitle}>生の分析データ</Text>
                    {selectedAnalysis.rawLabels
                      .slice(0, 10)
                      .map((label, index) => (
                        <Text key={index} style={styles.rawLabel}>
                          {label.description}:{" "}
                          {Math.round(label.confidence * 100)}%
                        </Text>
                      ))}
                  </View>

                  <Text style={styles.analysisTimestamp}>
                    分析日時:{" "}
                    {selectedAnalysis.processedAt.toLocaleString("ja-JP")}
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setAnalysisModalVisible(false)}
              >
                <Text style={styles.closeModalText}>閉じる</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
  },
  uploadButton: {
    backgroundColor: "#ff6b6b",
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  imagesContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  imageCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#333",
  },
  analysisOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  analysisPreview: {
    padding: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 8,
  },
  styleText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  complexityText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: "#4ade80",
    marginBottom: 12,
  },
  colorTitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  colorPalette: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  motifsContainer: {
    marginBottom: 12,
  },
  motifsTitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  motifsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  allMotifsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  motifTag: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  motifText: {
    fontSize: 12,
    color: "#aaa",
  },
  moreMotifs: {
    fontSize: 12,
    color: "#888",
  },
  viewDetailsButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteImageText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  analysisSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  analysisDetail: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  rawLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 2,
  },
  analysisTimestamp: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },
  closeModalButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  closeModalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ImageUploadScreen;
