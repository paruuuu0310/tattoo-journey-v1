import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { DesignTokens } from "../design-system/TattooDesignTokens";

// Themed Container Component
export interface ThemedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "surface" | "elevated";
  statusBarStyle?: "light-content" | "dark-content";
}

export const ThemedContainer: React.FC<ThemedContainerProps> = ({
  children,
  style,
  variant = "default",
  statusBarStyle = "light-content",
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case "surface":
        return DesignTokens.colors.dark.surface;
      case "elevated":
        return DesignTokens.colors.dark.elevated;
      default:
        return DesignTokens.colors.dark.background;
    }
  };

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: getBackgroundColor() }, style]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
};

// Themed Text Component
export interface ThemedTextProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "disabled" | "accent";
  size?: keyof typeof DesignTokens.typography.sizes;
  weight?: keyof typeof DesignTokens.typography.weights;
  style?: TextStyle;
  numberOfLines?: number;
  onPress?: () => void;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = "primary",
  size = "base",
  weight = "normal",
  style,
  numberOfLines,
  onPress,
}) => {
  const getTextColor = () => {
    switch (variant) {
      case "secondary":
        return DesignTokens.colors.dark.text.secondary;
      case "tertiary":
        return DesignTokens.colors.dark.text.tertiary;
      case "disabled":
        return DesignTokens.colors.dark.text.disabled;
      case "accent":
        return DesignTokens.colors.primary[500];
      default:
        return DesignTokens.colors.dark.text.primary;
    }
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: DesignTokens.typography.sizes[size],
    fontWeight: DesignTokens.typography.weights[weight],
    fontFamily: DesignTokens.typography.fonts.primary,
  };

  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      onPress={onPress}
    >
      {children}
    </Text>
  );
};

// Themed Section Header
export interface ThemedSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const ThemedSectionHeader: React.FC<ThemedSectionHeaderProps> = ({
  title,
  subtitle,
  action,
  style,
}) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderContent}>
        <ThemedText variant="primary" size="xl" weight="bold">
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText variant="secondary" size="sm">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {action && <View style={styles.sectionAction}>{action}</View>}
    </View>
  );
};

// Themed Separator
export interface ThemedSeparatorProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
}

export const ThemedSeparator: React.FC<ThemedSeparatorProps> = ({
  style,
  color = DesignTokens.colors.dark.border,
  thickness = 1,
}) => {
  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: color, height: thickness },
        style,
      ]}
    />
  );
};

// Themed Badge/Tag Component
export interface ThemedBadgeProps {
  text: string;
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ThemedBadge: React.FC<ThemedBadgeProps> = ({
  text,
  variant = "default",
  size = "md",
  style,
  textStyle,
}) => {
  const getBadgeStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: DesignTokens.radius.full,
      alignSelf: "flex-start",
    };

    // Size-specific styles
    switch (size) {
      case "sm":
        baseStyle.paddingHorizontal = DesignTokens.spacing[2];
        baseStyle.paddingVertical = DesignTokens.spacing[1];
        break;
      case "lg":
        baseStyle.paddingHorizontal = DesignTokens.spacing[4];
        baseStyle.paddingVertical = DesignTokens.spacing[2];
        break;
      default: // md
        baseStyle.paddingHorizontal = DesignTokens.spacing[3];
        baseStyle.paddingVertical = DesignTokens.spacing[1];
    }

    // Variant-specific colors
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = DesignTokens.colors.primary[500];
        break;
      case "accent":
        baseStyle.backgroundColor = DesignTokens.colors.accent.electric;
        break;
      case "success":
        baseStyle.backgroundColor = DesignTokens.colors.success;
        break;
      case "warning":
        baseStyle.backgroundColor = DesignTokens.colors.warning;
        break;
      case "error":
        baseStyle.backgroundColor = DesignTokens.colors.error;
        break;
      default:
        baseStyle.backgroundColor = DesignTokens.colors.dark.elevated;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = DesignTokens.colors.dark.border;
    }

    return baseStyle;
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "accent":
        return DesignTokens.colors.dark.background;
      case "default":
        return DesignTokens.colors.dark.text.primary;
      default:
        return DesignTokens.colors.dark.text.primary;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return DesignTokens.typography.sizes.xs;
      case "lg":
        return DesignTokens.typography.sizes.md;
      default:
        return DesignTokens.typography.sizes.sm;
    }
  };

  return (
    <View style={[getBadgeStyles(), style]}>
      <Text
        style={[
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: DesignTokens.typography.weights.medium,
            fontFamily: DesignTokens.typography.fonts.primary,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

// Themed Navigation Header
export interface ThemedHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  style?: ViewStyle;
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBackButton = false,
  onBackPress,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {showBackButton ? (
          <ThemedText
            variant="accent"
            size="md"
            onPress={onBackPress}
            style={styles.backButton}
          >
            ← 戻る
          </ThemedText>
        ) : (
          leftAction
        )}
      </View>

      <View style={styles.headerCenter}>
        <ThemedText variant="primary" size="lg" weight="bold" numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText variant="secondary" size="xs" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>

      <View style={styles.headerRight}>{rightAction}</View>
    </View>
  );
};

// Themed List Item
export interface ThemedListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ThemedListItem: React.FC<ThemedListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  badge,
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.listItem, disabled && styles.listItemDisabled, style]}>
      {leftIcon && <View style={styles.listItemIcon}>{leftIcon}</View>}

      <View style={styles.listItemContent}>
        <View style={styles.listItemTitleRow}>
          <ThemedText
            variant={disabled ? "disabled" : "primary"}
            size="md"
            weight="medium"
            style={styles.listItemTitle}
          >
            {title}
          </ThemedText>
          {badge && <ThemedBadge text={badge} variant="accent" size="sm" />}
        </View>

        {subtitle && (
          <ThemedText
            variant={disabled ? "disabled" : "secondary"}
            size="sm"
            numberOfLines={2}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>

      {rightIcon && <View style={styles.listItemIcon}>{rightIcon}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[4],
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionAction: {
    marginLeft: DesignTokens.spacing[4],
  },

  // Separator
  separator: {
    width: "100%",
    marginVertical: DesignTokens.spacing[2],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  headerLeft: {
    minWidth: 80,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  backButton: {
    padding: DesignTokens.spacing[2],
  },

  // List Item
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  listItemDisabled: {
    opacity: 0.6,
  },
  listItemIcon: {
    marginRight: DesignTokens.spacing[3],
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[1],
  },
  listItemTitle: {
    flex: 1,
    marginRight: DesignTokens.spacing[2],
  },
});

export default {
  ThemedContainer,
  ThemedText,
  ThemedSectionHeader,
  ThemedSeparator,
  ThemedBadge,
  ThemedHeader,
  ThemedListItem,
};
