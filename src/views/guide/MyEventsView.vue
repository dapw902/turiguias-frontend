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
    <div class="bg-base-100 rounded-xl p-2 lg:p-4 shadow-sm relative events-calendar">
      <!-- filtros por servicio -->
      <div class="mb-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <label class="text-sm font-medium" for="service-filter">Filtrar por servicio:</label>
        <VueSelect
          v-model="selectedServiceId"
          :options="services"
          :reduce="(s: Service) => s.id"
          label="name"
          placeholder="Todos los servicios"
          @update:modelValue="loadEvents()"
          class="w-full lg:w-64"
        >
          <template #option="{ turitop_product_id, name }">
            {{ turitop_product_id }} — {{ name }}
          </template>
          <template #no-options> No se encontraron resultados </template>
        </VueSelect>
      </div>
      <FullCalendar ref="calendar" :options="calendarOptions" />
    </div>
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
// importamos la funciones e interfaces necesarias
import { getGroupsByEvent } from '@/api/groups'
import { getEvents, type Event } from '@/api/events'
import { getServices, type Service } from '@/api/services'
// para conversión de UTC a hora local
import { DateTime } from 'luxon'
// importamos la store de Auth para identificar al guía logueado
import { useAuthStore } from '@/stores/auth'
// para la navegación
import { useRouter } from 'vue-router'

const router = useRouter()

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

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: window.innerWidth < 1024 ? 'timeGridDay' : 'timeGridWeek',
  locale: 'es',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right:
      window.innerWidth < 1024
        ? 'timeGridDay,dayGridMonth'
        : 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  eventClick: handleEventClick,
  height: 'auto',
  timeZone: 'UTC',
  eventDidMount: (info) => {
    const event = info.event.extendedProps['event'] as Event
    const viewType = info.view.type
    const isMobile = window.innerWidth < 1024

    if (isMobile && viewType === 'dayGridMonth') {
      info.event.setProp('title', `${event.service.turitop_product_id}`)
    } else if (isMobile && viewType === 'timeGridDay') {
      info.event.setProp('title', `${event.service.turitop_product_id} - ${event.service.name}`)
    } else {
      info.event.setProp(
        'title',
        `${event.service.turitop_product_id} - ${event.service.name} (${event.totalPax} pax)`,
      )
    }
  },
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

// NAVEGACIÓN AL LISTADO
// función que se ejecuta al hacer clic en un evento del calendario
async function handleEventClick(info: EventClickArg) {
  const event = info.event.extendedProps['event'] as Event
  // buscamos el grupo del guía para ese evento
  try {
    const groups = await getGroupsByEvent(event.id)
    const myGroup = groups.find((g) => g.user?.id === authStore.user?.id)
    if (myGroup) {
      router.push(`/guide/groups/${myGroup.id}/bookings`)
    }
  } catch {
    // si falla silenciosamente no navegamos
  }
}

onMounted(async () => {
  await loadServices()
  loadEvents()
})
</script>
