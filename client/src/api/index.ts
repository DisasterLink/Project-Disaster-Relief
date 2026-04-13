import axios from 'axios'

// Create a typed API client
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Inject token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateAvailability: (isAvailable: boolean) => api.patch('/auth/availability', { isAvailable }),
}

// ─── Requests ─────────────────────────────────
export const requestAPI = {
  getAll: (params?: Record<string, string>) => api.get('/requests', { params }),
  getOne: (id: string) => api.get(`/requests/${id}`),
  create: (data: any) => api.post('/requests', data),
  updateStatus: (id: string, status: string) => api.patch(`/requests/${id}/status`, { status }),
  getNearby: (lng: number, lat: number, radius?: number) => api.get('/requests/nearby', { params: { lng, lat, radius } }),
  getStats: () => api.get('/requests/stats'),
}

// ─── Tasks ────────────────────────────────────
export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getMyTasks: () => api.get('/tasks/my-tasks'),
  create: (data: any) => api.post('/tasks', data),
  updateStatus: (id: string, status: string, notes?: string) => api.patch(`/tasks/${id}/status`, { status, notes }),
}

// ─── Resources ────────────────────────────────
export const resourceAPI = {
  getAll: (type?: string) => api.get('/resources', { params: type ? { type } : {} }),
  create: (data: any) => api.post('/resources', data),
  update: (id: string, data: any) => api.patch(`/resources/${id}`, data),
  delete: (id: string) => api.delete(`/resources/${id}`),
}

// ─── Users ────────────────────────────────────
export const userAPI = {
  getAll: (role?: string) => api.get('/users', { params: role ? { role } : {} }),
  getVolunteers: () => api.get('/users/volunteers'),
  setAvailability: (id: string, isAvailable: boolean) => api.patch(`/users/${id}/availability`, { isAvailable }),
}

export default api
