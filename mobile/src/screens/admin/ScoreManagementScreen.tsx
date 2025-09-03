import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ArtistScoreService from "../../services/ArtistScoreService";

interface Props {
  navigation: any;
}

const ScoreManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [isUpdatingAll, setIsUpdatingAll] = useState<boolean>(false);
  const [lastBulkUpdate, setLastBulkUpdate] = useState<Date | null>(null);

  // 管理者権限チェック（実際の実装では適切な権限管理を行う）
  const isAdmin =
    userProfile?.email?.includes("admin") || userProfile?.userType === "admin";

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>スコア管理</Text>
        </View>

        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedIcon}>🚫</Text>
          <Text style={styles.unauthorizedTitle}>アクセス権限がありません</Text>
          <Text style={styles.unauthorizedText}>
            このページは管理者のみアクセスできます
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBulkUpdate = async (): Promise<void> => {
    Alert.alert(
      "一括スコア更新",
      "すべてのアーティストのスコアを更新します。\n処理に時間がかかる場合があります。\n続行しますか？",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "実行",
          style: "destructive",
          onPress: async () => {
            setIsUpdatingAll(true);
            try {
              await ArtistScoreService.updateAllArtistScores();
              setLastBulkUpdate(new Date());
              Alert.alert(
                "更新完了",
                "すべてのアーティストのスコアが正常に更新されました。",
              );
            } catch (error) {
              console.error("Bulk update error:", error);
              Alert.alert(
                "エラー",
                "一括更新中にエラーが発生しました。\n一部のスコアが更新されていない可能性があります。",
              );
            } finally {
              setIsUpdatingAll(false);
            }
          },
        },
      ],
    );
  };

  const handleViewMetrics = (): void => {
    // Future implementation: System-wide metrics dashboard
    Alert.alert("Coming Soon", "システムメトリクス画面は開発中です");
  };

  const handleExportData = (): void => {
    // Future implementation: Score data export functionality
    Alert.alert("Coming Soon", "データエクスポート機能は開発中です");
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
        <Text style={styles.title}>スコア管理</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 一括更新セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 一括スコア更新</Text>
          <Text style={styles.sectionDescription}>
            すべてのアーティストのスコアを最新のデータで再計算します
          </Text>

          <TouchableOpacity
            style={[
              styles.bulkUpdateButton,
              isUpdatingAll && styles.disabledButton,
            ]}
            onPress={handleBulkUpdate}
            disabled={isUpdatingAll}
          >
            {isUpdatingAll ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>更新中...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🔄 すべてのスコアを更新</Text>
            )}
          </TouchableOpacity>

          {lastBulkUpdate && (
            <Text style={styles.lastUpdateText}>
              最終一括更新: {lastBulkUpdate.toLocaleString("ja-JP")}
            </Text>
          )}
        </View>

        {/* スコア統計セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 システムメトリクス</Text>
          <Text style={styles.sectionDescription}>
            システム全体のスコア分布と統計情報を確認できます
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewMetrics}
          >
            <Text style={styles.actionButtonText}>📊 メトリクスを表示</Text>
          </TouchableOpacity>
        </View>

        {/* データエクスポートセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 データエクスポート</Text>
          <Text style={styles.sectionDescription}>
            アーティストスコアデータをCSV形式でエクスポートできます
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Text style={styles.actionButtonText}>📁 データをエクスポート</Text>
          </TouchableOpacity>
        </View>

        {/* 自動更新設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 自動更新設定</Text>
          <Text style={styles.sectionDescription}>
            スコアの自動更新に関する設定と動作状況
          </Text>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>レビュー投稿時</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.statusActive}>有効</Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>レビュー更新時</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.statusActive}>有効</Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>予約完了時</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.statusActive}>有効</Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>定期バッチ処理</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.statusInactive}>未実装</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 注意事項 */}
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ 重要な注意事項</Text>
          <Text style={styles.warningText}>
            • 一括更新は処理に時間がかかります{"\n"}•
            更新中はアプリの動作が重くなる可能性があります{"\n"}•
            定期的な更新により最新の状態が保たれます{"\n"}•
            エラーが発生した場合はログを確認してください
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
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unauthorizedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  unauthorizedText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
    marginBottom: 16,
  },
  bulkUpdateButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: "#fff",
  },
  settingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusInactive: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "bold",
  },
  warningSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: "#facc15",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#facc15",
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
  },
});

export default ScoreManagementScreen;
