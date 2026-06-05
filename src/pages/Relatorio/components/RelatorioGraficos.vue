<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { useRelatorioStore } from '@/stores/useRelatorioStore'
import { useRanking } from '@/composables/useRanking'
import { useGraficosResumo } from '@/composables/useGraficosResumo'
import RankingList from '@/components/shared/RankingList.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import RelatorioPrintCard from './RelatorioPrintCard.vue'

const relatorioStore = useRelatorioStore()

const { top, titulo, mostrarDetalhe } = useRanking(5)
const { donutOption: donutOptionBase, donutData, weekdayOption: weekdayOptionBase } = useGraficosResumo()

const donutOption = computed<EChartsOption | null>(() => {
  const opt = donutOptionBase.value
  if (!opt || !Array.isArray(opt.series)) return opt
  return {
    ...opt,
    series: opt.series.map((s: object) => ({
      ...s,
      label: {
        ...(s as { label?: object }).label,
        rich: {
          val: { fontFamily: 'Space Mono', fontSize: 16, fontWeight: 700, color: '#F0F2F8' },
          unit: { fontSize: 8, color: '#8B92A8', padding: [3, 0, 0, 0] },
        },
      },
    })),
  } as EChartsOption
})

const weekdayOption = computed<EChartsOption>(() => ({
  ...weekdayOptionBase.value,
  grid: { left: 8, right: 8, top: 20, bottom: 24, containLabel: false },
  yAxis: {
    ...(weekdayOptionBase.value.yAxis as object ?? {}),
    axisLine: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
  },
  xAxis: {
    ...(weekdayOptionBase.value.xAxis as object ?? {}),
    axisLabel: { color: '#8B92A8', fontSize: 9 },
  },
}))

const showRanking = computed(() => !!relatorioStore.printFiltros?.['ranking'])
const showDonut = computed(() => !!relatorioStore.printFiltros?.['donut'])
const showWeekday = computed(() => !!relatorioStore.printFiltros?.['weekday'])
const showRight = computed(() => showDonut.value || showWeekday.value)
const showSection = computed(() => showRanking.value || showRight.value)

function pct(value: number): string {
  if (!donutData.value.total) return '0'
  return ((value / donutData.value.total) * 100).toFixed(1)
}

const donutLegenda = computed(() => [
  { color: 'bg-jet-green', label: 'Novos', value: donutData.value.novos, pct: pct(donutData.value.novos) },
  { color: 'bg-jet-orange', label: 'Recorrentes', value: donutData.value.rec, pct: pct(donutData.value.rec) },
])
</script>

<template>
  <section v-if="showSection" class="mt-2">
    <div
      class="grid gap-4"
      :class="showRanking && showRight ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <!-- Left: Top 5 Revendedores -->
      <div v-if="showRanking" class="flex flex-col">
        <RelatorioPrintCard :title="titulo" class="flex-1">
          <RankingList v-if="top.length" :items="top" :show-detail="mostrarDetalhe" compact />
          <EmptyState v-else title="Sem revendedores registrados" />
        </RelatorioPrintCard>
      </div>

      <!-- Right: Novo vs Recorrente + Atendimentos por Dia da Semana -->
      <div v-if="showRight" class="flex flex-col gap-2">
        <RelatorioPrintCard v-if="showDonut" title="Novo vs Recorrente">
          <div v-if="donutOption" class="flex items-center justify-center gap-6">
            <BaseChart :option="donutOption" height="90px" class="!w-[90px]" />
            <ul class="flex flex-col gap-2">
              <li
                v-for="item in donutLegenda"
                :key="item.label"
                class="flex items-center gap-2 text-[11px] text-[#8899bb]"
              >
                <span :class="['w-2.5 h-2.5 rounded-sm', item.color]" />
                {{ item.label }}
                <span class="font-mono font-bold text-[#c8d0e8] ml-1">
                  {{ item.value }} ({{ item.pct }}%)
                </span>
              </li>
            </ul>
          </div>
          <EmptyState v-else title="Sem dados" />
        </RelatorioPrintCard>

        <RelatorioPrintCard v-if="showWeekday" title="Atendimentos por Dia da Semana">
          <BaseChart :option="weekdayOption" height="80px" />
        </RelatorioPrintCard>
      </div>
    </div>
  </section>
</template>
