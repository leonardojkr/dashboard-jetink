import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { EChartsOption } from 'echarts'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { MONTH_NAMES, buildYm, previousYear } from '@/utils/dateHelpers'
import type { Atendimento, StatusFiltro } from '@/types/Atendimento'

type Mode = 'todos' | 'ano' | 'mes'

interface EvolutionResult {
  mode: Mode
  option: EChartsOption | null
  tag: string | null
  hasData: boolean
}

const COLOR_NOVO = '#00D68F'
const COLOR_REC = '#FFA44F'
const COLOR_BY_STATUS: Record<StatusFiltro, string> = {
  Todos: '#A29BFE',
  Novo: COLOR_NOVO,
  Recorrente: COLOR_REC,
}

function countByStatus(rows: Atendimento[], status: StatusFiltro): number {
  if (status === 'Todos') return rows.length
  return rows.filter((r) => r.status === status).length
}

function statusToLabel(status: StatusFiltro): string | null {
  if (status === 'Todos') return null
  return status === 'Novo' ? 'Novos' : 'Recorrentes'
}

function makeTooltipFormatter(statusLabel: string | null) {
  return (params: unknown) => {
    const p = Array.isArray(params) ? params : [params]
    const valid = p
      .filter((item: any) => item.value !== null && item.value !== undefined)
      .sort((a: any, b: any) => a.seriesIndex - b.seriesIndex)
    if (!valid.length) return ''

    const month = (valid[0] as any)?.name ?? ''
    const header = statusLabel ? `${month} — ${statusLabel}` : month

    const rows = valid
      .map((item: any) => {
        const seriesName = String(item.seriesName)
        const label = seriesName.includes(' — ') ? seriesName.split(' — ')[0] : seriesName
        return `<div style="display:flex;justify-content:space-between;gap:24px;line-height:1.8"><span>${item.marker}${label}</span><span style="font-weight:600">${item.value}</span></div>`
      })
      .join('')

    return `<div style="padding:2px 0"><div style="font-weight:600;margin-bottom:6px">${header}</div>${rows}</div>`
  }
}

function baseTheme(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#F0F2F8', fontFamily: 'DM Sans, sans-serif' },
    grid: { left: 40, right: 12, top: 16, bottom: 52, containLabel: false },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#181D29',
      borderColor: '#2A3044',
      textStyle: { color: '#F0F2F8' },
    },
  }
}

export function useEvolucao() {
  const atendimentosStore = useAtendimentosStore()
  const filtrosStore = useFiltrosAtendimentoStore()
  const { atendimentos } = storeToRefs(atendimentosStore)
  const { filtro } = storeToRefs(filtrosStore)

  const resultado = computed<EvolutionResult>(() => {
    const { ano, mes, status } = filtro.value
    if (ano !== 'Todos' && mes !== 'Todos') return buildBarComparison(atendimentos.value, ano, mes, status)
    if (ano !== 'Todos') return buildYearLine(atendimentos.value, ano, status)
    return buildAllMonthsBars(atendimentos.value, status)
  })

  return { resultado }
}

function makeLine(name: string, data: number[], color: string) {
  return {
    name,
    type: 'line' as const,
    data,
    smooth: false,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { color, width: 2.5 },
    itemStyle: { color, borderColor: '#12161F', borderWidth: 2 },
    connectNulls: true,
  }
}

