/**
 * 🎨 Tattoo Journey 2.0 - Shared Module Entry Point
 *
 * Central exports for cross-platform types and utilities
 */

// Core type definitions
export type {
  User,
  UserType,
  UserProfile,
  Location,
  UserPreferences,
  Artist,
  ArtistProfile,
  PortfolioItem,
  ArtistRating,
  AvailabilitySlot,
} from "./types";

// AI and Analysis types
export type {
  AIAnalysis,
  AIAnalysisResult,
  ImageAnalysis,
  StyleScore,
  ColorAnalysis,
  TattooStyle,
  TattooSize,
} from "./types";

// Matching and Business Logic types
export type { MatchingRequest, MatchingResult, MatchReason } from "./types";

// Utility functions (if any shared utilities are added in the future)
export const SharedUtils = {
  // Placeholder for shared utility functions
  validateUserType: (userType: string): boolean => {
    return ["customer", "artist", "owner"].includes(userType);
  },

  validateTattooStyle: (style: string): boolean => {
    const validStyles = [
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
    return validStyles.includes(style);
  },
};
