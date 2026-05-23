<script setup lang="ts">
interface Option {
  label: string
  value: string
}
interface Props {
  modelValue: string
  options: Option[]
  label?: string
  disabled?: boolean
}
defineProps<Props>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="flex items-center gap-2">
    <span v-if="label" class="text-[11px] uppercase tracking-[1.5px] text-text-muted font-semibold">
      {{ label }}
    </span>
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="appearance-none pl-3.5 pr-9 py-2 bg-bg-card border border-border rounded-lg text-text-primary font-sans text-[13px] font-medium transition-colors focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/25"
        :class="disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-accent'"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <svg
        class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-secondary pointer-events-none"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 11L3 6h10z" />
      </svg>
    </div>
  </label>
</template>
