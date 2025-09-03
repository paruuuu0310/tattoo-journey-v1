import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, Dimensions, StyleSheet } from "react-native";
import { DesignTokens } from "../design-system/TattooDesignTokens";

const { width, height } = Dimensions.get("window");

// Floating Particles Animation (for background effects)
export interface FloatingParticlesProps {
  particleCount?: number;
  colors?: string[];
  particleSize?: number;
  speed?: number;
  style?: any;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  particleCount = 20,
  colors = [
    DesignTokens.colors.primary[500],
    DesignTokens.colors.accent.electric,
    DesignTokens.colors.accent.neon,
    DesignTokens.colors.accent.gold,
  ],
  particleSize = 4,
  speed = 3000,
  style,
}) => {
  const particles = useRef(
    Array.from({ length: particleCount }, () => ({
      translateX: new Animated.Value(Math.random() * width),
      translateY: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.8 + 0.2),
      scale: new Animated.Value(Math.random() * 0.8 + 0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
    })),
  ).current;

  useEffect(() => {
    const animations = particles.map((particle) => {
      const moveX = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.translateX, {
            toValue: Math.random() * width,
            duration: speed + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: Math.random() * width,
            duration: speed + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      const moveY = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.translateY, {
            toValue: Math.random() * height,
            duration: speed + Math.random() * 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: Math.random() * height,
            duration: speed + Math.random() * 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      const fade = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 0.2,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.8,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      return Animated.parallel([moveX, moveY, fade]);
    });

    Animated.parallel(animations).start();

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [particles, speed, particleCount]);

  return (
    <View style={[styles.particlesContainer, style]} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particleSize,
              height: particleSize,
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Pulse Animation Hook
export const usePulseAnimation = (
  duration: number = 1000,
  minScale: number = 1,
  maxScale: number = 1.05,
) => {
  const pulseAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim, duration, minScale, maxScale]);

  return pulseAnim;
};

// Neon Glow Animation
export interface NeonGlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  style?: any;
}

export const NeonGlow: React.FC<NeonGlowProps> = ({
  children,
  color = DesignTokens.colors.primary[500],
  intensity = 10,
  duration = 2000,
  style,
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false, // shadowRadius doesn't support native driver
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    glow.start();

    return () => glow.stop();
  }, [glowAnim, duration]);

  const animatedShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, intensity],
  });

  const animatedOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: animatedOpacity,
          shadowRadius: animatedShadowRadius,
          elevation: intensity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Tattoo Needle Drawing Animation
export interface TattooDrawingProps {
  paths: Array<{ x: number; y: number }[]>;
  color?: string;
  strokeWidth?: number;
  duration?: number;
  style?: any;
  onComplete?: () => void;
}

export const TattooDrawing: React.FC<TattooDrawingProps> = ({
  paths,
  color = DesignTokens.colors.primary[500],
  strokeWidth = 2,
  duration = 3000,
  style,
  onComplete,
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drawing = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    drawing.start(onComplete);
    sparkle.start();

    return () => {
      drawing.stop();
      sparkle.stop();
    };
  }, [progress, sparkleOpacity, duration, onComplete]);

  // This would need SVG implementation for actual path drawing
  // For now, showing animated dots that follow the path
  return (
    <View style={[styles.drawingContainer, style]}>
      {paths.map((path, pathIndex) =>
        path.map((point, pointIndex) => {
          const animatedOpacity = progress.interpolate({
            inputRange: [
              (pathIndex * path.length + pointIndex) / paths.flat().length,
              (pathIndex * path.length + pointIndex + 1) / paths.flat().length,
            ],
            outputRange: [0, 1],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={`${pathIndex}-${pointIndex}`}
              style={[
                styles.drawingPoint,
                {
                  left: point.x,
                  top: point.y,
                  width: strokeWidth * 2,
                  height: strokeWidth * 2,
                  backgroundColor: color,
                  opacity: animatedOpacity,
                },
              ]}
            />
          );
        }),
      )}
    </View>
  );
};

