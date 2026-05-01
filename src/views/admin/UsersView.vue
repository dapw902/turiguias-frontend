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
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, email o rol"
          class="input input-secondary w-full lg:w-80 text-base"
        />
        <button class="btn btn-gradient text-white w-full lg:w-auto" @click="openCreateModal">
          Nuevo usuario
        </button>
      </div>

      <!-- Tarjetas de usuarios móvil -->
      <div class="flex flex-col gap-3 lg:hidden">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          :class="{ 'opacity-40': user.id === authStore.user?.id }"
          class="bg-base-100 rounded-xl p-4 shadow-sm"
        >
          <div class="flex justify-between items-start mb-1">
            <p class="font-bold">{{ user.name }}</p>
            <span
              class="badge badge-md text-white"
              :class="user.role === 'admin' ? 'badge-primary' : 'badge-success'"
            >
              {{ user.role }}
            </span>
          </div>
          <p class="text-sm text-base-content/60">{{ user.email }}</p>
          <p class="text-sm text-base-content/60">{{ user.phone ?? '—' }}</p>
          <div v-if="user.notes" class="flex items-start gap-1 text-sm text-base-content/60 mt-1">
            <Info :size="14" class="flex-shrink-0 mt-0.5" />
            <span>{{ user.notes }}</span>
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <template v-if="user.id === authStore.user?.id">
              <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                <Pencil :size="14" />
              </button>
              <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                <Trash2 :size="14" />
              </button>
            </template>
            <template v-else>
              <button class="btn btn-ghost btn-xs" @click="openEditModal(user)">
                <Pencil :size="14" />
              </button>
              <button
                class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                :disabled="deletingUserId === user.id"
                @click="handleDelete(user.id)"
              >
                <span
                  v-if="deletingUserId === user.id"
                  class="loading loading-spinner loading-xs"
                ></span>
                <Trash2 v-else :size="14" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Tabla de usuarios desktop -->
      <div class="hidden lg:block overflow-x-auto rounded-xl shadow-sm">
        <table class="table bg-base-100">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              :class="{ 'opacity-40': user.id === authStore.user?.id }"
            >
              <td class="font-medium">
                <div class="flex items-center gap-2">
                  {{ user.name }}
                  <div v-if="user.notes" class="tooltip tooltip-right" :data-tip="user.notes">
                    <Info :size="14" class="text-base-content/40 cursor-help" />
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone ?? '—' }}</td>
              <td>
                <span
                  class="badge badge-md text-white"
                  :class="user.role === 'admin' ? 'badge-primary' : 'badge-success'"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <!-- botones deshabilitados para el usuario actual -->
                  <template v-if="user.id === authStore.user?.id">
                    <div class="tooltip tooltip-left" data-tip="Edita tu perfil desde 'Mi cuenta'">
                      <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                        <Pencil :size="14" />
                      </button>
                    </div>
                    <div class="tooltip tooltip-left" data-tip="No puedes borrarte a ti mismo">
                      <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </template>
                  <!-- botones activos para el resto -->
                  <template v-else>
                    <button class="btn btn-ghost btn-xs" @click="openEditModal(user)">
                      <Pencil :size="14" />
                    </button>
                    <button
                      class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      :disabled="deletingUserId === user.id"
                      @click="handleDelete(user.id)"
                    >
                      <span
                        v-if="deletingUserId === user.id"
                        class="loading loading-spinner loading-xs"
                      ></span>
                      <Trash2 v-else :size="14" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- modal crear/editar usuario -->
    <UserModal :show="showModal" :user="editingUser" @close="closeModal" @saved="onUserSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// importamos las funciones e interfaces necesarias
import { getUsers, deleteUser, type User } from '@/api/users'
// para saber qué usuario está logueado y no permitirle borrarse o editarse
import { useAuthStore } from '@/stores/auth'
// iconos
import { Trash2, Pencil, Info } from '@lucide/vue'
// modal para creación y actualización de usuarios
import UserModal from '@/components/UserModal.vue'
// para manejo de errores del back
import { extractError } from '@/utils/errors'
// store para mensajes de éxito
import { useSuccessMessages } from '@/stores/successMessages'

const authStore = useAuthStore()
const successMessages = useSuccessMessages()

// ESTADO
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

// filtro de búsqueda
const search = ref('')

// usuarios filtrados por nombre, email o rol
const filteredUsers = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return users.value
  return users.value.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
  )
})

// MODAL
// controla si el modal está abierto
const showModal = ref(false)
// usuario que se está editando — null si es creación
const editingUser = ref<User | null>(null)

// para abrir el modal en modo creación
function openCreateModal() {
  editingUser.value = null
  showModal.value = true
}

// para abrir el modal en modo edición
function openEditModal(user: User) {
  editingUser.value = user
  showModal.value = true
}

// para cerrar el modal
function closeModal() {
  showModal.value = false
}

// para cerrar el modal y recargar la lista tras guardar
function onUserSaved() {
  closeModal()
  loadData()
  successMessages.show(
    editingUser.value ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
  )
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    users.value = await getUsers()
  } catch {
    error.value = 'Error al cargar los usuarios'
  } finally {
    loading.value = false
  }
}

// BORRAR USUARIO
// id del usuario que se está borrando, para mostrar spinner en su botón
const deletingUserId = ref<number | null>(null)

async function handleDelete(id: number) {
  deletingUserId.value = id
  try {
    await deleteUser(id)
    await loadData()
    successMessages.show('Usuario eliminado correctamente')
  } catch (e: unknown) {
    error.value = extractError(e, 'Error al borrar el usuario')
  } finally {
    deletingUserId.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>
