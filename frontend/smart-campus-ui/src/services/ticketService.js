import api from './api'

export const ticketService = {
  async getTickets() {
    const response = await api.get('/api/tickets')
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
}
