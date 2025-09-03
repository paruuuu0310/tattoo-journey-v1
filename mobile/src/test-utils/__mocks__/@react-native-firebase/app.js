// Mock for @react-native-firebase/app

const mockFirebaseApp = {
  options: {
    projectId: "test-tattoo-journey",
    storageBucket: "test-tattoo-journey.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:test123",
    apiKey: "test-api-key-for-firebase",
  },
};

const mockFirebase = {
  app: jest.fn(() => mockFirebaseApp),
  initializeApp: jest.fn(),
};

module.exports = {
  firebase: mockFirebase,
  default: mockFirebase,
};
