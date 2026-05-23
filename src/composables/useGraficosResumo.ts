import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { useAtendimentos } from './useAtendimentos'
import { useDistribuicao } from './useDistribuicao'

const COLOR_NOVO = '#00D68F'
const COLOR_REC = '#FFA44F'
const COLOR_ACCENT = '#6C5CE7'
const COLOR_ACCENT_LIGHT = '#A29BFE'

function darkBase(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#F0F2F8', fontFamily: 'DM Sans, sans-serif' },
    tooltip: {
      backgroundColor: '#181D29',
      borderColor: '#2A3044',
      textStyle: { color: '#F0F2F8' },
    },
  }
}

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
      ...darkBase(),
      tooltip: { ...darkBase().tooltip, trigger: 'item' },
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
              val: { fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: '#F0F2F8' },
              unit: { fontSize: 10, color: '#8B92A8', padding: [4, 0, 0, 0] },
            },
          },
          itemStyle: { borderColor: '#12161F', borderWidth: 3 },
          data: [
            { name: 'Novos', value: novos, itemStyle: { color: COLOR_NOVO } },
            { name: 'Recorrentes', value: rec, itemStyle: { color: COLOR_REC } },
          ],
        },
      ],
    }
  })

  const weekdayOption = computed<EChartsOption>(() => {
    const values = weekday.value.map((w) => w.total)
    const maxVal = values.length ? Math.max(...values) : 0
    return {
      ...darkBase(),
      tooltip: { ...darkBase().tooltip, trigger: 'axis' },
      grid: { left: 32, right: 8, top: 30, bottom: 24, containLabel: false },
      xAxis: {
        type: 'category',
        data: weekday.value.map((w) => w.label),
        axisLine: { lineStyle: { color: '#2A3044' } },
        axisLabel: { color: '#8B92A8' },
      },
      yAxis: {
        type: 'value',
        max: Math.ceil(maxVal * 1.18),
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E2433' } },
        axisLabel: { color: '#8B92A8' },
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
                { offset: 0, color: COLOR_ACCENT_LIGHT },
                { offset: 1, color: COLOR_ACCENT },
              ],
            },
          },
          label: { show: true, position: 'top', color: '#F0F2F8', fontSize: 11, fontFamily: 'Space Mono' },
        },
      ],
    }
  })

  return { donutData, donutOption, weekdayOption }
}
