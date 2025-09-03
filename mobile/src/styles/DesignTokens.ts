// Design Tokens for Tattoo Journey Mobile App
export const DesignTokens = {
  // Color Palette - Dark theme focused
  colors: {
    // Primary Colors - Tattoo red theme
    primary: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#ff6b6b", // Main brand color
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519",
    },

    // Secondary Colors - Grays
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },

    // Accent Colors - Tattoo themed
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
    success: "#10b981", // Green
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
  },

  // Typography
  typography: {
    fonts: {
      primary: "System", // Default system font
      mono: "Menlo", // Monospace font
    },

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
    },

    weights: {
      thin: "100",
      extraLight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },

    lineHeights: {
      none: 1,
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2,
    },
  },

  // Spacing System (based on 4px grid)
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
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  },

  // Border Radius
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

  // Shadows
  shadows: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 16,
    },
  },

  // Animation
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    },
  },

  // Z-Index
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
};
