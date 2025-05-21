import * as React from "react"

/**
 * A hook that debounces a value.
 * The returned value will only update after the specified delay has passed without the input changing.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    // Update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
} 