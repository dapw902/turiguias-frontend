<template>
  <div>
    <!-- estado de carga -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" style="color: var(--color-primary)"></span>
    </div>

    <div v-else>
      <!-- mensaje de error -->
      <div v-if="error" class="banner-warning">
        <span class="text-2xl">⚠️</span>
        <p class="font-bold text-error">{{ error }}</p>
      </div>

      <!-- cabecera -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-3">
        <div>
          <h2 class="text-xl font-bold">{{ event ? formatEventTitle(event) : '' }}</h2>
          <p class="text-sm text-base-content/60 mt-1">
            {{ totalPax }} pax |
            {{ bookings.filter((b) => b.status !== 'deleted').length }} reserva/s |
            {{ groups.length }} grupo/s
          </p>
        </div>

        <!-- botones de acción -->
        <div class="flex flex-col lg:flex-row gap-2">
          <button class="btn btn-outline-gradient w-full lg:w-auto" @click="handleCreateGroup()">
            Crear grupo
          </button>
          <button
            class="btn btn-gradient text-white w-full lg:w-auto"
            :disabled="generating"
            @click="handleGenerateGroups()"
          >
            <span v-if="generating" class="loading loading-spinner loading-sm"></span>
            <span v-else>Generar grupos</span>
          </button>
        </div>
      </div>

      <!-- warning de grupos con necesidad de atención -->
      <div v-if="groups.some((g) => !!g.needs_attention)" class="banner-warning">
        <TriangleAlert :size="24" class="text-error flex-shrink-0" />
        <div>
          <p class="font-bold text-error">Hay grupos que requieren atención</p>
          <p class="text-sm text-base-content/70">{{ generateMessage }}</p>
        </div>
      </div>

      <!-- área principal: grupos + reservas sueltas -->

      <!-- vista desktop - kanban -->
      <div v-if="!isMobile">
        <div class="flex gap-4 overflow-x-auto pb-4">
          <!-- columnas de grupos -->
          <div
            v-for="group in groups"
            :key="group.id"
            class="bg-base-100 rounded-xl p-4 shadow-sm min-w-72 w-72 flex-shrink-0 border border-transparent"
            :class="{ 'border-error': group.needs_attention }"
          >
            <!-- header del grupo -->
            <div class="flex flex-col mb-3 gap-2">
              <!-- fila superior: título + checkbox + borrar -->
              <div class="flex items-center justify-between gap-2">
                <p class="font-bold text-sm">Grupo {{ group.id }}</p>
                <span class="badge badge-ghost text-xs">{{ paxByGroup[group.id] ?? 0 }} pax</span>
                <div class="flex items-center gap-2">
                  <!-- checkbox confirmed: bloqueado si needs_attention o sin guía asignado -->
                  <label
                    class="flex items-center gap-1"
                    :class="
                      group.needs_attention || !group.user ? 'cursor-not-allowed' : 'cursor-pointer'
                    "
                  >
                    <div
                      v-if="group.needs_attention || !group.user"
                      class="tooltip tooltip-bottom"
                      :data-tip="
                        group.needs_attention
                          ? 'Resuelve el problema de capacidad antes de confirmar'
                          : 'Asigna un guía antes de confirmar'
                      "
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm opacity-30"
                        :checked="group.confirmed"
                        disabled
                      />
                    </div>
                    <input
                      v-else
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="group.confirmed"
                      @change="handleToggleConfirmed(group)"
                    />
                    <span
                      class="text-sm"
                      :class="{ 'text-base-content/30': group.needs_attention || !group.user }"
                    >
                      Confirmado
                    </span>
                  </label>
                  <!-- botón borrar: grayed out si confirmado, activo si no -->
                  <div
                    v-if="group.confirmed"
                    class="tooltip tooltip-bottom"
                    data-tip="Desmarca 'Confirmado' antes de borrar"
                  >
                    <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                  <button
                    v-else
                    class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                    :disabled="deletingGroupId === group.id"
                    @click="handleDeleteGroup(group.id)"
                  >
                    <span
                      v-if="deletingGroupId === group.id"
                      class="loading loading-spinner loading-xs"
                    ></span>
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </div>

              <!-- selector de guía: ocupa todo el ancho, bloqueado si confirmado -->
              <div
                v-if="group.confirmed"
                class="tooltip tooltip-bottom w-full"
                data-tip="Desmarca 'Confirmado' para cambiar el guía"
              >
                <select
                  class="select select-sm w-full disabled:opacity-100 disabled:text-base-content"
                  :value="group.user?.id ?? ''"
                  :disabled="true"
                >
                  <option value="">Sin asignar</option>
                  <option
                    v-for="guide in availableGuides.filter(
                      (g) => !groups.some((gr) => gr.user?.id === g.guide_id && gr.id !== group.id),
                    )"
                    :key="guide.guide_id"
                    :value="guide.guide_id"
                  >
                    {{ guide.guide_name }}
                  </option>
                </select>
              </div>
              <select
                v-else
                class="select select-sm w-full"
                :value="group.user?.id ?? ''"
                @change="
                  handleAssignGuide(
                    group.id,
                    ($event.target as HTMLSelectElement).value === ''
                      ? null
                      : parseInt(($event.target as HTMLSelectElement).value),
                  )
                "
              >
                <option value="">Sin asignar</option>
                <option
                  v-for="guide in availableGuides.filter(
                    (g) => !groups.some((gr) => gr.user?.id === g.guide_id && gr.id !== group.id),
                  )"
                  :key="guide.guide_id"
                  :value="guide.guide_id"
                >
                  {{ guide.guide_name }}
                </option>
              </select>

              <!-- ajuste manual de capacidad: solo si needs_attention Y hay guía asignado -->
              <div v-if="group.needs_attention && group.user">
                <div v-if="adjustingCapacityGroupId === group.id" class="flex items-center gap-2">
                  <input
                    v-model.number="manualCapacity"
                    type="number"
                    min="1"
                    class="input input-secondary w-24"
                  />
                  <button class="btn btn-gradient text-white" @click="handleAdjustCapacity(group)">
                    Guardar
                  </button>
                  <button class="btn btn-ghost" @click="adjustingCapacityGroupId = null">✕</button>
                </div>
                <button
                  v-else
                  class="btn text-error border border-error hover:bg-error/10 w-full gap-2"
                  @click="toggleCapacityForm(group.id, group.capacity)"
                >
                  <LocateFixed :size="14" />
                  Ajustar capacidad
                </button>
              </div>

              <!-- mensaje cuando no hay guía disponible -->
              <div
                v-if="group.needs_attention && !group.user"
                class="flex items-center gap-1 text-sm text-error mt-1"
              >
                <TriangleAlert :size="14" />
                Sin guías disponibles
              </div>
            </div>

            <!-- reservas del grupo -->
            <draggable
              :list="bookingsByGroup[group.id]"
              group="bookings"
              item-key="id"
              class="flex flex-col gap-2 min-h-10"
              ghost-class="opacity-30"
              :data-group-id="group.id"
              @end="handleDragEnd"
            >
              <template #item="{ element }">
                <BookingCard :booking="element" :draggable="true" :data-booking-id="element.id" />
              </template>
            </draggable>
          </div>

          <!-- columna de reservas sueltas: siempre visible para poder soltar aquí -->
          <div class="bg-base-100 rounded-xl p-4 shadow-sm min-w-72 w-72 flex-shrink-0">
            <div class="flex items-center justify-between w-full mb-3">
              <p class="font-bold text-sm">Sin grupo ({{ ungroupedBookings.length }})</p>
              <span class="badge badge-ghost text-xs">{{ ungroupedPax }} pax</span>
            </div>
            <draggable
              :list="ungroupedBookings"
              group="bookings"
              item-key="id"
              class="flex flex-col gap-2 min-h-10"
              ghost-class="opacity-30"
              data-group-id="0"
              @end="handleDragEnd"
            >
              <template #item="{ element }">
                <BookingCard :booking="element" :draggable="true" :data-booking-id="element.id" />
              </template>
              <!-- placeholder cuando no hay reservas sueltas -->
              <template #footer>
                <div
                  v-if="ungroupedBookings.length === 0"
                  class="text-xs text-base-content/40 text-center py-4 border-2 border-dashed border-base-300 rounded-lg"
                >
                  Arrastra aquí para desasignar
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>

      <!-- Vista móvil - en vertical -->
      <div v-else class="flex flex-col gap-4">
        <!-- reservas sin grupo -->
        <div class="bg-base-100 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between w-full mb-3">
            <p class="font-bold text-sm">Sin grupo ({{ ungroupedBookings.length }})</p>
            <span class="badge badge-ghost text-xs">{{ ungroupedPax }} pax</span>
          </div>
          <div class="flex flex-col gap-2">
            <div v-for="booking in ungroupedBookings" :key="booking.id" class="flex flex-col gap-2">
              <BookingCard :booking="booking" />
              <select
                class="select select-sm w-full"
                @change="handleMobileAssign(booking.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">Mover a grupo...</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  Grupo {{ group.id }} — {{ group.user?.name ?? 'Sin guía' }}
                </option>
              </select>
            </div>
            <div
              v-if="ungroupedBookings.length === 0"
              class="text-xs text-base-content/40 text-center py-4"
            >
              Todas las reservas están asignadas
            </div>
          </div>
        </div>

        <!-- grupos -->
        <div
          v-for="group in groups"
          :key="group.id"
          class="bg-base-100 rounded-xl p-4 shadow-sm border border-transparent"
          :class="{ 'border-error': group.needs_attention }"
        >
          <div class="flex items-center justify-between w-full mb-2">
            <p class="font-bold text-sm">
              Grupo {{ group.id }} — {{ group.user?.name ?? 'Sin guía' }}
            </p>
            <span class="badge badge-ghost text-xs">{{ paxByGroup[group.id] ?? 0 }} pax</span>
          </div>
          <!-- selector de guía en móvil -->
          <div
            v-if="group.confirmed"
            class="tooltip tooltip-bottom w-full mb-2"
            data-tip="Desmarca 'Confirmado' para cambiar el guía"
          >
            <select
              class="select select-sm w-full disabled:opacity-100 disabled:text-base-content"
              :value="group.user?.id ?? ''"
              :disabled="true"
            >
              <option value="">Sin asignar</option>
              <option
                v-for="guide in availableGuides"
                :key="guide.guide_id"
                :value="guide.guide_id"
              >
                {{ guide.guide_name }}
              </option>
            </select>
          </div>
          <select
            v-else
            class="select select-sm w-full mb-2"
            :value="group.user?.id ?? ''"
            @change="
              handleAssignGuide(
                group.id,
                ($event.target as HTMLSelectElement).value === ''
                  ? null
                  : parseInt(($event.target as HTMLSelectElement).value),
              )
            "
          >
            <option value="">Sin asignar</option>
            <option v-for="guide in availableGuides" :key="guide.guide_id" :value="guide.guide_id">
              {{ guide.guide_name }}
            </option>
          </select>

          <!-- checkbox confirmado -->
          <div class="flex items-center justify-between mb-3">
            <label
              class="flex items-center gap-1"
              :class="
                group.needs_attention || !group.user ? 'cursor-not-allowed' : 'cursor-pointer'
              "
            >
              <div
                v-if="group.needs_attention || !group.user"
                class="tooltip tooltip-bottom"
                :data-tip="
                  group.needs_attention
                    ? 'Resuelve el problema de capacidad antes de confirmar'
                    : 'Asigna un guía antes de confirmar'
                "
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm opacity-30"
                  :checked="group.confirmed"
                  disabled
                />
              </div>
              <input
                v-else
                type="checkbox"
                class="checkbox checkbox-sm"
                :checked="group.confirmed"
                @change="handleToggleConfirmed(group)"
              />
              <span
                class="text-sm"
                :class="{ 'text-base-content/30': group.needs_attention || !group.user }"
              >
                Confirmado
              </span>
            </label>

            <!-- botón borrar -->
            <div
              v-if="group.confirmed"
              class="tooltip tooltip-left"
              data-tip="Desmarca 'Confirmado' antes de borrar"
            >
              <button class="btn btn-ghost btn-xs text-base-content/30 cursor-not-allowed">
                <Trash2 :size="16" />
              </button>
            </div>
            <button
              v-else
              class="btn btn-ghost btn-xs text-error hover:bg-error/10"
              :disabled="deletingGroupId === group.id"
              @click="handleDeleteGroup(group.id)"
            >
              <span
                v-if="deletingGroupId === group.id"
                class="loading loading-spinner loading-xs"
              ></span>
              <Trash2 v-else :size="16" />
            </button>
          </div>
          <!-- ajuste manual de capacidad en móvil: solo si needs_attention Y hay guía asignado -->
          <div v-if="group.needs_attention && group.user" class="mb-2">
            <div v-if="adjustingCapacityGroupId === group.id" class="flex items-center gap-2">
              <input
                v-model.number="manualCapacity"
                type="number"
                min="1"
                class="input input-secondary w-24"
              />
              <button class="btn btn-gradient text-white" @click="handleAdjustCapacity(group)">
                Guardar
              </button>
              <button class="btn btn-ghost" @click="adjustingCapacityGroupId = null">✕</button>
            </div>
            <button
              v-else
              class="btn text-error border border-error hover:bg-error/10 w-full gap-2"
              @click="toggleCapacityForm(group.id, group.capacity)"
            >
              <LocateFixed :size="16" />
              Ajustar capacidad
            </button>
          </div>

          <!-- mensaje cuando no hay guía disponible en móvil -->
          <div
            v-if="group.needs_attention && !group.user"
            class="flex items-center gap-1 text-sm text-error mb-2"
          >
            <TriangleAlert :size="16" />
            Sin guías disponibles
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="booking in bookingsByGroup[group.id]"
              :key="booking.id"
              class="flex flex-col gap-2"
            >
              <BookingCard :booking="booking" />
              <button
                class="btn btn-ghost btn-xs text-error w-full"
                @click="handleMobileAssign(booking.id, '0')"
              >
                Quitar del grupo
              </button>
            </div>
            <div
              v-if="!bookingsByGroup[group.id]?.length"
              class="text-xs text-base-content/40 text-center py-2"
            >
              Sin reservas
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// para acceso a los parámetros de la URL
import { useRoute } from 'vue-router'
// importamos las funciones e interfaces necesarias
import { getEventById, type Event } from '@/api/events'
import { getBookingsByEvent, type Booking } from '@/api/bookings'
import {
  getGroupsByEvent,
  generateGroups,
  saveGroups,
  assignBookingToGroup,
  deleteGroups,
  getAvailableGuidesForEvent,
  assignGuide,
  type Group,
  type AvailableGuide,
} from '@/api/groups'
// para conversión de UTC a hora local
import { DateTime } from 'luxon'
// para el formato de las tarjetas de las reservas
import BookingCard from '@/components/BookingCard.vue'
// para el drag and drop
import draggable from 'vuedraggable'
// iconos
import { Trash2, TriangleAlert, LocateFixed } from '@lucide/vue'

