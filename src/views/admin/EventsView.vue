<template>
  <div>
    <!-- estado de carga -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" style="color: var(--color-primary)"></span>
    </div>

    <!-- mensaje de error -->
    <div v-else-if="error" class="alert alert-error mb-4">
      {{ error }}
    </div>

    <!-- calendario -->
    <div v-else class="bg-base-100 rounded-xl p-4 shadow-sm">
      <!-- filtros por servicio y por guías -->
      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium" for="service-filter">Filtrar por servicio:</label>
        <select
          id="service-filter"
          class="select select-sm select-bordered"
          v-model="selectedServiceId"
          @change="loadEvents()"
        >
          <option :value="null">Todos los servicios</option>
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.turitop_product_id }} — {{ service.name }}
          </option>
        </select>

        <label class="text-sm font-medium" for="guide-filter">Guía:</label>
        <select
          id="guide-filter"
          class="select select-sm select-bordered"
          v-model="selectedGuideId"
          @change="loadEvents()"
        >
          <option :value="null">Todos</option>
          <option v-for="guide in guides" :key="guide.id" :value="guide.id">
            {{ guide.name }}
          </option>
        </select>
      </div>
      <FullCalendar :options="calendarOptions" />
    </div>
    <!-- modal de detalle del evento -->
    <EventDetailModal :isOpen="modalOpen" :event="selectedEvent" @close="modalOpen = false" />
  </div>
</template>

<script setup lang="ts">
// para crear variables reactivas y ejecutar código al montar el componente
import { ref, onMounted } from 'vue'
// importamos FullCalendar y los plugins necesarios
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, CalendarOptions, EventInput } from '@fullcalendar/core'
// importamos la función y las interfaces de la API de eventos
import { getEvents, type Event } from '@/api/events'
// importamos la función y la interfaz de servicios
import { getServices, type Service } from '@/api/services'
// importamos el componente del modal
import EventDetailModal from '@/components/EventDetailModal.vue'
// importamos la función  y la interfaz de usuarios
import { getGuides, type User } from '@/api/users'

// EVENTOS Y CALENDARIO
// estado de carga
const loading = ref(false)
// error si falla la carga
const error = ref('')

// función para convertir un evento del backend al formato de FullCalendar
function toCalendarEvent(event: Event): EventInput {
  const start = new Date(event.event_time * 1000)
  const end = new Date((event.event_time + event.duration * 60) * 1000)
  const isPast = start < new Date()
  return {
    id: String(event.id),
    title: `${event.service.name} · ${event.totalPax} pax`,
    start,
    end,
    backgroundColor: isPast ? '#9ca3af' : event.status === 'open' ? '#2eac66' : '#ef4444',
    borderColor: '#fff',
    extendedProps: { event },
    display: 'block',
  }
}

// TARJETA EVENTO Y MODAL
// controla si el modal está abiertos
const modalOpen = ref(false)
// evento seleccionado al hacer clic
const selectedEvent = ref<Event | null>(null)

// función que se ejecuta al hacer clic en un evento del calendario
function handleEventClick(info: EventClickArg) {
  selectedEvent.value = info.event.extendedProps['event'] as Event
  modalOpen.value = true
}

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  locale: 'es',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  eventClick: handleEventClick,
  height: 'auto',
})

// FILTRO POR SERVICIOS
// lista de servicios para el filtro
const services = ref<Service[]>([])
// servicio seleccionado para filtrar (null = todos)
const selectedServiceId = ref<number | null>(null)

// carga los servicios para el filtro
async function loadServices() {
  services.value = await getServices()
}

// FILTRO POR GUÍAS
// lista de guías para el filtro
const guides = ref<User[]>([])
// guía seleccionado para filtrar (null = todos)
const selectedGuideId = ref<number | null>(null)

// carga los guías para el filtro
async function loadGuides() {
  guides.value = await getGuides()
}

// CARGA EVENTOS BACKEND
// función para cargar los eventos desde el backend
async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const result = await getEvents({
      withBookings: true,
      limit: 100,
      serviceId: selectedServiceId.value ?? undefined,
      guideId: selectedGuideId.value ?? undefined,
    })
    // actualizamos los eventos directamente en las opciones del calendario
    calendarOptions.value = {
      ...calendarOptions.value,
      events: result.data.map(toCalendarEvent),
    }
  } catch {
    error.value = 'Error al cargar los eventos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadServices()
  loadGuides()
  loadEvents()
})
</script>
