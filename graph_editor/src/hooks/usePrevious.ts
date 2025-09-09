import { useState, useCallback } from 'react';

/**
 * Custom hook that tracks both current and previous values
 * @param initialValue - The initial value
 * @returns An object with current value, previous value, and setter function
 */
export function usePrevious<T>(initialValue: T) {
  const [current, setCurrent] = useState<T>(initialValue);
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  const setValue = useCallback(
    (newValue: T) => {
      setPrevious(current);
      setCurrent(newValue);
    },
    [current]
  );

  return {
    current,
    previous,
    setValue,
  };
}

export default usePrevious;
