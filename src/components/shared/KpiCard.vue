<script setup lang="ts">
import { computed } from 'vue'
import type { Kpi } from '@/composables/useKpis'

interface Props {
  kpi: Kpi
  delay?: number
}
const props = withDefaults(defineProps<Props>(), { delay: 0 })

const barClass = computed(() => ({
  purple: 'bg-gradient-to-r from-accent to-accent-light',
  green: 'bg-gradient-to-r from-jet-green to-emerald-300',
  orange: 'bg-gradient-to-r from-jet-orange to-jet-yellow',
  blue: 'bg-gradient-to-r from-jet-blue to-jet-cyan',
  pink: 'bg-gradient-to-r from-jet-pink to-jet-red',
}[props.kpi.color]))

const valueClass = computed(() => ({
  purple: 'text-accent-light',
  green: 'text-jet-green',
  orange: 'text-jet-orange',
  blue: 'text-jet-blue',
  pink: 'text-jet-pink',
}[props.kpi.color]))

const badgeClass = computed(() => {
  if (!props.kpi.badge) return ''
  return props.kpi.badge.tone === 'up'
    ? 'bg-jet-green/12 text-jet-green'
    : 'bg-jet-red/12 text-jet-red'
})

const animationStyle = computed(() => ({
  animationDelay: `${props.delay * 0.05}s`,
}))
</script>

<template>
  <div
    class="relative bg-bg-card border border-border rounded-[14px] p-[22px] overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border-light hover:shadow-card animate-fade-up"
    :style="animationStyle"
  >
    <div :class="['absolute top-0 inset-x-0 h-[3px] rounded-t-[14px]', barClass]" />
    <div class="text-[11px] uppercase tracking-[1.5px] text-text-muted font-semibold mb-3">
      {{ kpi.label }}
    </div>
    <div :class="['font-mono text-[32px] font-bold leading-none mb-1.5', valueClass]">
      {{ kpi.value }}
    </div>
    <div class="text-xs text-text-muted flex items-center gap-1">
      <span v-if="kpi.badge" :class="['inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold', badgeClass]">
        {{ kpi.badge.text }}
      </span>
      <span>{{ kpi.sub }}</span>
    </div>
  </div>
</template>
