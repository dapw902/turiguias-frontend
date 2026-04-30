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
        <button class="btn btn-gradient text-white" @click="showForm = !showForm">
          {{ showForm ? 'Cancelar' : 'Registrar disponibilidad' }}
        </button>
      </div>

      <!-- navegación entre subvistas del guía -->
      <div class="flex gap-2 mb-6 justify-center">
        <RouterLink
          :to="`/admin/guides/${guideId}/services`"
          class="btn btn-outline-gradient gap-2"
        >
          <ListCheck :size="14" style="color: var(--color-primary)" />
          Servicios
        </RouterLink>
        <RouterLink :to="`/admin/guides/${guideId}/groups`" class="btn btn-outline-gradient gap-2">
          <BookOpenCheck :size="14" style="color: var(--color-primary)" />
          Grupos
        </RouterLink>
      </div>

      <!-- formulario de nueva disponibilidad -->
      <div v-if="showForm" class="bg-base-100 rounded-xl p-4 shadow-sm mb-4 max-w-lg mx-auto">
        <h3 class="font-bold text-sm mb-3">Nueva franja de disponibilidad</h3>
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label pb-1"
                ><span class="label-text font-medium">Fecha inicio *</span></label
              >
              <input
                ref="startDateInput"
                type="text"
                class="input input-secondary w-full"
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div class="form-control">
              <label class="label pb-1"
                ><span class="label-text font-medium">Fecha fin *</span></label
              >
              <input
                ref="endDateInput"
                type="text"
                class="input input-secondary w-full"
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div class="form-control">
              <label class="label pb-1"
                ><span class="label-text font-medium">Hora inicio *</span></label
              >
              <input v-model="form.start_time" type="time" class="input input-secondary w-full" />
            </div>
            <div class="form-control">
              <label class="label pb-1"
                ><span class="label-text font-medium">Hora fin *</span></label
              >
              <input v-model="form.end_time" type="time" class="input input-secondary w-full" />
            </div>
          </div>
          <p v-if="formError" class="text-error text-sm">{{ formError }}</p>
          <div class="flex justify-end gap-2">
            <button class="btn btn-outline-gradient" @click="showForm = false">Cancelar</button>
            <button
              class="btn btn-gradient text-white"
              :disabled="formLoading"
              @click="handleSubmit"
            >
              <span v-if="formLoading" class="loading loading-spinner loading-sm"></span>
              <span v-else>Guardar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- listado de franjas + calendario -->
      <div class="grid grid-cols-4 gap-4">
        <!-- listado de horarios -->
        <div class="bg-base-100 rounded-xl p-4 shadow-sm col-span-1 flex flex-col gap-4">
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
                <button
                  class="btn btn-ghost btn-xs text-error hover:bg-error/10 flex-shrink-0"
                  :disabled="deletingId === a.id"
                  @click="handleDelete(a.id)"
                >
                  <span
                    v-if="deletingId === a.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <Trash2 v-else :size="14" />
                </button>
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
                <button
                  class="btn btn-ghost btn-xs text-error hover:bg-error/10 flex-shrink-0"
                  :disabled="deletingId === a.id"
                  @click="handleDelete(a.id)"
                >
                  <span
                    v-if="deletingId === a.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <Trash2 v-else :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- calendario -->
        <div class="bg-base-100 rounded-xl p-4 shadow-sm col-span-3">
          <FullCalendar :options="calendarOptions" />
        </div>
      </div>
    </div>
    <!-- modal de confirmación de borrado con grupos afectados -->
    <ForceDeleteAvailabilityModal
      :show="showForceDeleteConfirm"
      :affected-groups-count="affectedGroupsCount"
      :loading="!!deletingId"
      @confirm="handleForceDelete"
      @cancel="showForceDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
// para acceso a los parámetros de la URL y navegación
import { useRoute } from 'vue-router'
// importamos FullCalendar y los plugins necesarios
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { CalendarOptions } from '@fullcalendar/core'
// importamos las funciones e interfaces necesarias
import {
  getGuideAvailability,
  createAvailability,
  deleteAvailability,
  type Availability,
} from '@/api/guide-availability'
// para obtener la timezone del guía a través de sus servicios
import { getGuideServices } from '@/api/guide-services'
// para obtener el listado de los usuarios
import { getUsers } from '@/api/users'
// para conversión de fechas
import { DateTime } from 'luxon'
// iconos
import { Trash2, BookOpenCheck, ListCheck } from '@lucide/vue'
// para el selector de las fechas
import flatpickr from 'flatpickr'
import { Spanish } from 'flatpickr/dist/l10n/es'
import 'flatpickr/dist/flatpickr.min.css'
import type { Instance } from 'flatpickr/dist/types/instance'
// para manejo de errores del back
import { extractError } from '@/utils/errors'
// store para mensajes de éxito
import { useSuccessMessages } from '@/stores/successMessages'
// modal para la reconfirmación de borrado de horarios con grupos
import ForceDeleteAvailabilityModal from '@/components/ForceDeleteAvailabilityModal.vue'

