<script setup lang="ts">
import { computed } from 'vue'
import type { GroupEntry } from '@/utils/grouping'

interface Props {
  items: GroupEntry[]
  tone?: 'accent' | 'cyan' | 'green'
}
const props = withDefaults(defineProps<Props>(), { tone: 'accent' })

const fillClass = computed(() => ({
  accent: 'bg-gradient-to-r from-accent to-accent-light',
  cyan: 'bg-gradient-to-r from-jet-cyan to-jet-blue',
  green: 'bg-gradient-to-r from-jet-green to-emerald-300',
}[props.tone]))

const max = computed(() => props.items[0]?.total ?? 1)
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="item in items" :key="item.key" class="grid grid-cols-[120px_1fr_50px] items-center gap-3">
      <span class="text-[13px] font-medium text-text-secondary truncate">{{ item.key }}</span>
      <div class="h-6 bg-bg-elevated rounded-md overflow-hidden">
        <div
          :class="['h-full rounded-md transition-[width] duration-700', fillClass]"
          :style="{ width: `${(item.total / max) * 100}%` }"
        />
      </div>
      <span class="font-mono text-[13px] font-bold text-text-primary text-right">{{ item.total }}</span>
    </li>
    <li v-if="!items.length" class="text-sm text-text-muted text-center py-4">Sem dados</li>
  </ul>
</template>
