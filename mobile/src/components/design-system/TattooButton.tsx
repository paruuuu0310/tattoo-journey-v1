import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { DesignTokens } from "./TattooDesignTokens";

export interface TattooButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "accent" | "ghost" | "neon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  gradient?: boolean;
  neonEffect?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const TattooButton: React.FC<TattooButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  gradient = false,
  neonEffect = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: DesignTokens.radius.lg,
      ...DesignTokens.components.button.sizes[size],
    };

    // Add full width if specified
    if (fullWidth) {
      baseStyle.width = "100%";
    }

    // Add neon effect
    if (neonEffect && !disabled) {
      switch (variant) {
        case "primary":
          baseStyle.shadowColor = DesignTokens.colors.primary[500];
          baseStyle.shadowOffset = { width: 0, height: 0 };
          baseStyle.shadowOpacity = 0.8;
          baseStyle.shadowRadius = 10;
          baseStyle.elevation = 10;
          break;
        case "accent":
          baseStyle.shadowColor = DesignTokens.colors.accent.electric;
          baseStyle.shadowOffset = { width: 0, height: 0 };
          baseStyle.shadowOpacity = 0.8;
          baseStyle.shadowRadius = 10;
          baseStyle.elevation = 10;
          break;
        case "neon":
          baseStyle.shadowColor = DesignTokens.colors.accent.neon;
          baseStyle.shadowOffset = { width: 0, height: 0 };
          baseStyle.shadowOpacity = 1;
          baseStyle.shadowRadius = 15;
          baseStyle.elevation = 15;
          break;
      }
    }

    // Variant-specific styles
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = disabled
          ? DesignTokens.colors.secondary[600]
          : DesignTokens.colors.primary[500];
        if (gradient && !disabled) {
          // Gradient would be implemented with react-native-linear-gradient
          baseStyle.backgroundColor = DesignTokens.colors.primary[500];
        }
        break;

      case "secondary":
        baseStyle.backgroundColor = disabled
          ? DesignTokens.colors.secondary[800]
          : DesignTokens.colors.dark.elevated;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled
          ? DesignTokens.colors.secondary[700]
          : DesignTokens.colors.primary[500];
        break;

      case "accent":
        baseStyle.backgroundColor = disabled
          ? DesignTokens.colors.secondary[600]
          : DesignTokens.colors.accent.electric;
        break;

      case "ghost":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled
          ? DesignTokens.colors.secondary[700]
          : DesignTokens.colors.primary[500];
        break;

      case "neon":
        baseStyle.backgroundColor = disabled
          ? DesignTokens.colors.secondary[800]
          : DesignTokens.colors.dark.background;
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = disabled
          ? DesignTokens.colors.secondary[600]
          : DesignTokens.colors.accent.neon;
        break;
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: DesignTokens.components.button.sizes[size].fontSize,
      fontWeight: DesignTokens.typography.weights.semibold,
      fontFamily: DesignTokens.typography.fonts.primary,
    };

    // Variant-specific text colors
    switch (variant) {
      case "primary":
        baseTextStyle.color = DesignTokens.colors.dark.text.primary;
        break;

      case "secondary":
        baseTextStyle.color = disabled
          ? DesignTokens.colors.dark.text.disabled
          : DesignTokens.colors.primary[500];
        break;

      case "accent":
        baseTextStyle.color = DesignTokens.colors.dark.background;
        break;

      case "ghost":
        baseTextStyle.color = disabled
          ? DesignTokens.colors.dark.text.disabled
          : DesignTokens.colors.primary[500];
        break;

      case "neon":
        baseTextStyle.color = disabled
          ? DesignTokens.colors.dark.text.disabled
          : DesignTokens.colors.accent.neon;
        baseTextStyle.fontWeight = DesignTokens.typography.weights.bold;
        baseTextStyle.textTransform = "uppercase";
        baseTextStyle.letterSpacing =
          DesignTokens.typography.letterSpacing.wider;
        break;
    }

    return baseTextStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={getTextStyles().color} />
          <Text style={[getTextStyles(), textStyle, styles.loadingText]}>
            {title}
          </Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={styles.iconContainer}>
          {iconPosition === "left" && icon}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {iconPosition === "right" && icon}
        </View>
      );
    }

    return <Text style={[getTextStyles(), textStyle]}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  loadingText: {
    marginLeft: DesignTokens.spacing[2],
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
});

export default TattooButton;
