<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { EChartsOption } from 'echarts'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import { useAtendimentos } from '@/composables/useAtendimentos'
import { ESTADOS_BRASIL, resolverNomeEstado } from '@/utils/estadoMap'
import { CHART_COLORS, MAP_COLORS, chartTooltip } from '@/utils/chartTheme'
import { useMapaFiltroStore } from '@/stores/useMapaFiltroStore'
import type { TipoMapa } from '@/stores/useMapaFiltroStore'

const TIPOS: { label: string; value: TipoMapa }[] = [
  { label: 'Sublimador', value: 'sublimador' },
  { label: 'Revenda', value: 'revenda' },
]

const { tipo } = storeToRefs(useMapaFiltroStore())
const { atendimentos } = useAtendimentos()

const totaisPorEstado = computed<Map<string, number>>(() => {
  const counts = new Map<string, number>()
  for (const a of atendimentos.value) {
    const key = tipo.value === 'sublimador' ? resolverNomeEstado(a.estado) : a.estadoNome
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
})

const top3 = computed<string[]>(() =>
  Array.from(totaisPorEstado.value.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome]) => nome),
)

const option = computed<EChartsOption | null>(() => {
  const counts = totaisPorEstado.value
  const top = top3.value

  const data = ESTADOS_BRASIL.map((nome) => {
    const value = counts.get(nome) ?? 0
    const idx = top.indexOf(nome)
    const areaColor =
      idx >= 0 ? MAP_COLORS.highlight[idx] : value > 0 ? MAP_COLORS.hasData : MAP_COLORS.neutral
    return { name: nome, value, itemStyle: { areaColor } }
  })

  return {
    backgroundColor: 'transparent',
    tooltip: {
      ...chartTooltip(),
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number | undefined }
        const v = Number(p.value) || 0
        return `<div style="font-weight:600">${p.name}</div><div style="margin-top:4px;color:${CHART_COLORS.textSecondary}">${v.toLocaleString('pt-BR')} atendimento${v === 1 ? '' : 's'}</div>`
      },
    },
    series: [
      {
        type: 'map',
        map: 'brazil',
        roam: false,
        left: '3%',
        right: '3%',
        top: '3%',
        bottom: '3%',
        aspectScale: 0.88,
        label: { show: false },
        itemStyle: {
          areaColor: MAP_COLORS.neutral,
          borderColor: MAP_COLORS.border,
          borderWidth: 1,
        },
        emphasis: {
          label: { show: false },
          itemStyle: { borderColor: MAP_COLORS.emphasisBorder, borderWidth: 1.5 },
        },
        select: { disabled: true },
        data,
      },
    ],
  }
})
</script>

<template>
  <BaseCard class="animate-fade-up flex flex-col h-full" data-print="hide">
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h3 class="text-[13px] font-bold uppercase tracking-[1px] text-text-secondary">Mapa</h3>
        <div class="flex items-center gap-0.5 bg-bg-elevated rounded-lg p-0.5 border border-border">
          <button
            v-for="opt in TIPOS"
            :key="opt.value"
            type="button"
            class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
            :class="tipo === opt.value
              ? 'bg-bg-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'"
            @click="tipo = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </template>

    <div class="-mx-6 -mb-6 flex-1 min-h-0 overflow-hidden rounded-b-[14px]">
      <BaseChart v-if="option" :option="option" height="100%" />
    </div>
  </BaseCard>
</template>
