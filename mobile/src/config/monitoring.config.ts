/**
 * Monitoring Configuration for Tattoo Journey
 * 株式会社からもん - Karamon Inc.
 */

export interface MonitoringConfig {
  crashlytics: {
    enabled: boolean;
    collectUserIds: boolean;
    collectCustomAttributes: boolean;
  };
  analytics: {
    enabled: boolean;
    trackScreenViews: boolean;
    trackUserEngagement: boolean;
    debugMode: boolean;
  };
  performance: {
    enabled: boolean;
    traceNetworkRequests: boolean;
    traceScreenRenders: boolean;
    customTraces: boolean;
  };
  healthCheck: {
    enabled: boolean;
    intervalMs: number;
    reportThresholds: {
      memoryUsageWarningMB: number;
      responseTimeWarningMs: number;
      errorRateWarning: number;
    };
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableConsole: boolean;
    enableRemote: boolean;
    bufferSize: number;
  };
}

// Development configuration
const developmentConfig: MonitoringConfig = {
  crashlytics: {
    enabled: false,
    collectUserIds: false,
    collectCustomAttributes: true,
  },
  analytics: {
    enabled: false,
    trackScreenViews: true,
    trackUserEngagement: false,
    debugMode: true,
  },
  performance: {
    enabled: true,
    traceNetworkRequests: true,
    traceScreenRenders: true,
    customTraces: true,
  },
  healthCheck: {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    reportThresholds: {
      memoryUsageWarningMB: 150,
      responseTimeWarningMs: 3000,
      errorRateWarning: 0.05,
    },
  },
  logging: {
    level: "debug",
    enableConsole: true,
    enableRemote: false,
    bufferSize: 100,
  },
};

// Staging configuration
const stagingConfig: MonitoringConfig = {
  crashlytics: {
    enabled: true,
    collectUserIds: true,
    collectCustomAttributes: true,
  },
  analytics: {
    enabled: true,
    trackScreenViews: true,
    trackUserEngagement: true,
    debugMode: true,
  },
  performance: {
    enabled: true,
    traceNetworkRequests: true,
    traceScreenRenders: true,
    customTraces: true,
  },
  healthCheck: {
    enabled: true,
    intervalMs: 60000, // 1 minute
    reportThresholds: {
      memoryUsageWarningMB: 200,
      responseTimeWarningMs: 5000,
      errorRateWarning: 0.02,
    },
  },
  logging: {
    level: "info",
    enableConsole: false,
    enableRemote: true,
    bufferSize: 500,
  },
};

// Production configuration
const productionConfig: MonitoringConfig = {
  crashlytics: {
    enabled: true,
    collectUserIds: true,
    collectCustomAttributes: true,
  },
  analytics: {
    enabled: true,
    trackScreenViews: true,
    trackUserEngagement: true,
    debugMode: false,
  },
  performance: {
    enabled: true,
    traceNetworkRequests: true,
    traceScreenRenders: false, // Disabled in production for performance
    customTraces: true,
  },
  healthCheck: {
    enabled: true,
    intervalMs: 300000, // 5 minutes
    reportThresholds: {
      memoryUsageWarningMB: 300,
      responseTimeWarningMs: 10000,
      errorRateWarning: 0.01,
    },
  },
  logging: {
    level: "warn",
    enableConsole: false,
    enableRemote: true,
    bufferSize: 1000,
  },
};

// Get configuration based on environment
export const getMonitoringConfig = (): MonitoringConfig => {
  const env = process.env.NODE_ENV || "development";
  const appEnv = process.env.APP_ENV || "development";

  switch (appEnv) {
    case "production":
      return productionConfig;
    case "staging":
      return stagingConfig;
    case "development":
    default:
      return developmentConfig;
  }
};

// Monitoring event names and parameters
export const MonitoringEvents = {
  // Authentication events
  AUTH_LOGIN_SUCCESS: "auth_login_success",
  AUTH_LOGIN_FAILED: "auth_login_failed",
  AUTH_LOGOUT: "auth_logout",
  AUTH_SIGNUP_SUCCESS: "auth_signup_success",
  AUTH_SIGNUP_FAILED: "auth_signup_failed",

  // Onboarding events
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",

  // Search and matching events
  SEARCH_INITIATED: "search_initiated",
  SEARCH_COMPLETED: "search_completed",
  SEARCH_FAILED: "search_failed",
  IMAGE_UPLOADED: "image_uploaded",
  MATCHING_RESULTS_VIEWED: "matching_results_viewed",
  ARTIST_PROFILE_VIEWED: "artist_profile_viewed",

  // Chat and communication events
  CHAT_OPENED: "chat_opened",
  MESSAGE_SENT: "message_sent",
  MESSAGE_RECEIVED: "message_received",
  INQUIRY_SENT: "inquiry_sent",

  // Booking events
  BOOKING_INITIATED: "booking_initiated",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_COMPLETED: "booking_completed",

  // Review events
  REVIEW_STARTED: "review_started",
  REVIEW_SUBMITTED: "review_submitted",
  REVIEW_VIEWED: "review_viewed",

  // Error events
  ERROR_NETWORK: "error_network",
  ERROR_FIREBASE: "error_firebase",
  ERROR_LOCATION: "error_location",
  ERROR_CAMERA: "error_camera",
  ERROR_UNKNOWN: "error_unknown",

  // Performance events
  APP_LAUNCH: "app_launch",
  SCREEN_LOAD_TIME: "screen_load_time",
  API_RESPONSE_TIME: "api_response_time",
  IMAGE_LOAD_TIME: "image_load_time",

  // User engagement events
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  FEATURE_USED: "feature_used",
  TUTORIAL_VIEWED: "tutorial_viewed",
} as const;

// Performance trace names
export const PerformanceTraces = {
  APP_STARTUP: "app_startup",
  SCREEN_RENDER: "screen_render",
  API_REQUEST: "api_request",
  IMAGE_UPLOAD: "image_upload",
  SEARCH_PROCESS: "search_process",
  AUTHENTICATION: "authentication",
  DATABASE_QUERY: "database_query",
} as const;

// Custom attributes for monitoring
export const MonitoringAttributes = {
  USER_TYPE: "user_type",
  FEATURE_FLAG: "feature_flag",
  AB_TEST_VARIANT: "ab_test_variant",
  DEVICE_TYPE: "device_type",
  NETWORK_TYPE: "network_type",
  APP_VERSION: "app_version",
  BUILD_NUMBER: "build_number",
} as const;

// Error categories
export const ErrorCategories = {
  NETWORK: "network",
  AUTHENTICATION: "authentication",
  LOCATION: "location",
  CAMERA: "camera",
  STORAGE: "storage",
  PERMISSION: "permission",
  VALIDATION: "validation",
  UNKNOWN: "unknown",
} as const;

export default {
  getMonitoringConfig,
  MonitoringEvents,
  PerformanceTraces,
  MonitoringAttributes,
  ErrorCategories,
};
