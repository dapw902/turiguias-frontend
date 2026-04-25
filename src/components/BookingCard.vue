<template>
  <div class="bg-base-200 rounded-lg p-3 text-sm">
    <!-- campos obligatorios -->
    <div class="flex items-center justify-between mb-1">
      <p class="font-bold">{{ booking.turitop_booking_id }}</p>
      <span class="badge badge-sm text-white" :class="isGood ? 'badge-success' : 'badge-warning'">
        {{ booking.status }}
      </span>
    </div>
    <!-- datos adicionales del cliente -->
    <p class="font-medium">{{ booking.pax }} pax · {{ booking.client_data.name }}</p>
    <p class="text-xs">
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
        class="text-xs text-base-content/70 flex items-center gap-1 min-w-0"
      >
        <span class="truncate max-w-24" :title="ticket.name">{{ ticket.name }}:</span>
        <span class="flex-shrink-0">{{ ticket.count }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Booking } from '@/api/bookings'

const props = defineProps<{
  booking: Booking
}>()

// colores para el estado: verde para confirmed y paid, amarillo para el resto
const isGood = computed(() => ['confirmed', 'paid'].includes(props.booking.status))
</script>
