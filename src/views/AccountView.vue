<template>
  <div class="max-w-2xl mx-auto flex flex-col gap-6">
    <!-- sección: datos del perfil -->
    <div class="bg-base-100 rounded-xl p-6 shadow-sm">
      <h3 class="font-bold text-lg mb-4">Datos del perfil</h3>

      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-medium">Nombre *</span></label>
            <input v-model="form.name" type="text" class="input input-secondary w-full" />
          </div>
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-medium">Email *</span></label>
            <input v-model="form.email" type="email" class="input input-secondary w-full" />
          </div>
        </div>
        <div class="form-control">
          <label class="label pb-1"><span class="label-text font-medium">Teléfono</span></label>
          <input
            v-model="form.phone"
            type="text"
            class="input input-secondary w-full"
            placeholder="+34600000000"
          />
        </div>
        <div class="form-control">
          <label class="label pb-1"><span class="label-text font-medium">Notas</span></label>
          <textarea
            v-model="form.notes"
            class="textarea textarea-secondary w-full"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- mensaje de error o éxito -->
      <p v-if="formError" class="text-error text-sm mt-3">{{ formError }}</p>
      <p v-if="formSuccess" class="text-success text-sm mt-3">{{ formSuccess }}</p>

      <div class="flex justify-end mt-4">
        <button
          class="btn btn-gradient text-white"
          :disabled="formLoading"
          @click="handleUpdateProfile"
        >
          <span v-if="formLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Guardar cambios</span>
        </button>
      </div>
    </div>

    <!-- sección: cambiar contraseña -->
    <div class="bg-base-100 rounded-xl p-6 shadow-sm">
      <h3 class="font-bold text-lg mb-4">Cambiar contraseña</h3>

      <div class="flex flex-col gap-3">
        <div class="form-control">
          <label class="label pb-1"
            ><span class="label-text font-medium">Contraseña actual *</span></label
          >
          <div class="relative">
            <input
              v-model="passwordForm.current_password"
              :type="showCurrent ? 'text' : 'password'"
              class="input input-secondary w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              @click="showCurrent = !showCurrent"
            >
              <EyeOff v-if="showCurrent" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>
        <div class="form-control">
          <label class="label pb-1"
            ><span class="label-text font-medium">Nueva contraseña *</span></label
          >
          <div class="relative">
            <input
              v-model="passwordForm.new_password"
              :type="showNew ? 'text' : 'password'"
              class="input input-secondary w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              @click="showNew = !showNew"
            >
              <EyeOff v-if="showNew" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>
        <div class="form-control">
          <label class="label pb-1"
            ><span class="label-text font-medium">Confirmar nueva contraseña *</span></label
          >
          <div class="relative">
            <input
              v-model="passwordForm.confirm_password"
              :type="showConfirm ? 'text' : 'password'"
              class="input input-secondary w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              @click="showConfirm = !showConfirm"
            >
              <EyeOff v-if="showConfirm" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- mensaje de error o éxito -->
      <p v-if="passwordError" class="text-error text-sm mt-3">{{ passwordError }}</p>
      <p v-if="passwordSuccess" class="text-success text-sm mt-3">{{ passwordSuccess }}</p>

      <div class="flex justify-end mt-4">
        <button
          class="btn btn-gradient text-white"
          :disabled="passwordLoading"
          @click="handleChangePassword"
        >
          <span v-if="passwordLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Cambiar contraseña</span>
        </button>
      </div>
    </div>

    <!-- sección: borrar cuenta -->
    <div class="bg-base-100 rounded-xl p-6 shadow-sm border border-error/30">
      <h3 class="font-bold text-lg mb-2 text-error">Borrar cuenta</h3>
      <p class="text-sm text-base-content/60 mb-4">
        Al borrar tu cuenta se eliminarán todos tus datos. Esta acción no se puede deshacer.
      </p>

      <!-- mensaje de error -->
      <p v-if="deleteError" class="text-error text-sm mb-3">{{ deleteError }}</p>

      <button
        class="btn btn-error text-white"
        :disabled="deleteLoading"
        @click="handleDeleteAccount"
      >
        <span v-if="deleteLoading" class="loading loading-spinner loading-sm"></span>
        <span v-else>Borrar mi cuenta</span>
      </button>
    </div>
    <!-- modal de confirmación de borrado de cuenta -->
    <dialog :open="showDeleteConfirm" class="modal">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg mb-2">¿Borrar tu cuenta?</h3>
        <p class="text-sm text-base-content/60 mb-6">
          Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
        </p>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="showDeleteConfirm = false">Cancelar</button>
          <button class="btn btn-error text-white" :disabled="deleteLoading" @click="confirmDelete">
            <span v-if="deleteLoading" class="loading loading-spinner loading-sm"></span>
            <span v-else>Sí, borrar mi cuenta</span>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showDeleteConfirm = false"></div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// para acceso a los datos del usuario logueado
