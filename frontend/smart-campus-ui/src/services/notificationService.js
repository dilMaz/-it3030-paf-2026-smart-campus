import api from './api'

function normalizeNotification(notification) {
  if (!notification || typeof notification !== 'object') {
    return notification
  }

  const read = typeof notification.read === 'boolean'
    ? notification.read
    : !!notification.isRead

  return {
    ...notification,
    read,
  }
}

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/api/notifications')
    return Array.isArray(response.data) ? response.data.map(normalizeNotification) : []
  },

  async getMyNotifications() {
    return this.getNotifications()
  },

  async markAsRead(id) {
    const response = await api.patch(`/api/notifications/${id}/read`, {})
    return normalizeNotification(response.data)
  },

  async markAllAsRead() {
    const response = await api.patch('/api/notifications/read-all', {})
    return response.data
  },

  async createNotification(payload) {
    const response = await api.post('/api/notifications', payload)
    return normalizeNotification(response.data)
  },

  async deleteNotification(id) {
    await api.delete(`/api/notifications/${id}`)
  },
}
