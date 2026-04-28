<template>
  <div
    class="bg-base-100 rounded-lg p-3 text-sm"
    :class="{ 'cursor-grab active:cursor-grabbing': draggable }"
  >
    <!-- campos obligatorios -->
    <div class="flex items-center justify-between mb-1">
      <p class="font-bold text-base">{{ booking.turitop_booking_id }}</p>
      <span class="badge badge-md text-white" :class="isGood ? 'badge-success' : 'badge-warning'">
        {{ booking.status }}
      </span>
    </div>
    <!-- datos adicionales del cliente -->
    <p class="font-medium text-base">{{ booking.pax }} pax · {{ booking.client_data.name }}</p>
    <p class="text-sm">
      <a
        :href="`mailto:${booking.client_data.email}`"
        class="hover:underline"
        style="color: var(--color-primary)"
        @dragstart.prevent
      >
        {{ booking.client_data.email }}
      </a>
      ·
      <a
        :href="`tel:${booking.client_data.phone}`"
        class="hover:underline"
        style="color: var(--color-primary)"
        @dragstart.prevent
      >
        {{ booking.client_data.phone }}
      </a>
    </p>
    <!-- resumen de tickets -->
    <div class="mt-2 pt-2 border-t border-base-300 flex flex-wrap gap-x-3">
      <p
        v-for="ticket in booking.ticket_type_count"
        :key="ticket.id"
        class="text-sm text-base-content/70 flex items-center gap-1 min-w-0"
      >
        <span class="truncate max-w-24" :title="ticket.name">{{ ticket.name }}:</span>
        <span class="flex-shrink-0">{{ ticket.count }}</span>
      </p>
    </div>
    <!-- detalles extra opcionales: comentarios y notas-->
    <template v-if="showDetails">
      <div v-if="booking.client_data.comments" class="mt-2 pt-2 border-t border-base-300">
        <p class="text-sm text-base-content/60 font-medium">Comentarios</p>
        <p class="text-sm mt-1">{{ booking.client_data.comments }}</p>
      </div>
      <div v-if="booking.notes" class="mt-2 pt-2 border-t border-base-300">
        <p class="text-sm text-base-content/60 font-medium">Notas</p>
        <p class="text-sm mt-1">{{ booking.notes }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// tipo mínimo que necesita BookingCard para renderizar
interface BookingLike {
  id: number
  turitop_booking_id: string
  pax: number
  client_data: {
    name: string
    email: string
    phone: string
    comments?: string
  }
  ticket_type_count: {
    id: number
    name: string
    count: number
  }[]
  status: string
  notes?: string | null
  group?: { id: number } | null
}

const props = defineProps<{
  booking: BookingLike
  draggable?: boolean
  showDetails?: boolean
}>()

// colores para el estado: verde para confirmed y paid, amarillo para el resto
const isGood = computed(() => ['confirmed', 'paid'].includes(props.booking.status))
</script>
