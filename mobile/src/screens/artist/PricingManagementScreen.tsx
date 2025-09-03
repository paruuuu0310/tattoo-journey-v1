import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

interface PricingRule {
  id: string;
  artistId: string;
  type: "size" | "time" | "style" | "custom";
  name: string;
  basePrice: number;
  pricePerHour?: number;
  minPrice?: number;
  maxPrice?: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SizePricing {
  small: number; // 5cm以下
  medium: number; // 5-15cm
  large: number; // 15cm以上
  extraLarge: number; // 30cm以上
}

const PricingManagementScreen: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [sizePricing, setSizePricing] = useState<SizePricing>({
    small: 0,
    medium: 0,
    large: 0,
    extraLarge: 0,
  });
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [consultationFee, setConsultationFee] = useState<string>("");
  const [touchUpFee, setTouchUpFee] = useState<string>("");
  const [customRules, setCustomRules] = useState<PricingRule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRule, setNewRule] = useState({
    type: "custom" as const,
    name: "",
    basePrice: "",
    description: "",
  });

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    if (!userProfile?.uid) return;

    try {
      // アーティストの基本料金情報を取得
      const artistDoc = await firestore()
        .collection("users")
        .doc(userProfile.uid)
        .get();

      if (artistDoc.exists) {
        const data = artistDoc.data();
        const artistInfo = data?.profile?.artistInfo;

        if (artistInfo) {
          setSizePricing(
            artistInfo.priceRange || {
              small: 0,
              medium: 0,
              large: 0,
              extraLarge: 0,
            },
          );
          setHourlyRate(artistInfo.hourlyRate?.toString() || "");
          setConsultationFee(artistInfo.consultationFee?.toString() || "");
          setTouchUpFee(artistInfo.touchUpFee?.toString() || "");
        }
      }

      // カスタム料金ルールを取得
      const rulesSnapshot = await firestore()
        .collection("pricingRules")
        .where("artistId", "==", userProfile.uid)
        .orderBy("createdAt", "desc")
        .get();

      const rules = rulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as PricingRule[];

      setCustomRules(rules);
    } catch (error) {
      console.error("Error loading pricing data:", error);
    }
  };

  const saveSizePricing = async () => {
    if (!userProfile?.uid) return;

    try {
      const updatedProfile = {
        ...userProfile.profile,
        artistInfo: {
          ...userProfile.profile.artistInfo,
          priceRange: sizePricing,
          hourlyRate: parseFloat(hourlyRate) || 0,
          consultationFee: parseFloat(consultationFee) || 0,
          touchUpFee: parseFloat(touchUpFee) || 0,
        },
      };

      await updateUserProfile(updatedProfile);
      Alert.alert("成功", "基本料金設定が保存されました");
    } catch (error) {
      Alert.alert("エラー", "保存に失敗しました");
      console.error("Error saving pricing:", error);
    }
  };

  const addCustomRule = async () => {
    if (!userProfile?.uid || !newRule.name || !newRule.basePrice) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }

    try {
      const rule: Omit<PricingRule, "id"> = {
        artistId: userProfile.uid,
        type: newRule.type,
        name: newRule.name,
        basePrice: parseFloat(newRule.basePrice),
        description: newRule.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await firestore().collection("pricingRules").add(rule);

      const newRuleWithId = { id: docRef.id, ...rule };
      setCustomRules((prev) => [newRuleWithId, ...prev]);

      setNewRule({ type: "custom", name: "", basePrice: "", description: "" });
      setModalVisible(false);
      Alert.alert("成功", "カスタム料金ルールが追加されました");
    } catch (error) {
      Alert.alert("エラー", "追加に失敗しました");
      console.error("Error adding custom rule:", error);
    }
  };

  const toggleRuleStatus = async (rule: PricingRule) => {
    try {
      const updatedRule = {
        ...rule,
        isActive: !rule.isActive,
        updatedAt: new Date(),
      };

      await firestore().collection("pricingRules").doc(rule.id).update({
        isActive: updatedRule.isActive,
        updatedAt: updatedRule.updatedAt,
      });

      setCustomRules((prev) =>
        prev.map((r) => (r.id === rule.id ? updatedRule : r)),
      );
    } catch (error) {
      Alert.alert("エラー", "更新に失敗しました");
      console.error("Error toggling rule status:", error);
    }
  };

  const deleteRule = async (rule: PricingRule) => {
    Alert.alert("削除確認", "この料金ルールを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("pricingRules").doc(rule.id).delete();

            setCustomRules((prev) => prev.filter((r) => r.id !== rule.id));
            Alert.alert("成功", "料金ルールが削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Error deleting rule:", error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>料金設定</Text>
        <Text style={styles.subtitle}>アーティストの料金体系を管理します</Text>

        {/* サイズ別基本料金 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サイズ別基本料金</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>小サイズ (5cm以下) - ¥</Text>
            <TextInput
              style={styles.input}
              value={sizePricing.small.toString()}
              onChangeText={(text) =>
                setSizePricing((prev) => ({
                  ...prev,
                  small: parseFloat(text) || 0,
                }))
              }
              placeholder="10000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>中サイズ (5-15cm) - ¥</Text>
            <TextInput
              style={styles.input}
              value={sizePricing.medium.toString()}
              onChangeText={(text) =>
                setSizePricing((prev) => ({
                  ...prev,
                  medium: parseFloat(text) || 0,
                }))
              }
              placeholder="30000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>大サイズ (15-30cm) - ¥</Text>
            <TextInput
              style={styles.input}
              value={sizePricing.large.toString()}
              onChangeText={(text) =>
                setSizePricing((prev) => ({
                  ...prev,
                  large: parseFloat(text) || 0,
                }))
              }
              placeholder="80000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>特大サイズ (30cm以上) - ¥</Text>
            <TextInput
              style={styles.input}
              value={sizePricing.extraLarge.toString()}
              onChangeText={(text) =>
                setSizePricing((prev) => ({
                  ...prev,
                  extraLarge: parseFloat(text) || 0,
                }))
              }
              placeholder="150000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 時間単価・その他料金 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>時間単価・その他料金</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>時間料金 (¥/時間)</Text>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="15000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>相談料金 (¥)</Text>
            <TextInput
              style={styles.input}
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="3000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>初回カウンセリング料金</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>タッチアップ料金 (¥)</Text>
            <TextInput
              style={styles.input}
              value={touchUpFee}
              onChangeText={setTouchUpFee}
              placeholder="5000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>施術後の修正・追加料金</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSizePricing}>
          <Text style={styles.saveButtonText}>基本料金を保存</Text>
        </TouchableOpacity>

        {/* カスタム料金ルール */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>カスタム料金ルール</Text>
            <TouchableOpacity
              style={styles.addRuleButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addRuleButtonText}>+ 追加</Text>
            </TouchableOpacity>
          </View>

          {customRules.length > 0 ? (
            customRules.map((rule) => (
              <View
                key={rule.id}
                style={[
                  styles.ruleCard,
                  !rule.isActive && styles.inactiveRuleCard,
                ]}
              >
                <View style={styles.ruleHeader}>
                  <Text
                    style={[
                      styles.ruleName,
                      !rule.isActive && styles.inactiveText,
                    ]}
                  >
                    {rule.name}
                  </Text>
                  <View style={styles.ruleActions}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        rule.isActive
                          ? styles.activeButton
                          : styles.inactiveButton,
                      ]}
                      onPress={() => toggleRuleStatus(rule)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {rule.isActive ? "有効" : "無効"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteRuleButton}
                      onPress={() => deleteRule(rule)}
                    >
                      <Text style={styles.deleteRuleButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text
                  style={[
                    styles.rulePrice,
                    !rule.isActive && styles.inactiveText,
                  ]}
                >
                  ¥{rule.basePrice.toLocaleString()}
                </Text>
                {rule.description && (
                  <Text
                    style={[
                      styles.ruleDescription,
                      !rule.isActive && styles.inactiveText,
                    ]}
                  >
                    {rule.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noRulesText}>
              カスタム料金ルールがありません
            </Text>
          )}
        </View>
      </ScrollView>

      {/* カスタムルール追加モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>カスタム料金ルールを追加</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ルール名</Text>
              <TextInput
                style={styles.input}
                value={newRule.name}
                onChangeText={(text) =>
                  setNewRule((prev) => ({ ...prev, name: text }))
                }
                placeholder="例: カラータトゥー追加料金"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>料金 (¥)</Text>
              <TextInput
                style={styles.input}
                value={newRule.basePrice}
                onChangeText={(text) =>
                  setNewRule((prev) => ({ ...prev, basePrice: text }))
                }
                placeholder="20000"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>説明</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newRule.description}
                onChangeText={(text) =>
                  setNewRule((prev) => ({ ...prev, description: text }))
                }
                placeholder="料金ルールの詳細説明"
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addCustomRule}
              >
                <Text style={styles.saveButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addRuleButton: {
    backgroundColor: "#4ade80",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addRuleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ruleCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  inactiveRuleCard: {
    opacity: 0.6,
    borderColor: "#555",
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  ruleActions: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeButton: {
    backgroundColor: "#4ade80",
  },
  inactiveButton: {
    backgroundColor: "#64748b",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteRuleButton: {
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteRuleButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  rulePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: "#aaa",
  },
  inactiveText: {
    color: "#666",
  },
  noRulesText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333",
  },
  cancelButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PricingManagementScreen;
