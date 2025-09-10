import '@testing-library/jest-dom';

// Polyfill ResizeObserver for tests
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
});
