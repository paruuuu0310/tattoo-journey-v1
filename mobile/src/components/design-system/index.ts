// Tattoo Journey 2.0 Design System Export
// Art-inspired component library for tattoo artist matching app

// Design Tokens
export {
  DesignTokens,
  getColor,
  getSpacing,
  getFontSize,
  getShadow,
  getRadius,
} from "./TattooDesignTokens";
import { DesignTokens } from "./TattooDesignTokens";

// Core Components
export { default as TattooButton } from "./TattooButton";
export type { TattooButtonProps } from "./TattooButton";

export { default as TattooCard, ArtistCard, PortfolioCard } from "./TattooCard";
export type {
  TattooCardProps,
  ArtistCardProps,
  PortfolioCardProps,
} from "./TattooCard";

export {
  default as TattooInput,
  SearchInput,
  PasswordInput,
} from "./TattooInput";
export type {
  TattooInputProps,
  SearchInputProps,
  PasswordInputProps,
} from "./TattooInput";

export {
  default as TattooLoadingSpinner,
  FullScreenLoader,
  InlineLoader,
} from "./TattooLoadingSpinner";
export type { TattooLoadingSpinnerProps } from "./TattooLoadingSpinner";

// Design System Theme
export const TattooTheme = {
  colors: DesignTokens.colors,
  typography: DesignTokens.typography,
  spacing: DesignTokens.spacing,
  radius: DesignTokens.radius,
  shadows: DesignTokens.shadows,
  animation: DesignTokens.animation,
  components: DesignTokens.components,
} as const;

// Utility functions for common design patterns
export const createNeonEffect = (color: string, intensity: number = 0.8) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: intensity,
  shadowRadius: 10,
  elevation: 10,
});

export const createGradientBackground = (colors: string[]) => {
  // This would require react-native-linear-gradient
  // For now, return the first color as fallback
  return {
    backgroundColor: colors[0],
  };
};

export const createArtisticBorder = (
  color: string = DesignTokens.colors.primary[500],
) => ({
  borderWidth: 2,
  borderColor: color,
  borderRadius: DesignTokens.radius.xl,
});

export const createTattooTextStyle = (
  size: keyof typeof DesignTokens.typography.sizes = "base",
) => ({
  fontSize: DesignTokens.typography.sizes[size],
  fontFamily: DesignTokens.typography.fonts.primary,
  color: DesignTokens.colors.dark.text.primary,
  fontWeight: DesignTokens.typography.weights.medium,
});

// Common layout utilities
export const layoutUtils = {
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  centerContent: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  column: {
    flexDirection: "column" as const,
  },
  spaceBetween: {
    justifyContent: "space-between" as const,
  },
  spaceAround: {
    justifyContent: "space-around" as const,
  },
  padding: {
    sm: { padding: DesignTokens.spacing[2] },
    md: { padding: DesignTokens.spacing[4] },
    lg: { padding: DesignTokens.spacing[6] },
    xl: { padding: DesignTokens.spacing[8] },
  },
  margin: {
    sm: { margin: DesignTokens.spacing[2] },
    md: { margin: DesignTokens.spacing[4] },
    lg: { margin: DesignTokens.spacing[6] },
    xl: { margin: DesignTokens.spacing[8] },
  },
};
