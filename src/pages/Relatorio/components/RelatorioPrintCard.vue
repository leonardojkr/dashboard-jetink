<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="border border-[#2a3142] rounded-xl p-2 flex flex-col">
    <div class="text-[9px] font-bold uppercase tracking-[2px] text-[#6b7a99] mb-1 shrink-0">
      {{ title }}
    </div>
    <div class="flex-1 min-h-0">
      <slot />
    </div>
  </div>
</template>
