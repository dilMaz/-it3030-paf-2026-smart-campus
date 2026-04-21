import api from './api'

export const profileService = {
  async getMyProfile() {
    const response = await api.get('/api/users/me')
    return response.data
  },

  async updateMyProfile(payload) {
    const response = await api.put('/api/users/me', payload)
    return response.data
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/api/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response.data
  },

  async getAllProfiles() {
    const response = await api.get('/api/users')
    return response.data
  },
}
