export default () => ({
  currentUser: null,
  signInAnonymously: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: {
        uid: "mock-user-id",
        email: "test@example.com",
      },
    }),
  ),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: {
        uid: "mock-user-id",
        email: "test@example.com",
      },
    }),
  ),
});
