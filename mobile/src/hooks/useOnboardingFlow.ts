import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TattooStyle } from "../types";
import { useNotificationsMock } from "./useNotificationsMock";
import telemetry from "../lib/telemetry";

type OnboardingStep =
  | "welcome"
  | "preferences"
  | "tags"
  | "location"
  | "notifications"
  | "complete";

interface UserPreferences {
  selectedTags: TattooStyle[];
  maxBudget: number;
  maxDistance: number;
  preferredSchedule: "weekdays" | "weekends" | "flexible";
  experienceLevel: "first_time" | "experienced" | "expert";
}

interface OnboardingState {
  currentStep: OnboardingStep;
  progress: number;
  canSkip: boolean;
  canGoBack: boolean;
  preferences: Partial<UserPreferences>;
  skippedSteps: OnboardingStep[];
  timeSpent: number;
  isComplete: boolean;
}

interface UseOnboardingFlow {
  state: OnboardingState;
  actions: {
    nextStep: () => void;
    previousStep: () => void;
    skipStep: () => void;
    skipAll: () => void;
    selectTags: (tags: TattooStyle[]) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => void;
  };

  // Tag management
  tagManager: {
    availableTags: TattooStyle[];
    selectedTags: TattooStyle[];
    recommendedTags: TattooStyle[];
    getTagDescription: (tag: TattooStyle) => string;
    isTagSelected: (tag: TattooStyle) => boolean;
    toggleTag: (tag: TattooStyle) => void;
  };

  // Validation & Progress
  validation: {
    isStepValid: (step: OnboardingStep) => boolean;
    getRequiredTags: () => number;
    canProceed: () => boolean;
  };
}

const ONBOARDING_STORAGE_KEY = "@tattoo_journey_onboarding";
const MIN_REQUIRED_TAGS = 3;
const MAX_REQUIRED_TAGS = 5;

const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "preferences",
  "tags",
  "location",
  "notifications",
  "complete",
];

const AVAILABLE_TAGS: TattooStyle[] = [
  "リアリズム",
  "トラディショナル",
  "ネオトラディショナル",
  "ジャパニーズ",
  "ブラック＆グレー",
  "カラー",
  "ジオメトリック",
  "ミニマル",
  "トライバル",
  "バイオメカニクス",
  "オールドスクール",
  "レタリング",
  "ポートレート",
];

const TAG_DESCRIPTIONS: Record<TattooStyle, string> = {
  リアリズム: "写真のようなリアルな表現",
  トラディショナル: "伝統的なアメリカンスタイル",
  ネオトラディショナル: "モダンなアレンジを加えた伝統スタイル",
  ジャパニーズ: "和彫りや日本的なデザイン",
  "ブラック＆グレー": "黒とグレーのみを使用",
  カラー: "鮮やかな色彩を使用",
  ジオメトリック: "幾何学的なパターン",
  ミニマル: "シンプルで洗練されたデザイン",
  トライバル: "部族的・民族的なパターン",
  バイオメカニクス: "SF的・機械的なデザイン",
  オールドスクール: "クラシックなタトゥースタイル",
  レタリング: "文字やテキストベースのデザイン",
  ポートレート: "人物の肖像画",
};

