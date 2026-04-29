<template>
  <dialog :open="show" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        {{ user ? 'Editar usuario' : 'Nuevo usuario' }}
      </h3>

      <!-- campos del formulario -->
      <div class="flex flex-col gap-3">
        <div class="form-control">
          <label class="label pb-1"><span class="label-text font-medium">Nombre *</span></label>
          <input
            v-model="form.name"
            type="text"
            class="input input-secondary w-full"
            placeholder="Nombre completo"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-medium">Email *</span></label>
            <input
              v-model="form.email"
              type="email"
              class="input input-secondary w-full"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-medium">Teléfono</span></label>
            <input
              v-model="form.phone"
              type="text"
              class="input input-secondary w-full"
              placeholder="+34600000000"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text font-medium">{{
                user ? 'Nueva contraseña' : 'Contraseña *'
              }}</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              class="input input-secondary w-full"
              placeholder="••••••••"
            />
          </div>
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-medium">Rol *</span></label>
            <select v-model="form.role" class="select select-secondary w-full">
              <option value="guide">Guía</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div class="form-control">
          <label class="label pb-1"><span class="label-text font-medium">Notas</span></label>
          <textarea
            v-model="form.notes"
            class="textarea textarea-secondary w-full"
            placeholder="Notas sobre el usuario"
          ></textarea>
        </div>
      </div>

      <!-- mensaje de error -->
      <p v-if="formError" class="text-error text-sm mt-3">{{ formError }}</p>

      <!-- botones del modal -->
      <div class="modal-action">
        <button class="btn btn-outline" @click="emit('close')">Cancelar</button>
        <button class="btn btn-gradient text-white" :disabled="formLoading" @click="handleSubmit">
          <span v-if="formLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>{{ user ? 'Guardar cambios' : 'Crear usuario' }}</span>
        </button>
      </div>
    </div>
    <!-- click fuera del modal para cerrar -->
    <div class="modal-backdrop" @click="emit('close')"></div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  createUser,
  updateUser,
  type User,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/api/users'
// para manejo de errores del back
import { extractError } from '@/utils/errors'

// props que recibe el componente
const props = defineProps<{
  show: boolean
  user: User | null
}>()

// eventos que emite hacia el padre
const emit = defineEmits<{
  close: []
  saved: []
}>()

// campos del formulario
const form = ref<CreateUserDto>({
  name: '',
  email: '',
  password: '',
  role: 'guide',
  phone: undefined,
  notes: undefined,
})

const formError = ref('')
const formLoading = ref(false)

// cuando cambia el usuario que se edita, actualizamos el formulario
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.value = {
        name: newUser.name,
        email: newUser.email,
        password: '',
        role: newUser.role,
        phone: newUser.phone ?? undefined,
        notes: newUser.notes ?? undefined,
      }
    } else {
      form.value = {
        name: '',
        email: '',
        password: '',
        role: 'guide',
        phone: undefined,
        notes: undefined,
      }
    }
    formError.value = ''
  },
)

// cuando el modal se abre para crear nuevo usuario, reseteamos el formulario
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.user) {
      form.value = {
        name: '',
        email: '',
        password: '',
        role: 'guide',
        phone: undefined,
        notes: undefined,
      }
      formError.value = ''
    }
  },
)

// para crear o editar un usuario
async function handleSubmit() {
  formError.value = ''

  // validación manual de campos obligatorios
  if (!form.value.name || !form.value.email || !form.value.role) {
    formError.value = 'Nombre, email y rol son obligatorios'
    return
  }

  // la contraseña es obligatoria solo al crear
  if (!props.user && !form.value.password) {
    formError.value = 'La contraseña es obligatoria'
    return
  }

  formLoading.value = true
  try {
    if (props.user) {
      const dto: UpdateUserDto = {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        phone: form.value.phone ?? undefined,
        notes: form.value.notes ?? undefined,
        ...(form.value.password && { password: form.value.password }),
      }
      await updateUser(props.user.id, dto)
    } else {
      await createUser(form.value)
    }
    // avisamos al padre que se guardó para que recargue
    emit('saved')
  } catch (e: unknown) {
    formError.value = extractError(
      e,
      props.user ? 'Error al actualizar el usuario' : 'Error al crear el usuario',
    )
  } finally {
    formLoading.value = false
  }
}
</script>