const route = useRoute()
const successMessages = useSuccessMessages()

// leemos el guideId de la URL (/admin/guides/:guideId/availability)
const guideId = parseInt(route.params.guideId as string)

// ESTADO
const guideName = ref('')
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

// controla si el formulario está visible
const showForm = ref(false)

// campos del formulario
const form = ref({
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
})
const formError = ref('')
const formLoading = ref(false)

// CALENDARIO
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  locale: 'es',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
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

// ESTADO — modal confirmación borrado con grupos afectados
const showForceDeleteConfirm = ref(false)
const forceDeleteId = ref<number | null>(null)
const affectedGroupsCount = ref(0)

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
        title: `${localStart} — ${localEnd}`,
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
  try {
    const [availabilityData, servicesData, usersData] = await Promise.all([
      getGuideAvailability(guideId),
      getGuideServices(),
      getUsers(),
    ])

    // el nombre siempre lo sacamos del listado de usuarios
    const guideUser = usersData.find((u) => u.id === guideId)
    if (guideUser) guideName.value = guideUser.name

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

// CREAR DISPONIBILIDAD
// función para registrar nuevos horarios
async function handleSubmit() {
  formError.value = ''

  if (
    !form.value.start_date ||
    !form.value.end_date ||
    !form.value.start_time ||
    !form.value.end_time
  ) {
    formError.value = 'Completa todos los campos'
    return
  }

  if (form.value.end_date < form.value.start_date) {
    formError.value = 'La fecha de fin no puede ser anterior a la de inicio'
    return
  }

  if (form.value.end_time <= form.value.start_time) {
    formError.value = 'La hora de fin debe ser posterior a la de inicio'
    return
  }

  formLoading.value = true
  try {
    await createAvailability({
      user_id: guideId,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
    })
    // reseteamos el formulario y recargamos
    form.value = { start_date: '', end_date: '', start_time: '', end_time: '' }
    showForm.value = false
    successMessages.show('Disponibilidad registrada correctamente')
    await loadData()
  } catch (e: unknown) {
    formError.value = extractError(e, 'Error al registrar la disponibilidad')
  } finally {
    formLoading.value = false
  }
}

// BORRAR DISPONIBILIDAD
// función para borrar horarios. Si tiene grupos existentes, detecta el error 409 y muestra un modal de reconfirmación
const deletingId = ref<number | null>(null)

async function handleDelete(id: number) {
  deletingId.value = id
  try {
    await deleteAvailability(id)
    await loadData()
    successMessages.show('Disponibilidad eliminada correctamente')
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { statusCode?: number; message?: string; affectedGroups?: number } }
    }
    if (err?.response?.data?.statusCode === 409) {
      // si hay grupos afectados, mostramos el modal de confirmación
      forceDeleteId.value = id
      affectedGroupsCount.value = err?.response?.data?.affectedGroups ?? 0
      showForceDeleteConfirm.value = true
    } else {
      error.value = extractError(e, 'Error al borrar la disponibilidad')
    }
  } finally {
    deletingId.value = null
  }
}

// para borrar la disponibilidad ignorando los grupos afectados
async function handleForceDelete() {
  if (!forceDeleteId.value) return
  deletingId.value = forceDeleteId.value
  try {
    await deleteAvailability(forceDeleteId.value, true)
    showForceDeleteConfirm.value = false
    forceDeleteId.value = null
    await loadData()
    successMessages.show(
      'Disponibilidad eliminada. Los grupos afectados han sido marcados para revisión.',
    )
  } catch {
    error.value = 'Error al borrar la disponibilidad'
  } finally {
    deletingId.value = null
  }
}

// SELECTOR FECHAS
// referencias a los inputs de fecha para flatpickr
const startDateInput = ref<HTMLInputElement | null>(null)
const endDateInput = ref<HTMLInputElement | null>(null)
let fpStart: Instance | null = null
let fpEnd: Instance | null = null

// inicializamos flatpickr cuando el formulario se muestra
watch(showForm, (val) => {
  if (val) {
    nextTick(() => {
      if (startDateInput.value) {
        fpStart = flatpickr(startDateInput.value, {
          locale: Spanish,
          dateFormat: 'Y-m-d',
          onChange: (_, dateStr) => {
            form.value.start_date = dateStr
          },
        })
      }
      if (endDateInput.value) {
        fpEnd = flatpickr(endDateInput.value, {
          locale: Spanish,
          dateFormat: 'Y-m-d',
          onChange: (_, dateStr) => {
            form.value.end_date = dateStr
          },
        })
      }
    })
  } else {
    fpStart?.destroy()
    fpEnd?.destroy()
  }
})

onMounted(() => {
  loadData()
})
</script>
