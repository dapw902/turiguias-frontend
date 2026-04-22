// importamos la instancia de axios configurada
import api from './axios'

// interfaz que define la forma de un usuario
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'guide'
  phone: string | null
  notes: string | null
  photo: string | null
}

// para obtener el listado de usuarios
export async function getUsers(params?: { page?: number; limit?: number }) {
  const response = await api.get<{ data: User[] }>('/users', {
    params: { limit: 100, ...params },
  })
  return response.data.data
}

// para obtener solo los guías
export async function getGuides() {
  const users = await getUsers()
  return users.filter((u) => u.role === 'guide')
}
