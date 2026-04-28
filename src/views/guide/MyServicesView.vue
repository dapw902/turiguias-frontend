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
          <p v-if="assignedServices.length > 0" class="text-sm text-base-content/60 mt-1">
            {{ assignedServices[0]?.timezone }}
          </p>
        </div>
      </div>

      <!-- tabla de servicios asignados -->
      <div class="overflow-x-auto rounded-xl shadow-sm max-w-3xl mx-auto">
        <table class="table bg-base-100">
          <thead>
            <tr>
              <th>Código</th>
              <th>Servicio</th>
              <th>Capacidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in assignedServices" :key="service.id">
              <td>{{ service.turitop_product_id }}</td>
              <td class="font-medium">{{ service.service_name }}</td>
              <td>{{ service.capacity }} pax</td>
            </tr>
          </tbody>
        </table>

        <!-- mensaje si no hay servicios -->
        <div
          v-if="assignedServices.length === 0"
          class="text-center py-12 text-base-content/40 bg-base-100"
        >
          No hay servicios asignados
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// importamos las funciones e interfaces necesarias
import { getGuideServicesByUser, type GuideAssignedService } from '@/api/guide-services'
// para identficar al guía logueado
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ESTADO
const guideName = authStore.user?.name
const assignedServices = ref<GuideAssignedService[]>([])
const loading = ref(false)
const error = ref('')

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  const guideId = authStore.user?.id
  if (!guideId) return
  try {
    const guideServicesData = await getGuideServicesByUser(guideId)

    // los servicios asignados solo si existen
    const guideData = guideServicesData[0]
    if (guideData) {
      assignedServices.value = guideData.services
    } else {
      assignedServices.value = []
    }
  } catch {
    error.value = 'Error al cargar los servicios'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
