<script setup lang="ts">
interface Props {
  title: string
  description?: string
}
defineProps<Props>()
</script>

<template>
  <div class="px-9 py-9 text-center text-text-muted">
    <h3 class="text-text-secondary mb-1.5 font-semibold">{{ title }}</h3>
    <p v-if="description" class="text-sm">{{ description }}</p>
    <slot />
  </div>
</template>
