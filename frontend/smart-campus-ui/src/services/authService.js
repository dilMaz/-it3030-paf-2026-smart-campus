import api from './api'

export const authService = {
  async getCurrentUser() {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  async login(payload) {
    const response = await api.post('/api/auth/login', payload)
    return response.data
  },

  async signup(payload) {
    const response = await api.post('/api/auth/register', payload)
    return response.data
  },

  async logout() {
    await api.post('/api/auth/logout')
  },

  getGoogleLoginUrl() {
    return `${api.defaults.baseURL}/oauth2/authorization/google`
  },
}
