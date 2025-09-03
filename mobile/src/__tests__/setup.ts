/**
 * 🧪 Tattoo Journey 2.0 - Jest Test Setup
 *
 * Global test configuration and mocks
 */

import "react-native-gesture-handler/jestSetup";

// Mock React Native modules
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");

  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Firebase modules
jest.mock("@react-native-firebase/app", () => ({
  apps: [],
  initializeApp: jest.fn(),
}));

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
  }),
}));

jest.mock("@react-native-firebase/firestore", () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({ id: "mock-doc-id" })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
  }),
}));

jest.mock("@react-native-firebase/storage", () => ({
  __esModule: true,
  default: () => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(() => Promise.resolve()),
      getDownloadURL: jest.fn(() =>
        Promise.resolve("https://example.com/image.jpg"),
      ),
    })),
  }),
}));

jest.mock("@react-native-firebase/database", () => ({
  __esModule: true,
  default: () => ({
    ref: jest.fn(() => ({
      set: jest.fn(() => Promise.resolve()),
      once: jest.fn(() => Promise.resolve({ val: () => null })),
      on: jest.fn(),
      off: jest.fn(),
    })),
  }),
}));

// Mock Geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn((success) =>
    Promise.resolve(
      success({
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }),
    ),
  ),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
};

// @ts-ignore
global.navigator.geolocation = mockGeolocation;

// Mock Image Picker
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      assets: [
        {
          uri: "file://mock-image.jpg",
          type: "image/jpeg",
          fileSize: 1024,
        },
      ],
    });
  }),
  launchCamera: jest.fn((options, callback) => {
    callback({
      assets: [
        {
          uri: "file://mock-camera.jpg",
          type: "image/jpeg",
          fileSize: 2048,
        },
      ],
    });
  }),
}));

// Mock Permissions
jest.mock("react-native-permissions", () => ({
  check: jest.fn(() => Promise.resolve("granted")),
  request: jest.fn(() => Promise.resolve("granted")),
  PERMISSIONS: {
    IOS: {
      CAMERA: "ios.permission.CAMERA",
      LOCATION_WHEN_IN_USE: "ios.permission.LOCATION_WHEN_IN_USE",
    },
    ANDROID: {
      CAMERA: "android.permission.CAMERA",
      ACCESS_FINE_LOCATION: "android.permission.ACCESS_FINE_LOCATION",
    },
  },
  RESULTS: {
    GRANTED: "granted",
    DENIED: "denied",
    BLOCKED: "blocked",
  },
}));

// Mock Crashlytics
jest.mock("@react-native-firebase/crashlytics", () => ({
  __esModule: true,
  default: () => ({
    recordError: jest.fn(),
    log: jest.fn(),
    setUserId: jest.fn(),
    setAttributes: jest.fn(),
    crash: jest.fn(),
  }),
}));

// Mock Analytics
jest.mock("@react-native-firebase/analytics", () => ({
  __esModule: true,
  default: () => ({
    logEvent: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
    setUserProperties: jest.fn(() => Promise.resolve()),
    setCurrentScreen: jest.fn(() => Promise.resolve()),
  }),
}));

// Global test timeout
jest.setTimeout(10000);

// Console error suppression for known warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
        args[0].includes("Warning: Each child in a list should have a unique"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("componentWillReceiveProps has been renamed")
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  }),
) as jest.Mock;
