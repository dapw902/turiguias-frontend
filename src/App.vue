<template>
  <RouterView />
  <SuccessMessages />
</template>

<script setup lang="ts">
// importamos el componente para los mensajes de éxito en toda la app
import SuccessMessages from '@/components/SuccessMessages.vue'
</script>
