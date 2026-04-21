// Booking service for API communication
import api from './api'

export const bookingService = {
  // Fetch all bookings from API
  async getBookings() {
    const response = await api.get('/api/bookings')
    return response.data
  },

  // Create new booking via API
  async createBooking(payload) {
    const response = await api.post('/api/bookings', payload)
    return response.data
  },

  async approveBooking(id) {
    const response = await api.patch(`/api/bookings/${id}/approve`)
    return response.data
  },

  async rejectBooking(id) {
    const response = await api.patch(`/api/bookings/${id}/reject`)
    return response.data
  },
}
