import '@testing-library/jest-dom';

// // Mock ResizeObserver for testing
// declare const global: any;
// global.ResizeObserver = global.jest?.fn?.() || (() => ({
//   observe: () => {},
//   unobserve: () => {},
//   disconnect: () => {},
// }));

// // Mock window.matchMedia for responsive design tests
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: (query: string) => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: () => {}, // deprecated
//     removeListener: () => {}, // deprecated
//     addEventListener: () => {},
//     removeEventListener: () => {},
//     dispatchEvent: () => {},
//   }),
// });

// // Mock console methods to reduce noise in tests
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render is no longer supported')
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });

// afterAll(() => {
//   console.error = originalError;
// });
