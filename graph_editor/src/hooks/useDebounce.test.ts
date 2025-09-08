import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';
import { jest } from '@jest/globals';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast-forward time by 250ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast-forward time by another 250ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should reset timer when value changes multiple times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value multiple times quickly
    rerender({ value: 'first', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'final', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('initial'); // Should still be initial

    // Fast-forward the full delay
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('final'); // Should be the final value
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 1000 });
    expect(result.current).toBe('initial');

    // Fast-forward by 500ms (less than 1000ms delay)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // Fast-forward by another 500ms (total 1000ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 0 });
    expect(result.current).toBe('initial'); // Should still be initial before timer

    // Fast-forward time by 0ms (immediate execution)
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
