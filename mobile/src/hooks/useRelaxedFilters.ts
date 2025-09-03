import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import MatchingService, {
  MatchingCriteria,
  ArtistMatch,
} from "../services/MatchingService";
import { TattooStyle, TattooSize } from "../types";
import { useNotificationsMock } from "./useNotificationsMock";

interface SearchFilters {
  maxDistance: number;
  budgetRange: {
    min: number;
    max: number;
  };
  preferredStyles: TattooStyle[];
  size: TattooSize;
  isWeekdayOnly: boolean;
  experienceLevel: "any" | "junior" | "senior" | "master";
}

interface RelaxationLevel {
  level: number;
  name: string;
  description: string;
  adjustments: Partial<SearchFilters>;
  icon: string;
}

interface UseRelaxedFilters {
  originalFilters: SearchFilters | null;
  currentFilters: SearchFilters | null;
  relaxationLevels: RelaxationLevel[];
  currentRelaxationLevel: number;
  isSearching: boolean;
  lastSearchResults: ArtistMatch[];

  actions: {
    setOriginalFilters: (filters: SearchFilters) => void;
    applyRelaxation: (level: number) => Promise<ArtistMatch[]>;
    resetToOriginal: () => void;
    acceptRelaxedFilters: () => void;
    suggestOneClickRelaxation: () => RelaxationLevel | null;
    getRelaxationReason: (level: number) => string;
    previewRelaxation: (level: number) => SearchFilters;
  };

  analytics: {
    relaxationUsageStats: Map<number, number>;
    mostSuccessfulLevel: number | null;
    userAcceptanceRate: number;
  };
}

const RELAXATION_LEVELS: RelaxationLevel[] = [
  {
    level: 0,
    name: "オリジナル",
    description: "元の検索条件",
    adjustments: {},
    icon: "🔍",
  },
  {
    level: 1,
    name: "距離を拡張",
    description: "検索範囲を +2km 拡張",
    adjustments: { maxDistance: 2 }, // Will be added to original
    icon: "📍",
  },
  {
    level: 2,
    name: "平日も含める",
    description: "土日に加えて平日も検索",
    adjustments: { isWeekdayOnly: false },
    icon: "📅",
  },
  {
    level: 3,
    name: "予算を調整",
    description: "予算範囲を ±20% 拡張",
    adjustments: {}, // Calculated dynamically
    icon: "💰",
  },
  {
    level: 4,
    name: "スタイルを拡張",
    description: "関連スタイルも含めて検索",
    adjustments: {}, // Calculated dynamically
    icon: "🎨",
  },
  {
    level: 5,
    name: "経験レベルを拡張",
    description: "すべての経験レベルを含める",
    adjustments: { experienceLevel: "any" },
    icon: "⭐",
  },
];

