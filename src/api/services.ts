// importamos la instancia de axios configurada
import api from './axios'

// interfaz que define la forma de un servicio
export interface Service {
  id: number
  turitop_product_id: string
  name: string
  duration: number
  active: boolean
}

// obtiene el listado de servicios
export async function getServices() {
  const response = await api.get<{ data: Service[] }>('/services', {
    params: { limit: 100 },
  })
  return response.data.data
}
