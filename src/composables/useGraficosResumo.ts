import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { useAtendimentos } from './useAtendimentos'
import { useDistribuicao } from './useDistribuicao'
import {
  CHART_COLORS,
  chartBase,
  chartTooltip,
  axisLabelStyle,
  categoryAxisLine,
  valueSplitLine,
} from '@/utils/chartTheme'

export function useGraficosResumo() {
  const { atendimentos } = useAtendimentos()
  const { weekday } = useDistribuicao()

  const donutData = computed(() => {
    const novos = atendimentos.value.filter((a) => a.status === 'Novo').length
    const rec = atendimentos.value.filter((a) => a.status === 'Recorrente').length
    return { novos, rec, total: novos + rec }
  })

  const donutOption = computed<EChartsOption | null>(() => {
    const { novos, rec, total } = donutData.value
    if (!total) return null
    return {
      ...chartBase(),
      tooltip: { ...chartTooltip(), trigger: 'item' },
      legend: { show: false },
      series: [
        {
          name: 'Atendimentos',
          type: 'pie',
          radius: ['68%', '88%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'center',
            formatter: () => `{val|${total}}\n{unit|atendimentos}`,
            rich: {
              val: { fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: CHART_COLORS.textPrimary },
              unit: { fontSize: 10, color: CHART_COLORS.textSecondary, padding: [4, 0, 0, 0] },
            },
          },
          itemStyle: { borderColor: CHART_COLORS.bgCard, borderWidth: 3 },
          data: [
            { name: 'Novos', value: novos, itemStyle: { color: CHART_COLORS.novo } },
            { name: 'Recorrentes', value: rec, itemStyle: { color: CHART_COLORS.recorrente } },
          ],
        },
      ],
    }
  })

  const weekdayOption = computed<EChartsOption>(() => {
    const values = weekday.value.map((w) => w.total)
    const maxVal = values.length ? Math.max(...values) : 0
    return {
      ...chartBase(),
      tooltip: { ...chartTooltip(), trigger: 'axis' },
      grid: { left: 32, right: 8, top: 30, bottom: 24, containLabel: false },
      xAxis: {
        type: 'category',
        data: weekday.value.map((w) => w.label),
        axisLine: categoryAxisLine(),
        axisLabel: axisLabelStyle(),
      },
      yAxis: {
        type: 'value',
        max: Math.ceil(maxVal * 1.18),
        axisLine: { show: false },
        splitLine: valueSplitLine(),
        axisLabel: axisLabelStyle(),
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: CHART_COLORS.accentLight },
                { offset: 1, color: CHART_COLORS.accent },
              ],
            },
          },
          label: { show: true, position: 'top', color: CHART_COLORS.textPrimary, fontSize: 11, fontFamily: 'Space Mono' },
        },
      ],
    }
  })

  return { donutData, donutOption, weekdayOption }
}
