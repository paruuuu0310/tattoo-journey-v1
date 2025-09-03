import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import NotificationService from "../../services/NotificationService";
import firestore from "@react-native-firebase/firestore";
import { DesignTokens } from "../../components/design-system/TattooDesignTokens";

interface Props {
  navigation: any;
}

interface NotificationSettings {
  enabledNotificationTypes: {
    booking_request: boolean;
    booking_confirmed: boolean;
    booking_cancelled: boolean;
    message: boolean;
    review_received: boolean;
    promotion: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  sound: {
    enabled: boolean;
    soundName: string;
  };
  vibration: boolean;
  badge: boolean;
}

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabledNotificationTypes: {
      booking_request: true,
      booking_confirmed: true,
      booking_cancelled: true,
      message: true,
      review_received: true,
      promotion: false,
    },
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
    },
    sound: {
      enabled: true,
      soundName: "default",
    },
    vibration: true,
    badge: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      loadNotificationSettings();
      setFcmToken(NotificationService.getCurrentToken());
    }
  }, [userProfile]);

  const loadNotificationSettings = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const doc = await firestore()
        .collection("userNotificationSettings")
        .doc(userProfile.uid)
        .get();

      if (doc.exists) {
        const data = doc.data();
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      Alert.alert("エラー", "通知設定の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      setSaving(true);
      await firestore()
        .collection("userNotificationSettings")
        .doc(userProfile.uid)
        .set(
          {
            ...settings,
            lastUpdated: new Date(),
          },
          { merge: true },
        );

      Alert.alert("保存完了", "通知設定が保存されました");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert("エラー", "通知設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationType = (
    type: keyof NotificationSettings["enabledNotificationTypes"],
    enabled: boolean,
  ): void => {
    setSettings((prev) => ({
      ...prev,
      enabledNotificationTypes: {
        ...prev.enabledNotificationTypes,
        [type]: enabled,
      },
    }));
  };

  const updateQuietHours = (
    field: keyof NotificationSettings["quietHours"],
    value: any,
  ): void => {
    setSettings((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  const updateSound = (
    field: keyof NotificationSettings["sound"],
    value: any,
  ): void => {
    setSettings((prev) => ({
      ...prev,
      sound: {
        ...prev.sound,
        [field]: value,
      },
    }));
  };

  const testNotification = async (): Promise<void> => {
    if (!userProfile?.uid) return;

    try {
      await NotificationService.sendNotificationToUser(
        userProfile.uid,
        {
          title: "テスト通知",
          body: "通知設定が正常に動作しています",
          data: { test: true },
        },
        "message",
      );
      Alert.alert("テスト通知", "テスト通知を送信しました");
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("エラー", "テスト通知の送信に失敗しました");
    }
  };

  const resetToDefaults = (): void => {
    Alert.alert(
      "デフォルト設定に戻す",
      "すべての通知設定をデフォルト値に戻しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "戻す",
          style: "destructive",
          onPress: () => {
            setSettings({
              enabledNotificationTypes: {
                booking_request: true,
                booking_confirmed: true,
                booking_cancelled: true,
                message: true,
                review_received: true,
                promotion: false,
              },
              quietHours: {
                enabled: false,
                startTime: "22:00",
                endTime: "08:00",
              },
              sound: {
                enabled: true,
                soundName: "default",
              },
              vibration: true,
              badge: true,
            });
          },
        },
      ],
    );
  };

  const getNotificationTypeLabel = (type: string): string => {
    const labels = {
      booking_request: "予約リクエスト",
      booking_confirmed: "予約確定",
      booking_cancelled: "予約キャンセル",
      message: "メッセージ",
      review_received: "レビュー通知",
      promotion: "プロモーション",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getNotificationTypeDescription = (type: string): string => {
    const descriptions = {
      booking_request: "新しい予約リクエストが届いた時",
      booking_confirmed: "予約が確定した時",
      booking_cancelled: "予約がキャンセルされた時",
      message: "チャットでメッセージが届いた時",
      review_received: "レビューが投稿された時",
      promotion: "キャンペーンやお得情報",
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>設定を読み込み中...</Text>
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
        <Text style={styles.title}>通知設定</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={saveNotificationSettings}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "保存中..." : "保存"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 通知タイプ設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 通知タイプ</Text>
          <Text style={styles.sectionDescription}>
            受信したい通知の種類を選択してください
          </Text>

          {Object.entries(settings.enabledNotificationTypes).map(
            ([type, enabled]) => (
              <View key={type} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {getNotificationTypeLabel(type)}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {getNotificationTypeDescription(type)}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(value) =>
                    updateNotificationType(type as any, value)
                  }
                  trackColor={{ false: "#333", true: "#ff6b6b" }}
                  thumbColor={enabled ? "#fff" : "#aaa"}
                />
              </View>
            ),
          )}
        </View>

        {/* サウンド設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 サウンド設定</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>通知音を鳴らす</Text>
              <Text style={styles.settingDescription}>
                通知を受信した時に音を再生します
              </Text>
            </View>
            <Switch
              value={settings.sound.enabled}
              onValueChange={(value) => updateSound("enabled", value)}
              trackColor={{ false: "#333", true: "#ff6b6b" }}
              thumbColor={settings.sound.enabled ? "#fff" : "#aaa"}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              !settings.sound.enabled && styles.disabledSetting,
            ]}
            disabled={!settings.sound.enabled}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>通知音の種類</Text>
              <Text style={styles.settingValue}>
                {settings.sound.soundName === "default"
                  ? "デフォルト"
                  : settings.sound.soundName}
              </Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* バイブレーション設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📳 バイブレーション</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>バイブレーションを使用</Text>
              <Text style={styles.settingDescription}>
                通知を受信した時にバイブレーションします
              </Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, vibration: value }))
              }
              trackColor={{ false: "#333", true: "#ff6b6b" }}
              thumbColor={settings.vibration ? "#fff" : "#aaa"}
            />
          </View>
        </View>

        {/* バッジ設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔴 バッジ</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                アプリアイコンにバッジを表示
              </Text>
              <Text style={styles.settingDescription}>
                未読通知数をアプリアイコンに表示します
              </Text>
            </View>
            <Switch
              value={settings.badge}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, badge: value }))
              }
              trackColor={{ false: "#333", true: "#ff6b6b" }}
              thumbColor={settings.badge ? "#fff" : "#aaa"}
            />
          </View>
        </View>

        {/* おやすみモード */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌙 おやすみモード</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>おやすみモードを使用</Text>
              <Text style={styles.settingDescription}>
                指定した時間帯は通知を受信しません
              </Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={(value) => updateQuietHours("enabled", value)}
              trackColor={{ false: "#333", true: "#ff6b6b" }}
              thumbColor={settings.quietHours.enabled ? "#fff" : "#aaa"}
            />
          </View>

          {settings.quietHours.enabled && (
            <>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>開始時刻</Text>
                  <Text style={styles.settingValue}>
                    {settings.quietHours.startTime}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>終了時刻</Text>
                  <Text style={styles.settingValue}>
                    {settings.quietHours.endTime}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* デバッグ情報 */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 デバッグ情報</Text>

            <View style={styles.debugInfo}>
              <Text style={styles.debugLabel}>FCMトークン:</Text>
              <Text style={styles.debugValue}>
                {fcmToken ? `${fcmToken.substring(0, 20)}...` : "未取得"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.testButton}
              onPress={testNotification}
            >
              <Text style={styles.testButtonText}>テスト通知を送信</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* アクションボタン */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
          >
            <Text style={styles.resetButtonText}>デフォルト設定に戻す</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  backButton: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    color: DesignTokens.colors.primary[500],
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: DesignTokens.colors.dark.text.primary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  disabledButton: {
    backgroundColor: DesignTokens.colors.secondary[600],
  },
  saveButtonText: {
    color: DesignTokens.colors.dark.text.primary,
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
    color: DesignTokens.colors.dark.text.secondary,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  disabledSetting: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 14,
    color: DesignTokens.colors.primary[500],
    fontWeight: "500",
  },
  arrowIcon: {
    fontSize: 16,
    color: DesignTokens.colors.dark.text.tertiary,
  },
  debugInfo: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  debugLabel: {
    fontSize: 12,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 10,
    color: DesignTokens.colors.accent.electric,
    fontFamily: "monospace",
  },
  testButton: {
    backgroundColor: DesignTokens.colors.accent.electric,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: DesignTokens.colors.dark.background,
    fontSize: 14,
    fontWeight: "bold",
  },
  actionSection: {
    marginBottom: 32,
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DesignTokens.colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  resetButtonText: {
    color: DesignTokens.colors.error,
    fontSize: 16,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 40,
  },
});

export default NotificationSettingsScreen;
