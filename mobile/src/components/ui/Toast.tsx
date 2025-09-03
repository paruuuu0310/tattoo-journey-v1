import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { DesignTokens } from "../../styles/DesignTokens";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  visible: boolean;
  duration?: number;
  onHide?: () => void;
  position?: "top" | "center" | "bottom";
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  visible,
  duration = 3000,
  onHide,
  position = "top",
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible, duration]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === "bottom" ? 50 : -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getPositionStyle = () => {
    switch (position) {
      case "top":
        return { top: 60 };
      case "center":
        return { top: "50%", marginTop: -25 };
      case "bottom":
        return { bottom: 100 };
      default:
        return { top: 60 };
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: DesignTokens.colors.success + "E6",
          borderColor: DesignTokens.colors.success,
        };
      case "warning":
        return {
          backgroundColor: DesignTokens.colors.warning + "E6",
          borderColor: DesignTokens.colors.warning,
        };
      case "error":
        return {
          backgroundColor: DesignTokens.colors.error + "E6",
          borderColor: DesignTokens.colors.error,
        };
      default:
        return {
          backgroundColor: DesignTokens.colors.info + "E6",
          borderColor: DesignTokens.colors.info,
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        getTypeStyles(),
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: DesignTokens.spacing[4],
    right: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: DesignTokens.spacing[2],
  },
  message: {
    flex: 1,
    fontSize: DesignTokens.typography.sizes.sm,
    fontFamily: DesignTokens.typography.fonts.primary,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.dark.text.primary,
    lineHeight: 20,
  },
});
