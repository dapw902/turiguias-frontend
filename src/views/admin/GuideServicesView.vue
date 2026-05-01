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
        <button class="btn btn-gradient text-white" @click="openCreateModal">
          Asignar servicio
        </button>
      </div>
      <!-- navegación entre subvistas del guía -->
      <div class="flex gap-2 mb-6 justify-center">
        <RouterLink :to="`/admin/guides/${guideId}/availability`" class="btn btn-outline-gradient">
          <CalendarCheck :size="14" style="color: var(--color-primary)" />
          Horarios
        </RouterLink>
        <RouterLink :to="`/admin/guides/${guideId}/groups`" class="btn btn-outline-gradient">
          <BookOpenCheck :size="14" style="color: var(--color-primary)" />
          Grupos
        </RouterLink>
      </div>

      <!-- error al borrar servicio -->
      <div v-if="deleteError" class="banner-warning mb-4">
        <TriangleAlert :size="20" class="text-error flex-shrink-0" />
        <p class="text-error">{{ deleteError }}</p>
      </div>

      <!-- tarjetas de servicio asignados en móvil -->
      <div class="flex flex-col gap-3 lg:hidden">
        <div
          v-for="service in assignedServices"
          :key="service.id"
          class="bg-base-100 rounded-xl p-4 shadow-sm"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-bold">{{ service.service_name }}</p>
              <p class="text-sm text-base-content/60">
                {{ service.turitop_product_id }} · {{ service.capacity }} pax
              </p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-xs" @click="openEditModal(service)">
                <Pencil :size="14" />
              </button>
              <button
                class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                :disabled="deletingId === service.id"
                @click="handleDelete(service.id)"
              >
                <span
                  v-if="deletingId === service.id"
                  class="loading loading-spinner loading-xs"
                ></span>
                <Trash2 v-else :size="14" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="assignedServices.length === 0" class="text-center py-12 text-base-content/40">
          No hay servicios asignados
        </div>
      </div>

      <!-- tabla de servicios asignados en desktop -->
      <div class="hidden lg:block overflow-x-auto rounded-xl shadow-sm">
        <table class="table bg-base-100">
          <thead>
            <tr>
              <th>Código</th>
              <th>Servicio</th>
              <th>Capacidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in assignedServices" :key="service.id">
              <td>{{ service.turitop_product_id }}</td>
              <td class="font-medium">{{ service.service_name }}</td>
              <td>{{ service.capacity }} pax</td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button class="btn btn-ghost btn-xs" @click="openEditModal(service)">
                    <Pencil :size="14" />
                  </button>
                  <button
                    class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                    :disabled="deletingId === service.id"
                    @click="handleDelete(service.id)"
                  >
                    <span
                      v-if="deletingId === service.id"
                      class="loading loading-spinner loading-xs"
                    ></span>
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </td>
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

    <!-- modal asignar/editar servicio -->
    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editingService ? 'Editar servicio' : 'Asignar servicio' }}
        </h3>

        <div class="flex flex-col gap-3">
          <!-- selector de servicio -->
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text font-medium">Servicio *</span>
            </label>
            <select
              v-model="form.service_id"
              class="select select-secondary w-full"
              :disabled="!!editingService"
            >
              <option :value="null">Selecciona un servicio</option>
              <option v-for="service in availableServices" :key="service.id" :value="service.id">
                {{ service.turitop_product_id }} — {{ service.name }}
              </option>
            </select>
            <p v-if="editingService" class="text-xs text-base-content/40 mt-1">
              El servicio no se puede cambiar, solo la capacidad
            </p>
          </div>

          <!-- capacidad -->
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text font-medium">Capacidad (pax) *</span>
            </label>
            <input
              v-model.number="form.capacity"
              type="number"
              min="1"
              class="input input-secondary w-full"
              placeholder="Ej: 15"
            />
          </div>
        </div>

        <!-- mensaje de error -->
        <p v-if="formError" class="text-error text-sm mt-3">{{ formError }}</p>

        <!-- botones del modal -->
        <div class="modal-action">
          <button class="btn btn-outline-gradient" @click="closeModal">Cancelar</button>
          <button class="btn btn-gradient text-white" :disabled="formLoading" @click="handleSubmit">
            <span v-if="formLoading" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ editingService ? 'Guardar cambios' : 'Asignar' }}</span>
          </button>
        </div>
      </div>
      <!-- click fuera del modal para cerrar -->
      <div class="modal-backdrop" @click="closeModal"></div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// para acceso a los parámetros de la URL
