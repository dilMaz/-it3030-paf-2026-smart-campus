import api from './api'

export const ticketService = {
  async getTickets() {
    const response = await api.get('/api/tickets')
    return response.data
  },

  async uploadAttachments(files = []) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/api/tickets/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response.data
  },

  async assignTechnician(ticketId, payload) {
    const response = await api.patch(`/api/tickets/${ticketId}/assign`, payload)
    return response.data
  },

  async createTicket(payload) {
    const response = await api.post('/api/tickets', payload)
    return response.data
  },

  async updateTicketStatus(ticketId, payload) {
    const response = await api.patch(`/api/tickets/${ticketId}/status`, payload)
    return response.data
  },

  async addComment(ticketId, payload) {
    const response = await api.post(`/api/tickets/${ticketId}/comments`, payload)
    return response.data
  },

  async updateComment(ticketId, commentId, payload) {
    const response = await api.patch(`/api/tickets/${ticketId}/comments/${commentId}`, payload)
    return response.data
  },

  async deleteComment(ticketId, commentId) {
    const response = await api.delete(`/api/tickets/${ticketId}/comments/${commentId}`)
    return response.data
  },
}
