export default () => ({
  ref: jest.fn(() => ({
    putFile: jest.fn(() =>
      Promise.resolve({
        state: "success",
        downloadURL: "https://mock-download-url.com/image.jpg",
      }),
    ),
    putString: jest.fn(() =>
      Promise.resolve({
        state: "success",
        downloadURL: "https://mock-download-url.com/data.txt",
      }),
    ),
    put: jest.fn(() =>
      Promise.resolve({
        state: "success",
        downloadURL: "https://mock-download-url.com/file",
      }),
    ),
    getDownloadURL: jest.fn(() =>
      Promise.resolve("https://mock-download-url.com/file"),
    ),
    delete: jest.fn(() => Promise.resolve()),
    listAll: jest.fn(() =>
      Promise.resolve({
        items: [],
        prefixes: [],
      }),
    ),
    getMetadata: jest.fn(() =>
      Promise.resolve({
        name: "mock-file.jpg",
        size: 12345,
        timeCreated: "2023-01-01T00:00:00.000Z",
      }),
    ),
    updateMetadata: jest.fn(() => Promise.resolve()),
    child: jest.fn((path) => ({
      putFile: jest.fn(() =>
        Promise.resolve({
          state: "success",
          downloadURL: `https://mock-download-url.com/${path}`,
        }),
      ),
      getDownloadURL: jest.fn(() =>
        Promise.resolve(`https://mock-download-url.com/${path}`),
      ),
      delete: jest.fn(() => Promise.resolve()),
    })),
  })),
});
