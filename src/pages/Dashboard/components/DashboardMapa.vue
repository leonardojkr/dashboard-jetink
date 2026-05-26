<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import { useAtendimentos } from '@/composables/useAtendimentos'
import { UF_TO_ESTADO, resolverNomeEstado } from '@/utils/estadoMap'

type TipoMapa = 'sublimador' | 'revenda'

const tipo = ref<TipoMapa>('sublimador')
const { atendimentos } = useAtendimentos()

const ESTADOS_BRASIL = Object.values(UF_TO_ESTADO)
const HIGHLIGHT_COLORS = ['#6C5CE7', '#8174E9', '#A29BFE']
const HAS_DATA_COLOR = '#3D3A5C'
const NEUTRAL_COLOR = '#1A1F2E'

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
      idx >= 0 ? HIGHLIGHT_COLORS[idx] : value > 0 ? HAS_DATA_COLOR : NEUTRAL_COLOR
    return { name: nome, value, itemStyle: { areaColor } }
  })

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#181D29',
      borderColor: '#2A3044',
      textStyle: { color: '#F0F2F8', fontFamily: 'DM Sans, sans-serif' },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number | undefined }
        const v = Number(p.value) || 0
        return `<div style="font-weight:600">${p.name}</div><div style="margin-top:4px;color:#8B92A8">${v.toLocaleString('pt-BR')} atendimento${v === 1 ? '' : 's'}</div>`
      },
    },
    series: [
      {
        type: 'map',
        map: 'brazil',
        roam: false,
        label: { show: false },
        itemStyle: {
          areaColor: NEUTRAL_COLOR,
          borderColor: '#2A3044',
          borderWidth: 1,
        },
        emphasis: {
          label: { show: false },
          itemStyle: { borderColor: '#A29BFE', borderWidth: 1.5 },
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
            v-for="opt in [{ label: 'Sublimador', value: 'sublimador' }, { label: 'Revenda', value: 'revenda' }]"
            :key="opt.value"
            type="button"
            class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
            :class="tipo === opt.value
              ? 'bg-bg-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'"
            @click="tipo = opt.value as TipoMapa"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </template>

    <div class="-mx-6 -mb-6 flex-1 min-h-0 flex overflow-hidden rounded-b-[14px]">
      <div class="flex-1 min-w-0">
        <BaseChart v-if="option" :option="option" height="100%" />
      </div>

      <div class="w-[200px] border-l border-border flex flex-col overflow-hidden shrink-0">
        <ul class="flex flex-col gap-2.5 p-4 overflow-y-auto flex-1 min-h-0">
          <li
            v-for="(w, i) in [88, 74, 63, 55, 46, 39, 31, 24]"
            :key="i"
            class="grid items-center gap-2"
            style="grid-template-columns: 26px 1fr 26px"
          >
            <div class="h-3 bg-bg-elevated rounded" />
            <div class="h-5 bg-bg-elevated rounded overflow-hidden">
              <div class="h-full bg-border-light rounded" :style="{ width: `${w}%` }" />
            </div>
            <div class="h-3 bg-bg-elevated rounded" />
          </li>
        </ul>
      </div>
    </div>
  </BaseCard>
</template>
