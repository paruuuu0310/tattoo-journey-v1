import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ArtistScoreService, {
  ArtistScoreMetrics,
  ArtistRankingInfo,
} from "../../services/ArtistScoreService";

interface Props {
  route: {
    params?: {
      artistId?: string;
    };
  };
  navigation: any;
}

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor = "#333",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute" }}>
        <circle
          stroke={backgroundColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <View style={styles.progressRingCenter}>
        <Text style={styles.progressRingText}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
};

const ArtistScoreDashboard: React.FC<Props> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { artistId } = route.params || {};
  const targetArtistId = artistId || userProfile?.uid;

  const [scoreMetrics, setScoreMetrics] = useState<ArtistScoreMetrics | null>(
    null,
  );
  const [rankingInfo, setRankingInfo] = useState<ArtistRankingInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isOwner = userProfile?.uid === targetArtistId;

  useEffect(() => {
    if (targetArtistId) {
      loadScoreData();
    }
  }, [targetArtistId]);

  const loadScoreData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [metrics, ranking] = await Promise.all([
        ArtistScoreService.getCurrentScore(targetArtistId!),
        ArtistScoreService.getArtistRanking(targetArtistId!),
      ]);

      setScoreMetrics(metrics);
      setRankingInfo(ranking);
    } catch (error) {
      console.error("Error loading score data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    if (!targetArtistId) return;

    setRefreshing(true);
    try {
      // スコア更新を実行
      await ArtistScoreService.updateArtistScore(
        targetArtistId,
        "manual_update",
      );
      // データを再読み込み
      await loadScoreData();
    } catch (error) {
      console.error("Error refreshing score:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return "#4ade80"; // 緑
    if (score >= 4.0) return "#22d3ee"; // 青
    if (score >= 3.5) return "#facc15"; // 黄
    if (score >= 3.0) return "#fb923c"; // オレンジ
    return "#ef4444"; // 赤
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return "エクセレント";
    if (score >= 4.0) return "とても良い";
    if (score >= 3.5) return "良い";
    if (score >= 3.0) return "普通";
    return "改善が必要";
  };

  const formatRank = (rank: number, total: number): string => {
    if (rank === 0) return "ランク外";
    return `${rank}位 / ${total}人中`;
  };

  const formatResponseTime = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}分`;
    if (hours < 24) return `${Math.round(hours)}時間`;
    return `${Math.round(hours / 24)}日`;
  };

  if (isLoading && !scoreMetrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>スコアデータを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scoreMetrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>スコアダッシュボード</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>📊 スコアデータなし</Text>
          <Text style={styles.emptyStateText}>
            まだレビューが投稿されていないため、{"\n"}
            スコアデータが利用できません。
          </Text>
          {isOwner && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>スコア更新</Text>
            </TouchableOpacity>
          )}
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
        <Text style={styles.title}>スコアダッシュボード</Text>
        {isOwner && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 総合評価 */}
        <View style={styles.overallScoreCard}>
          <Text style={styles.cardTitle}>総合評価</Text>
          <View style={styles.overallScoreContainer}>
            <View style={styles.scoreDisplay}>
              <Text
                style={[
                  styles.overallScore,
                  { color: getScoreColor(scoreMetrics.overallRating) },
                ]}
              >
                {scoreMetrics.overallRating.toFixed(1)}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Text
                    key={i}
                    style={[
                      styles.star,
                      {
                        color:
                          i <= scoreMetrics.overallRating
                            ? getScoreColor(scoreMetrics.overallRating)
                            : "#333",
                      },
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.scoreLabel}>
                {getScoreLabel(scoreMetrics.overallRating)}
              </Text>
              <Text style={styles.reviewCount}>
                {scoreMetrics.totalReviews}件のレビューから算出
              </Text>
            </View>

            {rankingInfo && (
              <View style={styles.rankingInfo}>
                <Text style={styles.rankLabel}>総合ランキング</Text>
                <Text style={styles.rankValue}>
                  {formatRank(
                    rankingInfo.overallRank,
                    rankingInfo.totalArtists,
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* カテゴリー別評価 */}
        <View style={styles.categoryScoresCard}>
          <Text style={styles.cardTitle}>カテゴリー別評価</Text>
          <View style={styles.categoriesGrid}>
            {Object.entries(scoreMetrics.categoryScores).map(
              ([category, score]) => {
                const label =
                  {
                    technical: "技術力",
                    communication: "コミュニケーション",
                    cleanliness: "清潔感",
                    atmosphere: "雰囲気",
                    value: "コストパフォーマンス",
                  }[category] || category;

                const rank =
                  rankingInfo?.categoryRanks[
                    category as keyof typeof rankingInfo.categoryRanks
                  ] || 0;

                return (
                  <View key={category} style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>{label}</Text>
                    <Text
                      style={[
                        styles.categoryScore,
                        { color: getScoreColor(score) },
                      ]}
                    >
                      {score.toFixed(1)}
                    </Text>
                    <View style={styles.categoryStars}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Text
                          key={i}
                          style={[
                            styles.categoryStarSmall,
                            {
                              color: i <= score ? getScoreColor(score) : "#333",
                            },
                          ]}
                        >
                          ★
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.categoryRank}>
                      {rank > 0 ? `${rank}位` : "-"}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* パフォーマンスメトリクス */}
        <View style={styles.performanceCard}>
          <Text style={styles.cardTitle}>パフォーマンス指標</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>レスポンシブ性</Text>
              <Text style={styles.metricValue}>
                {Math.round(scoreMetrics.responsiveness * 100)}%
              </Text>
              <Text style={styles.metricDescription}>レビューへの返信率</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>返信速度</Text>
              <Text style={styles.metricValue}>
                {formatResponseTime(scoreMetrics.responseTime)}
              </Text>
              <Text style={styles.metricDescription}>平均返信時間</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>完了率</Text>
              <Text style={styles.metricValue}>
                {Math.round(scoreMetrics.completionRate * 100)}%
              </Text>
              <Text style={styles.metricDescription}>予約完了率</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>リピート率</Text>
              <Text style={styles.metricValue}>
                {Math.round(scoreMetrics.repeatCustomerRate * 100)}%
              </Text>
              <Text style={styles.metricDescription}>リピーター率</Text>
            </View>
          </View>
        </View>

        {/* スコア履歴 */}
        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>スコア履歴</Text>
          {scoreMetrics.scoreHistory.length > 0 ? (
            <View style={styles.historyList}>
              {scoreMetrics.scoreHistory.slice(0, 10).map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>
                      {entry.date.toLocaleDateString("ja-JP")}
                    </Text>
                    <Text style={styles.historyTrigger}>
                      {entry.trigger === "review_added" && "📝 レビュー追加"}
                      {entry.trigger === "review_updated" && "✏️ レビュー更新"}
                      {entry.trigger === "booking_completed" && "✅ 予約完了"}
                      {entry.trigger === "manual_update" && "🔄 手動更新"}
                    </Text>
                  </View>
                  <View style={styles.historyScore}>
                    <Text
                      style={[
                        styles.historyScoreValue,
                        { color: getScoreColor(entry.score) },
                      ]}
                    >
                      {entry.score.toFixed(1)}
                    </Text>
                    <Text style={styles.historyReviewCount}>
                      ({entry.reviewCount}件)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noHistoryText}>履歴データがありません</Text>
          )}
        </View>

        {/* 改善提案 */}
        {isOwner && (
          <View style={styles.improvementCard}>
            <Text style={styles.cardTitle}>💡 改善提案</Text>
            <View style={styles.improvementList}>
              {scoreMetrics.responsiveness < 0.8 && (
                <Text style={styles.improvementItem}>
                  • レビューへの返信率を上げることでスコアが向上します
                </Text>
              )}
              {scoreMetrics.responseTime > 48 && (
                <Text style={styles.improvementItem}>
                  • レビューへの返信速度を上げることでスコアが向上します
                </Text>
              )}
              {scoreMetrics.completionRate < 0.9 && (
                <Text style={styles.improvementItem}>
                  • 予約完了率を上げることでスコアが向上します
                </Text>
              )}
              {Object.values(scoreMetrics.categoryScores).some(
                (score) => score < 4.0,
              ) && (
                <Text style={styles.improvementItem}>
                  • カテゴリー別評価の低い項目を重点的に改善しましょう
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            最終更新: {scoreMetrics.lastUpdated.toLocaleString("ja-JP")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  refreshButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#aaa",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  overallScoreCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  overallScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreDisplay: {
    alignItems: "center",
    flex: 1,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#aaa",
  },
  rankingInfo: {
    alignItems: "center",
  },
  rankLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 4,
  },
  rankValue: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  categoryScoresCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 64) / 2 - 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
    textAlign: "center",
  },
  categoryScore: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoryStars: {
    flexDirection: "row",
    marginBottom: 4,
  },
  categoryStarSmall: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  categoryRank: {
    fontSize: 10,
    color: "#aaa",
  },
  performanceCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 64) / 2 - 6,
  },
  metricLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 10,
    color: "#aaa",
    textAlign: "center",
  },
  historyCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 2,
  },
  historyTrigger: {
    fontSize: 14,
    color: "#fff",
  },
  historyScore: {
    alignItems: "center",
  },
  historyScoreValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyReviewCount: {
    fontSize: 10,
    color: "#aaa",
  },
  noHistoryText: {
    color: "#aaa",
    textAlign: "center",
    paddingVertical: 20,
  },
  improvementCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  improvementList: {
    gap: 8,
  },
  improvementItem: {
    color: "#facc15",
    fontSize: 14,
    lineHeight: 20,
  },
  lastUpdated: {
    paddingVertical: 20,
    alignItems: "center",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#666",
  },
  progressRingCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ArtistScoreDashboard;