const route = useRoute()

// leemos el eventId de la URL (/admin/events/:eventId/groups)
const eventId = parseInt(route.params.eventId as string)

// para detectar si estamos en vista móvil y cambiar el layout
const isMobile = ref(window.innerWidth < 1024)

// ESTADO
const event = ref<Event | null>(null)
const groups = ref<Group[]>([])
const bookings = ref<Booking[]>([])
const loading = ref(false)
const error = ref('')
const generateMessage = ref<string>('')

// guías disponibles para este evento
const availableGuides = ref<AvailableGuide[]>([])

// de las reservas activas únicamente
const totalPax = computed(() =>
  bookings.value.filter((b) => b.status !== 'deleted').reduce((sum, b) => sum + b.pax, 0),
)
// reservas sin grupo asignado — ref para que el Draggable pueda modificarlo
const ungroupedBookings = ref<Booking[]>([])
// reservas agrupadas por group.id — ref para que el Draggable pueda modificarlo
const bookingsByGroup = ref<Record<number, Booking[]>>({})

// pax total por grupo (para mostrar en la cabecera de cada tarjeta)
const paxByGroup = computed(() => {
  const map: Record<number, number> = {}
  for (const group of groups.value) {
    map[group.id] = (bookingsByGroup.value[group.id] ?? []).reduce((sum, b) => sum + b.pax, 0)
  }
  return map
})

