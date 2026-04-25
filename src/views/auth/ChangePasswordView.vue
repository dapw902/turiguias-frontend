<template>
  <main class="min-h-screen flex items-center justify-center bg-base-200">
    <section class="card w-96 bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-primary">TuriGuías</h1>
          <p class="text-sm text-base-content/60 mt-1">Cambia tu contraseña para continuar</p>
        </div>
        <!-- contraseña actual -->
        <div class="form-control mb-3">
          <label class="label pb-2" for="current">
            <span class="label-text">Contraseña actual</span>
          </label>
          <div class="relative">
            <input
              id="current"
              :type="showCurrent ? 'text' : 'password'"
              placeholder="••••••••"
              :class="['input w-full pr-10', error ? 'input-error' : 'input-secondary']"
              v-model="currentPassword"
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
        <!-- inputs para generar la nueva -->
        <div class="form-control mb-3">
          <label class="label pb-2" for="new">
            <span class="label-text">Nueva contraseña</span>
          </label>
          <div class="relative">
            <input
              id="new"
              :type="showNew ? 'text' : 'password'"
              placeholder="••••••••"
              :class="['input w-full pr-10', error ? 'input-error' : 'input-secondary']"
              v-model="newPassword"
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

        <div class="form-control mb-6">
          <label class="label pb-2" for="confirm">
            <span class="label-text">Confirmar nueva contraseña</span>
          </label>
          <div class="relative">
            <input
              id="confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="••••••••"
              :class="['input w-full pr-10', error ? 'input-error' : 'input-secondary']"
              v-model="confirmPassword"
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

        <!-- mensaje de error -->
        <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

        <button
          class="btn w-full text-white"
          style="background-color: var(--color-primary); border-color: var(--color-primary)"
          :disabled="loading"
          @click="handleSubmit"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Cambiar contraseña</span>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// importamos la store de Auth
import { useAuthStore } from '@/stores/auth'
// para acceder a los endpoints
import api from '@/api/axios'
// iconos
import { Eye, EyeOff } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

// campos del formulario
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// estado de visibilidad de cada campo de contraseña
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

// estado de carga y error
const loading = ref(false)
const error = ref('')

// para cambiar la contraseña y redirigir al panel según el rol
async function handleSubmit() {
  error.value = ''

  // validación manual de campos
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'Completa todos los campos'
    return
  }

  if (newPassword.value.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  try {
    await api.patch('/auth/change-password', {
      current_password: currentPassword.value,
      new_password: newPassword.value,
    })
    // actualizamos el store para que must_change_password sea false
    // y el guard de rutas permita el acceso al panel
    await authStore.fetchCurrentUser()
    router.push(authStore.isAdmin ? '/admin/events' : '/guide/events')
  } catch {
    error.value = 'La contraseña actual no es correcta'
  } finally {
    loading.value = false
  }
}
</script>
