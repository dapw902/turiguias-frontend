// función para crear un store de Pinia
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// importamos la instancia de axios configurada con el token JWT
import api from '@/api/axios'

// interfaz para definir la forma del objeto usuario
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'guide'
  phone: string | null
  notes: string | null
  photo: string | null
}

// creamos y exportamos el store auth para autenticación y control de sesión de los usuarios
export const useAuthStore = defineStore('auth', () => {
  // leemos localStorage para ver si el usuario ya estaba logueado.
  // y registramos variables reactivas para el estado de la sesión
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))

  // valores calculados derivados del estado
  // verificamos si está autenticado y el rol del usuario (boolean)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isGuide = computed(() => user.value?.role === 'guide')

  // llamos al método para hacer login
  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    const { access_token } = response.data

    // decodificamos el payload del JWT para obtener los datos del usuario
    const payload = JSON.parse(atob(access_token.split('.')[1]))

    // actualizamos las variables
    token.value = access_token
    user.value = {
      id: payload.sub,
      name: '',
      email: payload.email,
      role: payload.role,
      phone: null,
      notes: null,
      photo: null,
    }

    // guardamos en localStorage para persistir la sesión
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user.value))

    // cargamos los datos completos del usuario
    await fetchCurrentUser()
  }

  // método para obtener los datos completos del usuario actual
  async function fetchCurrentUser() {
    if (!user.value?.id) return
    const response = await api.get(`/users/${user.value.id}`)
    user.value = response.data
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  // método para cerrar sesión
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return { token, user, isAuthenticated, isAdmin, isGuide, login, logout, fetchCurrentUser }
})
