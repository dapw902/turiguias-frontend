<template>
  <dialog :open="isOpen" class="modal">
    <div class="modal-box max-w-lg">
      <!-- header del modal -->
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold">
            {{ event?.service.turitop_product_id }}-{{ event?.service.name }}
          </h3>
          <!-- info del evento -->
          <p class="text-sm text-base-content/60">
            {{ event ? formatDate(event.event_time) : '' }}
          </p>
        </div>
        <button class="btn btn-ghost btn-sm btn-circle" @click="$emit('close')">✕</button>
      </div>

      <!-- Pax ocupados -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-base-200 rounded-lg p-3">
          <p class="text-xs text-base-content/60">Pax reservados</p>
          <p class="text-xl font-bold">{{ event?.totalPax }}</p>
        </div>
        <!-- conteo de grupos -->
        <div class="bg-base-200 rounded-lg p-3">
          <p class="text-xs text-base-content/60">Duración</p>
          <p class="text-xl font-bold">{{ formatDuration(event?.duration ?? 0) }}</p>
        </div>
        <!-- conteo de reservas -->
        <div class="bg-base-200 rounded-lg p-3">
          <p class="text-xs text-base-content/60">Reservas</p>
          <p class="text-xl font-bold">
            {{ bookings.filter((b) => b.status !== 'deleted').length }}
          </p>
        </div>
        <!-- conteo de grupos -->
        <div class="bg-base-200 rounded-lg p-3 mb-4">
          <p class="text-xs text-base-content/60">Grupos configurados</p>
          <p class="text-xl font-bold">{{ groups.length }}</p>
        </div>
      </div>

      <!-- acciones -->
      <div class="flex justify-center gap-2">
        <RouterLink
          v-if="event"
          :to="`/admin/events/${event.id}/groups`"
          class="btn font-normal btn-gradient"
          @click="emit('close')"
        >
          Ver grupos
        </RouterLink>
      </div>
    </div>
    <!-- fondo oscuro que cierra el modal al hacer clic -->
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
// importamos la interfaz tipo Event de la API
import type { Event } from '@/api/events'
// importamos ref y watch
import { ref, watch } from 'vue'
// importamos la función e interfz de grupos
import { getGroupsByEvent, type Group } from '@/api/groups'
// importamos la función e interfaz de reservas
import { getBookingsByEvent, type Booking } from '@/api/bookings'

// props que recibe el componente
const props = defineProps<{
  isOpen: boolean
  event: Event | null
}>()

// eventos que emite el componente al padre
const emit = defineEmits<{
  close: []
}>()

// grupos del evento
const groups = ref<Group[]>([])

// reservas del evento
const bookings = ref<Booking[]>([])

// INFO EVENTO
// formatea un unix timestamp a fecha y hora legible
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// convertir la duración a horas
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

// GRUPOS Y RESERVAS
// cargamos los grupos y las reservas asociadas al evento cuando se abre el modal
watch(
  () => props.event,
  async (event) => {
    if (event) {
      groups.value = await getGroupsByEvent(event.id)
      bookings.value = await getBookingsByEvent(event.id)
    } else {
      groups.value = []
      bookings.value = []
    }
  },
)
</script>
