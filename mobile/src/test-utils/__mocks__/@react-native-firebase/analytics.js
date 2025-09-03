export default () => ({
  logEvent: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  setUserProperties: jest.fn(() => Promise.resolve()),
  setCurrentScreen: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  resetAnalyticsData: jest.fn(() => Promise.resolve()),
  setDefaultEventParameters: jest.fn(() => Promise.resolve()),
  getAppInstanceId: jest.fn(() => Promise.resolve("mock-app-instance-id")),
});
