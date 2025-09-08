import { renderHook, act } from '@testing-library/react';
import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  it('should initialize with current value and undefined previous', () => {
    const { result } = renderHook(() => usePrevious('initial'));

    expect(result.current.current).toBe('initial');
    expect(result.current.previous).toBeUndefined();
  });

  it('should update current value and save previous value when setValue is called', () => {
    const { result } = renderHook(() => usePrevious('initial'));

    act(() => {
      result.current.setValue('second');
    });

    expect(result.current.current).toBe('second');
    expect(result.current.previous).toBe('initial');
  });

  it('should track multiple value changes correctly', () => {
    const { result } = renderHook(() => usePrevious(0));

    act(() => {
      result.current.setValue(1);
    });

    expect(result.current.current).toBe(1);
    expect(result.current.previous).toBe(0);

    act(() => {
      result.current.setValue(2);
    });

    expect(result.current.current).toBe(2);
    expect(result.current.previous).toBe(1);

    act(() => {
      result.current.setValue(3);
    });

    expect(result.current.current).toBe(3);
    expect(result.current.previous).toBe(2);
  });

  it('should work with different data types', () => {
    const { result } = renderHook(() => usePrevious({ id: 1, name: 'test' }));

    const newObject = { id: 2, name: 'updated' };

    act(() => {
      result.current.setValue(newObject);
    });

    expect(result.current.current).toEqual(newObject);
    expect(result.current.previous).toEqual({ id: 1, name: 'test' });
  });

  it('should work with arrays', () => {
    const { result } = renderHook(() => usePrevious([1, 2, 3]));

    const newArray = [4, 5, 6];

    act(() => {
      result.current.setValue(newArray);
    });

    expect(result.current.current).toEqual(newArray);
    expect(result.current.previous).toEqual([1, 2, 3]);
  });

  it('should work with null and undefined values', () => {
    const { result } = renderHook(() => usePrevious<string | null>(null));

    act(() => {
      result.current.setValue('not null');
    });

    expect(result.current.current).toBe('not null');
    expect(result.current.previous).toBe(null);

    act(() => {
      result.current.setValue(null);
    });

    expect(result.current.current).toBe(null);
    expect(result.current.previous).toBe('not null');
  });
});
