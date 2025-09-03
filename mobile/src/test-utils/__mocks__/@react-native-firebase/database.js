export default () => ({
  ref: jest.fn(() => ({
    once: jest.fn(() =>
      Promise.resolve({
        exists: () => true,
        val: () => ({ message: "Test data" }),
        key: "mock-key",
      }),
    ),
    on: jest.fn((event, callback) => {
      callback({
        exists: () => true,
        val: () => ({ message: "Test data" }),
        key: "mock-key",
      });
      return jest.fn(); // unsubscribe
    }),
    off: jest.fn(),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => Promise.resolve({ key: "mock-push-key" })),
    child: jest.fn((path) => ({
      once: jest.fn(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ data: "child data" }),
          key: path,
        }),
      ),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
    })),
    orderByChild: jest.fn(() => ({
      equalTo: jest.fn(() => ({
        once: jest.fn(() =>
          Promise.resolve({
            exists: () => true,
            val: () => ({ filtered: "data" }),
          }),
        ),
      })),
    })),
    limitToFirst: jest.fn(() => ({
      once: jest.fn(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ limited: "data" }),
        }),
      ),
    })),
    limitToLast: jest.fn(() => ({
      once: jest.fn(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ limited: "data" }),
        }),
      ),
    })),
  })),
  goOnline: jest.fn(),
  goOffline: jest.fn(),
  ServerValue: {
    TIMESTAMP: {
      ".sv": "timestamp",
    },
  },
});