import { useAuthStore } from '@/stores/auth'
// para las llamadas a la API
import { updateUser, deleteSelf } from '@/api/users'
import api from '@/api/axios'
// iconos
import { Eye, EyeOff } from '@lucide/vue'
// para manejo de errores del back
import { extractError } from '@/utils/errors'

const authStore = useAuthStore()

// ESTADO — datos de perfil
const form = ref({
  name: '',
  email: '',
  phone: '',
  notes: '',
})
const formLoading = ref(false)
const formError = ref<string>('')
const formSuccess = ref<string>('')

// ESTADO — contraseña
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const passwordLoading = ref(false)
const passwordError = ref<string>('')
const passwordSuccess = ref<string>('')

// ESTADO — borrado cuenta
const deleteLoading = ref(false)
const deleteError = ref<string>('')
const showDeleteConfirm = ref(false)

// inicializamos el formulario con los datos actuales del usuario
function initForm() {
  const user = authStore.user
  if (!user) return
  form.value = {
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    notes: user.notes ?? '',
  }
}

// ACTUALIZAR PERFIL
async function handleUpdateProfile() {
  formError.value = ''
  formSuccess.value = ''
  if (!form.value.name || !form.value.email) {
    formError.value = 'Nombre y email son obligatorios'
    return
  }
  formLoading.value = true
  try {
    await updateUser(authStore.user!.id, {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone || null,
      notes: form.value.notes || null,
    })
    // actualizamos el store con los nuevos datos
    await authStore.fetchCurrentUser()
    formSuccess.value = 'Perfil actualizado correctamente'
  } catch (e: unknown) {
    formError.value = extractError(e, 'Error al actualizar el perfil')
  } finally {
    formLoading.value = false
  }
}

// CAMBIAR CONTRASEÑA
async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  if (
    !passwordForm.value.current_password ||
    !passwordForm.value.new_password ||
    !passwordForm.value.confirm_password
  ) {
    passwordError.value = 'Completa todos los campos'
    return
  }
  if (passwordForm.value.new_password.length < 8) {
    passwordError.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }
  passwordLoading.value = true
  try {
    await api.patch('/auth/change-password', {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
    })
    passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    passwordSuccess.value = 'Contraseña actualizada correctamente'
  } catch (e: unknown) {
    passwordError.value = extractError(e, 'La contraseña actual no es correcta')
  } finally {
    passwordLoading.value = false
  }
}

// BORRAR CUENTA y MODAL DE CONFIRMACIÓN
// para mostrar el modal de confirmación
function handleDeleteAccount() {
  showDeleteConfirm.value = true
}

// para ejecutar el borrado tras la confirmación
async function confirmDelete() {
  deleteLoading.value = true
  try {
    await deleteSelf()
    authStore.logout()
  } catch (e: unknown) {
    deleteError.value = extractError(e, 'Error al borrar la cuenta')
    showDeleteConfirm.value = false
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  initForm()
})
</script>