import { useRoute } from 'vue-router'
// importamos las funciones e interfaces necesarias
import {
  getGuideServicesByUser,
  createGuideService,
  updateGuideService,
  deleteGuideService,
  type GuideAssignedService,
} from '@/api/guide-services'
// para obtener el listado de servicios disponibles
import { getServices, type Service } from '@/api/services'
// para recuperar el listado de usuarios
import { getUsers } from '@/api/users'
// iconos
import { Pencil, Trash2, CalendarCheck, BookOpenCheck, TriangleAlert } from '@lucide/vue'
// para manejo de errores del back
import { extractError } from '@/utils/errors'
// store para mensajes de éxito
import { useSuccessMessages } from '@/stores/successMessages'

const route = useRoute()

// mensaje de confrimación
const successMessages = useSuccessMessages()

// error específico para el borrado de servicios
const deleteError = ref('')

// leemos el guideId de la URL (/admin/guides/:guideId/services)
const guideId = parseInt(route.params.guideId as string)

// ESTADO
const guideName = ref('')
const assignedServices = ref<GuideAssignedService[]>([])
const availableServices = ref<Service[]>([])
const loading = ref(false)
const error = ref('')

// MODAL
const showModal = ref(false)
// servicio que se está editando — null si es asignación nueva
const editingService = ref<GuideAssignedService | null>(null)

// campos del formulario
const form = ref({
  service_id: null as number | null,
  capacity: 1,
})
const formError = ref('')
const formLoading = ref(false)

// para abrir el modal en modo asignación
function openCreateModal() {
  editingService.value = null
  form.value = { service_id: null, capacity: 1 }
  formError.value = ''
  showModal.value = true
}

// para abrir el modal en modo edición
function openEditModal(service: GuideAssignedService) {
  editingService.value = service
  // buscamos el service_id real en el listado de servicios disponibles
  const found = availableServices.value.find((s) => s.name === service.service_name)
  form.value = {
    service_id: found?.id ?? null,
    capacity: service.capacity,
  }
  formError.value = ''
  showModal.value = true
}

// para cerrar el modal
function closeModal() {
  showModal.value = false
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [guideServicesData, servicesData, usersData] = await Promise.all([
      getGuideServicesByUser(guideId),
      getServices(),
      getUsers(),
    ])

    // el nombre siempre lo sacamos del listado de usuarios
    const guideUser = usersData.find((u) => u.id === guideId)
    if (guideUser) guideName.value = guideUser.name

    // los servicios asignados solo si existen
    const guideData = guideServicesData[0]
    if (guideData) {
      assignedServices.value = guideData.services
    } else {
      assignedServices.value = []
    }

    availableServices.value = servicesData
  } catch {
    error.value = 'Error al cargar los servicios'
  } finally {
    loading.value = false
  }
}

// CREAR O EDITAR SERVICIO ASIGNADO
async function handleSubmit() {
  formError.value = ''

  if (!form.value.service_id) {
    formError.value = 'Selecciona un servicio'
    return
  }

  if (!form.value.capacity || form.value.capacity < 1) {
    formError.value = 'La capacidad debe ser mínimo 1'
    return
  }

  formLoading.value = true
  try {
    if (editingService.value) {
      await updateGuideService(editingService.value.id, {
        user_id: guideId,
        service_id: form.value.service_id,
        capacity: form.value.capacity,
      })
    } else {
      await createGuideService({
        user_id: guideId,
        service_id: form.value.service_id,
        capacity: form.value.capacity,
      })
    }
    closeModal()
    successMessages.show(
      editingService.value
        ? 'Servicio actualizado correctamente'
        : 'Servicio asignado correctamente',
    )
    await loadData()
  } catch (e: unknown) {
    formError.value = extractError(e, 'Error al guardar el servicio')
  } finally {
    formLoading.value = false
  }
}

// BORRAR SERVICIO ASIGNADO
const deletingId = ref<number | null>(null)

async function handleDelete(id: number) {
  deletingId.value = id
  deleteError.value = ''
  try {
    await deleteGuideService(id)
    await loadData()
    successMessages.show('Servicio eliminado correctamente')
  } catch (e: unknown) {
    deleteError.value = extractError(e, 'Error al borrar el servicio')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>
