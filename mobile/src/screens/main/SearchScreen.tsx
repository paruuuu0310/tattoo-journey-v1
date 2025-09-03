import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Button, Tag, ImageCard, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import {
  mockDesigns,
  mockArtists,
  Design,
  Artist,
} from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - DesignTokens.spacing[4] * 3) / 2;

interface SearchScreenProps {
  onDesignPress?: (design: Design) => void;
  onArtistPress?: (artist: Artist) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({
  onDesignPress,
  onArtistPress,
}) => {
  const [searchMode, setSearchMode] = useState<"text" | "image" | "filter">(
    "text",
  );
  const [searchText, setSearchText] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Design[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const styles = [
    "すべて",
    "ミニマル",
    "リアリズム",
    "ジャパニーズ",
    "幾何学",
    "トライバル",
  ];
  const priceRanges = [
    "〜¥20,000",
    "¥20,000〜¥50,000",
    "¥50,000〜¥100,000",
    "¥100,000〜",
  ];

  const handleImageUpload = () => {
    Alert.alert("画像アップロード", "画像を選択してください", [
      { text: "キャンセル", style: "cancel" },
      { text: "カメラ", onPress: () => mockImageUpload("camera") },
      { text: "ライブラリ", onPress: () => mockImageUpload("library") },
    ]);
  };

  const mockImageUpload = (source: string) => {
    setIsSearching(true);
    setToastMessage(
      `${source === "camera" ? "カメラ" : "ライブラリ"}から画像を取得中...`,
    );
    setShowToast(true);

    setTimeout(() => {
      setIsSearching(false);
      setSearchResults(mockDesigns);
      setToastMessage("AI分析が完了しました！");
      setShowToast(true);
    }, 2000);
  };

  const handleTextSearch = () => {
    if (!searchText.trim()) {
      setToastMessage("検索キーワードを入力してください");
      setShowToast(true);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const filtered = mockDesigns.filter(
        (design) =>
          design.title.toLowerCase().includes(searchText.toLowerCase()) ||
          design.tags.some((tag) =>
            tag.toLowerCase().includes(searchText.toLowerCase()),
          ) ||
          design.artist.name.toLowerCase().includes(searchText.toLowerCase()),
      );

      setSearchResults(filtered);
      setIsSearching(false);

      if (filtered.length === 0) {
        setToastMessage(
          "検索結果が見つかりませんでした。条件を変更してお試しください。",
        );
        setShowToast(true);
      }
    }, 1000);
  };

  const handleFilterSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      let filtered = mockDesigns;

      if (selectedStyles.length > 0 && !selectedStyles.includes("すべて")) {
        filtered = filtered.filter((design) =>
          selectedStyles.includes(design.style),
        );
      }

      setSearchResults(filtered);
      setIsSearching(false);

      if (filtered.length === 0) {
        setToastMessage("条件に合うデザインが見つかりませんでした");
        setShowToast(true);
      }
    }, 1000);
  };

  const handleStyleSelect = (style: string) => {
    if (style === "すべて") {
      setSelectedStyles(["すべて"]);
    } else {
      setSelectedStyles((prev) => {
        const newStyles = prev.filter((s) => s !== "すべて");
        return prev.includes(style)
          ? newStyles.filter((s) => s !== style)
          : [...newStyles, style];
      });
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0 && !isSearching) {
      return null;
    }

    return (
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            検索結果 ({searchResults.length}件)
          </Text>
        </View>

        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <ImageCard
              imageUrl={item.imageUrl}
              title={item.title}
              subtitle={item.artist.name}
              price={item.priceRange}
              tags={item.tags}
              likes={item.likes}
              isLiked={item.isLiked}
              onPress={() => onDesignPress?.(item)}
              width={CARD_WIDTH}
              aspectRatio={4 / 5}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.resultRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>デザイン検索</Text>
          <Text style={styles.subtitle}>
            理想のタトゥーデザインを見つけよう
          </Text>
        </View>

        {/* Search Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "text" && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode("text")}
          >
            <Text
              style={[
                styles.modeButtonText,
                searchMode === "text" && styles.modeButtonTextActive,
              ]}
            >
              テキスト検索
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "image" && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode("image")}
          >
            <Text
              style={[
                styles.modeButtonText,
                searchMode === "image" && styles.modeButtonTextActive,
              ]}
            >
              画像検索
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "filter" && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode("filter")}
          >
            <Text
              style={[
                styles.modeButtonText,
                searchMode === "filter" && styles.modeButtonTextActive,
              ]}
            >
              条件検索
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Search */}
        {searchMode === "text" && (
          <View style={styles.searchSection}>
            <View style={styles.textSearchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="デザインやアーティスト名を検索..."
                placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleTextSearch}
              />
              <Button
                title="検索"
                onPress={handleTextSearch}
                loading={isSearching}
                variant="primary"
                size="medium"
                style={styles.searchButton}
              />
            </View>
          </View>
        )}

        {/* Image Search */}
        {searchMode === "image" && (
          <View style={styles.searchSection}>
            <View style={styles.imageSearchContainer}>
              <View style={styles.uploadArea}>
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadTitle}>画像をアップロード</Text>
                <Text style={styles.uploadSubtitle}>
                  参考画像からAIが似たデザインを検索します
                </Text>
                <Button
                  title="画像を選択"
                  onPress={handleImageUpload}
                  loading={isSearching}
                  variant="primary"
                  size="large"
                  style={styles.uploadButton}
                />
              </View>
            </View>
          </View>
        )}

        {/* Filter Search */}
        {searchMode === "filter" && (
          <View style={styles.searchSection}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>スタイル</Text>
              <View style={styles.filterTags}>
                {styles.map((style) => (
                  <Tag
                    key={style}
                    label={style}
                    selected={selectedStyles.includes(style)}
                    onPress={() => handleStyleSelect(style)}
                    variant={
                      selectedStyles.includes(style) ? "accent" : "default"
                    }
                    size="medium"
                    style={styles.filterTag}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>価格帯</Text>
              <View style={styles.filterTags}>
                {priceRanges.map((range) => (
                  <Tag
                    key={range}
                    label={range}
                    selected={selectedPriceRange === range}
                    onPress={() =>
                      setSelectedPriceRange(
                        selectedPriceRange === range ? "" : range,
                      )
                    }
                    variant={
                      selectedPriceRange === range ? "success" : "default"
                    }
                    size="medium"
                    style={styles.filterTag}
                  />
                ))}
              </View>
            </View>

            <Button
              title="この条件で検索"
              onPress={handleFilterSearch}
              loading={isSearching}
              variant="primary"
              size="large"
              fullWidth
              style={styles.filterSearchButton}
            />
          </View>
        )}

        {/* Search Results */}
        {renderSearchResults()}
      </ScrollView>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="info"
        position="top"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    alignItems: "center",
  },
  title: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
  },

  // Mode Selector
  modeSelector: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginHorizontal: DesignTokens.spacing[6],
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[1],
  },
  modeButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.lg,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: DesignTokens.colors.primary[500],
  },
  modeButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.dark.text.secondary,
  },
  modeButtonTextActive: {
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },

  // Text Search
  textSearchContainer: {
    flexDirection: "row",
    gap: DesignTokens.spacing[3],
    alignItems: "flex-end",
  },
  searchInput: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },
  searchButton: {
    paddingHorizontal: DesignTokens.spacing[6],
  },

  // Image Search
  imageSearchContainer: {
    alignItems: "center",
  },
  uploadArea: {
    width: "100%",
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius["2xl"],
    padding: DesignTokens.spacing[8],
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: DesignTokens.colors.dark.border,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: DesignTokens.spacing[4],
  },
  uploadTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  uploadSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[6],
    lineHeight: 20,
  },
  uploadButton: {
    paddingHorizontal: DesignTokens.spacing[8],
  },

  // Filter Search
  filterSection: {
    marginBottom: DesignTokens.spacing[6],
  },
  filterTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  filterTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[2],
  },
  filterTag: {
    marginBottom: DesignTokens.spacing[2],
  },
  filterSearchButton: {
    marginTop: DesignTokens.spacing[4],
  },

  // Results Section
  resultsSection: {
    paddingHorizontal: DesignTokens.spacing[6],
  },
  resultsHeader: {
    marginBottom: DesignTokens.spacing[4],
  },
  resultsTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  resultRow: {
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[4],
  },
});

export default SearchScreen;
