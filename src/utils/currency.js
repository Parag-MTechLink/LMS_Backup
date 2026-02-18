/**
 * Centralized Indian Rupee (₹) formatting for the LMS.
 * Display-layer only; do not change or convert stored values.
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Format a number as Indian Rupees (e.g. ₹ 1,25,000.00).
 * @param {number} amount - Numeric value to format
 * @returns {string} Formatted string
 */
export function formatCurrencyINR(amount) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) {
    return INR_FORMATTER.format(0)
  }
  return INR_FORMATTER.format(Number(amount))
}

/**
 * Format without currency symbol (e.g. 1,25,000.00). Useful for inputs.
 * @param {number} amount
 * @returns {string}
 */
export function formatAmountINR(amount) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) {
    return '0.00'
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}