// pax total de las reservas sin grupo
const ungroupedPax = computed(() => ungroupedBookings.value.reduce((sum, b) => sum + b.pax, 0))

// HELPERS
// para formatear el título del evento: "dd/MM/yyyy - HH:mm - Nombre servicio"
function formatEventTitle(event: Event): string {
  const dt = DateTime.fromSeconds(event.event_time).setZone(event.service.timezone)
  const time = dt.toFormat('HH:mm')
  const date = dt.toFormat('dd/MM/yyyy')
  return `${date} - ${time} - ${event.service.name}`
}

// CARGA DE DATOS
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [eventData, groupsData, bookingsData, guidesData] = await Promise.all([
      getEventById(eventId),
      getGroupsByEvent(eventId),
      getBookingsByEvent(eventId),
      getAvailableGuidesForEvent(eventId),
    ])
    event.value = eventData
    groups.value = groupsData
    availableGuides.value = guidesData
    bookings.value = bookingsData
    ungroupedBookings.value = bookingsData.filter((b) => b.group === null && b.status !== 'deleted')
    // reconstruimos el mapa de reservas por grupo
    const map: Record<number, Booking[]> = {}
    for (const group of groupsData) {
      map[group.id] = bookingsData.filter((b) => b.group?.id === group.id && b.status !== 'deleted')
    }
    bookingsByGroup.value = map
  } catch {
    error.value = 'Error al cargar los datos'
  } finally {
    loading.value = false
  }
}

