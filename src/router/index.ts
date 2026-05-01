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
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/views/auth/ChangePasswordView.vue'),
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
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersView.vue'),
        },
        {
          path: 'guides',
          name: 'admin-guides',
          component: () => import('@/views/admin/GuidesView.vue'),
        },
        {
          path: 'guides/:guideId/availability',
          name: 'admin-guide-availability',
          component: () => import('@/views/admin/GuideAvailabilityView.vue'),
        },
        {
          path: 'guides/:guideId/services',
          name: 'admin-guide-services',
          component: () => import('@/views/admin/GuideServicesView.vue'),
        },
        {
          path: 'guides/:guideId/groups',
          name: 'admin-guide-groups',
          component: () => import('@/views/admin/GuideGroupsView.vue'),
        },
        {
          path: 'account',
          name: 'admin-account',
          component: () => import('@/views/AccountView.vue'),
        },
        {
          path: 'groups/:groupId/bookings',
          name: 'admin-group-bookings',
          component: () => import('@/views/GroupBookingsView.vue'),
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
          component: () => import('@/views/guide/MyEventsView.vue'),
        },
        {
          path: 'services',
          name: 'guide-services',
          component: () => import('@/views/guide/MyServicesView.vue'),
        },
        {
          path: 'availability',
          name: 'guide-availability',
          component: () => import('@/views/guide/MyAvailabilityView.vue'),
        },
        {
          path: 'groups',
          name: 'guide-groups',
          component: () => import('@/views/guide/MyGroupsView.vue'),
        },
        {
          path: 'groups/:groupId/bookings',
          name: 'guide-group-bookings',
          component: () => import('@/views/GroupBookingsView.vue'),
        },
        {
          path: 'account',
          name: 'guide-account',
          component: () => import('@/views/AccountView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  // si no está autenticado y no es login, redirigimos
  if (!authStore.isAuthenticated && to.name !== 'login') {
    return '/login'
  }

  // si está autenticado y debe cambiar contraseña, solo puede ir a /change-password
  if (authStore.isAuthenticated && authStore.mustChangePassword && to.name !== 'change-password') {
    return '/change-password'
  }

  // si ya cambió la contraseña y intenta ir a /change-password, redirigimos a su panel
  if (authStore.isAuthenticated && !authStore.mustChangePassword && to.name === 'change-password') {
    return authStore.isAdmin ? '/admin/events' : '/guide/events'
  }

  // si la ruta es login y ya está autenticado, redirigimos a su panel
  if (to.name === 'login' && authStore.isAuthenticated) {
    return authStore.isAdmin ? '/admin/events' : '/guide/events'
  }

  // si la ruta es de admin y no es admin, redirigimos
  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    if (!authStore.isAuthenticated) return '/login'
    const equivalentPath = to.path.replace('/admin', '/guide')
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
})

export default router
