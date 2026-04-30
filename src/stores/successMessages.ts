import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSuccessMessages = defineStore('successMessages', () => {
  const messages = ref<{ id: number; text: string }[]>([])
  let nextId = 0

  function show(text: string, duration = 3000) {
    const id = nextId++
    messages.value.push({ id, text })
    setTimeout(() => {
      messages.value = messages.value.filter((m) => m.id !== id)
    }, duration)
  }

  return { messages, show }
})
