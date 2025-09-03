import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { DesignTokens } from "../../styles/DesignTokens";

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "default" | "accent" | "success";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  selected = false,
  onPress,
  variant = "default",
  size = "medium",
  disabled = false,
  style,
  textStyle,
}) => {
  const tagStyle = [
    styles.base,
    styles[variant],
    styles[size],
    selected && styles.selected,
    selected && styles[`${variant}Selected`],
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    selected && styles.selectedText,
    selected && styles[`${variant}SelectedText`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const Component = onPress ? TouchableOpacity : React.Fragment;
  const touchableProps = onPress
    ? {
        onPress,
        disabled,
        activeOpacity: 0.7,
      }
    : {};

  return (
    <Component {...touchableProps} style={onPress ? tagStyle : undefined}>
      {onPress ? (
        <Text style={labelStyle}>{label}</Text>
      ) : (
        <React.Fragment>
          <Text style={[tagStyle, labelStyle]}>{label}</Text>
        </React.Fragment>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: DesignTokens.spacing[1],
    paddingHorizontal: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },

  // Variants
  default: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderColor: DesignTokens.colors.dark.border,
  },
  accent: {
    backgroundColor: DesignTokens.colors.accent.electric + "20",
    borderColor: DesignTokens.colors.accent.electric,
  },
  success: {
    backgroundColor: DesignTokens.colors.success + "20",
    borderColor: DesignTokens.colors.success,
  },

  // Sizes
  small: {
    paddingVertical: DesignTokens.spacing[1],
    paddingHorizontal: DesignTokens.spacing[2],
  },
  medium: {
    paddingVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[3],
  },
  large: {
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
  },

  // Selected states
  selected: {
    shadowColor: DesignTokens.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  defaultSelected: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderColor: DesignTokens.colors.primary[500],
  },
  accentSelected: {
    backgroundColor: DesignTokens.colors.accent.electric,
    borderColor: DesignTokens.colors.accent.electric,
  },
  successSelected: {
    backgroundColor: DesignTokens.colors.success,
    borderColor: DesignTokens.colors.success,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontFamily: DesignTokens.typography.fonts.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  defaultText: {
    color: DesignTokens.colors.dark.text.secondary,
  },
  accentText: {
    color: DesignTokens.colors.accent.electric,
  },
  successText: {
    color: DesignTokens.colors.success,
  },

  // Selected text styles
  selectedText: {
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  defaultSelectedText: {
    color: DesignTokens.colors.dark.text.primary,
  },
  accentSelectedText: {
    color: DesignTokens.colors.dark.background,
  },
  successSelectedText: {
    color: DesignTokens.colors.dark.text.primary,
  },

  // Text sizes
  smallText: {
    fontSize: DesignTokens.typography.sizes.xs,
  },
  mediumText: {
    fontSize: DesignTokens.typography.sizes.sm,
  },
  largeText: {
    fontSize: DesignTokens.typography.sizes.base,
  },

  disabledText: {
    color: DesignTokens.colors.dark.text.disabled,
  },
});
