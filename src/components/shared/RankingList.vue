<script setup lang="ts">
import type { GroupDetailEntry } from '@/utils/grouping'

interface Props {
  items: GroupDetailEntry[]
  showDetail?: boolean
}
withDefaults(defineProps<Props>(), { showDetail: true })

const POS_CLASSES = ['text-jet-yellow', 'text-zinc-300', 'text-amber-600']
</script>

<template>
  <ol class="flex flex-col h-full">
    <li
      v-for="(item, idx) in items"
      :key="item.key"
      class="grid grid-cols-[28px_1fr_auto] items-center gap-3.5 flex-1 border-b border-border last:border-b-0"
    >
      <span :class="['font-mono text-[13px] font-bold text-center', POS_CLASSES[idx] ?? 'text-text-muted']">
        {{ String(idx + 1).padStart(2, '0') }}
      </span>
      <div class="min-w-0">
        <div class="text-sm font-semibold text-text-primary truncate">{{ item.key }}</div>
      </div>
      <div class="flex flex-col items-end gap-0.5">
        <strong class="font-mono text-lg font-bold text-text-primary">{{ item.total }}</strong>
        <span v-if="showDetail" class="text-[11px] text-text-muted">
          {{ item.novos }}N · {{ item.recorrentes }}R
        </span>
      </div>
    </li>
  </ol>
</template>
