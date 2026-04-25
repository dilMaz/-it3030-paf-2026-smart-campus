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

  // Approve booking via API
  async approveBooking(id) {
    const response = await api.patch(`/api/bookings/${id}/approve`)
    return response.data
  },

  // Reject booking via API
  async rejectBooking(id) {
    const response = await api.patch(`/api/bookings/${id}/reject`)
    return response.data
  },

  // Check for booking conflicts before creating/updating
  async checkBookingConflict(resourceId, startTime, endTime, excludeBookingId = null) {
    const params = new URLSearchParams({
      resourceId,
      startTime,
      endTime,
    })
    if (excludeBookingId) {
      params.append('excludeBookingId', excludeBookingId)
    }
    const response = await api.get(`/api/bookings/conflict-check?${params.toString()}`)
    return response.data
  },
}