// GENERACIÓN DE GRUPOS

// estado de carga del botón generar
const generating = ref(false)

// para generar grupos automáticamente y guardarlos como no confirmados
async function handleGenerateGroups() {
  generating.value = true
  error.value = ''
  try {
    // borramos los grupos no confirmados antes de generar la nueva propuesta
    await deleteGroups(eventId)
    // generamos la propuesta
    const proposal = await generateGroups(eventId)
    // guardamos el mensaje de error para el banner
    generateMessage.value = proposal.message
    // guardamos los grupos propuestos en la BBDD como no confirmados
    await saveGroups({
      event_id: eventId,
      groups: proposal.groups.map((g, index) => ({
        booking_ids: g.bookings.map((b) => b.id),
        needs_attention: g.needs_attention,
        user_id: proposal.available_guides[index]?.guide_id ?? null,
      })),
    })
    // recargamos para ver los grupos nuevos
    await loadData()
  } catch {
    error.value = 'Error al generar los grupos'
  } finally {
    generating.value = false
  }
}

// para crear un grupo vacío manualmente
async function handleCreateGroup() {
  try {
    await saveGroups({
      event_id: eventId,
      groups: [{ booking_ids: [] }],
    })
    await loadData()
  } catch {
    error.value = 'Error al crear el grupo'
  }
}

