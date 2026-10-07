import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

const wrap = (promise) =>
  promise.then((r) => r.data.data).catch((e) => { throw e })

export const getHealth = () => wrap(api.get('/health'))
export const getDashboard = () => wrap(api.get('/dashboard'))
export const getConsumers = () => wrap(api.get('/consumers'))
export const getConsumer = (id) => wrap(api.get(`/consumers/${id}`))
export const getAnalytics = () => wrap(api.get('/analytics/overview'))
export const getTrends = () => wrap(api.get('/analytics/trends'))
export const getAreas = () => wrap(api.get('/analytics/areas'))
export const getQueue = (params = {}) => wrap(api.get('/queue', { params }))
export const getInvestigations = () => wrap(api.get('/investigations'))
export const analyzeConsumer = (id) => wrap(api.post(`/analyze/${id}`))
export const explainConsumer = (consumer_id) =>
  wrap(api.post('/investigation/explain', { consumer_id }))

export default api
