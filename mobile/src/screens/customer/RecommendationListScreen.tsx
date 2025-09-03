import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import firestore from "@react-native-firebase/firestore";
import MatchingService, {
  ArtistMatch,
  MatchingCriteria,
} from "../../services/MatchingService";
import { AIAnalysisResult } from "../../types";

interface RecommendationHistory {
  id: string;
  criteria: MatchingCriteria;
  matchCount: number;
  topMatches: Array<{
    artistId: string;
    matchScore: number;
    breakdown: {
      designScore: number;
      artistScore: number;
      priceScore: number;
      distanceScore: number;
    };
  }>;
  createdAt: Date;
}

const RecommendationListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { userProfile } = useAuth();
  const [recommendationHistory, setRecommendationHistory] = useState<
    RecommendationHistory[]
  >([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<
    ArtistMatch[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHistory, setSelectedHistory] =
    useState<RecommendationHistory | null>(null);
  const [detailMatches, setDetailMatches] = useState<ArtistMatch[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadRecommendationHistory();
    loadCurrentRecommendations();
  }, []);

  const loadRecommendationHistory = async () => {
    if (!userProfile?.uid) return;

    try {
      const historySnapshot = await firestore()
        .collection("matchingHistory")
        .where("customerId", "==", userProfile.uid)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const history = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as RecommendationHistory[];

      setRecommendationHistory(history);
    } catch (error) {
      console.error("Error loading recommendation history:", error);
    }
  };

  const loadCurrentRecommendations = async () => {
    try {
      // 最新のマッチング結果を取得
      const latestHistory = recommendationHistory[0];
      if (latestHistory && latestHistory.topMatches.length > 0) {
        // 詳細なマッチング情報を再取得
        const detailedMatches = await Promise.all(
          latestHistory.topMatches.map(async (match) => {
            const artistDoc = await firestore()
              .collection("users")
              .doc(match.artistId)
              .get();

            if (artistDoc.exists) {
              const artistData = { uid: artistDoc.id, ...artistDoc.data() };
              return {
                artist: artistData,
                matchScore: match.matchScore,
                breakdown: match.breakdown,
                compatibility: 0.8, // 仮の値
                distance: 5, // 仮の値
                estimatedPrice: 25000, // 仮の値
                topPortfolioMatches: [],
                matchReasons: ["高い技術力", "予算に適合"],
              } as ArtistMatch;
            }
            return null;
          }),
        );

        const validMatches = detailedMatches.filter(
          (match) => match !== null,
        ) as ArtistMatch[];
        setCurrentRecommendations(validMatches);
      }
    } catch (error) {
      console.error("Error loading current recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadRecommendationHistory(),
      loadCurrentRecommendations(),
    ]);
    setIsRefreshing(false);
  };

  const viewHistoryDetails = async (history: RecommendationHistory) => {
    setSelectedHistory(history);
    setIsLoading(true);

    try {
      // 履歴の詳細なマッチング情報を取得
      const detailedMatches = await Promise.all(
        history.topMatches.map(async (match) => {
          const artistDoc = await firestore()
            .collection("users")
            .doc(match.artistId)
            .get();

          if (artistDoc.exists) {
            const artistData = { uid: artistDoc.id, ...artistDoc.data() };
            return {
              artist: artistData,
              matchScore: match.matchScore,
              breakdown: match.breakdown,
              compatibility: 0.8,
              distance: 5,
              estimatedPrice: 25000,
              topPortfolioMatches: [],
              matchReasons: ["履歴データから復元"],
            } as ArtistMatch;
          }
          return null;
        }),
      );

      const validMatches = detailedMatches.filter(
        (match) => match !== null,
      ) as ArtistMatch[];
      setDetailMatches(validMatches);
      setShowHistoryModal(true);
    } catch (error) {
      Alert.alert("エラー", "履歴の詳細取得に失敗しました");
      console.error("Error loading history details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 0.8) return "#4ade80"; // green
    if (score >= 0.6) return "#facc15"; // yellow
    if (score >= 0.4) return "#fb923c"; // orange
    return "#ef4444"; // red
  };

  const getMatchScoreText = (score: number): string => {
    if (score >= 0.9) return "非常に高い";
    if (score >= 0.8) return "高い";
    if (score >= 0.6) return "良好";
    if (score >= 0.4) return "中程度";
    return "低い";
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "今日";
    if (diffDays === 2) return "昨日";
    if (diffDays <= 7) return `${diffDays - 1}日前`;

    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  const renderRecommendationCard = ({ item }: { item: ArtistMatch }) => {
    const artistInfo = item.artist.profile?.artistInfo;
    const matchScoreColor = getMatchScoreColor(item.matchScore);

    return (
      <TouchableOpacity
        style={styles.recommendationCard}
        onPress={() => {
          navigation.navigate("ArtistProfile", { artistId: item.artist.uid });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.artistBasicInfo}>
            <Text style={styles.artistName}>
              {item.artist.profile?.firstName} {item.artist.profile?.lastName}
            </Text>
            <Text style={styles.studioName}>
              {artistInfo?.studioName || "個人アーティスト"}
            </Text>
            <Text style={styles.distance}>📍 {item.distance.toFixed(1)}km</Text>
          </View>

          <View style={styles.matchBadgeContainer}>
            <View
              style={[styles.matchBadge, { backgroundColor: matchScoreColor }]}
            >
              <Text style={styles.matchBadgeText}>
                {Math.round(item.matchScore * 100)}%
              </Text>
            </View>
            <Text style={[styles.matchQuality, { color: matchScoreColor }]}>
              {getMatchScoreText(item.matchScore)}
            </Text>
          </View>
        </View>

        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>デザイン</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${item.breakdown.designScore * 100}%`,
                    backgroundColor: getMatchScoreColor(
                      item.breakdown.designScore,
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreValue}>
              {Math.round(item.breakdown.designScore * 100)}%
            </Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>技術力</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${item.breakdown.artistScore * 100}%`,
                    backgroundColor: getMatchScoreColor(
                      item.breakdown.artistScore,
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreValue}>
              {Math.round(item.breakdown.artistScore * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.estimatedPrice}>
            見積もり: ¥{item.estimatedPrice?.toLocaleString() || "要相談"}
          </Text>
          <Text style={styles.rating}>
            ⭐ {artistInfo?.rating?.toFixed(1) || "未評価"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            navigation.navigate("Chat", { artistId: item.artist.uid });
          }}
        >
          <Text style={styles.contactButtonText}>問い合わせ</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: RecommendationHistory }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => viewHistoryDetails(item)}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.matchCount}>{item.matchCount}人マッチ</Text>
      </View>

      <View style={styles.historyContent}>
        <Text style={styles.historyStyle}>
          スタイル: {item.criteria.customerAnalysis.style}
        </Text>
        <Text style={styles.historyBudget}>
          予算: ¥{item.criteria.budgetRange.min.toLocaleString()} - ¥
          {item.criteria.budgetRange.max.toLocaleString()}
        </Text>
      </View>

      <View style={styles.topMatchesPreview}>
        {item.topMatches.slice(0, 3).map((match, index) => (
          <View key={index} style={styles.miniMatchCard}>
            <View
              style={[
                styles.miniMatchBadge,
                { backgroundColor: getMatchScoreColor(match.matchScore) },
              ]}
            >
              <Text style={styles.miniMatchText}>
                {Math.round(match.matchScore * 100)}%
              </Text>
            </View>
          </View>
        ))}
        {item.topMatches.length > 3 && (
          <Text style={styles.moreMatchesText}>
            +{item.topMatches.length - 3}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && recommendationHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>レコメンド履歴を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>レコメンド一覧</Text>
        <TouchableOpacity
          style={styles.newSearchButton}
          onPress={() => navigation.navigate("ImageUpload")}
        >
          <Text style={styles.newSearchButtonText}>新規検索</Text>
        </TouchableOpacity>
      </View>

      {currentRecommendations.length > 0 && (
        <View style={styles.currentSection}>
          <Text style={styles.sectionTitle}>最新のレコメンド</Text>
          <FlatList
            data={currentRecommendations.slice(0, 3)}
            renderItem={renderRecommendationCard}
            keyExtractor={(item) => item.artist.uid}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.currentRecommendations}
          />
          {currentRecommendations.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                navigation.navigate("MatchingResults", {
                  matches: currentRecommendations,
                });
              }}
            >
              <Text style={styles.viewAllButtonText}>
                すべて表示 ({currentRecommendations.length}件)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>検索履歴</Text>
        {recommendationHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>まだ検索履歴がありません</Text>
            <Text style={styles.emptyStateSubtext}>
              画像をアップロードしてアーティストを検索してみましょう
            </Text>
            <TouchableOpacity
              style={styles.startSearchButton}
              onPress={() => navigation.navigate("ImageUpload")}
            >
              <Text style={styles.startSearchButtonText}>検索を開始</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recommendationHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.historyList}
            refreshing={isRefreshing}
            onRefresh={refreshRecommendations}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* 履歴詳細モーダル */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedHistory ? formatDate(selectedHistory.createdAt) : ""}
              の検索結果
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {detailMatches.map((match, index) => (
              <View key={index} style={styles.modalMatchCard}>
                {renderRecommendationCard({ item: match })}
              </View>
            ))}
          </ScrollView>
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
  newSearchButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newSearchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  currentSection: {
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  currentRecommendations: {
    paddingLeft: 20,
  },
  viewAllButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
  },
  viewAllButtonText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600",
  },
  historySection: {
    flex: 1,
    paddingTop: 20,
  },
  historyList: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },
  startSearchButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startSearchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  recommendationCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 280,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  artistBasicInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  studioName: {
    fontSize: 12,
    color: "#ff6b6b",
    marginBottom: 4,
  },
  distance: {
    fontSize: 11,
    color: "#aaa",
  },
  matchBadgeContainer: {
    alignItems: "center",
  },
  matchBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  matchQuality: {
    fontSize: 10,
    fontWeight: "600",
  },
  scoreBreakdown: {
    marginBottom: 12,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#aaa",
    width: 50,
  },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginHorizontal: 8,
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  scoreValue: {
    fontSize: 10,
    color: "#fff",
    width: 30,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  estimatedPrice: {
    fontSize: 12,
    color: "#4ade80",
    fontWeight: "600",
  },
  rating: {
    fontSize: 12,
    color: "#ccc",
  },
  contactButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  historyCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  matchCount: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "600",
  },
  historyContent: {
    marginBottom: 12,
  },
  historyStyle: {
    fontSize: 12,
    color: "#ccc",
    marginBottom: 4,
  },
  historyBudget: {
    fontSize: 12,
    color: "#4ade80",
  },
  topMatchesPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniMatchCard: {
    marginRight: 8,
  },
  miniMatchBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniMatchText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  moreMatchesText: {
    fontSize: 10,
    color: "#888",
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
  modalMatchCard: {
    marginBottom: 16,
  },
});

export default RecommendationListScreen;
