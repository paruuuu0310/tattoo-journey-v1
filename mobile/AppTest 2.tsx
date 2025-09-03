/**
 * 🧪 TEST APP - MAGI システムテスト用
 * MAGIレビューシステムの動作確認とデモンストレーション
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { DesignTokens } from "./src/styles/DesignTokens";
import MAGIReviewScreen from "./src/screens/review/MAGIReviewScreen";
import EnhancedReviewScreen from "./src/screens/review/EnhancedReviewScreen";

type TestMode = "menu" | "magi" | "enhanced";

const AppTest: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<TestMode>("menu");

  const renderMenu = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <Text style={styles.title}>🧪 レビューシステムテスト</Text>
        <Text style={styles.subtitle}>UI/UX確認とMAGIシステムデモ</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.testButton, styles.magiButton]}
          onPress={() => setCurrentMode("magi")}
        >
          <Text style={styles.buttonIcon}>🧠</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>MAGIレビューシステム</Text>
            <Text style={styles.buttonDescription}>
              3AI協調によるインテリジェントレビュー
            </Text>
          </View>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.enhancedButton]}
          onPress={() => setCurrentMode("enhanced")}
        >
          <Text style={styles.buttonIcon}>🌟</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>統合レビューシステム</Text>
            <Text style={styles.buttonDescription}>
              最適化されたUI/UXと機能統合
            </Text>
          </View>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📝 システム比較</Text>
          <Text style={styles.infoText}>
            • MAGIシステム: エヴァンゲリオン風3AI協調分析{"\n"}• 統合システム:
            従来UI/UXの最適化版{"\n"}• 両システムで体験の違いを確認できます
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  if (currentMode === "magi") {
    return (
      <MAGIReviewScreen
        artistId="artist-1"
        bookingId="booking-1"
        onBack={() => setCurrentMode("menu")}
        onComplete={() => setCurrentMode("menu")}
      />
    );
  }

  if (currentMode === "enhanced") {
    return (
      <EnhancedReviewScreen
        artistId="artist-1"
        bookingId="booking-1"
        mode="create"
        onBack={() => setCurrentMode("menu")}
        onComplete={() => setCurrentMode("menu")}
      />
    );
  }

  return renderMenu();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },

  header: {
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[8],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  title: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.accent.electric,
    textAlign: "center",
  },

  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    gap: DesignTokens.spacing[6],
  },

  testButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing[5],
    borderRadius: DesignTokens.radius.xl,
    borderWidth: 2,
    ...DesignTokens.shadows.lg,
  },
  magiButton: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderColor: DesignTokens.colors.accent.electric + "50",
  },
  enhancedButton: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderColor: DesignTokens.colors.primary[500] + "50",
  },

  buttonIcon: {
    fontSize: 32,
    marginRight: DesignTokens.spacing[4],
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  buttonDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 18,
  },
  buttonArrow: {
    fontSize: 24,
    color: DesignTokens.colors.dark.text.tertiary,
    marginLeft: DesignTokens.spacing[2],
  },

  infoCard: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },
  infoTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  infoText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    lineHeight: 20,
  },
});

export default AppTest;
