<script setup lang="ts" generic="T extends string">
interface Tab {
  label: string
  value: T
}
interface Props {
  modelValue: T
  tabs: Tab[]
}
defineProps<Props>()
defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="flex bg-bg-card rounded-[10px] p-[3px] border border-border">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :class="[
        'px-5 py-2 text-[13px] font-semibold font-sans rounded-lg transition-all whitespace-nowrap',
        modelValue === tab.value
          ? 'bg-accent text-white shadow-[0_2px_12px_rgba(108,92,231,0.25)]'
          : 'bg-transparent text-text-muted hover:text-text-secondary',
      ]"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
