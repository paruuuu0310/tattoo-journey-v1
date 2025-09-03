export default () => ({
  recordError: jest.fn(() => Promise.resolve()),
  log: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  setCustomKey: jest.fn(() => Promise.resolve()),
  setAttributes: jest.fn(() => Promise.resolve()),
  crash: jest.fn(() => Promise.resolve()),
  checkForUnsentReports: jest.fn(() => Promise.resolve(false)),
  deleteUnsentReports: jest.fn(() => Promise.resolve()),
  didCrashOnPreviousExecution: jest.fn(() => Promise.resolve(false)),
  sendUnsentReports: jest.fn(() => Promise.resolve()),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
});
