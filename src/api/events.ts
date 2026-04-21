// importamos la instancia de axios configurada
import api from './axios'

// interfaz que define la forma de un evento
export interface Event {
  id: number
  service: {
    id: number
    name: string
    duration: number
    timezone: string
  }
  event_time: number
  duration: number
  capacity: number
  status: string
  totalPax: number
}

// interfaz para la respuesta paginada de eventos
export interface PaginatedEvents {
  data: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// obtiene el listado de eventos con filtros opcionales
export async function getEvents(params: {
  page?: number
  limit?: number
  serviceId?: number
  startTimestamp?: number
  endTimestamp?: number
}) {
  const response = await api.get<PaginatedEvents>('/events', { params })
  return response.data
}
