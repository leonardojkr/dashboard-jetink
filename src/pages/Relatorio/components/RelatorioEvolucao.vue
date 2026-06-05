<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/ui/BaseChart.vue'
import RelatorioPrintCard from './RelatorioPrintCard.vue'
import { useEvolucao } from '@/composables/useEvolucao'

const { resultado } = useEvolucao()

function addBarLabels(opt: EChartsOption): EChartsOption {
  if (!Array.isArray(opt.series)) return opt
  return {
    ...opt,
    series: opt.series.map((s) => {
      const item = s as { type?: string }
      if (item.type !== 'bar') return s
      return {
        ...item,
        label: { show: true, position: 'inside', color: '#fff', fontSize: 11, fontWeight: 700 },
      }
    }),
  } as EChartsOption
}

function compactForPrint(opt: EChartsOption): EChartsOption {
  return {
    ...opt,
    legend: {
      ...(opt.legend as object ?? {}),
      bottom: 0,
      itemWidth: 10,
      itemHeight: 6,
      textStyle: { color: '#8B92A8', fontSize: 9 },
    },
    grid: {
      ...(opt.grid as object ?? {}),
      bottom: 28,
      top: 12,
    },
    yAxis: {
      ...(opt.yAxis as object ?? {}),
      splitNumber: 3,
      axisLabel: { color: '#8B92A8', fontSize: 9 },
    },
    xAxis: {
      ...(opt.xAxis as object ?? {}),
      axisLabel: {
        ...((opt.xAxis as { axisLabel?: object } | undefined)?.axisLabel ?? {}),
        fontSize: 9,
        color: '#8B92A8',
      },
    },
  } as EChartsOption
}

const printOption = computed<EChartsOption | null>(() => {
  const opt = resultado.value.option
  if (!opt || !resultado.value.hasData) return null
  return compactForPrint(addBarLabels(opt))
})
</script>

<template>
  <section v-if="printOption" class="mt-2">
    <RelatorioPrintCard title="Evolução Mensal">
      <BaseChart :key="resultado.mode" :option="printOption" height="100px" />
    </RelatorioPrintCard>
  </section>
</template>
