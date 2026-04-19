import api from './api'

export const notificationService = {
  async getMyNotifications() {
    const response = await api.get('/api/notifications/me')
    return response.data
  },

  async markAsRead(id) {
    const response = await api.patch(`/api/notifications/${id}/read`, {})
    return response.data
  },

  async deleteNotification(id) {
    await api.delete(`/api/notifications/${id}`)
  },
}
