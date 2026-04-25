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
  must_change_password: boolean
}

// interfaz para crear un usuario nuevo
export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: 'admin' | 'guide'
  phone?: string | null
  notes?: string | null
}

// interfaz para actualizar un usuario existente
export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'guide'
  phone?: string | null
  notes?: string | null
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

// para crear un usuario nuevo
export async function createUser(dto: CreateUserDto) {
  const response = await api.post<User>('/users', dto)
  return response.data
}

// para actualizar un usuario existente
export async function updateUser(id: number, dto: UpdateUserDto) {
  const response = await api.patch<User>(`/users/${id}`, dto)
  return response.data
}

// para borrar un usuario
export async function deleteUser(id: number) {
  await api.delete(`/users/${id}`)
}
