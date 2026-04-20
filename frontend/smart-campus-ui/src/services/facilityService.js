import api from './api'

function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const facilityService = {
  async getFacilities(filters = {}) {
    const response = await api.get('/api/facilities', { params: cleanParams(filters) })
    return response.data
  },

  async getFacilityById(id) {
    const response = await api.get(`/api/facilities/${id}`)
    return response.data
  },

  async createFacility(payload) {
    const response = await api.post('/api/facilities', payload)
    return response.data
  },

  async updateFacility(id, payload) {
    const response = await api.put(`/api/facilities/${id}`, payload)
    return response.data
  },

  async updateFacilityStatus(id, status) {
    const response = await api.patch(`/api/facilities/${id}/status`, { status })
    return response.data
  },

  async deleteFacility(id) {
    await api.delete(`/api/facilities/${id}`)
  },
}
