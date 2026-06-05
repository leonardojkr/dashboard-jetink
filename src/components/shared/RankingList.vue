<script setup lang="ts">
import type { GroupDetailEntry } from '@/utils/grouping'

interface Props {
  items: GroupDetailEntry[]
  showDetail?: boolean
  compact?: boolean
}
withDefaults(defineProps<Props>(), { showDetail: true, compact: false })

const POS_CLASSES = ['text-jet-yellow', 'text-zinc-300', 'text-amber-600']
</script>

<template>
  <ol class="flex flex-col h-full">
    <li
      v-for="(item, idx) in items"
      :key="item.key"
      :class="[
        'grid items-center flex-1 border-b border-border last:border-b-0',
        compact
          ? 'grid-cols-[18px_1fr_auto] gap-2'
          : 'grid-cols-[28px_1fr_auto] gap-3.5',
      ]"
    >
      <span :class="['font-mono font-bold text-center', POS_CLASSES[idx] ?? 'text-text-muted', compact ? 'text-[9px]' : 'text-[13px]']">
        {{ String(idx + 1).padStart(2, '0') }}
      </span>
      <div class="min-w-0">
        <div :class="['font-semibold text-text-primary truncate', compact ? 'text-[10px]' : 'text-sm']">{{ item.key }}</div>
      </div>
      <div class="flex flex-col items-end gap-0.5">
        <strong :class="['font-mono font-bold text-text-primary', compact ? 'text-[12px]' : 'text-lg']">{{ item.total }}</strong>
        <span v-if="showDetail" :class="['text-text-muted', compact ? 'text-[8px]' : 'text-[11px]']">
          {{ item.novos }}N · {{ item.recorrentes }}R
        </span>
      </div>
    </li>
  </ol>
</template>
