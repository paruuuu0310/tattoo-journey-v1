/**
 * 🧠 MAGI REVIEW SYSTEM
 * エヴァンゲリオンMAGI協調システムを適用したレビュー分析・生成画面
 *
 * システム構成:
 * - MELCHIOR: 論理的・統計的分析
 * - BALTHASAR: 感情的・共感的分析
 * - CASPER: 直感的・創造的分析
 *
 * 機能:
 * - リアルタイムMAGI分析表示
 * - 3AI協調による品質評価
 * - インテリジェントな推奨事項
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Button, Avatar, Tag, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockArtists, mockReviews, currentUser } from "../../../mocks/fixtures";
import {
  MAGISystemController,
  MAGIDecision,
  MAGIConsensus,
} from "../../ai/MAGISystem";

interface Props {
  artistId?: string;
  bookingId?: string;
  onBack?: () => void;
  onComplete?: () => void;
}

interface ReviewFormData {
  overallRating: number;
  comment: string;
  photos: string[];
  isAnonymous: boolean;
}

const MAGIReviewScreen: React.FC<Props> = ({
  artistId = "artist-1",
  bookingId = "booking-1",
  onBack,
  onComplete,
}) => {
  const artist = mockArtists.find((a) => a.id === artistId) || mockArtists[0];
  const [magiController] = useState(new MAGISystemController());

  const [formData, setFormData] = useState<ReviewFormData>({
    overallRating: 0,
    comment: "",
    photos: [],
    isAnonymous: false,
  });

  const [magiAnalysis, setMagiAnalysis] = useState<{
    melchior?: MAGIDecision;
    balthasar?: MAGIDecision;
    casper?: MAGIDecision;
    consensus?: MAGIConsensus;
  }>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSystemDetails, setShowSystemDetails] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // アニメーション
  const [systemAnimations] = useState({
    melchior: new Animated.Value(0),
    balthasar: new Animated.Value(0),
    casper: new Animated.Value(0),
  });

  // リアルタイムMAGI分析
  useEffect(() => {
    if (formData.overallRating > 0 && formData.comment.length > 10) {
      performMAGIAnalysis();
    }
  }, [formData.overallRating, formData.comment]);

  const performMAGIAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // モックレビューデータを作成
      const mockReview = {
        id: "temp-review",
        artistId,
        rating: formData.overallRating,
        comment: formData.comment,
        photos: formData.photos,
        isAnonymous: formData.isAnonymous,
        date: new Date().toISOString(),
        isHelpful: false,
      };

      // MAGI分析を並列実行（アニメーション付き）
      animateSystemActivation();

      const [melchiorResult, balthasarResult, casperResult] = await Promise.all(
        [
          magiController["melchior"].processReviewAnalysis(mockReview, {
            artist,
          }),
          magiController["balthasar"].processReviewAnalysis(mockReview, {
            artist,
          }),
          magiController["casper"].processReviewAnalysis(mockReview, {
            artist,
          }),
        ],
      );

      // 合意形成
      const consensus = await magiController.processMAGIDecision({
        type: "review_analysis",
        data: mockReview,
        context: { artist },
        priority: "high",
      });

      setMagiAnalysis({
        melchior: melchiorResult,
        balthasar: balthasarResult,
        casper: casperResult,
        consensus,
      });
    } catch (error) {
      console.error("MAGI Analysis Error:", error);
      setToastMessage("AI分析に失敗しました");
      setShowToast(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const animateSystemActivation = () => {
    // 3システムの順次アクティベーション
    Animated.sequence([
      Animated.timing(systemAnimations.melchior, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(systemAnimations.balthasar, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(systemAnimations.casper, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void,
  ) => (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress(star)}
          style={styles.starButton}
        >
          <Text
            style={[
              styles.starText,
              {
                color:
                  star <= rating
                    ? DesignTokens.colors.accent.gold
                    : DesignTokens.colors.dark.text.tertiary,
              },
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMAGISystemCard = (
    systemName: "MELCHIOR" | "BALTHASAR" | "CASPER",
    decision?: MAGIDecision,
    animation?: Animated.Value,
  ) => {
    const systemInfo = {
      MELCHIOR: {
        name: "メルキオール",
        role: "論理分析",
        icon: "🧮",
        color: DesignTokens.colors.info,
        description: "統計・データ分析",
      },
      BALTHASAR: {
        name: "バルタザール",
        role: "感情分析",
        icon: "💝",
        color: DesignTokens.colors.primary[500],
        description: "共感・感情理解",
      },
      CASPER: {
        name: "カスパー",
        role: "直感判断",
        icon: "⚡",
        color: DesignTokens.colors.accent.electric,
        description: "パターン・創造性",
      },
    };

    const info = systemInfo[systemName];
    const isActive = decision && decision.confidence > 0;

    return (
      <Animated.View
        style={[
          styles.magiSystemCard,
          {
            opacity: animation || 1,
            borderColor: isActive
              ? info.color
              : DesignTokens.colors.dark.border,
            backgroundColor: isActive
              ? info.color + "10"
              : DesignTokens.colors.dark.surface,
          },
        ]}
      >
        <View style={styles.systemHeader}>
          <Text style={styles.systemIcon}>{info.icon}</Text>
          <View style={styles.systemInfo}>
            <Text style={styles.systemName}>{info.name}</Text>
            <Text style={styles.systemRole}>{info.description}</Text>
          </View>
          {isActive && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceValue}>
                {Math.round((decision?.confidence || 0) * 100)}%
              </Text>
              <Text style={styles.confidenceLabel}>信頼度</Text>
            </View>
          )}
        </View>

        {isActive && decision && (
          <View style={styles.systemAnalysis}>
            <Text style={styles.analysisText} numberOfLines={3}>
              {decision.reasoning.trim()}
            </Text>
          </View>
        )}

        {isAnalyzing && !isActive && (
          <View style={styles.systemLoading}>
            <ActivityIndicator size="small" color={info.color} />
            <Text style={styles.loadingText}>分析中...</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderMAGIConsensus = () => {
    if (!magiAnalysis.consensus) return null;

    const consensus = magiAnalysis.consensus;
    const confidenceColor =
      consensus.confidence > 0.8
        ? DesignTokens.colors.success
        : consensus.confidence > 0.6
          ? DesignTokens.colors.warning
          : DesignTokens.colors.error;

    return (
      <View style={styles.consensusCard}>
        <View style={styles.consensusHeader}>
          <Text style={styles.consensusTitle}>🎯 MAGI総合判定</Text>
          <View
            style={[
              styles.consensusBadge,
              { backgroundColor: confidenceColor },
            ]}
          >
            <Text style={styles.consensusConfidence}>
              {Math.round(consensus.confidence * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.consensusContent}>
          <Text style={styles.consensusResult}>
            {consensus.confidence > 0.8 && "✅ 高品質なレビューです"}
            {consensus.confidence > 0.6 &&
              consensus.confidence <= 0.8 &&
              "⚠️ 標準的なレビューです"}
            {consensus.confidence <= 0.6 && "❌ 改善が必要です"}
          </Text>

          <Text style={styles.consensusDetail}>
            参加システム: {consensus.participatingSystems.join(", ")}
          </Text>

          <Text style={styles.processingTime}>
            処理時間: {consensus.metadata.processingTime}ms
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setShowSystemDetails(true)}
        >
          <Text style={styles.detailsButtonText}>詳細分析を見る 📊</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canSubmit =
    formData.overallRating > 0 &&
    formData.comment.length >= 10 &&
    magiAnalysis.consensus &&
    magiAnalysis.consensus.confidence > 0.5;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setToastMessage("🧠 MAGI協調システムによる高品質レビューを投稿しました！");
    setShowToast(true);

    setTimeout(() => {
      onComplete?.();
      onBack?.();
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🧠 MAGI レビューシステム</Text>
          <Text style={styles.headerSubtitle}>3AI協調による高品質レビュー</Text>
        </View>

        <TouchableOpacity
          style={styles.diagnosticsButton}
          onPress={() => setShowSystemDetails(true)}
        >
          <Text style={styles.diagnosticsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Artist Info */}
        <View style={styles.artistCard}>
          <Avatar
            imageUrl={artist.avatar}
            name={artist.name}
            size="large"
            showBadge={artist.isVerified}
          />
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.artistStudio}>{artist.studioName}</Text>
          </View>
        </View>

        {/* Review Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>総合評価</Text>
          {renderStarRating(formData.overallRating, (rating) =>
            setFormData((prev) => ({ ...prev, overallRating: rating })),
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳しい感想</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="体験した感想を詳しくお聞かせください（10文字以上）"
            placeholderTextColor={DesignTokens.colors.dark.text.tertiary}
            value={formData.comment}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, comment: text }))
            }
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {formData.comment.length}/1000文字
          </Text>
        </View>

        {/* MAGI Systems Analysis */}
        <View style={styles.magiSection}>
          <Text style={styles.magiTitle}>🧠 MAGI協調分析システム</Text>
          <Text style={styles.magiDescription}>
            3つの人工知能があなたのレビューを多角的に分析します
          </Text>

          <View style={styles.magiSystems}>
            {renderMAGISystemCard(
              "MELCHIOR",
              magiAnalysis.melchior,
              systemAnimations.melchior,
            )}
            {renderMAGISystemCard(
              "BALTHASAR",
              magiAnalysis.balthasar,
              systemAnimations.balthasar,
            )}
            {renderMAGISystemCard(
              "CASPER",
              magiAnalysis.casper,
              systemAnimations.casper,
            )}
          </View>

          {renderMAGIConsensus()}
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title={isAnalyzing ? "MAGI分析中..." : "MAGIレビューを投稿"}
            onPress={handleSubmit}
            loading={isAnalyzing}
            disabled={!canSubmit}
            variant={canSubmit ? "primary" : "secondary"}
            size="large"
            fullWidth
          />

          {magiAnalysis.consensus && (
            <Text style={styles.submitNote}>
              {magiAnalysis.consensus.confidence > 0.8 &&
                "✅ 高品質レビューとして認定されました"}
              {magiAnalysis.consensus.confidence > 0.6 &&
                magiAnalysis.consensus.confidence <= 0.8 &&
                "⚠️ 追加の詳細があるとより良いレビューになります"}
              {magiAnalysis.consensus.confidence <= 0.6 &&
                "❌ より詳しい感想の追加をおすすめします"}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* System Details Modal */}
      <Modal
        visible={showSystemDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🧠 MAGI システム詳細</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSystemDetails(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* System Diagnostics */}
            <View style={styles.diagnosticsSection}>
              <Text style={styles.diagnosticsTitle}>システム診断</Text>
              {Object.entries(magiController.getSystemDiagnostics())
                .slice(0, 3)
                .map(([system, status]: any) => (
                  <View key={system} style={styles.diagnosticsItem}>
                    <Text style={styles.diagnosticsSystem}>
                      {system.toUpperCase()}
                    </Text>
                    <Text style={styles.diagnosticsStatus}>
                      {status.status === "online" ? "🟢" : "🔴"} {status.status}
                    </Text>
                    <Text style={styles.diagnosticsPersonality}>
                      ({status.personality})
                    </Text>
                  </View>
                ))}
            </View>

            {/* Detailed Analysis */}
            {magiAnalysis.melchior && (
              <View style={styles.detailedAnalysis}>
                <Text style={styles.analysisTitle}>📊 詳細分析結果</Text>

                <View style={styles.systemAnalysisCard}>
                  <Text style={styles.systemAnalysisTitle}>
                    🧮 MELCHIOR (論理分析)
                  </Text>
                  <Text style={styles.systemAnalysisText}>
                    {magiAnalysis.melchior.reasoning}
                  </Text>
                </View>

                {magiAnalysis.balthasar && (
                  <View style={styles.systemAnalysisCard}>
                    <Text style={styles.systemAnalysisTitle}>
                      💝 BALTHASAR (感情分析)
                    </Text>
                    <Text style={styles.systemAnalysisText}>
                      {magiAnalysis.balthasar.reasoning}
                    </Text>
                  </View>
                )}

                {magiAnalysis.casper && (
                  <View style={styles.systemAnalysisCard}>
                    <Text style={styles.systemAnalysisTitle}>
                      ⚡ CASPER (直感分析)
                    </Text>
                    <Text style={styles.systemAnalysisText}>
                      {magiAnalysis.casper.reasoning}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
        position="bottom"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: DesignTokens.spacing[4],
  },
  headerTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.electric,
    marginTop: 2,
  },
  diagnosticsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  diagnosticsIcon: {
    fontSize: 20,
  },

  content: {
    flex: 1,
  },

  // Artist Card
  artistCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[5],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  artistInfo: {
    marginLeft: DesignTokens.spacing[4],
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  artistStudio: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.primary[500],
    marginTop: 2,
  },

  // Form Section
  section: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },

  // Star Rating
  starRating: {
    flexDirection: "row",
    justifyContent: "center",
    gap: DesignTokens.spacing[2],
  },
  starButton: {
    padding: DesignTokens.spacing[2],
  },
  starText: {
    fontSize: 36,
  },

  // Comment Input
  commentInput: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    minHeight: 120,
  },
  characterCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "right",
    marginTop: DesignTokens.spacing[2],
  },

  // MAGI Section
  magiSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent.electric + "30",
    marginHorizontal: DesignTokens.spacing[4],
    borderRadius: DesignTokens.radius["2xl"],
    marginBottom: DesignTokens.spacing[4],
  },
  magiTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  magiDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.electric,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[6],
  },
  magiSystems: {
    gap: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[6],
  },

  // MAGI System Card
  magiSystemCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    borderWidth: 2,
    ...DesignTokens.shadows.sm,
  },
  systemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemIcon: {
    fontSize: 24,
    marginRight: DesignTokens.spacing[3],
  },
  systemInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  systemRole: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  confidenceContainer: {
    alignItems: "center",
  },
  confidenceValue: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
  },
  confidenceLabel: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
  },
  systemAnalysis: {
    marginTop: DesignTokens.spacing[3],
    paddingTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  analysisText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    lineHeight: 18,
  },
  systemLoading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DesignTokens.spacing[3],
    paddingTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  loadingText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginLeft: DesignTokens.spacing[2],
  },

  // Consensus Card
  consensusCard: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent.gold + "50",
    ...DesignTokens.shadows.lg,
  },
  consensusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  consensusTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  consensusBadge: {
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: 4,
  },
  consensusConfidence: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  consensusContent: {
    gap: DesignTokens.spacing[2],
  },
  consensusResult: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.dark.text.primary,
  },
  consensusDetail: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  processingTime: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.tertiary,
  },
  detailsButton: {
    marginTop: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.accent.electric + "20",
    borderRadius: DesignTokens.radius.lg,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.electric,
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Submit Section
  submitSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  submitNote: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    marginTop: DesignTokens.spacing[3],
    lineHeight: 18,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing[6],
  },

  // Diagnostics
  diagnosticsSection: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    marginVertical: DesignTokens.spacing[4],
  },
  diagnosticsTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },
  diagnosticsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[2],
    gap: DesignTokens.spacing[3],
  },
  diagnosticsSystem: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    minWidth: 80,
  },
  diagnosticsStatus: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.success,
  },
  diagnosticsPersonality: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Detailed Analysis
  detailedAnalysis: {
    gap: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[6],
  },
  analysisTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },
  systemAnalysisCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
  },
  systemAnalysisTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  systemAnalysisText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 18,
  },
});

export default MAGIReviewScreen;
