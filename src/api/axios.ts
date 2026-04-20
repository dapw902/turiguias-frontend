// importamos la librería de axios para hacer llamadas http al backend
import axios from 'axios'

// instancia de axios configurada con la URL base del backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})
console.log('API URL:', import.meta.env.VITE_API_URL)

// interceptor para añadir el token JWT a todas las peticiones automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// interceptor que maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // si el token ha expirado o es inválido, limpiamos la sesión
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
