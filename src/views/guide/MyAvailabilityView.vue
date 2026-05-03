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

    <div v-else>
      <!-- cabecera -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold">{{ guideName }}</h2>
          <p class="text-sm text-base-content/60 mt-1">{{ guideTimezone }}</p>
        </div>
      </div>

      <!-- listado de franjas + calendario -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- listado de horarios -->
        <div class="bg-base-100 rounded-xl p-4 shadow-sm lg:col-span-1 flex flex-col gap-4">
          <!-- horarios activos -->
          <div>
            <p class="font-bold text-sm mb-3">Horarios registrados</p>
            <div
              v-if="activeAvailabilities.length > 0"
              class="flex flex-col gap-2 overflow-y-auto max-h-64"
            >
              <div
                v-for="a in activeAvailabilities"
                :key="a.id"
                class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <p class="font-medium">{{ a.start_date }} — {{ a.end_date }}</p>
                  <p class="text-xs text-base-content/60">
                    {{ toGuideTime(a.start_time, a.start_date) }} —
                    {{ toGuideTime(a.end_time, a.end_date) }}
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-base-content/40">Sin horarios registrados</p>
          </div>

          <!-- horarios pasados -->
          <div v-if="pastAvailabilities.length > 0">
            <p class="font-bold text-sm mb-3">Horarios pasados</p>
            <div class="flex flex-col gap-2 overflow-y-auto max-h-64">
              <div
                v-for="a in pastAvailabilities"
                :key="a.id"
                class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 text-sm opacity-50"
              >
                <div>
                  <p class="font-medium">{{ a.start_date }} — {{ a.end_date }}</p>
                  <p class="text-xs text-base-content/60">
                    {{ toGuideTime(a.start_time, a.start_date) }} —
                    {{ toGuideTime(a.end_time, a.end_date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- calendario -->
        <div class="bg-base-100 rounded-xl p-4 shadow-sm lg:col-span-3 availability-calendar">
          <FullCalendar :options="calendarOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// importamos FullCalendar y los plugins necesarios
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { CalendarOptions } from '@fullcalendar/core'
// importamos las funciones e interfaces necesarias
import { getGuideAvailability, type Availability } from '@/api/guide-availability'
import { getGuideServices } from '@/api/guide-services'
// para conversión de fechas
import { DateTime } from 'luxon'
import { useAuthStore } from '@/stores/auth'
// para las traducciones al español de FullCalendar
import esLocale from '@fullcalendar/core/locales/es'

const authStore = useAuthStore()

// ESTADO
const guideName = authStore.user?.name
const availabilities = ref<Availability[]>([])
const guideTimezone = ref('UTC')
const loading = ref(false)
const error = ref('')

// horarios futuros o actuales
const activeAvailabilities = computed(() =>
  availabilities.value.filter((a) => DateTime.fromISO(a.end_date) >= DateTime.now().startOf('day')),
)

// horarios pasados
const pastAvailabilities = computed(() =>
  availabilities.value.filter((a) => DateTime.fromISO(a.end_date) < DateTime.now().startOf('day')),
)

// CALENDARIO
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: esLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth',
  },
  height: 'auto',
  timeZone: 'UTC',
  events: [],
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  displayEventTime: false,
})

// HELPERS

// convierte una hora UTC a la timezone del guía para mostrarla en la lista
function toGuideTime(time: string, date: string): string {
  return DateTime.fromISO(`${date}T${time}:00`, { zone: 'UTC' })
    .setZone(guideTimezone.value)
    .toFormat('HH:mm')
}

// genera los eventos del calendario con las horas convertidas a la timezone del guía
function buildCalendarEvents() {
  const now = DateTime.now()
  const events = []

  for (const a of availabilities.value) {
    let current = DateTime.fromISO(a.start_date)
    const end = DateTime.fromISO(a.end_date)

    while (current <= end) {
      const dateStr = current.toISODate()!
      // comparamos cada día con la fecha actual para pintar los eventos
      const isPast = current < now.startOf('day')
      // convertimos las horas UTC a la timezone del guía para el título
      const localStart = toGuideTime(a.start_time, dateStr)
      const localEnd = toGuideTime(a.end_time, dateStr)

      events.push({
        id: `${a.id}-${dateStr}`,
        title: `${localStart} - ${localEnd}`,
        start: `${dateStr}T${a.start_time}:00`,
        end: `${dateStr}T${a.end_time}:00`,
        backgroundColor: isPast ? '#9ca3af' : '#2eac66',
        borderColor: 'transparent',
        textColor: 'white',
        display: 'block',
      })
      current = current.plus({ days: 1 })
    }
  }

  return events
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  const guideId = authStore.user?.id
  if (!guideId) return
  try {
    const [availabilityData, servicesData] = await Promise.all([
      getGuideAvailability(guideId),
      getGuideServices(),
    ])

    // los horarios solo si existen
    const guideData = availabilityData[0]
    if (guideData) {
      availabilities.value = guideData.availabilities
    }

    // obtenemos la timezone del guía de sus servicios
    const guideServiceData = servicesData.find((gs) => gs.guide_id === guideId)
    if (guideServiceData?.services[0]) {
      guideTimezone.value = guideServiceData.services[0].timezone
    }

    // actualizamos los eventos del calendario con la timezone ya cargada
    calendarOptions.value = {
      ...calendarOptions.value,
      timeZone: guideTimezone.value,
      events: buildCalendarEvents(),
    }
  } catch {
    error.value = 'Error al cargar los horarios'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
