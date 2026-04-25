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
          <h2 class="text-xl font-bold">{{ event ? formatEventTitle(event) : '' }}</h2>
          <p class="text-sm text-base-content/60 mt-1">
            {{ totalPax }} pax |
            {{ bookings.filter((b) => b.status !== 'deleted').length }} reserva/s |
            {{ groups.length }} grupo/s
          </p>
        </div>
        <!-- botones de acción -->
        <div class="flex gap-2">
          <button class="btn btn-outline" @click="handleCreateGroup()">Crear grupo</button>
          <button
            class="btn btn-gradient text-white"
            :disabled="generating"
            @click="handleGenerateGroups()"
          >
            <span v-if="generating" class="loading loading-spinner loading-sm"></span>
            <span v-else>Generar grupos</span>
          </button>
        </div>
      </div>

      <!-- área principal: grupos + reservas sueltas -->
      <div class="flex gap-4 overflow-x-auto pb-4">
        <!-- columnas de grupos -->
        <div
          v-for="group in groups"
          :key="group.id"
          class="bg-base-100 rounded-xl p-4 shadow-sm min-w-72 w-72 flex-shrink-0"
        >
          <!-- header del grupo -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="font-bold text-sm">Grupo {{ group.id }}</p>
              <p class="text-xs text-base-content/60">
                Guía: {{ group.user?.name ?? 'Sin asignar' }}
              </p>
            </div>
            <!-- checkbox confirmed -->
            <label class="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                :checked="group.confirmed"
                @change="handleToggleConfirmed(group)"
              />
              <span class="text-xs">Confirmado</span>
            </label>
          </div>

          <!-- reservas del grupo -->
          <div class="flex flex-col gap-2">
            <BookingCard
              v-for="booking in bookings.filter((b) => b.group?.id === group.id)"
              :key="booking.id"
              :booking="booking"
            />
          </div>
        </div>

        <!-- columna de reservas sueltas -->
        <div
          v-if="ungroupedBookings.length > 0"
          class="bg-base-100 rounded-xl p-4 shadow-sm min-w-72 w-72 flex-shrink-0"
        >
          <p class="font-bold text-sm mb-3">Sin grupo ({{ ungroupedBookings.length }})</p>
          <div class="flex flex-col gap-2">
            <BookingCard
              v-for="booking in ungroupedBookings"
              :key="booking.id"
              :booking="booking"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// para acceso a los parámetros de la URL
import { useRoute } from 'vue-router'
// importamos las funciones e interfaces necesarias
import { getEventById, type Event } from '@/api/events'
import { getBookingsByEvent, type Booking } from '@/api/bookings'
import { getGroupsByEvent, generateGroups, saveGroups, type Group } from '@/api/groups'
// para conversión de UTC a hora local
import { DateTime } from 'luxon'
// para el formato de las tarjetas de las reservas
import BookingCard from '@/components/BookingCard.vue'

const route = useRoute()
// leemos el eventId de la URL (/admin/events/:eventId/groups)
const eventId = parseInt(route.params.eventId as string)

// ESTADO
const event = ref<Event | null>(null)
const groups = ref<Group[]>([])
const bookings = ref<Booking[]>([])
const loading = ref(false)
const error = ref('')
// de las reservas activas únicamente
const totalPax = computed(() =>
  bookings.value.filter((b) => b.status !== 'deleted').reduce((sum, b) => sum + b.pax, 0),
)

// reservas sin grupo asignado
const ungroupedBookings = computed(() =>
  bookings.value.filter((b) => b.group === null && b.status !== 'deleted'),
)

// HELPERS
// para formatear el título del evento: "08:00 - Excursión Teide"
function formatEventTitle(event: Event): string {
  const time = DateTime.fromSeconds(event.event_time)
    .setZone(event.service.timezone)
    .toFormat('HH:mm')
  return `${time} - ${event.service.name}`
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [eventData, groupsData, bookingsData] = await Promise.all([
      getEventById(eventId),
      getGroupsByEvent(eventId),
      getBookingsByEvent(eventId),
    ])
    event.value = eventData
    groups.value = groupsData
    bookings.value = bookingsData
  } catch {
    error.value = 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

// GENERACIÓN DE GRUPOS

// estado de carga del botón generar
const generating = ref(false)

// para generar grupos automáticamente y guardarlos como no confirmados
async function handleGenerateGroups() {
  generating.value = true
  error.value = ''
  try {
    // generamos la propuesta
    const proposal = await generateGroups(eventId)
    // guardamos los grupos propuestos en la BBDD como no confirmados
    await saveGroups({
      event_id: eventId,
      groups: proposal.groups.map((g, index) => ({
        booking_ids: g.bookings.map((b) => b.id),
        needs_attention: g.needs_attention,
        user_id: proposal.available_guides[index]?.guide_id ?? null,
      })),
    })
    // recargamos para ver los grupos nuevos
    await loadData()
  } catch {
    error.value = 'Error al generar los grupos'
  } finally {
    generating.value = false
  }
}

// para crear un grupo vacío manualmente
async function handleCreateGroup() {
  try {
    await saveGroups({
      event_id: eventId,
      groups: [{ booking_ids: [] }],
    })
    await loadData()
  } catch {
    error.value = 'Error al crear el grupo'
  }
}

// CONFIRMACIÓN DE GRUPOS
// para confirmar un grupo al hacer clic en el checkbox
async function handleToggleConfirmed(group: Group) {
  try {
    await saveGroups({
      event_id: eventId,
      groups: [
        {
          group_id: group.id,
          booking_ids: [],
          user_id: group.user?.id ?? null,
          confirmed: !group.confirmed,
        },
      ],
    })
    await loadData()
  } catch {
    error.value = 'Error al actualizar el grupo'
  }
}

onMounted(() => {
  loadData()
})
</script>