export const useRelaxedFilters = (): UseRelaxedFilters => {
  const { showNotification } = useNotificationsMock();

  const [originalFilters, setOriginalFilters] = useState<SearchFilters | null>(
    null,
  );
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(
    null,
  );
  const [currentRelaxationLevel, setCurrentRelaxationLevel] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchResults, setLastSearchResults] = useState<ArtistMatch[]>([]);

  // Analytics state
  const [relaxationUsageStats, setRelaxationUsageStats] = useState(
    new Map<number, number>(),
  );
  const [acceptanceHistory, setAcceptanceHistory] = useState<boolean[]>([]);

  const setFilters = useCallback((filters: SearchFilters) => {
    setOriginalFilters(filters);
    setCurrentFilters(filters);
    setCurrentRelaxationLevel(0);
    console.log("🔍 Original search filters set:", filters);
  }, []);

  const calculateRelaxedFilters = useCallback(
    (original: SearchFilters, level: number): SearchFilters => {
      if (level === 0 || !original) return original;

      const relaxation = RELAXATION_LEVELS[level];
      if (!relaxation) return original;

      let adjusted = { ...original };

      // Apply static adjustments
      Object.assign(adjusted, relaxation.adjustments);

      // Apply dynamic adjustments based on level
      switch (level) {
        case 1: // Distance expansion
          adjusted.maxDistance =
            original.maxDistance + (relaxation.adjustments.maxDistance || 2);
          break;

        case 3: // Budget expansion (±20%)
          const budgetExpansion = 0.2;
          adjusted.budgetRange = {
            min: Math.round(original.budgetRange.min * (1 - budgetExpansion)),
            max: Math.round(original.budgetRange.max * (1 + budgetExpansion)),
          };
          break;

        case 4: // Style expansion
          adjusted.preferredStyles = expandRelatedStyles(
            original.preferredStyles,
          );
          break;
      }

      return adjusted;
    },
    [],
  );

  const expandRelatedStyles = useCallback(
    (originalStyles: TattooStyle[]): TattooStyle[] => {
      const styleRelations: Record<TattooStyle, TattooStyle[]> = {
        リアリズム: ["ポートレート", "ブラック＆グレー"],
        トラディショナル: ["オールドスクール", "ネオトラディショナル"],
        ネオトラディショナル: ["トラディショナル", "カラー"],
        ジャパニーズ: ["トライバル", "ブラック＆グレー"],
        "ブラック＆グレー": ["リアリズム", "ポートレート"],
        カラー: ["ネオトラディショナル", "ジオメトリック"],
        ジオメトリック: ["ミニマル", "カラー"],
        ミニマル: ["ジオメトリック", "レタリング"],
        トライバル: ["ジャパニーズ", "ブラック＆グレー"],
        バイオメカニクス: ["リアリズム", "ブラック＆グレー"],
        オールドスクール: ["トラディショナル"],
        レタリング: ["ミニマル", "ブラック＆グレー"],
        ポートレート: ["リアリズム", "ブラック＆グレー"],
      };

      const expandedStyles = new Set(originalStyles);

      originalStyles.forEach((style) => {
        const related = styleRelations[style] || [];
        related.forEach((relatedStyle) => expandedStyles.add(relatedStyle));
      });

      return Array.from(expandedStyles);
    },
    [],
  );

  const applyRelaxation = useCallback(
    async (level: number): Promise<ArtistMatch[]> => {
      if (!originalFilters) {
        throw new Error("No original filters set");
      }

      if (level < 0 || level >= RELAXATION_LEVELS.length) {
        throw new Error(`Invalid relaxation level: ${level}`);
      }

      setIsSearching(true);
      setCurrentRelaxationLevel(level);

      try {
        const relaxedFilters = calculateRelaxedFilters(originalFilters, level);
        setCurrentFilters(relaxedFilters);

        // Update usage statistics
        setRelaxationUsageStats((prev) => {
          const newStats = new Map(prev);
          newStats.set(level, (newStats.get(level) || 0) + 1);
          return newStats;
        });

        // Mock search with relaxed filters
        // In real implementation, call actual search service
        console.log(
          "🔍 Searching with relaxed filters (level " + level + "):",
          relaxedFilters,
        );

        const mockResults: ArtistMatch[] = generateMockSearchResults(level);
        setLastSearchResults(mockResults);

        // Show notification about relaxation
        if (level > 0) {
          const relaxation = RELAXATION_LEVELS[level];
          showNotification({
            type: "info",
            title: `${relaxation.icon} ${relaxation.name}`,
            message: `${relaxation.description} で ${mockResults.length} 件見つかりました`,
          });
        }

        console.log(
          `🎯 Relaxation level ${level} applied, found ${mockResults.length} results`,
        );

        return mockResults;
      } catch (error) {
        showNotification({
          type: "error",
          title: "検索エラー",
          message: "もう一度お試しください",
        });
        console.error("Error applying relaxation:", error);
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [originalFilters, calculateRelaxedFilters, showNotification],
  );

  const resetToOriginal = useCallback(() => {
    if (originalFilters) {
      setCurrentFilters(originalFilters);
      setCurrentRelaxationLevel(0);
      setLastSearchResults([]);
      console.log("🔄 Reset to original filters");
    }
  }, [originalFilters]);

  const acceptRelaxedFilters = useCallback(() => {
    if (currentFilters && currentRelaxationLevel > 0) {
      setOriginalFilters(currentFilters);
      setAcceptanceHistory((prev) => [...prev, true]);

      const relaxation = RELAXATION_LEVELS[currentRelaxationLevel];
      showNotification({
        type: "success",
        title: "検索条件を更新",
        message: `${relaxation.name} で検索条件を保存しました`,
      });

      console.log("✅ Relaxed filters accepted as new original");
    } else {
      setAcceptanceHistory((prev) => [...prev, false]);
    }
  }, [currentFilters, currentRelaxationLevel, showNotification]);

  const suggestOneClickRelaxation = useCallback((): RelaxationLevel | null => {
    if (!originalFilters) return null;

    // Smart suggestion based on filter characteristics
    if (originalFilters.maxDistance <= 3) {
      return RELAXATION_LEVELS[1]; // Distance expansion
    }

    if (originalFilters.isWeekdayOnly) {
      return RELAXATION_LEVELS[2]; // Include weekdays
    }

    if (
      originalFilters.budgetRange.max - originalFilters.budgetRange.min <
      20000
    ) {
      return RELAXATION_LEVELS[3]; // Budget expansion
    }

    if (originalFilters.preferredStyles.length <= 2) {
      return RELAXATION_LEVELS[4]; // Style expansion
    }

    return RELAXATION_LEVELS[1]; // Default to distance
  }, [originalFilters]);

  const getRelaxationReason = useCallback((level: number): string => {
    const reasons = {
      1: "近隣に適したアーティストが見つからないため、検索範囲を広げることをお勧めします",
      2: "土日の予約が集中しているため、平日も含めて検索することをお勧めします",
      3: "予算範囲内でのマッチが少ないため、価格帯を調整することをお勧めします",
      4: "指定したスタイルが限定的なため、関連スタイルも含めることをお勧めします",
      5: "経験レベルの条件が厳しすぎる可能性があります",
    };

    return (
      reasons[level as keyof typeof reasons] ||
      "条件を緩和することで、より多くの選択肢が見つかります"
    );
  }, []);

  const previewRelaxation = useCallback(
    (level: number): SearchFilters => {
      if (!originalFilters) throw new Error("No original filters set");
      return calculateRelaxedFilters(originalFilters, level);
    },
    [originalFilters, calculateRelaxedFilters],
  );

  // Analytics calculations
  const mostSuccessfulLevel =
    Array.from(relaxationUsageStats.entries()).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0] || null;

  const userAcceptanceRate =
    acceptanceHistory.length > 0
      ? acceptanceHistory.filter(Boolean).length / acceptanceHistory.length
      : 0;

  return {
    originalFilters,
    currentFilters,
    relaxationLevels: RELAXATION_LEVELS,
    currentRelaxationLevel,
    isSearching,
    lastSearchResults,

    actions: {
      setOriginalFilters: setFilters,
      applyRelaxation,
      resetToOriginal,
      acceptRelaxedFilters,
      suggestOneClickRelaxation,
      getRelaxationReason,
      previewRelaxation,
    },

    analytics: {
      relaxationUsageStats,
      mostSuccessfulLevel,
      userAcceptanceRate,
    },
  };
};

