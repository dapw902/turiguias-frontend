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

    <div v-else-if="groupData">
      <!-- cabecera -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold">{{ authStore.user?.name }}</h2>
          <p class="text-sm text-base-content/60 mt-1">{{ groupData.service_timezone }}</p>
          <p class="text-sm mt-1">
            <span class="font-medium">Grupo {{ groupData.group_id }}</span>
            · {{ formattedEventTime }} · {{ groupData.service_name }} · {{ totalPax }} pax
          </p>
        </div>
        <button class="btn btn-outline-gradient" @click="router.back()">← Volver</button>
      </div>

      <!-- listado de reservas -->
      <div class="flex flex-col gap-3 max-w-2xl mx-auto">
        <BookingCard
          v-for="booking in groupData.bookings"
          :key="booking.id"
          :booking="booking"
          :show-details="true"
        />
        <div v-if="groupData.bookings.length === 0" class="text-center py-12 text-base-content/40">
          No hay reservas en este grupo
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// para acceso a los parámetros de la URL y navegación
import { useRoute, useRouter } from 'vue-router'
// importamos las funciones e interfaces necesarias
import { getBookingsByGroup, type GroupWithBookings } from '@/api/groups'
// para conversión de fechas
import { DateTime } from 'luxon'
// para identificar al guía logueado
import { useAuthStore } from '@/stores/auth'
// template para tarjeta de reserva
import BookingCard from '@/components/BookingCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// leemos el groupId de la URL
const groupId = parseInt(route.params.groupId as string)

// ESTADO
const groupData = ref<GroupWithBookings | null>(null)
const loading = ref(false)
const error = ref('')

// total de pax del grupo
const totalPax = computed(() => groupData.value?.total_pax ?? 0)

// formateamos la fecha del evento en la timezone del servicio
const formattedEventTime = computed(() => {
  if (!groupData.value) return ''
  return DateTime.fromSeconds(groupData.value.event_time)
    .setZone(groupData.value.service_timezone)
    .toFormat('dd/MM/yyyy HH:mm')
})

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    groupData.value = await getBookingsByGroup(groupId)
  } catch {
    error.value = 'Error al cargar las reservas'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