// CONFIRMACIÓN DE GRUPOS
// para confirmar un grupo al hacer clic en el checkbox
async function handleToggleConfirmed(group: Group) {
  try {
    await saveGroups({
      event_id: eventId,
      groups: [
        {
          group_id: group.id,
          booking_ids: [],
          user_id: group.user?.id ?? null,
          confirmed: !group.confirmed,
        },
      ],
    })
    await loadData()
  } catch {
    error.value = 'Error al actualizar el grupo'
  }
}

// para asignar o cambiar el guía de un grupo
async function handleAssignGuide(groupId: number, userId: number | null) {
  try {
    await assignGuide(groupId, userId)
    await loadData()
  } catch {
    error.value = 'Error al asignar el guía'
  }
}

// BORRAR GRUPO
// id del grupo que se está borrando, para mostrar spinner en su botón
const deletingGroupId = ref<number | null>(null)

// para borrar un grupo no confirmado específico
async function handleDeleteGroup(groupId: number) {
  deletingGroupId.value = groupId
  try {
    await deleteGroups(eventId, groupId)
    await loadData()
  } catch {
    error.value = 'Error al borrar el grupo'
  } finally {
    deletingGroupId.value = null
  }
}

// AJUSTE MANUAL DE CAPACIDAD
// id del grupo que está siendo ajustado
const adjustingCapacityGroupId = ref<number | null>(null)
// valor de la nueva capacidad manual
const manualCapacity = ref<number>(1)

