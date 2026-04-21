<template>
  <div>
    <!-- cabecera de la vista -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-medium">Eventos</h2>
    </div>

    <!-- estado de carga -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" style="color: var(--color-primary)"></span>
    </div>

    <!-- mensaje de error -->
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <!-- lista de eventos -->
    <div v-else>
      <!-- aquí van las tarjetas -->
    </div>
  </div>
</template>

<script setup lang="ts">
// para crear variables reactivas y ejecutar código al montar el componente
import { ref, onMounted } from 'vue'
// importamos la función y las interfaces de la API de eventos
import { getEvents, type Event, type PaginatedEvents } from '@/api/events'

// lista de eventos cargados
const events = ref<Event[]>([])
// estado de carga
const loading = ref(false)
// error si falla la carga
const error = ref('')
// datos de paginación
const pagination = ref<Omit<PaginatedEvents, 'data'>>({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
})

// función para cargar los eventos desde el backend
async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const result = await getEvents({ page: pagination.value.page, limit: pagination.value.limit })
    events.value = result.data
    pagination.value = {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  } catch {
    error.value = 'Error al cargar los eventos'
  } finally {
    loading.value = false
  }
}

// cargamos los eventos al montar la vista
onMounted(() => {
  loadEvents()
})
</script>
