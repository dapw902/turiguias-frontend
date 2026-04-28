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
          <p class="text-sm text-base-content/60 mt-1">
            {{ activeGroups.length }} grupo/s de eventos a celebrar
          </p>
        </div>
      </div>

      <!-- grupos activos y futuros -->
      <div class="mb-8">
        <p class="font-bold text-sm mb-3">Grupos presentes y futuros</p>
        <div class="overflow-x-auto rounded-xl shadow-sm">
          <table class="table bg-base-100">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Ocupación</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in activeGroups" :key="group.group_id">
                <td>{{ formatEventTime(group.event_time, group.service_timezone) }}</td>
                <td class="font-medium">{{ group.service_name }}</td>
                <td>{{ group.total_pax }} / {{ group.capacity ?? '—' }} pax</td>
                <td>
                  <span
                    class="badge badge-md text-white"
                    :class="group.confirmed ? 'badge-success' : 'badge-warning'"
                  >
                    {{ group.confirmed ? 'Confirmado' : 'Pendiente' }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="router.push(`/guide/groups/${group.group_id}/bookings`)"
                  >
                    <Eye :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="activeGroups.length === 0"
            class="text-center py-12 text-base-content/40 bg-base-100"
          >
            No hay grupos presentes o futuros
          </div>
        </div>
      </div>

      <!-- grupos pasados -->
      <div>
        <p class="font-bold text-sm mb-3 text-base-content/40">Grupos pasados</p>
        <div class="overflow-x-auto rounded-xl shadow-sm">
          <table class="table bg-base-100 opacity-60">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Ocupación</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in pastGroups" :key="group.group_id">
                <td>{{ formatEventTime(group.event_time, group.service_timezone) }}</td>
                <td class="font-medium">{{ group.service_name }}</td>
                <td>{{ group.total_pax }} / {{ group.capacity ?? '—' }} pax</td>
                <td>
                  <span
                    class="badge badge-md text-white"
                    :class="group.confirmed ? 'badge-success' : 'badge-warning'"
                  >
                    {{ group.confirmed ? 'Confirmado' : 'Pendiente' }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="router.push(`/guide/groups/${group.group_id}/bookings`)"
                  >
                    <Eye :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="pastGroups.length === 0"
            class="text-center py-12 text-base-content/40 bg-base-100"
          >
            No hay grupos pasados
          </div>
        </div>
      </div>

      <!-- paginación -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
        <button
          class="btn btn-sm btn-outline-gradient"
          :disabled="currentPage === 1"
          @click="loadData(currentPage - 1)"
        >
          ←
        </button>
        <span class="btn btn-sm btn-ghost pointer-events-none">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          class="btn btn-sm btn-outline-gradient"
          :disabled="currentPage === totalPages"
          @click="loadData(currentPage + 1)"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// para acceso a los parámetros de la URL
import { getGroupsByGuide, type GuideGroup } from '@/api/groups'
// para conversión de fechas
import { DateTime } from 'luxon'
// iconos
import { Eye } from '@lucide/vue'
// para identficar al guía logueado
import { useAuthStore } from '@/stores/auth'
// para navegación
import { useRouter } from 'vue-router'

const authStore = useAuthStore()

const router = useRouter()

// ESTADO
const guideName = authStore.user?.name
const groups = ref<GuideGroup[]>([])
const loading = ref(false)
const error = ref('')

// PAGINACIÓN
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const limit = 10

// grupos presentes y futuros
const activeGroups = computed(() =>
  groups.value.filter(
    (g) =>
      DateTime.fromSeconds(g.event_time).setZone(g.service_timezone) >=
      DateTime.now().startOf('day'),
  ),
)

// grupos pasados
const pastGroups = computed(() =>
  groups.value.filter(
    (g) =>
      DateTime.fromSeconds(g.event_time).setZone(g.service_timezone) <
      DateTime.now().startOf('day'),
  ),
)

// HELPERS
// para formatear la fecha del evento
function formatEventTime(timestamp: number, timezone: string): string {
  return DateTime.fromSeconds(timestamp).setZone(timezone).toFormat('dd/MM/yyyy HH:mm')
}

// CARGA DE DATOS
async function loadData(page = 1) {
  loading.value = true
  error.value = ''
  const guideId = authStore.user?.id
  if (!guideId) return
  try {
    const groupsData = await getGroupsByGuide(guideId, page, limit)

    groups.value = groupsData.data
    totalPages.value = groupsData.totalPages
    total.value = groupsData.total
    currentPage.value = page
  } catch {
    error.value = 'Error al cargar los grupos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
