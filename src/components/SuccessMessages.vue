<template>
  <div class="fixed top-6 left-72 flex flex-col gap-2 z-50">
    <div
      v-for="msg in store.messages"
      :key="msg.id"
      class="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium"
    >
      <CircleCheck :size="16" />
      {{ msg.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSuccessMessages } from '@/stores/successMessages'
import { CircleCheck } from '@lucide/vue'
import { watch } from 'vue'

const store = useSuccessMessages()

watch(
  () => store.messages,
  (val) => {
    console.log('messages changed:', val)
  },
  { deep: true },
)
</script>
