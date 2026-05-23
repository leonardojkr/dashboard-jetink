<script setup lang="ts">
interface Props {
  title?: string
  count?: string | number
}
defineProps<Props>()
</script>

<template>
  <section class="bg-bg-card border border-border rounded-[14px] p-6 transition-colors hover:border-border-light">
    <header v-if="title || $slots.header || count !== undefined" class="flex items-center justify-between mb-5">
      <slot name="header">
        <h3 v-if="title" class="text-[13px] font-bold uppercase tracking-[1px] text-text-secondary">
          {{ title }}
        </h3>
      </slot>
      <span
        v-if="count !== undefined"
        class="font-mono text-xs text-text-muted bg-bg-elevated px-2.5 py-1 rounded-full"
      >
        {{ count }}
      </span>
    </header>
    <slot />
  </section>
</template>
