<template>
  <main class="min-h-screen flex items-center justify-center bg-base-200">
    <section class="card w-96 bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-primary">TuriGuías</h1>
          <p class="text-sm text-base-content/60 mt-1">Gestión de guías turísticos</p>
        </div>
        <!-- formulario de inicio de sesión -->
        <form @submit.prevent="handleLogin">
          <div class="form-control mb-3">
            <label class="label pb-2" for="email">
              <span class="label-text">Email</span>
            </label>
            <input
              id="email"
              type="text"
              placeholder="Correo electrónico"
              :class="['input w-full', error ? 'input-error' : 'input-secondary']"
              v-model="email"
            />
          </div>
          <div class="form-control mb-6">
            <label class="label pb-2" for="password">
              <span class="label-text">Contraseña</span>
            </label>
            <div class="relative">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                :class="['input w-full pr-10', error ? 'input-error' : 'input-secondary']"
                v-model="password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                @click="showPassword = !showPassword"
              >
                <span v-if="showPassword">👁️</span>
                <span v-else>👁️‍🗨️</span>
              </button>
            </div>
          </div>

          <!-- mensaje de error -->
          <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

          <!-- botón submit -->
          <button
            type="submit"
            class="btn w-full text-white"
            style="background-color: var(--color-primary); border-color: var(--color-primary)"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <span v-else>Iniciar sesión</span>
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
// para crear variables reactivas
import { ref } from 'vue'
// para navegar entre páginas después del login
import { useRouter } from 'vue-router'
// importamos la store de Auth
import { useAuthStore } from '@/stores/auth'

// para navegar
const router = useRouter()
// para acceder al método login
const authStore = useAuthStore()

// variables reactivas del formulario
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

// función para inicio de sesión (se ejecuta al hacer submit)
async function handleLogin() {
  // limpiamos el error anterior
  console.log('handleLogin llamado')
  error.value = ''

  // validación manual para verificar que los inputs no estén vacíos
  if (!email.value || !password.value) {
    error.value = 'Completa todos los campos'
    return
  }

  // validación básica de formato email
  if (!email.value.includes('@')) {
    error.value = 'Introduce un email válido'
    return
  }

  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    // redirigimos según el rol
    if (authStore.isAdmin) {
      router.push('/admin/events')
    } else {
      router.push('/guide/events')
    }
  } catch (e: unknown) {
    console.log('Error:', e)
    error.value = 'Email o contraseña incorrectos'
  } finally {
    // siempre desactivamos el loading, haya error o no
    loading.value = false
  }
}
</script>
