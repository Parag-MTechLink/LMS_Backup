/**
 * Centralized API error message extraction.
 * Handles both FastAPI detail and standard format (success: false, error, details).
 * Use for consistent user-facing error messages.
 *
 * @param {import('axios').AxiosError} error - Axios error from API call
 * @returns {string} User-facing error message
 */
export function getApiErrorMessage(error) {
  if (!error || typeof error !== 'object') {
    return 'An error occurred'
  }

  const data = error.response?.data

  // Standard format (global exception handler): { success: false, error, details }
  if (data && typeof data.error === 'string') {
    const details = Array.isArray(data.details) && data.details.length > 0
      ? ` ${data.details.join(' ')}`
      : ''
    return `${data.error}${details}`.trim()
  }

  // FastAPI HTTPException / validation: detail (string or array)
  if (data && data.detail !== undefined) {
    const detail = data.detail
    if (Array.isArray(detail)) {
      return detail
        .map((err) => {
          const field = err.loc?.join('.') || 'unknown field'
          return `${field}: ${err.msg || err.message || JSON.stringify(err)}`
        })
        .join(', ')
    }
    if (typeof detail === 'string') {
      return detail
    }
    return typeof detail === 'object' ? JSON.stringify(detail) : String(detail)
  }

  return error.message || 'An error occurred'
}