function buildAllMonthsBars(all: Atendimento[], status: StatusFiltro): EvolutionResult {
  const monthsSet = new Set<string>()
  for (const a of all) monthsSet.add(a.ym)
  const months = [...monthsSet].sort()

  const labels: string[] = []
  const totais: number[] = []
  const novos: number[] = []
  const recorrentes: number[] = []

  for (const ym of months) {
    const [year, month] = ym.split('-')
    const monthIdx = parseInt(month, 10) - 1
    const rows = all.filter((a) => a.ym === ym)
    const n = rows.filter((a) => a.status === 'Novo').length
    const r = rows.filter((a) => a.status === 'Recorrente').length
    labels.push(`${MONTH_NAMES[monthIdx]}/${year.slice(2)}`)
    novos.push(n)
    recorrentes.push(r)
    totais.push(n + r)
  }

  // Detect year transitions to adjust label rotation and grid spacing
  let hasMultipleYears = false
  for (let i = 1; i < months.length; i++) {
    if (months[i].split('-')[0] !== months[i - 1].split('-')[0]) {
      hasMultipleYears = true
      break
    }
  }

  const series: NonNullable<EChartsOption['series']> = []
  if (status === 'Todos') {
    series.push(makeLine('Atendimentos', totais, COLOR_BY_STATUS.Todos))
  }
  if (status !== 'Recorrente') {
    series.push(makeLine('Novos', novos, COLOR_NOVO))
  }
  if (status !== 'Novo') {
    series.push(makeLine('Recorrentes', recorrentes, COLOR_REC))
  }

  const distinctYears = [...new Set(months.map((ym) => ym.split('-')[0]))]
  const tag = distinctYears.length > 1
    ? distinctYears[0] + ' — ' + distinctYears[distinctYears.length - 1]
    : null

  return {
    mode: 'todos',
    tag,
    hasData: months.length > 0,
    option: {
      ...baseTheme(),
      tooltip: {
        ...(baseTheme().tooltip as object),
        formatter: makeTooltipFormatter(statusToLabel(status)),
      },
      grid: { left: 40, right: 12, top: 16, bottom: hasMultipleYears ? 92 : 60, containLabel: false },
      legend: { textStyle: { color: '#8B92A8' }, bottom: 0 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#2A3044' } },
        axisLabel: { color: '#8B92A8', rotate: hasMultipleYears ? 40 : 0, interval: 0 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E2433' } },
        axisLabel: { color: '#8B92A8' },
      },
      series,
    },
  }
}

function buildYearLine(all: Atendimento[], year: string, status: StatusFiltro): EvolutionResult {
  const prevYear = previousYear(year)
  const hasPrev = all.some((a) => a.year === prevYear)

  function monthCount(y: string, monthIdx0: number): number | null {
    const ym = buildYm(y, monthIdx0)
    const rows = all.filter((a) => a.ym === ym)
    if (!rows.length) return null
    return countByStatus(rows, status)
  }

  const curVals: (number | null)[] = []
  const prevVals: (number | null)[] = []
  for (let i = 0; i < 12; i++) {
    curVals.push(monthCount(year, i))
    prevVals.push(hasPrev ? monthCount(prevYear, i) : null)
  }

  const hasCur = curVals.some((v) => v !== null)
  if (!hasCur) {
    return { mode: 'ano', tag: null, hasData: false, option: null }
  }

  const color = COLOR_BY_STATUS[status]
  const statusLabel = status === 'Novo' ? 'Novos' : status === 'Recorrente' ? 'Recorrentes' : 'Total'

  const series: NonNullable<EChartsOption['series']> = [
    {
      name: `${year} — ${statusLabel}`,
      type: 'line',
      data: curVals,
      smooth: false,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color, width: 2.5 },
      itemStyle: { color, borderColor: '#12161F', borderWidth: 2 },
      connectNulls: true,
    },
  ]
  if (hasPrev) {
    series.push({
      name: prevYear,
      type: 'line',
      data: prevVals,
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color, width: 1.5, type: 'dashed', opacity: 0.5 },
      itemStyle: { color, opacity: 0.55, borderColor: '#12161F', borderWidth: 2 },
      connectNulls: true,
    })
  }

  return {
    mode: 'ano',
    tag: hasPrev ? `${year} vs ${prevYear}` : year,
    hasData: true,
    option: {
      ...baseTheme(),
      tooltip: {
        ...(baseTheme().tooltip as object),
        formatter: makeTooltipFormatter(statusToLabel(status)),
      },
      grid: { left: 40, right: 12, top: 16, bottom: 72, containLabel: false },
      legend: { textStyle: { color: '#8B92A8' }, bottom: 0 },
      xAxis: {
        type: 'category',
        data: [...MONTH_NAMES],
        axisLine: { lineStyle: { color: '#2A3044' } },
        axisLabel: { color: '#8B92A8', rotate: 30, interval: 0 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E2433' } },
        axisLabel: { color: '#8B92A8' },
      },
      series,
    },
  }
}

function buildBarComparison(all: Atendimento[], year: string, ym: string, status: StatusFiltro): EvolutionResult {
  const prevYear = previousYear(year)
  const prevYm = prevYear + ym.slice(4)
  const monthIdx = parseInt(ym.split('-')[1], 10) - 1
  const mLabel = MONTH_NAMES[monthIdx]

  function bucket(targetYm: string) {
    const rows = all.filter((a) => a.ym === targetYm)
    return {
      novos: rows.filter((a) => a.status === 'Novo').length,
      recorrentes: rows.filter((a) => a.status === 'Recorrente').length,
      hasData: rows.length > 0,
    }
  }

  const cur = bucket(ym)
  const prev = bucket(prevYm)

  const labels = [`${mLabel} ${year}`, `${mLabel} ${prevYear}`]

  const novosData = [cur.novos, prev.novos]
  const recData = [cur.recorrentes, prev.recorrentes]

  const series: NonNullable<EChartsOption['series']> = []
  if (status !== 'Recorrente') {
    series.push({
      name: 'Novos',
      type: 'bar',
      data: novosData,
      itemStyle: { color: COLOR_NOVO, borderRadius: [4, 4, 0, 0] },
    })
  }
  if (status !== 'Novo') {
    series.push({
      name: 'Recorrentes',
      type: 'bar',
      data: recData,
      itemStyle: { color: COLOR_REC, borderRadius: [4, 4, 0, 0] },
    })
  }

  return {
    mode: 'mes',
    tag: `${mLabel} ${year} vs ${mLabel} ${prevYear}`,
    hasData: cur.hasData || prev.hasData,
    option: {
      ...baseTheme(),
      legend: { textStyle: { color: '#8B92A8' }, bottom: 0 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#2A3044' } },
        axisLabel: { color: '#8B92A8' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E2433' } },
        axisLabel: { color: '#8B92A8' },
      },
      series,
    },
  }
}
