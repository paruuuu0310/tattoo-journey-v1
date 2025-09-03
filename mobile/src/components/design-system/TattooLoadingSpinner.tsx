import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
  Text,
} from "react-native";
import { DesignTokens } from "./TattooDesignTokens";

export interface TattooLoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "neon" | "pulse" | "dots" | "tattooNeedle";
  color?: string;
  message?: string;
  style?: ViewStyle;
}

const TattooLoadingSpinner: React.FC<TattooLoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  color = DesignTokens.colors.primary[500],
  message,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const dotValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const getSizes = () => {
    const sizes = {
      sm: { spinner: 20, message: DesignTokens.typography.sizes.xs },
      md: { spinner: 32, message: DesignTokens.typography.sizes.sm },
      lg: { spinner: 48, message: DesignTokens.typography.sizes.md },
      xl: { spinner: 64, message: DesignTokens.typography.sizes.lg },
    };
    return sizes[size];
  };

  useEffect(() => {
    const startAnimation = () => {
      switch (variant) {
        case "default":
          Animated.loop(
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: DesignTokens.animation.duration[1000],
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ).start();
          break;

        case "neon":
        case "pulse":
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseValue, {
                toValue: 1,
                duration: DesignTokens.animation.duration[700],
                easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                useNativeDriver: true,
              }),
              Animated.timing(pulseValue, {
                toValue: 0,
                duration: DesignTokens.animation.duration[700],
                easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                useNativeDriver: true,
              }),
            ]),
          ).start();
          break;

        case "dots":
          const dotAnimations = dotValues.map((dotValue, index) =>
            Animated.loop(
              Animated.sequence([
                Animated.delay(index * 200),
                Animated.timing(dotValue, {
                  toValue: 1,
                  duration: DesignTokens.animation.duration[500],
                  easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                  useNativeDriver: true,
                }),
                Animated.timing(dotValue, {
                  toValue: 0,
                  duration: DesignTokens.animation.duration[500],
                  easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                  useNativeDriver: true,
                }),
              ]),
            ),
          );
          Animated.stagger(200, dotAnimations).start();
          break;

        case "tattooNeedle":
          Animated.loop(
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: DesignTokens.animation.duration[300],
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: DesignTokens.animation.duration[300],
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ).start();
          break;
      }
    };

    startAnimation();
  }, [variant, animatedValue, pulseValue, dotValues]);

  const renderSpinner = () => {
    const { spinner } = getSizes();

    switch (variant) {
      case "default":
        const rotation = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        });

        return (
          <Animated.View
            style={[
              styles.defaultSpinner,
              {
                width: spinner,
                height: spinner,
                borderColor: `${color}33`,
                borderTopColor: color,
                transform: [{ rotate: rotation }],
              },
            ]}
          />
        );

      case "neon":
        const scale = pulseValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        });

        const opacity = pulseValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        });

        return (
          <Animated.View
            style={[
              styles.neonSpinner,
              {
                width: spinner,
                height: spinner,
                backgroundColor: color,
                shadowColor: color,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );

      case "pulse":
        const pulseScale = pulseValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.5],
        });

        const pulseOpacity = pulseValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        });

        return (
          <View style={styles.pulseContainer}>
            <View
              style={[
                styles.pulseCore,
                {
                  width: spinner * 0.4,
                  height: spinner * 0.4,
                  backgroundColor: color,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  width: spinner,
                  height: spinner,
                  borderColor: color,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
          </View>
        );

      case "dots":
        return (
          <View style={styles.dotsContainer}>
            {dotValues.map((dotValue, index) => {
              const dotScale = dotValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              });

              const dotOpacity = dotValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: spinner * 0.25,
                      height: spinner * 0.25,
                      backgroundColor: color,
                      transform: [{ scale: dotScale }],
                      opacity: dotOpacity,
                    },
                  ]}
                />
              );
            })}
          </View>
        );

      case "tattooNeedle":
        const needleTranslate = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        });

        return (
          <View style={styles.needleContainer}>
            <Animated.View
              style={[
                styles.needle,
                {
                  width: 4,
                  height: spinner,
                  backgroundColor: color,
                  transform: [{ translateY: needleTranslate }],
                },
              ]}
            />
            <View
              style={[
                styles.needleBase,
                {
                  width: spinner * 0.6,
                  height: spinner * 0.3,
                  backgroundColor: `${color}88`,
                },
              ]}
            />
            <View style={styles.sparkles}>
              {[...Array(3)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.sparkle,
                    {
                      backgroundColor: color,
                      opacity: animatedValue,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderSpinner()}
      {message && (
        <Text
          style={[
            styles.message,
            {
              fontSize: getSizes().message,
              color: DesignTokens.colors.dark.text.secondary,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Pre-built loading components for common use cases

export const FullScreenLoader: React.FC<{
  message?: string;
  variant?: TattooLoadingSpinnerProps["variant"];
}> = ({ message = "Loading...", variant = "neon" }) => {
  return (
    <View style={styles.fullScreenContainer}>
      <TattooLoadingSpinner
        size="xl"
        variant={variant}
        message={message}
        color={DesignTokens.colors.primary[500]}
      />
    </View>
  );
};

export const InlineLoader: React.FC<{
  message?: string;
}> = ({ message }) => {
  return (
    <View style={styles.inlineContainer}>
      <TattooLoadingSpinner
        size="sm"
        variant="dots"
        color={DesignTokens.colors.primary[500]}
      />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: DesignTokens.spacing[4],
    textAlign: "center",
    fontFamily: DesignTokens.typography.fonts.primary,
  },

  // Default Spinner
  defaultSpinner: {
    borderRadius: 9999,
    borderWidth: 3,
  },

  // Neon Spinner
  neonSpinner: {
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },

  // Pulse Spinner
  pulseContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCore: {
    borderRadius: 9999,
    position: "absolute",
  },
  pulseRing: {
    borderRadius: 9999,
    borderWidth: 2,
    position: "absolute",
  },

  // Dots Spinner
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  dot: {
    borderRadius: 9999,
  },

  // Tattoo Needle Spinner
  needleContainer: {
    alignItems: "center",
    position: "relative",
  },
  needle: {
    borderRadius: 2,
  },
  needleBase: {
    borderRadius: DesignTokens.radius.sm,
    marginTop: DesignTokens.spacing[1],
  },
  sparkles: {
    position: "absolute",
    top: -10,
    flexDirection: "row",
    gap: 4,
  },
  sparkle: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Pre-built variants
  fullScreenContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[4],
  },
  inlineMessage: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    fontFamily: DesignTokens.typography.fonts.primary,
  },
});

export default TattooLoadingSpinner;
