<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 lg:top-6 lg:bottom-auto lg:left-72 lg:translate-x-0"
  >
    <div
      v-for="msg in store.messages"
      :key="msg.id"
      class="bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-base font-medium"
    >
      <CircleCheck :size="24" />
      {{ msg.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSuccessMessages } from '@/stores/successMessages'
import { CircleCheck } from '@lucide/vue'

const store = useSuccessMessages()
</script>
