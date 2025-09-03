const IS_DEV = process.env.APP_ENV === "development";
const IS_STAGING = process.env.APP_ENV === "staging";

export default {
  expo: {
    name: IS_DEV
      ? "Tattoo Journey (Dev)"
      : IS_STAGING
        ? "Tattoo Journey (Staging)"
        : "Tattoo Journey",
    slug: "tattoo-journey",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "tattoo-journey",
    assetBundlePatterns: ["**/*"],

    ios: {
      bundleIdentifier: IS_DEV
        ? "com.karamon.tattoojourney.dev"
        : IS_STAGING
          ? "com.karamon.tattoojourney.staging"
          : "com.karamon.tattoojourney",
      buildNumber: process.env.BUILD_NUMBER || "1",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "このアプリは近くのタトゥーアーティストを見つけるために位置情報を使用します。",
        NSCameraUsageDescription:
          "タトゥーデザインの写真を撮影するためにカメラを使用します。",
        NSPhotoLibraryUsageDescription:
          "デザイン画像を選択するためにフォトライブラリへのアクセスが必要です。",
      },
    },

    android: {
      package: IS_DEV
        ? "com.karamon.tattoojourney.dev"
        : IS_STAGING
          ? "com.karamon.tattoojourney.staging"
          : "com.karamon.tattoojourney",
      versionCode: parseInt(process.env.BUILD_NUMBER || "1"),
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
      googleServicesFile: IS_DEV
        ? "./google-services.dev.json"
        : IS_STAGING
          ? "./google-services.staging.json"
          : "./google-services.json",
    },

    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/firestore",
      "@react-native-firebase/storage",
      "@react-native-firebase/analytics",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/messaging",
      "expo-location",
      [
        "expo-image-picker",
        {
          photosPermission:
            "デザイン画像を選択するためにフォトライブラリへのアクセスが必要です。",
          cameraPermission:
            "タトゥーデザインの写真を撮影するためにカメラを使用します。",
        },
      ],
    ],

    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      firebaseConfig: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      },
    },

    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    },

    runtimeVersion: {
      policy: "sdkVersion",
    },
  },
};
