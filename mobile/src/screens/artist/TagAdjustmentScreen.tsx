import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import AutoTaggingService, {
  TaggingResult,
} from "../../services/AutoTaggingService";
import { PortfolioItem } from "../../types";

interface TagAdjustment {
  portfolioItemId: string;
  originalTags: string[];
  adjustedTags: string[];
  addedTags: string[];
  removedTags: string[];
  customTags: string[];
}

const TagAdjustmentScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [taggingResult, setTaggingResult] = useState<TaggingResult | null>(
    null,
  );
  const [adjustedTags, setAdjustedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const commonTags = [
    // スタイル系
    "リアリズム",
    "トラディショナル",
    "ジャパニーズ",
    "ブラック&グレー",
    "カラー",
    "ミニマル",
    "ジオメトリック",
    "レタリング",

    // モチーフ系
    "動物",
    "花",
    "人物",
    "スカル",
    "ドラゴン",
    "鳥",
    "魚",
    "自然",
    "抽象",
    "文字",
    "記号",
    "マンダラ",

    // 技法系
    "シェーディング",
    "ラインワーク",
    "ドットワーク",
    "グラデーション",
    "テクスチャ",
    "3D効果",
    "ウォーターカラー",

    // 色彩系
    "カラフル",
    "モノクロ",
    "パステル",
    "ビビッド",
    "ダーク",
    "レッド",
    "ブルー",
    "グリーン",
    "イエロー",
    "パープル",

    // サイズ・配置系
    "小サイズ",
    "中サイズ",
    "大サイズ",
    "腕",
    "脚",
    "背中",
    "胸",

    // 雰囲気系
    "クール",
    "エレガント",
    "ワイルド",
    "キュート",
    "ゴシック",
    "ヴィンテージ",
    "モダン",
    "クラシック",
    "神秘的",
    "パワフル",
  ];

  useEffect(() => {
    loadPortfolioItems();
  }, []);

  const loadPortfolioItems = async () => {
    if (!userProfile?.uid) return;

    try {
      const snapshot = await firestore()
        .collection("portfolioItems")
        .where("artistId", "==", userProfile.uid)
        .orderBy("createdAt", "desc")
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as PortfolioItem[];

      setPortfolioItems(items);
    } catch (error) {
      console.error("Error loading portfolio items:", error);
    }
  };

  const startTagAdjustment = async (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsProcessing(true);

    try {
      // 既存のAI分析結果があるかチェック
      if (item.aiAnalysis && item.tags) {
        // 既存のデータを使用
        setTaggingResult({
          automaticTags: item.tags,
          confidenceScores: (item as any).tagConfidenceScores || {},
          suggestedTags: (item as any).suggestedTags || [],
          analysisData: item.aiAnalysis,
        });
        setAdjustedTags([...item.tags]);
      } else {
        // 新しくタグ付けを実行
        const result = await AutoTaggingService.tagPortfolioItem(
          item.id,
          item.imageUrl,
        );
        setTaggingResult(result);
        setAdjustedTags([...result.automaticTags]);

        // portfolioItemsの状態も更新
        setPortfolioItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  tags: result.automaticTags,
                  aiAnalysis: result.analysisData,
                }
              : p,
          ),
        );
      }
    } catch (error) {
      Alert.alert("エラー", "タグ分析に失敗しました");
      console.error("Error in tag analysis:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setAdjustedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addCustomTag = () => {
    if (
      customTagInput.trim() &&
      !adjustedTags.includes(customTagInput.trim())
    ) {
      setAdjustedTags((prev) => [...prev, customTagInput.trim()]);
      setCustomTagInput("");
    }
  };

  const saveTagAdjustments = async () => {
    if (!selectedItem || !taggingResult) return;

    try {
      const originalTags = taggingResult.automaticTags;
      const addedTags = adjustedTags.filter(
        (tag) => !originalTags.includes(tag),
      );
      const removedTags = originalTags.filter(
        (tag) => !adjustedTags.includes(tag),
      );

      const adjustment: TagAdjustment = {
        portfolioItemId: selectedItem.id,
        originalTags,
        adjustedTags,
        addedTags,
        removedTags,
        customTags: addedTags.filter((tag) => !commonTags.includes(tag)),
      };

      // ポートフォリオアイテムを更新
      await firestore()
        .collection("portfolioItems")
        .doc(selectedItem.id)
        .update({
          tags: adjustedTags,
          lastManualTagAdjustment: new Date(),
          tagAdjustmentHistory: firestore.FieldValue.arrayUnion(adjustment),
          updatedAt: new Date(),
        });

      // 調整履歴を保存
      await firestore()
        .collection("tagAdjustments")
        .add({
          ...adjustment,
          artistId: userProfile?.uid,
          createdAt: new Date(),
        });

      // 学習データとして保存（将来のAI改善のため）
      await firestore()
        .collection("tagLearningData")
        .add({
          artistId: userProfile?.uid,
          portfolioItemId: selectedItem.id,
          originalAnalysis: taggingResult.analysisData,
          originalTags,
          adjustedTags,
          userActions: {
            added: addedTags,
            removed: removedTags,
            custom: addedTags.filter((tag) => !commonTags.includes(tag)),
          },
          createdAt: new Date(),
        });

      Alert.alert("保存完了", "タグの調整が保存されました");
      setSelectedItem(null);
      setTaggingResult(null);
      loadPortfolioItems(); // 一覧を更新
    } catch (error) {
      Alert.alert("エラー", "タグの保存に失敗しました");
      console.error("Error saving tag adjustments:", error);
    }
  };

  const batchAutoTag = async () => {
    Alert.alert(
      "バッチ自動タグ付け",
      "全ての作品に対してAI自動タグ付けを実行しますか？\n（時間がかかる場合があります）",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "実行",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await AutoTaggingService.batchTagPortfolio(
                userProfile?.uid!,
              );
              Alert.alert(
                "完了",
                `バッチタグ付けが完了しました。\n成功: ${result.success}件\n失敗: ${result.failed}件`,
              );
              loadPortfolioItems();
            } catch (error) {
              Alert.alert("エラー", "バッチタグ付けに失敗しました");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const renderPortfolioItem = ({ item }: { item: PortfolioItem }) => (
    <TouchableOpacity
      style={styles.portfolioCard}
      onPress={() => startTagAdjustment(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
      <View style={styles.portfolioInfo}>
        <Text style={styles.portfolioTitle}>{item.title || "無題"}</Text>
        <View style={styles.tagsPreview}>
          {(item.tags || []).slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {(item.tags || []).length > 3 && (
            <Text style={styles.moreTagsText}>
              +{(item.tags || []).length - 3}
            </Text>
          )}
        </View>
        <Text style={styles.adjustmentStatus}>
          {item.aiAnalysis ? "AI分析済み" : "未分析"}
          {(item as any).lastManualTagAdjustment && " • 手動調整済み"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedItem && taggingResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.adjustmentContainer}>
          <View style={styles.adjustmentHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.adjustmentTitle}>タグ調整</Text>
          </View>

          <Image
            source={{ uri: selectedItem.imageUrl }}
            style={styles.selectedImage}
          />

          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>AI分析結果</Text>
            <Text style={styles.analysisText}>
              スタイル: {taggingResult.analysisData.style}
            </Text>
            <Text style={styles.analysisText}>
              複雑さ: {taggingResult.analysisData.complexity}
            </Text>
            <Text style={styles.analysisText}>
              信頼度: {Math.round(taggingResult.analysisData.confidence * 100)}%
            </Text>
          </View>

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>自動生成タグ</Text>
            <View style={styles.tagsList}>
              {taggingResult.automaticTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.adjustableTag,
                    adjustedTags.includes(tag)
                      ? styles.selectedTag
                      : styles.unselectedTag,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.adjustableTagText,
                      adjustedTags.includes(tag)
                        ? styles.selectedTagText
                        : styles.unselectedTagText,
                    ]}
                  >
                    {tag}
                  </Text>
                  <Text style={styles.confidenceScore}>
                    {Math.round(
                      (taggingResult.confidenceScores[tag] || 0) * 100,
                    )}
                    %
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {taggingResult.suggestedTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>提案タグ</Text>
              <View style={styles.tagsList}>
                {taggingResult.suggestedTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestedTag,
                      adjustedTags.includes(tag)
                        ? styles.selectedTag
                        : styles.unselectedTag,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.adjustableTagText,
                        adjustedTags.includes(tag)
                          ? styles.selectedTagText
                          : styles.unselectedTagText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>よく使用されるタグ</Text>
            <View style={styles.tagsList}>
              {commonTags
                .filter((tag) => !adjustedTags.includes(tag))
                .map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.commonTag}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={styles.commonTagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          <View style={styles.customTagSection}>
            <Text style={styles.sectionTitle}>カスタムタグを追加</Text>
            <View style={styles.customTagInput}>
              <TextInput
                style={styles.tagInput}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                placeholder="独自のタグを入力"
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addCustomTag}
              >
                <Text style={styles.addTagButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.selectedTagsSection}>
            <Text style={styles.sectionTitle}>
              選択中のタグ ({adjustedTags.length})
            </Text>
            <View style={styles.selectedTagsList}>
              {adjustedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.selectedTagChip}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={styles.selectedTagChipText}>{tag}</Text>
                  <Text style={styles.removeTagText}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveTagAdjustments}
          >
            <Text style={styles.saveButtonText}>タグ調整を保存</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>タグ管理</Text>
        <TouchableOpacity
          style={styles.batchButton}
          onPress={batchAutoTag}
          disabled={isProcessing}
        >
          <Text style={styles.batchButtonText}>
            {isProcessing ? "処理中..." : "一括タグ付け"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={portfolioItems}
        renderItem={renderPortfolioItem}
        keyExtractor={(item) => item.id}
        style={styles.portfolioList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              ポートフォリオがありません
            </Text>
            <Text style={styles.emptyStateSubtext}>
              作品を追加してからタグ管理を行ってください
            </Text>
          </View>
        }
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  batchButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  batchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  portfolioList: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  portfolioCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
  },
  portfolioImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  portfolioInfo: {
    flex: 1,
    marginLeft: 16,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  tagsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: "#aaa",
  },
  moreTagsText: {
    fontSize: 10,
    color: "#888",
    alignSelf: "center",
  },
  adjustmentStatus: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  adjustmentContainer: {
    flex: 1,
    padding: 20,
  },
  adjustmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  adjustmentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#333",
    marginBottom: 20,
  },
  analysisSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  adjustableTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  selectedTag: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  unselectedTag: {
    backgroundColor: "#333",
    borderColor: "#555",
  },
  suggestedTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  commonTag: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#444",
  },
  adjustableTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  selectedTagText: {
    color: "#fff",
  },
  unselectedTagText: {
    color: "#aaa",
  },
  commonTagText: {
    fontSize: 12,
    color: "#ccc",
  },
  confidenceScore: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  customTagSection: {
    marginBottom: 20,
  },
  customTagInput: {
    flexDirection: "row",
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  addTagButton: {
    backgroundColor: "#4ade80",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addTagButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedTagsSection: {
    marginBottom: 20,
  },
  selectedTagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedTagChip: {
    backgroundColor: "#ff6b6b",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedTagChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  removeTagText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TagAdjustmentScreen;
