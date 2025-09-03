import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Button, Tag } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { mockOnboardingTags } from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: (selectedTags: string[]) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "あなたの好みを教えてください",
      subtitle: "興味のあるタトゥースタイルを3〜5個選んでください",
      minSelection: 3,
      maxSelection: 5,
    },
  ];

  const handleTagPress = (tag: string) => {
    const currentStep = steps[0];

    if (selectedTags.includes(tag)) {
      // Remove tag
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      // Add tag (if under max limit)
      if (selectedTags.length < currentStep.maxSelection) {
        setSelectedTags((prev) => [...prev, tag]);
      }
    }
  };

  const handleNext = () => {
    if (selectedTags.length >= steps[0].minSelection) {
      onComplete(selectedTags);
    }
  };

  const handleSkip = () => {
    onComplete([]);
  };

  const canProceed = selectedTags.length >= steps[0].minSelection;
  const step = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={DesignTokens.colors.dark.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={styles.stepText}>ステップ 1/1</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
        </View>

        {/* Selection Counter */}
        <View style={styles.selectionCounter}>
          <Text style={styles.counterText}>
            選択済み: {selectedTags.length} / {step.maxSelection}
          </Text>
          {selectedTags.length < step.minSelection && (
            <Text style={styles.warningText}>
              あと{step.minSelection - selectedTags.length}個選んでください
            </Text>
          )}
        </View>

        {/* Tags Grid */}
        <View style={styles.tagsContainer}>
          {mockOnboardingTags.map((tag, index) => (
            <Tag
              key={index}
              label={tag}
              selected={selectedTags.includes(tag)}
              onPress={() => handleTagPress(tag)}
              variant={selectedTags.includes(tag) ? "accent" : "default"}
              size="medium"
              style={styles.tag}
            />
          ))}
        </View>

        {/* Selected Tags Preview */}
        {selectedTags.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>選択中のタグ:</Text>
            <View style={styles.selectedTags}>
              {selectedTags.map((tag, index) => (
                <Tag
                  key={index}
                  label={tag}
                  selected={true}
                  variant="success"
                  size="small"
                  style={styles.selectedTag}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <Button
            title="スキップ"
            onPress={handleSkip}
            variant="ghost"
            size="large"
            style={styles.skipButton}
          />

          <Button
            title="完了"
            onPress={handleNext}
            variant="primary"
            size="large"
            disabled={!canProceed}
            style={styles.nextButton}
          />
        </View>

        <Text style={styles.footerNote}>後で設定画面から変更できます</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[6],
  },
  progressContainer: {
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: 2,
    marginBottom: DesignTokens.spacing[2],
  },
  progressFill: {
    height: "100%",
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: 2,
  },
  stepText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing[6],
  },
  titleContainer: {
    marginBottom: DesignTokens.spacing[8],
    alignItems: "center",
  },
  title: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[3],
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  selectionCounter: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing[6],
  },
  counterText: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  warningText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.warning,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[8],
  },
  tag: {
    marginBottom: DesignTokens.spacing[2],
  },
  selectedContainer: {
    marginBottom: DesignTokens.spacing[6],
    padding: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
  },
  selectedTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[2],
  },
  selectedTag: {
    marginBottom: DesignTokens.spacing[1],
  },
  footer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  footerNote: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.tertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
