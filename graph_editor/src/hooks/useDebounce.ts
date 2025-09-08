import { useState, useEffect } from 'react';
import {usePrevious} from './usePrevious';

// /**
//  * Custom hook for debouncing values
//  * @param value - The value to debounce
//  * @param delay - Delay in milliseconds
//  * @returns The debounced value
//  */
// export function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// }


export function useDebounce<T>(value: T, delay: number): {current: T, previous: T | undefined} {
  // const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const { current: debouncedValue, previous: previousValue, setValue: setDebouncedValue } = usePrevious<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {current: debouncedValue, previous: previousValue};
}

export default useDebounce;
