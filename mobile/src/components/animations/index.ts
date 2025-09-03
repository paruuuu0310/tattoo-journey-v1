// Tattoo Journey 2.0 Animation Library
// Creative animations inspired by tattoo art and ink culture

// Basic Animations
export {
  FloatingParticles,
  usePulseAnimation,
  NeonGlow,
  TattooDrawing,
  useSpringBounce,
  InkSplatter,
  usePageTransition,
  MorphingShape,
} from "./TattooAnimations";

export type {
  FloatingParticlesProps,
  NeonGlowProps,
  TattooDrawingProps,
  InkSplatterProps,
  MorphingShapeProps,
} from "./TattooAnimations";

// Interactive Animations
export {
  InteractiveCard,
  ElasticButton,
  MagnifyingGlass,
  ParallaxScroll,
  RippleEffect,
} from "./InteractiveAnimations";

export type {
  InteractiveCardProps,
  ElasticButtonProps,
  MagnifyingGlassProps,
  ParallaxScrollProps,
  RippleEffectProps,
} from "./InteractiveAnimations";

// Animation Utilities
export const AnimationUtils = {
  // Duration presets
  durations: {
    quick: 150,
    fast: 250,
    normal: 350,
    slow: 500,
    veryLow: 800,
  },

  // Easing presets
  easings: {
    bounceOut: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    elasticOut: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    backOut: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    tattooInk: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth ink flow
    needlePunch: "cubic-bezier(0.55, 0.085, 0.68, 0.53)", // Sharp needle motion
  },

  // Common animation sequences
  sequences: {
    // Fade in with slight bounce
    fadeInBounce: {
      from: { opacity: 0, scale: 0.8 },
      to: { opacity: 1, scale: 1 },
      duration: 400,
      easing: "elasticOut",
    },

    // Slide in from bottom
    slideInBottom: {
      from: { translateY: 100, opacity: 0 },
      to: { translateY: 0, opacity: 1 },
      duration: 350,
      easing: "tattooInk",
    },

    // Neon glow pulse
    neonPulse: {
      from: { shadowRadius: 5, opacity: 0.7 },
      to: { shadowRadius: 20, opacity: 1 },
      duration: 1000,
      loop: true,
      easing: "tattooInk",
    },

    // Ink drop effect
    inkDrop: {
      from: { scale: 0, opacity: 1 },
      to: { scale: 1.2, opacity: 0 },
      duration: 600,
      easing: "needlePunch",
    },
  },

  // Color animation helpers
  colors: {
    // Interpolate between tattoo-inspired colors
    tattooSpectrum: [
      "#ff6b6b", // Brand red
      "#00f5ff", // Electric blue
      "#39ff14", // Neon green
      "#ffd700", // Gold
      "#8a2be2", // Violet
      "#ff6b35", // Coral
    ],

    // Neon colors for glowing effects
    neonColors: [
      "#ff0080", // Hot pink
      "#00ffff", // Cyan
      "#ffff00", // Yellow
      "#ff8000", // Orange
      "#8000ff", // Purple
    ],
  },

  // Gesture response configs
  gestures: {
    // Card swipe sensitivity
    swipeThreshold: {
      distance: 100,
      velocity: 1000,
    },

    // Button press response
    buttonPress: {
      scaleDown: 0.95,
      duration: 150,
      springConfig: {
        tension: 300,
        friction: 10,
      },
    },

    // Interactive card physics
    cardPhysics: {
      tension: 40,
      friction: 4,
      mass: 1,
    },
  },

  // Particle system configs
  particles: {
    // Floating ink particles
    inkParticles: {
      count: 25,
      size: { min: 2, max: 6 },
      speed: { min: 2000, max: 5000 },
      colors: ["#ff6b6b", "#00f5ff", "#39ff14"],
    },

    // Sparkle effect
    sparkles: {
      count: 12,
      size: { min: 1, max: 3 },
      speed: { min: 500, max: 1500 },
      colors: ["#ffd700", "#ffff00", "#ffffff"],
    },
  },
};

// Pre-built animation combinations
export const AnimationPresets = {
  // Hero section entrance
  heroEntrance: {
    title: {
      delay: 0,
      ...AnimationUtils.sequences.slideInBottom,
    },
    subtitle: {
      delay: 200,
      ...AnimationUtils.sequences.fadeInBounce,
    },
    button: {
      delay: 400,
      ...AnimationUtils.sequences.slideInBottom,
    },
  },

  // Card reveal animation
  cardReveal: {
    card: {
      delay: 0,
      from: { scale: 0, rotate: "45deg", opacity: 0 },
      to: { scale: 1, rotate: "0deg", opacity: 1 },
      duration: 500,
      easing: AnimationUtils.easings.bounceOut,
    },
    content: {
      delay: 200,
      ...AnimationUtils.sequences.fadeInBounce,
    },
  },

  // Artist profile entrance
  artistProfileEntrance: {
    avatar: {
      delay: 0,
      from: { scale: 0, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      duration: 400,
      easing: AnimationUtils.easings.elasticOut,
    },
    name: {
      delay: 200,
      ...AnimationUtils.sequences.slideInBottom,
    },
    rating: {
      delay: 300,
      ...AnimationUtils.sequences.fadeInBounce,
    },
    portfolio: {
      delay: 500,
      stagger: 100,
      ...AnimationUtils.sequences.slideInBottom,
    },
  },

  // Search results animation
  searchResults: {
    container: {
      delay: 0,
      ...AnimationUtils.sequences.fadeInBounce,
    },
    items: {
      stagger: 80,
      from: { translateX: -50, opacity: 0 },
      to: { translateX: 0, opacity: 1 },
      duration: 300,
      easing: AnimationUtils.easings.tattooInk,
    },
  },

  // Booking flow animations
  bookingFlow: {
    step: {
      enter: {
        from: { translateX: 100, opacity: 0 },
        to: { translateX: 0, opacity: 1 },
        duration: 350,
        easing: AnimationUtils.easings.tattooInk,
      },
      exit: {
        from: { translateX: 0, opacity: 1 },
        to: { translateX: -100, opacity: 0 },
        duration: 250,
        easing: AnimationUtils.easings.needlePunch,
      },
    },
    progress: {
      fill: {
        duration: 500,
        easing: AnimationUtils.easings.tattooInk,
      },
    },
  },

  // Review submission celebration
  reviewCelebration: {
    success: {
      scale: {
        from: { scale: 0 },
        to: { scale: 1 },
        duration: 400,
        easing: AnimationUtils.easings.elasticOut,
      },
      particles: {
        trigger: true,
        count: 20,
        duration: 2000,
      },
    },
  },
};

// Animation performance helpers
export const AnimationPerformance = {
  // Check if device can handle complex animations
  shouldUseReducedMotion: () => {
    // This would check device performance and user preferences
    // For now, return false (enable all animations)
    return false;
  },

  // Get appropriate animation duration based on device performance
  getOptimizedDuration: (baseDuration: number) => {
    const shouldReduce = AnimationPerformance.shouldUseReducedMotion();
    return shouldReduce ? baseDuration * 0.5 : baseDuration;
  },

  // Enable/disable native driver based on animation type
  shouldUseNativeDriver: (
    animationType: "transform" | "opacity" | "layout",
  ) => {
    return animationType !== "layout";
  },
};