export const useOnboardingFlow = (): UseOnboardingFlow => {
  const { showNotification } = useNotificationsMock();

  const [state, setState] = useState<OnboardingState>({
    currentStep: "welcome",
    progress: 0,
    canSkip: true,
    canGoBack: false,
    preferences: {},
    skippedSteps: [],
    timeSpent: 0,
    isComplete: false,
  });

  const startTimeRef = useRef<Date>(new Date());
  const stepStartTimeRef = useRef<Date>(new Date());
  const isMountedRef = useRef(true);

  useEffect(() => {
    loadSavedState();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update progress and step timing
  useEffect(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
    const progress = Math.round(
      (currentIndex / (ONBOARDING_STEPS.length - 1)) * 100,
    );

    setState((prev) => ({
      ...prev,
      progress,
      canGoBack: currentIndex > 0,
      canSkip: state.currentStep !== "complete",
    }));

    // Track step view
    telemetry.track("onboarding_step_view", {
      step: state.currentStep,
      stepIndex: currentIndex,
      progress,
    });

    stepStartTimeRef.current = new Date();
  }, [state.currentStep]);

  const loadSavedState = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (error) {
      console.error("Failed to load onboarding state:", error);
    }
  }, []);

  const saveState = useCallback(
    async (newState: Partial<OnboardingState>) => {
      try {
        const updatedState = { ...state, ...newState };
        await AsyncStorage.setItem(
          ONBOARDING_STORAGE_KEY,
          JSON.stringify(updatedState),
        );
        setState((prev) => ({ ...prev, ...newState }));
      } catch (error) {
        console.error("Failed to save onboarding state:", error);
        setState((prev) => ({ ...prev, ...newState }));
      }
    },
    [state],
  );

  const updateTimeSpent = useCallback(() => {
    const now = new Date();
    const timeSpent = now.getTime() - startTimeRef.current.getTime();
    return Math.round(timeSpent / 1000); // seconds
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentIndex + 1];

      // Track step completion
      const stepDuration =
        new Date().getTime() - stepStartTimeRef.current.getTime();
      telemetry.track("onboarding_step_complete", {
        step: state.currentStep,
        nextStep,
        durationSeconds: Math.round(stepDuration / 1000),
        skipped: false,
      });

      saveState({
        currentStep: nextStep,
        timeSpent: updateTimeSpent(),
      });
    }
  }, [state.currentStep, saveState, updateTimeSpent]);

  const previousStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const prevStep = ONBOARDING_STEPS[currentIndex - 1];

      telemetry.track("onboarding_step_back", {
        fromStep: state.currentStep,
        toStep: prevStep,
      });

      saveState({
        currentStep: prevStep,
        timeSpent: updateTimeSpent(),
      });
    }
  }, [state.currentStep, saveState, updateTimeSpent]);

  const skipStep = useCallback(() => {
    const currentStep = state.currentStep;
    const skippedSteps = [...state.skippedSteps, currentStep];

    telemetry.track("onboarding_step_skip", {
      step: currentStep,
      totalSkipped: skippedSteps.length,
    });

    saveState({
      skippedSteps,
      timeSpent: updateTimeSpent(),
    });

    nextStep();
  }, [
    state.currentStep,
    state.skippedSteps,
    saveState,
    updateTimeSpent,
    nextStep,
  ]);

  const skipAll = useCallback(() => {
    telemetry.track("onboarding_skipped", {
      step: state.currentStep,
      progress: state.progress,
      timeSpentSeconds: updateTimeSpent(),
      skippedSteps: ONBOARDING_STEPS.filter((step) => step !== "complete"),
    });

    saveState({
      currentStep: "complete",
      isComplete: true,
      skippedSteps: ONBOARDING_STEPS.filter((step) => step !== "complete"),
      timeSpent: updateTimeSpent(),
    });

    showNotification({
      type: "info",
      title: "オンボーディングをスキップしました",
      message: "後から設定画面で変更できます",
    });
  }, [
    state.currentStep,
    state.progress,
    saveState,
    updateTimeSpent,
    showNotification,
  ]);

  const selectTags = useCallback(
    (tags: TattooStyle[]) => {
      if (tags.length < MIN_REQUIRED_TAGS) {
        showNotification({
          type: "warning",
          title: "タグが不足しています",
          message: `最低${MIN_REQUIRED_TAGS}個のスタイルを選択してください`,
        });
        return;
      }

      if (tags.length > MAX_REQUIRED_TAGS) {
        showNotification({
          type: "warning",
          title: "タグが多すぎます",
          message: `最大${MAX_REQUIRED_TAGS}個まで選択できます`,
        });
        return;
      }

      telemetry.track("onboarding_tags_selected", {
        selectedTags: tags,
        tagCount: tags.length,
      });

      const updatedPreferences = {
        ...state.preferences,
        selectedTags: tags,
      };

      saveState({
        preferences: updatedPreferences,
        timeSpent: updateTimeSpent(),
      });
    },
    [state.preferences, saveState, updateTimeSpent, showNotification],
  );

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      telemetry.track("onboarding_preferences_update", {
        updatedFields: Object.keys(preferences),
        step: state.currentStep,
      });

      const updatedPreferences = {
        ...state.preferences,
        ...preferences,
      };

      saveState({
        preferences: updatedPreferences,
        timeSpent: updateTimeSpent(),
      });
    },
    [state.preferences, state.currentStep, saveState, updateTimeSpent],
  );

  const completeOnboarding = useCallback(async () => {
    const totalTimeSpent = updateTimeSpent();

    try {
      // Save final preferences to user profile
      await AsyncStorage.setItem(
        "@tattoo_journey_user_preferences",
        JSON.stringify(state.preferences),
      );

      // Track completion
      telemetry.trackOnboarding(true, {
        selectedTags: state.preferences.selectedTags || [],
        skippedSteps: state.skippedSteps,
        timeSpent: totalTimeSpent,
      });

      saveState({
        currentStep: "complete",
        isComplete: true,
        timeSpent: totalTimeSpent,
      });

      showNotification({
        type: "success",
        title: "セットアップ完了！",
        message: "あなたにぴったりのアーティストを見つけましょう",
        duration: 3000,
      });

      // Clear onboarding data after completion
      setTimeout(async () => {
        await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      }, 5000);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);

      telemetry.trackError(error as Error, {
        errorType: "ui",
        screenName: "onboarding",
        actionAttempted: "complete_onboarding",
      });

      showNotification({
        type: "error",
        title: "セットアップエラー",
        message: "もう一度お試しください",
      });
    }
  }, [
    state.preferences,
    state.skippedSteps,
    saveState,
    updateTimeSpent,
    showNotification,
  ]);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);

      setState({
        currentStep: "welcome",
        progress: 0,
        canSkip: true,
        canGoBack: false,
        preferences: {},
        skippedSteps: [],
        timeSpent: 0,
        isComplete: false,
      });

      startTimeRef.current = new Date();
      stepStartTimeRef.current = new Date();

      telemetry.track("onboarding_reset", {});
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
    }
  }, []);

  // Tag management functions
  const isTagSelected = useCallback(
    (tag: TattooStyle) => {
      return state.preferences.selectedTags?.includes(tag) ?? false;
    },
    [state.preferences.selectedTags],
  );

  const toggleTag = useCallback(
    (tag: TattooStyle) => {
      const currentTags = state.preferences.selectedTags || [];
      const isSelected = currentTags.includes(tag);

      let newTags: TattooStyle[];
      if (isSelected) {
        newTags = currentTags.filter((t) => t !== tag);
      } else {
        if (currentTags.length >= MAX_REQUIRED_TAGS) {
          showNotification({
            type: "warning",
            title: "選択上限",
            message: `最大${MAX_REQUIRED_TAGS}個まで選択できます`,
          });
          return;
        }
        newTags = [...currentTags, tag];
      }

      selectTags(newTags);
    },
    [state.preferences.selectedTags, selectTags, showNotification],
  );

  const getTagDescription = useCallback((tag: TattooStyle) => {
    return TAG_DESCRIPTIONS[tag] || tag;
  }, []);

  // Get recommended tags based on popular choices
  const recommendedTags: TattooStyle[] = [
    "リアリズム",
    "ジャパニーズ",
    "ミニマル",
    "ブラック＆グレー",
    "ジオメトリック",
  ];

  // Validation functions
  const isStepValid = useCallback(
    (step: OnboardingStep) => {
      switch (step) {
        case "tags":
          const tagCount = state.preferences.selectedTags?.length || 0;
          return tagCount >= MIN_REQUIRED_TAGS && tagCount <= MAX_REQUIRED_TAGS;
        case "preferences":
          return state.preferences.maxBudget !== undefined;
        default:
          return true;
      }
    },
    [state.preferences],
  );

  const getRequiredTags = useCallback(() => {
    const currentCount = state.preferences.selectedTags?.length || 0;
    return Math.max(0, MIN_REQUIRED_TAGS - currentCount);
  }, [state.preferences.selectedTags]);

  const canProceed = useCallback(() => {
    return isStepValid(state.currentStep);
  }, [state.currentStep, isStepValid]);

  return {
    state,
    actions: {
      nextStep,
      previousStep,
      skipStep,
      skipAll,
      selectTags,
      updatePreferences,
      completeOnboarding,
      resetOnboarding,
    },
    tagManager: {
      availableTags: AVAILABLE_TAGS,
      selectedTags: state.preferences.selectedTags || [],
      recommendedTags,
      getTagDescription,
      isTagSelected,
      toggleTag,
    },
    validation: {
      isStepValid,
      getRequiredTags,
      canProceed,
    },
  };
};
