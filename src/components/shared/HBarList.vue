<script setup lang="ts">
import { computed } from 'vue'
import type { GroupEntry } from '@/utils/grouping'

interface Props {
  items: GroupEntry[]
  tone?: 'accent' | 'cyan' | 'green'
  compact?: boolean
}
const props = withDefaults(defineProps<Props>(), { tone: 'accent', compact: false })

const fillClass = computed(() => ({
  accent: 'bg-gradient-to-r from-accent to-accent-light',
  cyan: 'bg-gradient-to-r from-jet-cyan to-jet-blue',
  green: 'bg-gradient-to-r from-jet-green to-emerald-300',
}[props.tone]))

const max = computed(() => props.items[0]?.total ?? 1)
</script>

<template>
  <ul :class="['flex flex-col', compact ? 'gap-1' : 'gap-3']">
    <li
      v-for="item in items"
      :key="item.key"
      :class="['grid items-center', compact ? 'grid-cols-[34px_1fr_20px] gap-1' : 'grid-cols-[120px_1fr_50px] gap-3']"
    >
      <span :class="['font-medium text-text-secondary truncate', compact ? 'text-[10px]' : 'text-[13px]']">{{ item.key }}</span>
      <div class="h-2 bg-bg-elevated rounded-md overflow-hidden">
        <div
          :class="['h-full rounded-md transition-[width] duration-700', fillClass]"
          :style="{ width: `${(item.total / max) * 100}%` }"
        />
      </div>
      <span :class="['font-mono font-bold text-text-primary text-right', compact ? 'text-[10px]' : 'text-[13px]']">{{ item.total }}</span>
    </li>
    <li v-if="!items.length" class="text-sm text-text-muted text-center py-4">Sem dados</li>
  </ul>
</template>
