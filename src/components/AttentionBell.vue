<template>
  <div class="relative" ref="bellRef">
    <!-- botón campana -->
    <button class="btn btn-ghost btn-xs btn-circle relative" @click="togglePanel">
      <Bell :size="18" :class="hasAttention ? 'text-error' : ''" />
      <!-- badge contador -->
      <span
        v-if="hasAttention"
        class="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none"
      >
        {{ Math.min(notifications.length, 9) }}{{ notifications.length > 9 ? '+' : '' }}
      </span>
    </button>

    <!-- panel de notificaciones -->
    <div
      v-if="open"
      class="absolute right-0 top-10 w-80 bg-base-100 rounded-xl shadow-lg border border-base-300 z-50"
    >
      <!-- cabecera -->
      <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <p class="font-bold text-sm">Notificaciones</p>
        <button class="btn btn-ghost btn-xs btn-circle" @click="open = false">
          <X :size="14" />
        </button>
      </div>

      <!-- estado de carga -->
      <div v-if="loading" class="flex justify-center py-6">
        <span class="loading loading-spinner loading-sm" style="color: var(--color-primary)"></span>
      </div>

      <!-- sin notificaciones -->
      <div
        v-else-if="notifications.length === 0"
        class="px-4 py-6 text-center text-sm text-base-content/40"
      >
        Sin notificaciones pendientes
      </div>

      <!-- listado de notificaciones -->
      <div v-else>
        <button
          v-for="n in visibleNotifications"
          :key="n.group_id"
          class="w-full text-left px-4 py-3 hover:bg-base-200 border-b border-base-300 last:border-0 transition-colors"
          @click="goToGroup(n)"
        >
          <p class="text-sm font-medium">{{ n.turitop_product_id }} — {{ n.service_name }}</p>
          <p class="text-xs text-base-content/60 mt-0.5">
            {{ formatEventTime(n.event_time, n.service_timezone) }}
          </p>
          <p
            class="text-xs mt-1 flex items-center gap-1"
            :class="n.reason === 'capacity' ? 'text-warning' : 'text-error'"
          >
            <TriangleAlert :size="12" />
            {{ n.reason === 'capacity' ? 'Capacidad superada' : 'Sin guía disponible' }}
          </p>
        </button>

        <!-- mensaje de grupos adicionales -->
        <div
          v-if="notifications.length > MAX_VISIBLE"
          class="px-4 py-3 text-xs text-base-content/50 text-center"
        >
          Hay {{ notifications.length - MAX_VISIBLE }} grupo/s adicional/es pendientes de revisión
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
// para la navegación
import { useRouter } from 'vue-router'
// importamos las funciones e interfaces necesarias
import { getGroupsWithAttention, type GroupAttention } from '@/api/groups'
// para decodificar la hora de los eventos
import { DateTime } from 'luxon'
// iconos
import { Bell, X, TriangleAlert } from '@lucide/vue'

const router = useRouter()

// número máximo de notificaciones visibles
const MAX_VISIBLE = 5

// ESTADO
const open = ref(false)
const loading = ref(false)
const notifications = ref<GroupAttention[]>([])
const bellRef = ref<HTMLElement | null>(null)

// hay notificaciones pendientes
const hasAttention = computed(() => notifications.value.length > 0)

// guardamos los 5 más próximos ordenados por fecha
const visibleNotifications = computed(() =>
  [...notifications.value].sort((a, b) => a.event_time - b.event_time).slice(0, MAX_VISIBLE),
)

// HELPERS
function formatEventTime(timestamp: number, timezone: string): string {
  return DateTime.fromSeconds(timestamp).setZone(timezone).toFormat('dd/MM/yyyy HH:mm')
}

function goToGroup(n: GroupAttention) {
  router.push(`/admin/events/${n.event_id}/groups`)
  open.value = false
}

// CARGA DE DATOS
async function loadNotifications() {
  loading.value = true
  try {
    notifications.value = await getGroupsWithAttention()
  } catch {
    // silencioso (la campana no debe romper el layout)
  } finally {
    loading.value = false
  }
}

// cerrar panel al hacer clic fuera
function handleClickOutside(e: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

// abre y cierra el panel (recarga las notificaciones al abrir)
function togglePanel() {
  open.value = !open.value
  if (open.value) loadNotifications()
}

onMounted(() => {
  loadNotifications()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
