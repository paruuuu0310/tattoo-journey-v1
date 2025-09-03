import React, { useEffect, useRef, useState } from "react";
import {
  PanGestureHandler,
  TapGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Animated, View, Dimensions, StyleSheet } from "react-native";
import { DesignTokens } from "../design-system/TattooDesignTokens";

const { width, height } = Dimensions.get("window");

// Interactive Card with gesture animations
export interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: any;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const lastOffset = useRef({ x: 0, y: 0 });

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true },
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY, velocityX } = event.nativeEvent;

      // Check for swipe gestures
      if (Math.abs(translationX) > 100 || Math.abs(velocityX) > 1000) {
        if (translationX > 0 && onSwipeRight) {
          // Swipe right
          Animated.timing(translateX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            resetCard();
          });
          return;
        } else if (translationX < 0 && onSwipeLeft) {
          // Swipe left
          Animated.timing(translateX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            resetCard();
          });
          return;
        }
      }

      // Snap back to center
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(rotate, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const onTapHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    } else if (event.nativeEvent.state === State.END) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (onPress) {
        onPress();
      }
    }
  };

  const resetCard = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    scale.setValue(1);
  };

  // Add rotation based on horizontal movement
  const rotateInterpolate = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
    >
      <Animated.View>
        <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange}>
          <Animated.View
            style={[
              styles.interactiveCard,
              style,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            {children}
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Elastic Button with haptic feedback
export interface ElasticButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  hapticType?: "light" | "medium" | "heavy";
  elasticScale?: number;
  style?: any;
}

export const ElasticButton: React.FC<ElasticButtonProps> = ({
  children,
  onPress,
  hapticType = "medium",
  elasticScale = 0.9,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const onTapHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      setIsPressed(true);
      Animated.spring(scale, {
        toValue: elasticScale,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else if (event.nativeEvent.state === State.END) {
      setIsPressed(false);
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Haptic feedback would go here
      // import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
      // impactAsync(ImpactFeedbackStyle[hapticType.charAt(0).toUpperCase() + hapticType.slice(1)]);

      onPress();
    } else if (event.nativeEvent.state === State.CANCELLED) {
      setIsPressed(false);
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TapGestureHandler>
  );
};

// Magnifying Glass Effect
export interface MagnifyingGlassProps {
  children: React.ReactNode;
  magnification?: number;
  glasSize?: number;
  style?: any;
}

export const MagnifyingGlass: React.FC<MagnifyingGlassProps> = ({
  children,
  magnification = 2,
  glasSize = 100,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glassOpacity = useRef(new Animated.Value(0)).current;

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true },
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: magnification,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (event.nativeEvent.state === State.END) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <View style={[styles.magnifyingContainer, style]}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <Animated.View style={styles.magnifyingContent}>
          <Animated.View
            style={{
              transform: [{ scale }],
            }}
          >
            {children}
          </Animated.View>

          {/* Magnifying Glass Overlay */}
          <Animated.View
            style={[
              styles.magnifyingGlass,
              {
                width: glasSize,
                height: glasSize,
                borderRadius: glasSize / 2,
                opacity: glassOpacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Parallax Scroll Effect
export interface ParallaxScrollProps {
  children: React.ReactNode;
  backgroundElement?: React.ReactNode;
  parallaxRatio?: number;
  style?: any;
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  children,
  backgroundElement,
  parallaxRatio = 0.5,
  style,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const backgroundTranslateY = scrollY.interpolate({
    inputRange: [0, height],
    outputRange: [0, -height * parallaxRatio],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.parallaxContainer, style]}>
      {backgroundElement && (
        <Animated.View
          style={[
            styles.parallaxBackground,
            {
              transform: [{ translateY: backgroundTranslateY }],
            },
          ]}
        >
          {backgroundElement}
        </Animated.View>
      )}

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        style={styles.parallaxScroll}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
};

// Ripple Effect
export interface RippleEffectProps {
  children: React.ReactNode;
  rippleColor?: string;
  rippleSize?: number;
  rippleDuration?: number;
  onPress?: () => void;
  style?: any;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  rippleColor = DesignTokens.colors.primary[500] + "40",
  rippleSize = 200,
  rippleDuration = 600,
  onPress,
  style,
}) => {
  const [ripples, setRipples] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      scale: Animated.Value;
      opacity: Animated.Value;
    }>
  >([]);

  const createRipple = (x: number, y: number) => {
    const id = Date.now();
    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(0.6);

    const newRipple = { id, x, y, scale, opacity };
    setRipples((prev) => [...prev, newRipple]);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: rippleDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: rippleDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    });
  };

  const onTapHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      const { x, y } = event.nativeEvent;
      createRipple(x, y);

      if (onPress) {
        onPress();
      }
    }
  };

  return (
    <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange}>
      <Animated.View style={[styles.rippleContainer, style]}>
        {children}

        {ripples.map((ripple) => (
          <Animated.View
            key={ripple.id}
            style={[
              styles.ripple,
              {
                left: ripple.x - rippleSize / 2,
                top: ripple.y - rippleSize / 2,
                width: rippleSize,
                height: rippleSize,
                borderRadius: rippleSize / 2,
                backgroundColor: rippleColor,
                opacity: ripple.opacity,
                transform: [{ scale: ripple.scale }],
              },
            ]}
          />
        ))}
      </Animated.View>
    </TapGestureHandler>
  );
};

const styles = StyleSheet.create({
  interactiveCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  magnifyingContainer: {
    position: "relative",
    overflow: "hidden",
  },
  magnifyingContent: {
    position: "relative",
  },
  magnifyingGlass: {
    position: "absolute",
    borderWidth: 3,
    borderColor: DesignTokens.colors.accent.electric,
    backgroundColor: "transparent",
    shadowColor: DesignTokens.colors.accent.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  parallaxContainer: {
    flex: 1,
    position: "relative",
  },
  parallaxBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 1.5,
  },
  parallaxScroll: {
    flex: 1,
  },
  rippleContainer: {
    position: "relative",
    overflow: "hidden",
  },
  ripple: {
    position: "absolute",
  },
});

export default {
  InteractiveCard,
  ElasticButton,
  MagnifyingGlass,
  ParallaxScroll,
  RippleEffect,
};
