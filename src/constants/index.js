/**
 * Shared application constants. Use these instead of magic numbers/strings.
 */

/** Request timeout for API calls (ms) */
export const API_TIMEOUT_MS = 30000

/** Default API base URL when env is not set (match backend port, e.g. 8001) */
export const API_BASE_URL_DEFAULT = 'http://127.0.0.1:8001/api/v1'

/** Lab management API base URL fallback */
export const LAB_API_BASE_URL_DEFAULT = 'http://localhost:8001'

/** Local storage keys */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  LAB_ACCESS_TOKEN: 'labManagementAccessToken',
  LAB_REFRESH_TOKEN: 'labManagementRefreshToken',
  LAB_USER: 'labManagementUser',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
}
