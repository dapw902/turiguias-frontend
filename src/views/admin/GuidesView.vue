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
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre o email"
          class="input input-secondary w-80 text-base"
        />
        <VueSelect
          v-model="selectedServiceTuriTopId"
          :options="services"
          :reduce="(s: Service) => s.turitop_product_id"
          label="name"
          placeholder="Todos los servicios"
          class="w-64"
        >
          <template #option="{ turitop_product_id, name }">
            {{ turitop_product_id }} — {{ name }}
          </template>
          <template #no-options>No se encontraron resultados</template>
        </VueSelect>
      </div>

      <!-- grid de tarjetas de guías -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="guide in filteredGuides"
          :key="guide.id"
          class="bg-base-100 rounded-xl p-4 shadow-sm flex flex-col gap-4 h-full"
        >
          <!-- cabecera: foto y nombre -->
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-base-300 flex items-center justify-center"
            >
              <img
                v-if="guide.photo"
                :src="`http://localhost:3000${guide.photo}`"
                :alt="guide.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-base-content/60 font-bold text-lg">
                {{ guide.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="font-bold truncate">{{ guide.name }}</p>
              <p class="text-xs text-base-content/60 truncate">{{ guide.email }}</p>
            </div>
          </div>

          <!-- servicios asignados -->
          <div class="flex-1">
            <p class="text-xs text-base-content/60 font-medium mb-1">Servicios</p>
            <div v-if="getServicesForGuide(guide.id).length > 0" class="flex flex-col gap-1">
              <span
                v-for="service in getServicesForGuide(guide.id).slice(0, 5)"
                :key="service.id"
                class="badge badge-md w-full justify-start"
              >
                {{ service.turitop_product_id }} — {{ service.service_name }}
              </span>
              <span
                v-if="getServicesForGuide(guide.id).length > 5"
                class="text-xs text-base-content/40 mt-1"
              >
                +{{ getServicesForGuide(guide.id).length - 5 }} más — ver en Servicios
              </span>
            </div>
            <p v-else class="text-xs text-base-content/40">Sin servicios asignados</p>
          </div>

          <!-- botones de acceso a subvistas — en vertical -->
          <div class="flex flex-col gap-2">
            <RouterLink
              :to="`/admin/guides/${guide.id}/availability`"
              class="btn btn-outline-gradient w-full gap-2"
            >
              <Clock :size="14" />
              Horarios
            </RouterLink>
            <RouterLink
              :to="`/admin/guides/${guide.id}/services`"
              class="btn btn-outline-gradient w-full gap-2"
            >
              <Briefcase :size="14" />
              Servicios
            </RouterLink>
            <RouterLink
              :to="`/admin/guides/${guide.id}/groups`"
              class="btn btn-outline-gradient w-full gap-2"
            >
              <Users :size="14" />
              Grupos
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- mensaje si no hay guías -->
      <div v-if="filteredGuides.length === 0" class="text-center py-12 text-base-content/40">
        No se encontraron guías
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// importamos las funciones e interfaces necesarias
import { getGuides, type User } from '@/api/users'
import { getGuideServices, type GuideServiceByUser } from '@/api/guide-services'
// iconos
import { Clock, Briefcase, Users } from '@lucide/vue'
// para el filtro por servicios
import VueSelect from 'vue-select'
import { getServices, type Service } from '@/api/services'

// ESTADO
const guides = ref<User[]>([])
const guideServices = ref<GuideServiceByUser[]>([])
const loading = ref(false)
const error = ref('')
const services = ref<Service[]>([])
const selectedServiceTuriTopId = ref<string | null>(null)

// filtro de búsqueda
const search = ref('')

// guías filtrados por nombre o email
const filteredGuides = computed(() => {
  const q = search.value.toLowerCase().trim()

  // primero filtramos por servicio seleccionado
  let result = guides.value
  if (selectedServiceTuriTopId.value !== null) {
    const guideIdsWithService = guideServices.value
      .filter((gs) =>
        gs.services.some((s) => s.turitop_product_id === selectedServiceTuriTopId.value),
      )
      .map((gs) => gs.guide_id)
    result = result.filter((g) => guideIdsWithService.includes(g.id))
  }

  // luego filtramos por búsqueda de texto
  if (!q) return result
  const serviceMatches = guideServices.value
    .filter((gs) =>
      gs.services.some(
        (s) =>
          s.service_name.toLowerCase().includes(q) ||
          s.turitop_product_id.toLowerCase().includes(q),
      ),
    )
    .map((gs) => gs.guide_id)

  return result.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      serviceMatches.includes(g.id),
  )
})

// para obtener los servicios de un guía concreto por su id
function getServicesForGuide(guideId: number) {
  return guideServices.value.find((gs) => gs.guide_id === guideId)?.services ?? []
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [guidesData, servicesData, allServicesData] = await Promise.all([
      getGuides(),
      getGuideServices(),
      getServices(),
    ])
    guides.value = guidesData
    guideServices.value = servicesData
    services.value = allServicesData
  } catch {
    error.value = 'Error al cargar los guías'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
