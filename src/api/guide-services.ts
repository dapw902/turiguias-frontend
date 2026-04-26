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
