/**
 * Throttle function - limits the rate at which a function can fire
 * Useful for scroll, resize, or mouse move events
 * @param {Function} func - The function to throttle
 * @param {number} delay - Minimum time between function calls in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

/**
 * Debounce function - delays function execution until after a period of inactivity
 * Useful for search inputs, form validation, or window resizing
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds before function executes
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
