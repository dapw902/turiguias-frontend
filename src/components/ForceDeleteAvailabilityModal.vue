<template>
  <dialog :open="show" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg mb-2">¿Borrar disponibilidad?</h3>
      <p class="text-sm text-base-content/60 mb-2">
        El guía tiene asignado
        <span class="font-bold text-error">{{ affectedGroupsCount }} grupo/s</span>
        en este periodo. De borrarlo, los grupos se quedarán sin guía y requerirán revisión manual.
      </p>
      <p class="text-sm text-base-content/60 mb-6">¿Deseas continuar?</p>
      <div class="flex justify-end gap-2">
        <button class="btn btn-outline" @click="emit('cancel')">Cancelar</button>
        <button class="btn btn-error text-white" :disabled="loading" @click="emit('confirm')">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Sí, borrar igualmente</span>
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="emit('cancel')"></div>
  </dialog>
</template>

<script setup lang="ts">
// props que recibe el componente
defineProps<{
  show: boolean
  affectedGroupsCount: number
  loading: boolean
}>()

// eventos que emite hacia el padre
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
