// importamos la instancia de axios configurada
import api from './axios'

// interfaz para un servicio asignado a un guía
export interface GuideAssignedService {
  id: number
  service_name: string
  turitop_product_id: string
  timezone: string
  capacity: number
}

// interfaz para la respuesta agrupada por guía
export interface GuideServiceByUser {
  guide_id: number
  guide_name: string
  services: GuideAssignedService[]
}

// para obtener todos los servicios asignados a guías, agrupados por guía
export async function getGuideServices() {
  const response = await api.get<{ data: GuideServiceByUser[] }>('/guide-services')
  return response.data.data
}

// interfaz para crear o actualizar una relación guía-servicio
export interface CreateUpdateGuideServiceDto {
  user_id: number
  service_id: number
  capacity: number
}

// para obtener los servicios asignados a un guía concreto
export async function getGuideServicesByUser(userId: number) {
  const response = await api.get<GuideServiceByUser[]>(`/guide-services?userId=${userId}`)
  return response.data
}

// para asignar un nuevo servicio a un guía
export async function createGuideService(dto: CreateUpdateGuideServiceDto) {
  const response = await api.post<GuideAssignedService>('/guide-services', dto)
  return response.data
}

// para actualizar la capacidad de un servicio asignado
export async function updateGuideService(id: number, dto: CreateUpdateGuideServiceDto) {
  const response = await api.patch<GuideAssignedService>(`/guide-services/${id}`, dto)
  return response.data
}

// para borrar la asignación de un servicio a un guía
export async function deleteGuideService(id: number) {
  await api.delete(`/guide-services/${id}`)
}
