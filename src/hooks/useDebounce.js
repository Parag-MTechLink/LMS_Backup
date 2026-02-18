import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounces a value. Useful for search inputs to avoid excessive API calls.
 * @param {*} value - Value to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Returns a debounced callback. Use for search handlers that should not fire on every keystroke.
 * @param {Function} callback - Function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns Debounced callback
 */
export function useDebouncedCallback(callback, delayMs) {
  const timerRef = useRef(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args)
        timerRef.current = null
      }, delayMs)
    },
    [delayMs]
  )

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  return debounced
}
