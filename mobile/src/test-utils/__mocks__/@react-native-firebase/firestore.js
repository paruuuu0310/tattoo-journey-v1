export default () => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          exists: true,
          data: () => ({ name: "Test User" }),
        }),
      ),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      onSnapshot: jest.fn((callback) => {
        callback({
          exists: true,
          data: () => ({ name: "Test User" }),
        });
        return jest.fn(); // unsubscribe function
      }),
    })),
    add: jest.fn(() => Promise.resolve({ id: "mock-doc-id" })),
    get: jest.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "mock-doc-id",
            data: () => ({ name: "Test Data" }),
          },
        ],
      }),
    ),
    where: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          docs: [],
        }),
      ),
    })),
    orderBy: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          docs: [],
        }),
      ),
    })),
    limit: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          docs: [],
        }),
      ),
    })),
  })),
  doc: jest.fn(() => ({
    get: jest.fn(() =>
      Promise.resolve({
        exists: true,
        data: () => ({ name: "Test Document" }),
      }),
    ),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
  runTransaction: jest.fn(() => Promise.resolve()),
  FieldValue: {
    serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
    delete: jest.fn(() => "DELETE_FIELD"),
    increment: jest.fn((value) => `INCREMENT(${value})`),
    arrayUnion: jest.fn((...values) => `ARRAY_UNION(${values.join(",")})`),
    arrayRemove: jest.fn((...values) => `ARRAY_REMOVE(${values.join(",")})`),
  },
});
