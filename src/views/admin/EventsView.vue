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
      <!-- tabs de timezone (solo si hay más de una) -->
      <div v-if="timezones.length > 1" class="flex gap-2 mb-4">
        <button
          class="btn btn-sm"
          :class="activeTimezone === null ? 'btn-gradient' : 'btn-outline-gradient'"
          @click="selectAllTimezones()"
        >
          Todas
        </button>
        <button
          v-for="tz in timezones"
          :key="tz"
          class="btn btn-sm"
          :class="activeTimezone === tz ? 'btn-gradient' : 'btn-outline-gradient'"
          @click="selectTimezone(tz)"
        >
          {{ tz }}
        </button>
      </div>

      <!-- filtros por servicio y por guías -->
      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium" for="service-filter">Filtrar por servicio:</label>
        <VueSelect
          v-model="selectedServiceId"
          :options="filteredServices"
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

        <label class="text-sm font-medium" for="guide-filter">Guía:</label>
        <VueSelect
          v-model="selectedGuideId"
          :options="guides"
          :reduce="(g: User) => g.id"
          label="name"
          placeholder="Todos los guías"
          @update:modelValue="loadEvents()"
          class="w-48"
        >
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
import { ref, onMounted, computed, useTemplateRef } from 'vue'
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
// importamos la función y la interfaz de usuarios
import { getGuides, type User } from '@/api/users'
// para conversión de UTC a hora local
import { DateTime } from 'luxon'

const calendarRef = useTemplateRef<InstanceType<typeof FullCalendar>>('calendar')

// TIMEZONES
// timezones únicas detectadas en los servicios
const timezones = computed(() => {
  const unique = [...new Set(services.value.map((s) => s.timezone))]
  return unique
})

// timezone activa (pestaña seleccionada)
const activeTimezone = ref<string | null>(null)

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
    title: `${event.service.name} · ${event.totalPax} pax`,
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

// servicios filtrados según la timezone activa
const filteredServices = computed(() => {
  if (!activeTimezone.value) return services.value
  return services.value.filter((s) => s.timezone === activeTimezone.value)
})

async function loadServices() {
  services.value = await getServices()
  // seleccionamos la primera timezone por defecto
  if (timezones.value.length > 0) {
    activeTimezone.value = timezones.value[0] ?? null
  }
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

// indica si es la primera carga (para no intentar usar calendarApi antes de que esté montado)
const initialLoad = ref(true)

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
    // filtramos por timezone activa en el frontend
    const filtered = activeTimezone.value
      ? result.data.filter((e) => e.service.timezone === activeTimezone.value)
      : result.data
    if (initialLoad.value) {
      // primera carga: pasamos los eventos via opciones
      calendarOptions.value = {
        ...calendarOptions.value,
        events: filtered.map(toCalendarEvent),
      }
      initialLoad.value = false
    } else {
      // cargas siguientes: actualizamos sin reiniciar el calendario
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        calendarApi.removeAllEvents()
        calendarApi.addEventSource(filtered.map(toCalendarEvent))
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

// selecciona todas las timezones y resetea el filtro de servicio
function selectAllTimezones() {
  activeTimezone.value = null
  selectedServiceId.value = null
  loadEvents()
}

// selecciona una timezone específica y resetea el filtro de servicio
function selectTimezone(tz: string) {
  activeTimezone.value = tz
  selectedServiceId.value = null
  loadEvents()
}

onMounted(async () => {
  await loadServices()
  await loadGuides()
  loadEvents()
})
</script>
