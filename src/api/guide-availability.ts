// importamos la instancia de axios configurada
import api from './axios'

// interfaz para una franja de disponibilidad
export interface Availability {
  id: number
  start_date: string
  end_date: string
  start_time: string
  end_time: string
}

// interfaz para la respuesta agrupada por guía
export interface GuideAvailability {
  guide_id: number
  guide_name: string
  availabilities: Availability[]
}

// interfaz para crear una nueva disponibilidad
export interface CreateAvailabilityDto {
  user_id: number
  start_date: string
  end_date: string
  start_time: string
  end_time: string
}

// para obtener las disponibilidades de un guía
export async function getGuideAvailability(userId: number) {
  const response = await api.get<GuideAvailability[]>(`/guide-availability?userId=${userId}`)
  return response.data
}

// para crear una nueva franja de disponibilidad
export async function createAvailability(dto: CreateAvailabilityDto) {
  const response = await api.post<Availability>('/guide-availability', dto)
  return response.data
}

// para borrar una franja de disponibilidad
export async function deleteAvailability(id: number, force = false) {
  await api.delete(`/guide-availability/${id}`, { params: { force: force || undefined } })
}
