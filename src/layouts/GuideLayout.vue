<template>
  <div class="flex h-screen overflow-hidden">
    <!-- navbar lateral -->
    <aside
      class="flex flex-col transition-all duration-300"
      :class="sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'"
      style="background-color: var(--color-primary)"
    >
      <!-- App info y desplegable -->
      <div class="px-4 py-4 border-b border-white/20 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <img
              src="http://localhost:3000/uploads/photos/logo_prueba.png"
              alt="TuriGuías"
              class="h-12 object-contain"
            />
            <h1 class="text-white text-lg font-bold">TuriGuías</h1>
          </div>
        </div>
        <!-- botón colapsar dentro del aside -->
        <button
          class="btn btn-circle btn-sm bg-white/20 border-none text-white hover:bg-white/30 shadow-none"
          @click="sidebarOpen = !sidebarOpen"
        >
          <ChevronsLeft :size="20" />
        </button>
      </div>

      <!-- navegación -->
      <nav class="flex-1">
        <RouterLink
          to="/guide/events"
          class="flex items-center gap-3 px-5 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          active-class="text-white bg-white/20 border-l-4 border-white"
        >
          <span>Mis eventos</span>
        </RouterLink>

        <RouterLink
          to="/guide/services"
          class="flex items-center gap-3 px-5 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          active-class="text-white bg-white/20 border-l-4 border-white"
        >
          <span>Mis servicios</span>
        </RouterLink>

        <RouterLink
          to="/guide/availability"
          class="flex items-center gap-3 px-5 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          active-class="text-white bg-white/20 border-l-4 border-white"
        >
          <span>Mis horarios</span>
        </RouterLink>
        <RouterLink
          to="/guide/groups"
          class="flex items-center gap-3 px-5 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          active-class="text-white bg-white/20 border-l-4 border-white"
        >
          <span>Mis grupos</span>
        </RouterLink>
      </nav>

      <!-- usuario actual -->
      <div class="p-4 border-t border-white/20 flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        >
          {{ authStore.user?.name?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">{{ authStore.user?.name }}</p>
          <p class="text-white/60 text-xs">Guía</p>
        </div>
        <!-- botón cerrar sesión -->
        <button
          class="text-white/60 hover:text-white transition-colors"
          @click="authStore.logout()"
          title="Cerrar sesión"
        >
          <LogOut :size="16" />
        </button>
      </div>
    </aside>

    <!-- contenido principal -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- topbar -->
      <header class="bg-base-200 px-4 py-6 flex items-center justify-between">
        <!-- botón abrir aside (solo visible cuando está cerrado) -->
        <button
          v-if="!sidebarOpen"
          class="btn btn-circle btn-sm bg-base-100 border-none shadow-sm"
          @click="sidebarOpen = !sidebarOpen"
        >
          <ChevronsRight :size="20" />
        </button>
        <div v-else></div>

        <!-- título -->
        <h2 class="text-3xl font-medium">{{ pageTitle }}</h2>

        <!-- iconos mini-menu  -->
        <div class="flex items-center bg-base-100 rounded-full px-3 py-1 gap-2 shadow-sm">
          <!-- mi cuenta -->
          <button
            class="btn btn-ghost btn-xs btn-circle"
            @click="router.push('/guide/account')"
            title="Mi cuenta"
          >
            <UserCircle :size="18" />
          </button>
          <!-- toggle de tema -->
          <button class="btn btn-ghost btn-xs btn-circle" @click="themeStore.toggleTheme()">
            <Eclipse v-if="themeStore.theme === 'cupcake'" :size="18" />
            <Sun v-else :size="18" />
          </button>
        </div>
      </header>

      <!-- vista actual -->
      <main class="flex-1 overflow-y-auto p-2 lg:p-6 bg-base-200">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// importamos el store de auth para mostrar el usuario actual
import { useAuthStore } from '@/stores/auth'
// importamos el store del tema
import { useThemeStore } from '@/stores/theme'
// para crear la variable reactiva para el aside colapsable
import { computed, ref } from 'vue'
// para los iconos con Lucide
import { LogOut, ChevronsRight, ChevronsLeft, Eclipse, Sun, UserCircle } from '@lucide/vue'
// para las redirecciones y títulos de las páginas
import { useRouter, useRoute } from 'vue-router'

// en móvil el aside empieza cerrado, en desktop abierto
const sidebarOpen = ref(window.innerWidth >= 1024)

const authStore = useAuthStore()

const themeStore = useThemeStore()

const router = useRouter()

const route = useRoute()

// título dinámico según la ruta activa
const pageTitle = computed(() => {
  if (route.path.includes('/events')) return 'Mis eventos'
  if (route.path.includes('/availability')) return 'Mis horarios'
  if (route.path.includes('/services')) return 'Mis servicios'
  if (route.path.includes('/groups') && route.path.includes('/bookings'))
    return 'Listado de reservas'
  if (route.path.includes('/groups')) return 'Mis grupos'
  if (route.path.includes('/account')) return 'Mi cuenta'
  return ''
})
</script>
