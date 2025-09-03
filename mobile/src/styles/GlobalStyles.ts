import { StyleSheet, Dimensions } from "react-native";
import { DesignTokens } from "../components/design-system/TattooDesignTokens";

const { width, height } = Dimensions.get("window");

// Global styles for the Tattoo Journey 2.0 app
export const GlobalStyles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },

  safeContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
    paddingHorizontal: DesignTokens.spacing[5],
  },

  // Screen layouts
  screenContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },

  screenPadding: {
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[4],
  },

  screenContent: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing[5],
  },

  // Header styles
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },

  headerTitle: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  headerSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  // Navigation styles
  backButton: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },

  backButtonText: {
    color: DesignTokens.colors.primary[500],
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  // Layout utilities
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowSpaceAround: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  column: {
    flexDirection: "column",
  },

  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Card styles
  card: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },

  elevatedCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  neonCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
    borderWidth: 2,
    borderColor: DesignTokens.colors.primary[500],
    shadowColor: DesignTokens.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },

  // Text styles
  title: {
    fontSize: DesignTokens.typography.sizes["3xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
    marginBottom: DesignTokens.spacing[2],
  },

  subtitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
    marginBottom: DesignTokens.spacing[2],
  },

  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
    marginBottom: DesignTokens.spacing[3],
  },

  bodyText: {
    fontSize: DesignTokens.typography.sizes.base,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
    lineHeight:
      DesignTokens.typography.lineHeights.normal *
      DesignTokens.typography.sizes.base,
  },

  caption: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  accentText: {
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.semibold,
  },

  // Button styles
  primaryButton: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[3],
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: DesignTokens.colors.primary[500],
  },

  neonButton: {
    backgroundColor: DesignTokens.colors.dark.background,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent.neon,
    shadowColor: DesignTokens.colors.accent.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },

  buttonText: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  primaryButtonText: {
    color: DesignTokens.colors.dark.text.primary,
  },

  secondaryButtonText: {
    color: DesignTokens.colors.primary[500],
  },

  neonButtonText: {
    color: DesignTokens.colors.accent.neon,
    textTransform: "uppercase",
    letterSpacing: DesignTokens.typography.letterSpacing.wider,
  },

  // Input styles
  inputContainer: {
    marginBottom: DesignTokens.spacing[4],
  },

  inputLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.dark.text.secondary,
    fontFamily: DesignTokens.typography.fonts.primary,
    marginBottom: DesignTokens.spacing[1],
  },

  input: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    fontSize: DesignTokens.typography.sizes.base,
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  inputFocused: {
    borderColor: DesignTokens.colors.primary[500],
  },

  inputError: {
    borderColor: DesignTokens.colors.error,
  },

  // List styles
  listContainer: {
    paddingVertical: DesignTokens.spacing[2],
  },

  listItem: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },

  listItemPressed: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    borderColor: DesignTokens.colors.primary[500],
  },

  // Spacing utilities
  mt1: { marginTop: DesignTokens.spacing[1] },
  mt2: { marginTop: DesignTokens.spacing[2] },
  mt3: { marginTop: DesignTokens.spacing[3] },
  mt4: { marginTop: DesignTokens.spacing[4] },
  mt5: { marginTop: DesignTokens.spacing[5] },
  mt6: { marginTop: DesignTokens.spacing[6] },

  mb1: { marginBottom: DesignTokens.spacing[1] },
  mb2: { marginBottom: DesignTokens.spacing[2] },
  mb3: { marginBottom: DesignTokens.spacing[3] },
  mb4: { marginBottom: DesignTokens.spacing[4] },
  mb5: { marginBottom: DesignTokens.spacing[5] },
  mb6: { marginBottom: DesignTokens.spacing[6] },

  ml1: { marginLeft: DesignTokens.spacing[1] },
  ml2: { marginLeft: DesignTokens.spacing[2] },
  ml3: { marginLeft: DesignTokens.spacing[3] },
  ml4: { marginLeft: DesignTokens.spacing[4] },

  mr1: { marginRight: DesignTokens.spacing[1] },
  mr2: { marginRight: DesignTokens.spacing[2] },
  mr3: { marginRight: DesignTokens.spacing[3] },
  mr4: { marginRight: DesignTokens.spacing[4] },

  p1: { padding: DesignTokens.spacing[1] },
  p2: { padding: DesignTokens.spacing[2] },
  p3: { padding: DesignTokens.spacing[3] },
  p4: { padding: DesignTokens.spacing[4] },
  p5: { padding: DesignTokens.spacing[5] },
  p6: { padding: DesignTokens.spacing[6] },

  px1: { paddingHorizontal: DesignTokens.spacing[1] },
  px2: { paddingHorizontal: DesignTokens.spacing[2] },
  px3: { paddingHorizontal: DesignTokens.spacing[3] },
  px4: { paddingHorizontal: DesignTokens.spacing[4] },
  px5: { paddingHorizontal: DesignTokens.spacing[5] },

  py1: { paddingVertical: DesignTokens.spacing[1] },
  py2: { paddingVertical: DesignTokens.spacing[2] },
  py3: { paddingVertical: DesignTokens.spacing[3] },
  py4: { paddingVertical: DesignTokens.spacing[4] },
  py5: { paddingVertical: DesignTokens.spacing[5] },

  // State styles
  loading: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.4,
  },

  hidden: {
    opacity: 0,
  },

  // Responsive utilities
  screenWidth: {
    width: width,
  },

  screenHeight: {
    height: height,
  },

  halfScreen: {
    width: width / 2,
  },

  // Animation styles
  fadeIn: {
    opacity: 1,
  },

  fadeOut: {
    opacity: 0,
  },

  // Error styles
  errorContainer: {
    backgroundColor: DesignTokens.colors.error + "20",
    borderColor: DesignTokens.colors.error,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[3],
    marginVertical: DesignTokens.spacing[2],
  },

  errorText: {
    color: DesignTokens.colors.error,
    fontSize: DesignTokens.typography.sizes.sm,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  // Success styles
  successContainer: {
    backgroundColor: DesignTokens.colors.success + "20",
    borderColor: DesignTokens.colors.success,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[3],
    marginVertical: DesignTokens.spacing[2],
  },

  successText: {
    color: DesignTokens.colors.success,
    fontSize: DesignTokens.typography.sizes.sm,
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  // Warning styles
  warningContainer: {
    backgroundColor: DesignTokens.colors.warning + "20",
    borderColor: DesignTokens.colors.warning,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing[3],
    marginVertical: DesignTokens.spacing[2],
  },

  warningText: {
    color: DesignTokens.colors.warning,
    fontSize: DesignTokens.typography.sizes.sm,
    fontFamily: DesignTokens.typography.fonts.primary,
  },
});

// Theme-aware utility functions
export const getThemeColor = (path: string): string => {
  const pathArray = path.split(".");
  let color: any = DesignTokens.colors;

  for (const key of pathArray) {
    color = color[key];
    if (!color) return DesignTokens.colors.dark.text.primary;
  }

  return color;
};

export const getThemeSpacing = (
  size: keyof typeof DesignTokens.spacing,
): number => {
  return DesignTokens.spacing[size];
};

export const createThemedStyles = (darkStyles: any, lightStyles?: any) => {
  // For now, always return dark styles since we're using dark theme
  // In the future, this could check a theme context
  return darkStyles;
};

export default GlobalStyles;
