import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import MatchingService, {
  ArtistMatch,
  MatchingCriteria,
} from "../../services/MatchingService";
import { AIAnalysisResult } from "../../types";

interface Props {
  route: {
    params: {
      customerAnalysis: AIAnalysisResult;
      matchingCriteria: MatchingCriteria;
    };
  };
  navigation: any;
}

const MatchingResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { customerAnalysis, matchingCriteria } = route.params;

  const [matches, setMatches] = useState<ArtistMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<ArtistMatch | null>(null);

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    setIsLoading(true);
    try {
      const results =
        await MatchingService.findMatchingArtists(matchingCriteria);
      setMatches(results);

      // マッチング履歴を保存
      if (userProfile?.uid) {
        await MatchingService.saveMatchingHistory(
          userProfile.uid,
          matchingCriteria,
          results,
        );
      }
    } catch (error) {
      Alert.alert("エラー", "マッチング検索に失敗しました");
      console.error("Matching error:", error);
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

  const renderScoreBreakdown = (breakdown: ArtistMatch["breakdown"]) => (
    <View style={styles.scoreBreakdown}>
      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>デザイン</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${breakdown.designScore * 100}%`,
                backgroundColor: getMatchScoreColor(breakdown.designScore),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>
          {Math.round(breakdown.designScore * 100)}%
        </Text>
      </View>

      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>アーティスト</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${breakdown.artistScore * 100}%`,
                backgroundColor: getMatchScoreColor(breakdown.artistScore),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>
          {Math.round(breakdown.artistScore * 100)}%
        </Text>
      </View>

      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>料金</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${breakdown.priceScore * 100}%`,
                backgroundColor: getMatchScoreColor(breakdown.priceScore),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>
          {Math.round(breakdown.priceScore * 100)}%
        </Text>
      </View>

      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>距離</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${breakdown.distanceScore * 100}%`,
                backgroundColor: getMatchScoreColor(breakdown.distanceScore),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>
          {Math.round(breakdown.distanceScore * 100)}%
        </Text>
      </View>
    </View>
  );

  const renderPortfolioPreview = (portfolioItems: any[]) => (
    <ScrollView
      horizontal
      style={styles.portfolioPreview}
      showsHorizontalScrollIndicator={false}
    >
      {portfolioItems.map((item, index) => (
        <Image
          key={index}
          source={{ uri: item.imageUrl }}
          style={styles.portfolioPreviewImage}
        />
      ))}
    </ScrollView>
  );

  const renderMatchCard = ({ item }: { item: ArtistMatch }) => {
    const artistInfo = item.artist.profile?.artistInfo;
    const matchScoreColor = getMatchScoreColor(item.matchScore);

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => setSelectedMatch(item)}
      >
        <View style={styles.matchHeader}>
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>
              {item.artist.profile?.firstName} {item.artist.profile?.lastName}
            </Text>
            <Text style={styles.studioName}>
              {artistInfo?.studioName || "個人アーティスト"}
            </Text>
            <Text style={styles.location}>
              📍 {item.artist.profile?.location?.city} (
              {item.distance.toFixed(1)}km)
            </Text>
          </View>

          <View style={styles.matchScoreContainer}>
            <View
              style={[
                styles.matchScoreBadge,
                { backgroundColor: matchScoreColor },
              ]}
            >
              <Text style={styles.matchScoreText}>
                {Math.round(item.matchScore * 100)}%
              </Text>
            </View>
            <Text style={[styles.matchQuality, { color: matchScoreColor }]}>
              {getMatchScoreText(item.matchScore)}
            </Text>
          </View>
        </View>

        <View style={styles.artistDetails}>
          <Text style={styles.experience}>
            経験年数: {artistInfo?.experienceYears || 0}年
          </Text>
          <Text style={styles.rating}>
            ⭐ {artistInfo?.rating?.toFixed(1) || "未評価"}(
            {artistInfo?.totalReviews || 0}件のレビュー)
          </Text>
          <Text style={styles.estimatedPrice}>
            見積もり料金: ¥{item.estimatedPrice?.toLocaleString() || "要相談"}
          </Text>
        </View>

        {item.matchReasons.length > 0 && (
          <View style={styles.matchReasons}>
            {item.matchReasons.map((reason, index) => (
              <Text key={index} style={styles.matchReason}>
                • {reason}
              </Text>
            ))}
          </View>
        )}

        {item.topPortfolioMatches.length > 0 && (
          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioLabel}>関連作品</Text>
            {renderPortfolioPreview(item.topPortfolioMatches)}
          </View>
        )}

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            // メッセージ送信画面に遷移
            navigation.navigate("Chat", { artistId: item.artist.uid });
          }}
        >
          <Text style={styles.contactButtonText}>問い合わせする</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>最適なアーティストを検索中...</Text>
          <Text style={styles.loadingSubtext}>
            AI分析に基づいてマッチングを行っています
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>マッチング結果</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>検索結果</Text>
        <Text style={styles.summaryText}>
          {matches.length}人のアーティストが見つかりました
        </Text>
        <Text style={styles.analysisInfo}>
          検出スタイル: {customerAnalysis.style} • 複雑さ:{" "}
          {customerAnalysis.complexity} • 信頼度:{" "}
          {Math.round(customerAnalysis.confidence * 100)}%
        </Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            マッチするアーティストが見つかりませんでした
          </Text>
          <Text style={styles.emptyStateSubtext}>
            検索条件を変更して再度お試しください
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>検索条件を変更</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatchCard}
          keyExtractor={(item) => item.artist.uid}
          style={styles.matchesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 詳細モーダル */}
      {selectedMatch && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>詳細スコア</Text>
                <TouchableOpacity
                  style={styles.closeModal}
                  onPress={() => setSelectedMatch(null)}
                >
                  <Text style={styles.closeModalText}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalArtistName}>
                {selectedMatch.artist.profile?.firstName}{" "}
                {selectedMatch.artist.profile?.lastName}
              </Text>

              <View style={styles.totalScore}>
                <Text style={styles.totalScoreLabel}>総合マッチ度</Text>
                <Text
                  style={[
                    styles.totalScoreValue,
                    { color: getMatchScoreColor(selectedMatch.matchScore) },
                  ]}
                >
                  {Math.round(selectedMatch.matchScore * 100)}%
                </Text>
              </View>

              <Text style={styles.breakdownTitle}>詳細スコア内訳</Text>
              {renderScoreBreakdown(selectedMatch.breakdown)}

              <View style={styles.compatibilitySection}>
                <Text style={styles.compatibilityTitle}>
                  ポートフォリオ互換性
                </Text>
                <Text style={styles.compatibilityValue}>
                  {Math.round(selectedMatch.compatibility * 100)}%
                </Text>
              </View>

              {selectedMatch.matchReasons.length > 0 && (
                <View style={styles.reasonsSection}>
                  <Text style={styles.reasonsTitle}>マッチング理由</Text>
                  {selectedMatch.matchReasons.map((reason, index) => (
                    <Text key={index} style={styles.detailedReason}>
                      {index + 1}. {reason}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
    padding: 20,
    paddingBottom: 10,
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#2a2a2a",
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
  },
  analysisInfo: {
    fontSize: 14,
    color: "#aaa",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  matchesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  studioName: {
    fontSize: 14,
    color: "#ff6b6b",
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: "#aaa",
  },
  matchScoreContainer: {
    alignItems: "center",
  },
  matchScoreBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  matchScoreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  matchQuality: {
    fontSize: 12,
    fontWeight: "600",
  },
  artistDetails: {
    marginBottom: 12,
  },
  experience: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 2,
  },
  rating: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 2,
  },
  estimatedPrice: {
    fontSize: 14,
    color: "#4ade80",
    fontWeight: "600",
  },
  matchReasons: {
    marginBottom: 16,
  },
  matchReason: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 2,
  },
  portfolioSection: {
    marginBottom: 16,
  },
  portfolioLabel: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  portfolioPreview: {
    marginBottom: 8,
  },
  portfolioPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#333",
  },
  contactButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalArtistName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 16,
    textAlign: "center",
  },
  totalScore: {
    alignItems: "center",
    marginBottom: 24,
  },
  totalScoreLabel: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 8,
  },
  totalScoreValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  scoreBreakdown: {
    marginBottom: 20,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#aaa",
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginHorizontal: 12,
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    color: "#fff",
    width: 40,
    textAlign: "right",
  },
  compatibilitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  compatibilityTitle: {
    fontSize: 16,
    color: "#fff",
  },
  compatibilityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ade80",
  },
  reasonsSection: {
    marginBottom: 20,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  detailedReason: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default MatchingResultsScreen;
