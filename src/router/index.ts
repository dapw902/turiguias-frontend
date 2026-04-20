import { createRouter, createWebHistory } from 'vue-router'

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

export default router
