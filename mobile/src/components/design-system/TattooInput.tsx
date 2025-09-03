import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { DesignTokens } from "./TattooDesignTokens";

export interface TattooInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "outlined" | "filled" | "neon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "off" | "email" | "name" | "password" | "username";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  onSubmitEditing?: () => void;
  neonColor?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

const TattooInput: React.FC<TattooInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  variant = "default",
  size = "md",
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoComplete,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  neonColor = DesignTokens.colors.primary[500],
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: DesignTokens.radius.lg,
      ...DesignTokens.components.input.sizes[size],
      flexDirection: "row",
      alignItems: multiline ? "flex-start" : "center",
    };

    // Multiline adjustments
    if (multiline) {
      baseStyle.height = undefined;
      baseStyle.minHeight = DesignTokens.components.input.sizes[size].height;
      baseStyle.paddingVertical = DesignTokens.spacing[3];
      baseStyle.alignItems = "flex-start";
    }

    // Variant-specific styles
    switch (variant) {
      case "default":
        baseStyle.backgroundColor = DesignTokens.colors.dark.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = error
          ? DesignTokens.colors.error
          : isFocused
            ? DesignTokens.colors.primary[500]
            : DesignTokens.colors.dark.border;
        break;

      case "outlined":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = error
          ? DesignTokens.colors.error
          : isFocused
            ? DesignTokens.colors.primary[500]
            : DesignTokens.colors.dark.border;
        break;

      case "filled":
        baseStyle.backgroundColor = DesignTokens.colors.dark.elevated;
        baseStyle.borderWidth = 0;
        if (isFocused) {
          baseStyle.borderBottomWidth = 2;
          baseStyle.borderBottomColor = error
            ? DesignTokens.colors.error
            : DesignTokens.colors.primary[500];
        }
        break;

      case "neon":
        baseStyle.backgroundColor = DesignTokens.colors.dark.background;
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = error
          ? DesignTokens.colors.error
          : isFocused
            ? neonColor
            : DesignTokens.colors.dark.border;

        if (isFocused && !error) {
          baseStyle.shadowColor = neonColor;
          baseStyle.shadowOffset = { width: 0, height: 0 };
          baseStyle.shadowOpacity = 0.8;
          baseStyle.shadowRadius = 8;
          baseStyle.elevation = 8;
        }
        break;
    }

    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.6;
      baseStyle.backgroundColor = DesignTokens.colors.secondary[800];
    }

    return baseStyle;
  };

  const getInputStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: DesignTokens.components.input.sizes[size].fontSize,
      color: DesignTokens.colors.dark.text.primary,
      fontFamily: DesignTokens.typography.fonts.primary,
    };

    // Multiline adjustments
    if (multiline) {
      baseStyle.textAlignVertical = "top";
    }

    return baseStyle;
  };

  const getLabelStyles = (): TextStyle => {
    return {
      fontSize: DesignTokens.typography.sizes.sm,
      fontWeight: DesignTokens.typography.weights.medium,
      color: error
        ? DesignTokens.colors.error
        : isFocused
          ? DesignTokens.colors.primary[500]
          : DesignTokens.colors.dark.text.secondary,
      marginBottom: DesignTokens.spacing[1],
    };
  };

  const getHelperTextStyles = (): TextStyle => {
    return {
      fontSize: DesignTokens.typography.sizes.xs,
      color: error
        ? DesignTokens.colors.error
        : DesignTokens.colors.dark.text.tertiary,
      marginTop: DesignTokens.spacing[1],
    };
  };

  const getCharacterCountStyles = (): TextStyle => {
    const isNearLimit = maxLength && value.length > maxLength * 0.8;
    return {
      fontSize: DesignTokens.typography.sizes.xs,
      color: isNearLimit
        ? DesignTokens.colors.warning
        : DesignTokens.colors.dark.text.tertiary,
      textAlign: "right",
      marginTop: DesignTokens.spacing[1],
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={getLabelStyles()}>{label}</Text>}

      <View style={getContainerStyles()}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[getInputStyles(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DesignTokens.colors.dark.text.disabled}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.helperTextContainer}>
          {(error || helperText) && (
            <Text style={getHelperTextStyles()}>{error || helperText}</Text>
          )}
        </View>

        {maxLength && (
          <Text style={getCharacterCountStyles()}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

// Pre-built input variants for common use cases

export interface SearchInputProps
  extends Omit<TattooInputProps, "leftIcon" | "rightIcon"> {
  onSearch: (query: string) => void;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  ...props
}) => {
  const handleSearch = () => {
    onSearch(props.value);
  };

  const handleClear = () => {
    props.onChangeText("");
    onClear?.();
  };

  return (
    <TattooInput
      {...props}
      variant="neon"
      placeholder="アーティストやスタイルを検索..."
      leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
      rightIcon={
        props.value ? <Text style={styles.clearIcon}>✕</Text> : undefined
      }
      onRightIconPress={props.value ? handleClear : undefined}
      autoCapitalize="none"
      onSubmitEditing={handleSearch}
    />
  );
};

export interface PasswordInputProps
  extends Omit<TattooInputProps, "secureTextEntry" | "rightIcon"> {}

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TattooInput
      {...props}
      secureTextEntry={!isVisible}
      rightIcon={<Text style={styles.eyeIcon}>{isVisible ? "👁️" : "👁️‍🗨️"}</Text>}
      onRightIconPress={() => setIsVisible(!isVisible)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  iconContainer: {
    padding: DesignTokens.spacing[2],
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  helperTextContainer: {
    flex: 1,
  },
  searchIcon: {
    fontSize: DesignTokens.typography.sizes.lg,
  },
  clearIcon: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.tertiary,
  },
  eyeIcon: {
    fontSize: DesignTokens.typography.sizes.lg,
  },
});

export default TattooInput;
