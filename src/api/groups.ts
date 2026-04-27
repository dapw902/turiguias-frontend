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

// interfaz para la respuesta del algoritmo de generación de grupos
export interface GeneratedGroups {
  groups: {
    bookings: {
      id: number
      pax: number
    }[]
    totalPax: number
    needs_attention: boolean
  }[]
  available_guides: {
    guide_id: number
    guide_name: string
    capacity: number
  }[]
  message: string
}

// interfaz para confirmar los grupos generados
export interface ConfirmGroupsDto {
  event_id: number
  groups: {
    booking_ids: number[]
    user_id?: number | null
    group_id?: number | null
    confirmed?: boolean
    needs_attention?: boolean
  }[]
}

// para generar una propuesta de grupos automáticamente
export async function generateGroups(eventId: number) {
  const response = await api.post<GeneratedGroups>(`/groups/generate/${eventId}`)
  return response.data
}

// para crear o actualizar grupos — usado tanto para generar grupos como para confirmarlos
export async function saveGroups(dto: ConfirmGroupsDto) {
  const response = await api.post('/groups/confirm', dto)
  return response.data
}

// para borrar grupos no confirmados de un evento o específico (groupId)
export async function deleteGroups(eventId: number, groupId?: number) {
  const url = groupId ? `/groups/delete/${eventId}/${groupId}` : `/groups/delete/${eventId}`
  await api.delete(url)
}

// para mover una reserva a un grupo o desasignarla
export async function assignBookingToGroup(bookingId: number, targetGroupId: number | null) {
  const target = targetGroupId ?? 0
  await api.patch(`/groups/assign-booking/${bookingId}/to/${target}`)
}

// interfaz para un guía disponible para un evento
export interface AvailableGuide {
  guide_id: number
  guide_name: string
  capacity: number
}

// para obtener los guías disponibles para un evento concreto
export async function getAvailableGuidesForEvent(eventId: number) {
  const response = await api.get<AvailableGuide[]>(`/groups/available-guides/${eventId}`)
  return response.data
}

// para asignar o cambiar el guía de un grupo (userId = null para desasignar)
export async function assignGuide(groupId: number, userId: number | null) {
  await api.patch(`/groups/assign-guide/${groupId}`, { user_id: userId })
}

// interfaz para un grupo asignado a un guía
export interface GuideGroup {
  group_id: number
  confirmed: boolean
  needs_attention: boolean
  event_id: number
  event_time: number
  service_name: string
  service_timezone: string
  capacity: number | null
  total_pax: number
  booking_count: number
}

// para obtener los grupos asignados a un guía con paginación
export async function getGroupsByGuide(guideId: number, page = 1, limit = 10) {
  const response = await api.get<{
    data: GuideGroup[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>(`/groups/guide/${guideId}`, { params: { page, limit } })
  return response.data
}