// Spring Bounce Animation
export const useSpringBounce = (
  trigger: boolean,
  toValue: number = 1,
  fromValue: number = 0,
) => {
  const springAnim = useRef(new Animated.Value(fromValue)).current;

  useEffect(() => {
    if (trigger) {
      Animated.spring(springAnim, {
        toValue,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      springAnim.setValue(fromValue);
    }
  }, [trigger, toValue, fromValue, springAnim]);

  return springAnim;
};

// Ink Splatter Animation
export interface InkSplatterProps {
  trigger: boolean;
  color?: string;
  size?: number;
  style?: any;
}

export const InkSplatter: React.FC<InkSplatterProps> = ({
  trigger,
  color = DesignTokens.colors.primary[500],
  size = 50,
  style,
}) => {
  const splatterAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;

  useEffect(() => {
    if (trigger) {
      const animations = splatterAnimations.map((splatter, index) => {
        const angle = (index * Math.PI * 2) / splatterAnimations.length;
        const distance = 20 + Math.random() * 30;

        return Animated.parallel([
          Animated.timing(splatter.scale, {
            toValue: 0.5 + Math.random() * 0.8,
            duration: 300 + Math.random() * 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(splatter.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 400 + Math.random() * 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(splatter.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 400 + Math.random() * 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(splatter.opacity, {
            toValue: 0,
            duration: 800 + Math.random() * 400,
            delay: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        // Reset animations
        splatterAnimations.forEach((splatter) => {
          splatter.scale.setValue(0);
          splatter.translateX.setValue(0);
          splatter.translateY.setValue(0);
          splatter.opacity.setValue(1);
        });
      });
    }
  }, [trigger, splatterAnimations]);

  return (
    <View style={[styles.splatterContainer, style]} pointerEvents="none">
      {splatterAnimations.map((splatter, index) => (
        <Animated.View
          key={index}
          style={[
            styles.splatterDrop,
            {
              width: size * (0.3 + Math.random() * 0.4),
              height: size * (0.3 + Math.random() * 0.4),
              backgroundColor: color,
              transform: [
                { scale: splatter.scale },
                { translateX: splatter.translateX },
                { translateY: splatter.translateY },
              ],
              opacity: splatter.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Page Transition Animation
export const usePageTransition = (isVisible: boolean) => {
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : width)).current;
  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isVisible ? 0 : width,
        duration: DesignTokens.animation.duration[300],
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isVisible ? 1 : 0,
        duration: DesignTokens.animation.duration[300],
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, slideAnim, fadeAnim]);

  return { slideAnim, fadeAnim };
};

// Morphing Shapes Animation
export interface MorphingShapeProps {
  shapes: Array<{ width: number; height: number; borderRadius: number }>;
  duration?: number;
  color?: string;
  style?: any;
}

export const MorphingShape: React.FC<MorphingShapeProps> = ({
  shapes,
  duration = 2000,
  color = DesignTokens.colors.accent.electric,
  style,
}) => {
  const morphAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const morph = Animated.loop(
      Animated.timing(morphAnim, {
        toValue: shapes.length - 1,
        duration: duration * shapes.length,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }),
    );

    morph.start();

    return () => morph.stop();
  }, [morphAnim, shapes, duration]);

  const animatedWidth = morphAnim.interpolate({
    inputRange: shapes.map((_, index) => index),
    outputRange: shapes.map((shape) => shape.width),
  });

  const animatedHeight = morphAnim.interpolate({
    inputRange: shapes.map((_, index) => index),
    outputRange: shapes.map((shape) => shape.height),
  });

  const animatedBorderRadius = morphAnim.interpolate({
    inputRange: shapes.map((_, index) => index),
    outputRange: shapes.map((shape) => shape.borderRadius),
  });

  return (
    <Animated.View
      style={[
        style,
        {
          width: animatedWidth,
          height: animatedHeight,
          borderRadius: animatedBorderRadius,
          backgroundColor: color,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: "absolute",
    borderRadius: 9999,
  },
  drawingContainer: {
    position: "relative",
  },
  drawingPoint: {
    position: "absolute",
    borderRadius: 9999,
  },
  splatterContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  splatterDrop: {
    position: "absolute",
    borderRadius: 9999,
  },
});

export default {
  FloatingParticles,
  usePulseAnimation,
  NeonGlow,
  TattooDrawing,
  useSpringBounce,
  InkSplatter,
  usePageTransition,
  MorphingShape,
};
