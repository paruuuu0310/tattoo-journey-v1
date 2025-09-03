import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { DesignTokens } from "../../styles/DesignTokens";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" ? "#FFFFFF" : DesignTokens.colors.primary[500]
          }
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  // Variants
  primary: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[500],
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  danger: {
    backgroundColor: DesignTokens.colors.error,
    borderWidth: 0,
  },

  // Sizes
  small: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    minHeight: 44,
  },
  large: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },

  // Text styles
  text: {
    fontFamily: DesignTokens.typography.fonts.primary,
    fontWeight: "600" as const,
  },
  primaryText: {
    color: DesignTokens.colors.dark.text.primary,
  },
  secondaryText: {
    color: DesignTokens.colors.primary[500],
  },
  ghostText: {
    color: DesignTokens.colors.primary[500],
  },
  dangerText: {
    color: DesignTokens.colors.dark.text.primary,
  },

  // Text sizes
  smallText: {
    fontSize: DesignTokens.typography.sizes.sm,
  },
  mediumText: {
    fontSize: DesignTokens.typography.sizes.md,
  },
  largeText: {
    fontSize: DesignTokens.typography.sizes.lg,
  },

  disabledText: {
    color: DesignTokens.colors.dark.text.disabled,
  },
});
