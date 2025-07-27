// Simple Jest setup for basic testing

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock console methods to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Basic test utilities
global.mockApiResponse = (data, status = 200) => {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
};

global.mockApiError = (error, status = 500) => {
  global.fetch.mockRejectedValueOnce(new Error(error));
};