// Mock function to simulate search results based on relaxation level
function generateMockSearchResults(level: number): ArtistMatch[] {
  const baseCount = Math.max(0, level * 2 - 1); // 0, 1, 3, 5, 7, 9
  const results: ArtistMatch[] = [];

  for (let i = 0; i < baseCount + Math.floor(Math.random() * 3); i++) {
    results.push({
      artist: {
        uid: `artist-${i}`,
        email: `artist${i}@example.com`,
        displayName: `アーティスト ${i + 1}`,
        userType: "artist",
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          firstName: `名前${i + 1}`,
          lastName: `苗字${i + 1}`,
          location: {
            address: `住所${i + 1}`,
            city: "東京",
            prefecture: "東京都",
            postalCode: "100-0001",
            latitude: 35.6762 + Math.random() * 0.1,
            longitude: 139.6503 + Math.random() * 0.1,
          },
        },
      },
      matchScore: Math.max(0.3, 1 - level * 0.1 + Math.random() * 0.3),
      breakdown: {
        designScore: Math.random() * 0.4,
        artistScore: Math.random() * 0.3,
        priceScore: Math.random() * 0.2,
        distanceScore: Math.random() * 0.1,
      },
      compatibility: Math.random(),
      distance: Math.random() * (5 + level * 2),
      estimatedPrice: 15000 + Math.random() * 50000,
      topPortfolioMatches: [],
      matchReasons: [`緩和レベル${level}での結果`],
    } as ArtistMatch);
  }

  return results;
}
