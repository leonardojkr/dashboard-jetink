<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

// Popover/menu genérico. O gatilho é fornecido pelo slot `trigger` (recebe
// `toggle`/`open`), e o conteúdo do painel pelo slot default (recebe `close`).
// Fecha em clique fora ou Escape. Apenas o painel é estilizado aqui.

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle(): void {
  open.value = !open.value
}

function close(): void {
  open.value = false
}

function onDocClick(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close()
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative inline-flex">
    <slot name="trigger" :toggle="toggle" :open="open" />

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        role="menu"
        class="absolute right-0 top-full z-50 mt-2 min-w-[210px] origin-top-right rounded-lg border border-border bg-bg-card p-1.5 shadow-card"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
