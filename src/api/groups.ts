// importamos la instancia de axios configurada
import api from './axios'

// interfaz que define la forma de un grupo
export interface Group {
  id: number
  confirmed: boolean
  needs_attention: boolean
  user: {
    id: number
    name: string
    photo: string | null
  } | null
  event: {
    id: number
    event_time: number
    duration: number
  }
}

// para obtener los grupos de un evento
export async function getGroupsByEvent(eventId: number) {
  const response = await api.get<Group[]>(`/groups/event/${eventId}`)
  return response.data
}