// para mostrar u ocultar el formulario de ajuste
function toggleCapacityForm(groupId: number, currentCapacity: number | null) {
  if (adjustingCapacityGroupId.value === groupId) {
    adjustingCapacityGroupId.value = null
  } else {
    adjustingCapacityGroupId.value = groupId
    manualCapacity.value = currentCapacity ?? 1
  }
}

// para guardar la capacidad manual y limpiar needs_attention
async function handleAdjustCapacity(group: Group) {
  try {
    await assignGuide(group.id, group.user?.id ?? null, manualCapacity.value)
    adjustingCapacityGroupId.value = null
    await loadData()
  } catch {
    error.value = 'Error al ajustar la capacidad'
  }
}

// DRAG & DROP

// tipo mínimo para el evento @end de Vue Draggable
interface DragEndEvent {
  from: HTMLElement
  to: HTMLElement
  item: HTMLElement
}

// para reflejar la acción del drag en el backend
// se dispara al soltar una tarjeta y persiste el cambio en el backend
async function handleDragEnd(event: DragEndEvent) {
  // leemos el group-id del contenedor destino (atributo data-group-id del div)
  const toGroupId = event.to.dataset.groupId
  const fromGroupId = event.from.dataset.groupId

  // si no se movió entre columnas distintas, no hacemos nada
  if (toGroupId === fromGroupId) return

  // el elemento arrastrado es el item de BookingCard — leemos su data-booking-id
  if (!event.item.dataset.bookingId || !event.to.dataset.groupId) return
  const bookingId = parseInt(event.item.dataset.bookingId)
  const targetGroupId = event.to.dataset.groupId === '0' ? null : parseInt(event.to.dataset.groupId)

  try {
    await assignBookingToGroup(bookingId, targetGroupId)
    // recargamos para sincronizar el estado con la BBDD
    await loadData()
  } catch {
    error.value = 'Error al mover la reserva'
    // revertimos recargando aunque haya fallado
    await loadData()
  }
}

// MÓVIL

// para asignar las reservas a un grupo en vista móvil con selector
async function handleMobileAssign(bookingId: number, targetGroupId: string) {
  if (!targetGroupId) return
  const groupId = targetGroupId === '0' ? null : parseInt(targetGroupId)
  try {
    await assignBookingToGroup(bookingId, groupId)
    await loadData()
  } catch {
    error.value = 'Error al mover la reserva'
  }
}

onMounted(() => {
  loadData()
})
</script>
