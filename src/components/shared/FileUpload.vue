<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  accept?: string
  loading?: boolean
  error?: string | null
}
withDefaults(defineProps<Props>(), {
  accept: '.xlsx,.xls',
  loading: false,
  error: null,
})

const emit = defineEmits<{ file: [file: File] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function openPicker(): void {
  inputRef.value?.click()
}

function onChange(e: Event): void {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) emit('file', files[0])
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) emit('file', files[0])
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :class="[
      'w-full max-w-[480px] p-[60px_40px] border-2 border-dashed rounded-[20px] cursor-pointer transition-all bg-bg-card text-center',
      isDragging
        ? 'border-jet-green bg-jet-green/5'
        : 'border-border-light hover:border-accent hover:bg-bg-card-hover hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(108,92,231,0.25)]',
    ]"
    @click="openPicker"
    @keydown.enter="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop="onDrop"
  >
    <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent to-violet-500 flex items-center justify-center shadow-[0_8px_32px_rgba(108,92,231,0.25)]">
      <svg class="w-7 h-7 fill-white" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
        <path d="M8 14h8v2H8zm0-3h8v2H8z" />
      </svg>
    </div>
    <div class="text-base text-text-primary font-semibold mb-2">
      {{ loading ? 'Processando arquivo…' : 'Importe sua planilha Excel' }}
    </div>
    <div class="text-[13px] text-text-muted">
      Arraste o arquivo .xlsx aqui ou clique para selecionar
    </div>
    <p v-if="error" class="mt-4 text-sm text-jet-red">{{ error }}</p>
    <input ref="inputRef" type="file" :accept="accept" class="hidden" @change="onChange" />
  </div>
</template>
