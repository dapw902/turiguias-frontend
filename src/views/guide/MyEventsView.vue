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

    <!-- calendario (siempre montado) -->
    <div class="bg-base-100 rounded-xl p-4 shadow-sm relative">
      <!-- filtros por servicio -->
      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium" for="service-filter">Filtrar por servicio:</label>
        <VueSelect
          v-model="selectedServiceId"
          :options="services"
          :reduce="(s: Service) => s.id"
          label="name"
          placeholder="Todos los servicios"
          @update:modelValue="loadEvents()"
          class="w-64"
        >
          <template #option="{ turitop_product_id, name }">
            {{ turitop_product_id }} — {{ name }}
          </template>
          <template #no-options> No se encontraron resultados </template>
        </VueSelect>
      </div>
      <FullCalendar ref="calendar" :options="calendarOptions" />
    </div>

    <!-- modal de detalle del evento -->
    <EventDetailModal :isOpen="modalOpen" :event="selectedEvent" @close="modalOpen = false" />
  </div>
</template>

<script setup lang="ts">
// para crear variables reactivas, valores calculados y ejecutar código al montar el componente
// referencia al componente FullCalendar para acceder a su API
import { ref, onMounted, useTemplateRef } from 'vue'
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
// para conversión de UTC a hora local
import { DateTime } from 'luxon'
// importamos la store de Auth para identificar al guía logueado
import { useAuthStore } from '@/stores/auth'

const calendarRef = useTemplateRef<InstanceType<typeof FullCalendar>>('calendar')

const authStore = useAuthStore()

// EVENTOS Y CALENDARIO
// estado de carga
const loading = ref(false)
// error si falla la carga
const error = ref('')

// función para convertir un evento del backend al formato de FullCalendar
function toCalendarEvent(event: Event): EventInput {
  const isPast = new Date(event.event_time * 1000) < new Date()
  return {
    id: String(event.id),
    title: `${event.service.turitop_product_id} - ${event.service.name} (${event.totalPax} pax)`,
    start: toLocalDateString(event.event_time, event.service.timezone),
    end: toLocalDateString(event.event_time + event.duration * 60, event.service.timezone),
    backgroundColor: isPast ? '#9ca3af' : event.status === 'open' ? '#2eac66' : '#ef4444',
    borderColor: '#fff',
    extendedProps: { event },
    display: 'block',
  }
}

// TARJETA EVENTO Y MODAL
// controla si el modal está abierto
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
  timeZone: 'UTC',
})

// FILTRO POR SERVICIOS
// lista de servicios para el filtro
const services = ref<Service[]>([])
// servicio seleccionado para filtrar (null = todos)
const selectedServiceId = ref<number | null>(null)

async function loadServices() {
  services.value = await getServices()
}

// CARGA EVENTOS BACKEND

// indica si es la primera carga (para no intentar usar calendarApi antes de que esté montado)
const initialLoad = ref(true)

// función para cargar los eventos desde el backend
async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const result = await getEvents({
      withBookings: true,
      limit: 1000,
      serviceId: selectedServiceId.value ?? undefined,
      guideId: authStore.user?.id ?? undefined,
    })
    if (initialLoad.value) {
      // carga inicial
      calendarOptions.value = {
        ...calendarOptions.value,
        events: result.data.map(toCalendarEvent),
      }
      initialLoad.value = false
    } else {
      // cargas siguientes
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        calendarApi.removeAllEvents()
        calendarApi.addEventSource(result.data.map(toCalendarEvent))
      }
    }
  } catch {
    error.value = 'Error al cargar los eventos'
  } finally {
    loading.value = false
  }
}

// HELPERS

// convierte un timestamp UTC a una fecha/hora legible en la timezone indicada
function toLocalDateString(timestamp: number, timezone: string): string {
  return DateTime.fromSeconds(timestamp).setZone(timezone).toFormat('yyyy-MM-dd HH:mm:ss')
}

onMounted(async () => {
  await loadServices()
  loadEvents()
})
</script>
