import api from './api'

function buildSearchParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const resourceService = {
  async getAll() {
    const response = await api.get('/api/resources')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/api/resources/${id}`)
    return response.data
  },

  async search(filters) {
    const response = await api.get('/api/resources/search', { params: buildSearchParams(filters) })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/api/resources', payload)
    return response.data
  },

  async update(id, payload) {
    const response = await api.put(`/api/resources/${id}`, payload)
    return response.data
  },

  async remove(id) {
    await api.delete(`/api/resources/${id}`)
  },
}
