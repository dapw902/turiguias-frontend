import { createRouter, createWebHistory } from 'vue-router'
// par el guard de las rutas
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'events',
          name: 'admin-events',
          component: () => import('@/views/admin/EventsView.vue'),
        },
        {
          path: 'events/:eventId/groups',
          name: 'admin-event-groups',
          component: () => import('@/views/admin/EventGroupsView.vue'),
        },
      ],
    },
    {
      path: '/guide',
      component: () => import('@/layouts/GuideLayout.vue'),
      children: [
        {
          path: 'events',
          name: 'guide-events',
          component: () => import('@/views/guide/EventsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  // si la ruta es login y ya está autenticado, redirigimos a su panel
  if (to.name === 'login' && authStore.isAuthenticated) {
    return authStore.isAdmin ? '/admin/events' : '/guide/events'
  }

  // si la ruta es de admin y no es admin, redirigimos
  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    if (!authStore.isAuthenticated) return '/login'
    const equivalentPath = to.path.replace('/admin', '/guide')
    // verificamos si la ruta equivalente existe, si no, redirigimos a la vista por defecto
    const routeExists = router.resolve(equivalentPath).matched.length > 0
    return routeExists ? equivalentPath : '/guide/events'
  }

  // si la ruta es de guía y no es guía, redirigimos
  if (to.path.startsWith('/guide') && !authStore.isGuide) {
    if (!authStore.isAuthenticated) return '/login'
    const equivalentPath = to.path.replace('/guide', '/admin')
    const routeExists = router.resolve(equivalentPath).matched.length > 0
    return routeExists ? equivalentPath : '/admin/events'
  }

  // si no está autenticado y no es login, redirigimos
  if (!authStore.isAuthenticated && to.name !== 'login') {
    return '/login'
  }
})

export default router
