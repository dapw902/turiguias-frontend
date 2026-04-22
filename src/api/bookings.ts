// importamos la instancia de axios configurada
import api from './axios'

// interfaz que define la forma de los datos del cliente
export interface ClientData {
  name: string
  email: string
  phone: string
  comments: string
  id: string
}

// interfaz que define la forma de un ticket
export interface TicketType {
  id: number
  name: string
  count: number
  seats: number
  price_per_ticket: string
}

// interfaz que define la forma de una reserva
export interface Booking {
  id: number
  turitop_booking_id: string
  pax: number
  client_data: ClientData
  ticket_type_count: TicketType[]
  status: string
  notes: string | null
  group: {
    id: number
    confirmed: boolean
    needs_attention: boolean
  } | null
}

// interfaz para la respuesta paginada de reservas
export interface PaginatedBookings {
  data: Booking[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// para obtener las reservas de un evento específico
export async function getBookingsByEvent(eventId: number) {
  const response = await api.get<Booking[]>(`/bookings/event/${eventId}`)
  return response.data
}

// para obtener todas las reservas paginadas
export async function getBookings(params: { page?: number; limit?: number }) {
  const response = await api.get<PaginatedBookings>('/bookings', { params })
  return response.data
}
