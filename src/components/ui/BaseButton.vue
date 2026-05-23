<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
  disabled: false,
})

defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all border whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none'
  const size = props.size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-xs'
  const variant = {
    primary: 'bg-accent border-transparent text-white hover:shadow-[0_4px_20px_rgba(108,92,231,0.4)] hover:-translate-y-px',
    accent: 'bg-gradient-to-br from-accent to-violet-500 border-transparent text-white hover:shadow-[0_4px_20px_rgba(108,92,231,0.4)] hover:-translate-y-px',
    secondary: 'bg-bg-elevated border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary hover:border-accent',
    ghost: 'bg-transparent border-transparent text-text-secondary hover:text-text-primary',
  }[props.variant]
  return `${base} ${size} ${variant}`
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes" @click="$emit('click', $event)">
    <slot />
  </button>
</template>
