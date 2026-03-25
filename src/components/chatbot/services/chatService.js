/**
 * Chatbot Service - API Client
 * 
 * Handles all communication with the chatbot backend API
 */

export class ChatService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID
   * @param {Object} context - User context
   * @returns {Promise<Object>} Chat response
   */
  async sendMessage(message, sessionId, context) {
    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken')

      const response = await fetch(`${this.apiUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          content: message,
          session_id: sessionId,
          context: context,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Chat service error:', error)
      throw error instanceof Error ? error : new Error('Failed to send message')
    }
  }

  /**
   * Get chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Array>} Array of chat messages
   */
  async getHistory(sessionId) {
    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken')

      const response = await fetch(`${this.apiUrl}/history?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`)
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
      return []
    }
  }

  /**
   * Create a new chat session
   * @param {string} userId - User ID
   * @returns {Promise<string>} Session ID
   */
  async createSession(userId) {
    try {
      const token = localStorage.getItem('labManagementAccessToken') || 
                   localStorage.getItem('accessToken')

      const response = await fetch(`${this.apiUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`)
      }

      const data = await response.json()
      return data.session_id
    } catch (error) {
      console.error('Failed to create session:', error)
      // Fallback to generating session ID locally
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Test connection to chatbot API
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

