// Design Tokens for Tattoo Journey 2.0 - Art-inspired Design System

export const DesignTokens = {
  // Color Palette - Inspired by traditional tattoo ink colors
  colors: {
    // Primary Colors - Bold tattoo inks
    primary: {
      50: "#fff1f2", // Very light pink
      100: "#ffe4e6", // Light pink
      200: "#fecdd3", // Soft pink
      300: "#fda4af", // Medium pink
      400: "#fb7185", // Bright pink
      500: "#ff6b6b", // Main brand red (tattoo red)
      600: "#e11d48", // Dark red
      700: "#be123c", // Deeper red
      800: "#9f1239", // Deep burgundy
      900: "#881337", // Very dark red
      950: "#4c0519", // Almost black red
    },

    // Secondary Colors - Classic tattoo palette
    secondary: {
      50: "#f8fafc", // Near white
      100: "#f1f5f9", // Very light gray
      200: "#e2e8f0", // Light gray
      300: "#cbd5e1", // Medium gray
      400: "#94a3b8", // Gray
      500: "#64748b", // Dark gray
      600: "#475569", // Darker gray
      700: "#334155", // Deep gray
      800: "#1e293b", // Very dark gray
      900: "#0f172a", // Almost black
      950: "#020617", // Pure black
    },

    // Accent Colors - Traditional tattoo colors
    accent: {
      electric: "#00f5ff", // Electric blue
      neon: "#39ff14", // Neon green
      gold: "#ffd700", // Gold
      violet: "#8a2be2", // Blue violet
      amber: "#ffbf00", // Amber
      emerald: "#50c878", // Emerald
      coral: "#ff6b35", // Coral
      turquoise: "#40e0d0", // Turquoise
    },

    // Semantic Colors
    success: "#10b981", // Emerald green
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
    info: "#3b82f6", // Blue

    // Dark Theme Base
    dark: {
      background: "#1a1a1a", // Main dark background
      surface: "#2a2a2a", // Card/surface background
      elevated: "#333333", // Elevated surfaces
      border: "#404040", // Borders and dividers
      text: {
        primary: "#ffffff", // Primary text
        secondary: "#cccccc", // Secondary text
        tertiary: "#aaaaaa", // Tertiary text
        disabled: "#666666", // Disabled text
      },
    },

    // Gradient Combinations
    gradients: {
      primary: ["#ff6b6b", "#e11d48"], // Red gradient
      secondary: ["#1a1a1a", "#2a2a2a"], // Dark gradient
      accent: ["#00f5ff", "#8a2be2"], // Electric gradient
      sunset: ["#ff6b6b", "#ffd700", "#ff6b35"], // Sunset gradient
      ocean: ["#00f5ff", "#40e0d0", "#10b981"], // Ocean gradient
      fire: ["#ff6b6b", "#ff6b35", "#ffd700"], // Fire gradient
    },
  },

  // Typography - Inspired by tattoo lettering styles
  typography: {
    // Font Families
    fonts: {
      primary: "Inter", // Clean, modern sans-serif
      secondary: "RobotoMono", // Monospace for technical info
      display: "PressStart2P", // Pixelated display font (needs installation)
      script: "DancingScript", // Script font for artistic elements
    },

    // Font Sizes
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 28,
      "4xl": 32,
      "5xl": 36,
      "6xl": 48,
      "7xl": 60,
      "8xl": 72,
      "9xl": 96,
    },

    // Font Weights
    weights: {
      thin: "100" as const,
      extraLight: "200" as const,
      light: "300" as const,
      normal: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
      extrabold: "800" as const,
      black: "900" as const,
    },

    // Line Heights
    lineHeights: {
      none: 1,
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
      tighter: -0.8,
      tight: -0.4,
      normal: 0,
      wide: 0.4,
      wider: 0.8,
      widest: 1.6,
    },
  },

  // Spacing System
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },

  // Border Radius - Inspired by organic/artistic shapes
  radius: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    "2xl": 16,
    "3xl": 24,
    full: 9999,
  },

  // Shadows - Dramatic lighting effects
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",

    // Neon/Glow effects
    neon: {
      primary: "0 0 10px #ff6b6b, 0 0 20px #ff6b6b, 0 0 30px #ff6b6b",
      secondary: "0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 30px #00f5ff",
      success: "0 0 10px #10b981, 0 0 20px #10b981, 0 0 30px #10b981",
      warning: "0 0 10px #f59e0b, 0 0 20px #f59e0b, 0 0 30px #f59e0b",
    },
  },

  // Animation & Timing
  animation: {
    // Duration
    duration: {
      75: 75,
      100: 100,
      150: 150,
      200: 200,
      300: 300,
      500: 500,
      700: 700,
      1000: 1000,
    },

    // Easing
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",

      // Custom easing for artistic animations
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      backOut: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },

    // Transform origins
    origin: {
      center: "center",
      top: "top",
      right: "right",
      bottom: "bottom",
      left: "left",
      topLeft: "top left",
      topRight: "top right",
      bottomLeft: "bottom left",
      bottomRight: "bottom right",
    },
  },

  // Z-Index Stack
  zIndex: {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  // Component-specific tokens
  components: {
    // Button variants
    button: {
      sizes: {
        xs: { height: 28, paddingHorizontal: 12, fontSize: 12 },
        sm: { height: 32, paddingHorizontal: 16, fontSize: 14 },
        md: { height: 40, paddingHorizontal: 20, fontSize: 16 },
        lg: { height: 48, paddingHorizontal: 24, fontSize: 18 },
        xl: { height: 56, paddingHorizontal: 28, fontSize: 20 },
      },
    },

    // Input variants
    input: {
      sizes: {
        sm: { height: 32, paddingHorizontal: 12, fontSize: 14 },
        md: { height: 40, paddingHorizontal: 16, fontSize: 16 },
        lg: { height: 48, paddingHorizontal: 20, fontSize: 18 },
      },
    },

    // Card variants
    card: {
      padding: {
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
      },
    },
  },

  // Iconography
  icons: {
    sizes: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      "2xl": 48,
    },
  },
};

// Utility functions for design tokens
export const getColor = (colorPath: string): string => {
  const path = colorPath.split(".");
  let result: any = DesignTokens.colors;

  for (const key of path) {
    result = result[key];
    if (result === undefined) {
      console.warn(`Color not found: ${colorPath}`);
      return DesignTokens.colors.primary[500];
    }
  }

  return result;
};

export const getSpacing = (size: keyof typeof DesignTokens.spacing): number => {
  return DesignTokens.spacing[size] || 0;
};

export const getFontSize = (
  size: keyof typeof DesignTokens.typography.sizes,
): number => {
  return (
    DesignTokens.typography.sizes[size] || DesignTokens.typography.sizes.base
  );
};

export const getShadow = (size: keyof typeof DesignTokens.shadows): string => {
  const shadow = DesignTokens.shadows[size];
  if (typeof shadow === "string") {
    return shadow;
  }
  return DesignTokens.shadows.none as string;
};

export const getRadius = (size: keyof typeof DesignTokens.radius): number => {
  return DesignTokens.radius[size] || DesignTokens.radius.base;
};
