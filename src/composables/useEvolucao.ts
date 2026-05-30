import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { EChartsOption } from 'echarts'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { MONTH_NAMES, buildYm, previousYear } from '@/utils/dateHelpers'
import {
  CHART_COLORS,
  STATUS_COLOR,
  chartBase,
  chartTooltip,
  axisLabelStyle,
  categoryAxisLine,
  valueSplitLine,
} from '@/utils/chartTheme'
import type { Atendimento, StatusFiltro } from '@/types/Atendimento'

type Mode = 'todos' | 'ano' | 'mes'

interface EvolutionResult {
  mode: Mode
  option: EChartsOption | null
  tag: string | null
  hasData: boolean
}

interface TooltipParam {
  name?: string
  value?: number | null
  seriesName?: string
  seriesIndex?: number
  marker?: string
  dataIndex?: number
}

type SeriesDataLookup = Record<string, (number | null)[]>

function deltaTag(current: number, prevData: (number | null)[] | undefined, dataIndex: number): string {
  if (!prevData || dataIndex <= 0) return ''
  const prev = prevData[dataIndex - 1]
  if (prev === null || prev === undefined || prev === 0) return ''
  const pct = Math.round(((current - prev) / prev) * 100)
  const sign = pct > 0 ? '+' : ''
  const color = pct > 0 ? CHART_COLORS.novo : pct < 0 ? '#FF5C7A' : CHART_COLORS.textSecondary
  return ` <span style="font-size:11px;font-weight:400;color:${color}">(${sign}${pct}%)</span>`
}

function statusToLabel(status: StatusFiltro): string | null {
  if (status === 'Todos') return null
  return status === 'Novo' ? 'Novos' : 'Recorrentes'
}

function countByStatus(rows: Atendimento[], status: StatusFiltro): number {
  if (status === 'Todos') return rows.length
  return rows.filter((r) => r.status === status).length
}

function makeTooltipFormatter(statusLabel: string | null, lookup?: SeriesDataLookup) {
  return (params: unknown) => {
    const list = (Array.isArray(params) ? params : [params]) as TooltipParam[]
    const valid = list
      .filter((item) => item.value !== null && item.value !== undefined)
      .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))
    if (!valid.length) return ''

    const month = valid[0].name ?? ''
    const header = statusLabel ? `${month} — ${statusLabel}` : month
    const dataIndex = valid[0].dataIndex ?? -1

    const rows = valid
      .map((item) => {
        const seriesName = String(item.seriesName ?? '')
        const label = seriesName.includes(' — ') ? seriesName.split(' — ')[0] : seriesName
        const value = item.value ?? 0
        const delta = lookup ? deltaTag(value, lookup[seriesName], dataIndex) : ''
        return `<div style="display:flex;justify-content:space-between;gap:24px;line-height:1.8"><span>${item.marker ?? ''}${label}</span><span style="font-weight:600">${value}${delta}</span></div>`
      })
      .join('')

    return `<div style="padding:2px 0"><div style="font-weight:600;margin-bottom:6px">${header}</div>${rows}</div>`
  }
}

function evolutionBase(): Partial<EChartsOption> {
  return {
    ...chartBase(),
    grid: { left: 40, right: 12, top: 16, bottom: 52, containLabel: false },
    tooltip: { ...chartTooltip(), trigger: 'axis' },
  }
}

function categoryAxis(data: string[], rotate = 0) {
  return {
    type: 'category' as const,
    data,
    axisLine: categoryAxisLine(),
    axisLabel: { ...axisLabelStyle(), rotate, interval: 0 as const },
    boundaryGap: false,
  }
}

function valueAxis() {
  return {
    type: 'value' as const,
    axisLine: { show: false },
    splitLine: valueSplitLine(),
    axisLabel: axisLabelStyle(),
  }
}

function lineSeries(name: string, data: (number | null)[], color: string, opts: { dashed?: boolean; small?: boolean } = {}) {
  const isDashed = opts.dashed === true
  return {
    name,
    type: 'line' as const,
    data,
    smooth: false,
    symbol: 'circle' as const,
    symbolSize: opts.small ? 6 : isDashed ? 6 : 7,
    lineStyle: isDashed
      ? { color, width: 1.5, type: 'dashed' as const, opacity: 0.5 }
      : { color, width: 2.5 },
    itemStyle: { color, borderColor: CHART_COLORS.bgCard, borderWidth: 2, ...(isDashed ? { opacity: 0.55 } : {}) },
    connectNulls: true,
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
    return buildAllMonthsLine(atendimentos.value, status)
  })

  return { resultado }
}

function buildAllMonthsLine(all: Atendimento[], status: StatusFiltro): EvolutionResult {
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

  let hasMultipleYears = false
  for (let i = 1; i < months.length; i++) {
    if (months[i].split('-')[0] !== months[i - 1].split('-')[0]) {
      hasMultipleYears = true
      break
    }
  }

  const series: NonNullable<EChartsOption['series']> = []
  if (status === 'Todos') series.push(lineSeries('Atendimentos', totais, STATUS_COLOR.Todos))
  if (status !== 'Recorrente') series.push(lineSeries('Novos', novos, CHART_COLORS.novo))
  if (status !== 'Novo') series.push(lineSeries('Recorrentes', recorrentes, CHART_COLORS.recorrente))

  const distinctYears = [...new Set(months.map((ym) => ym.split('-')[0]))]
  const tag = distinctYears.length > 1
    ? `${distinctYears[0]} — ${distinctYears[distinctYears.length - 1]}`
    : null

  const lookup: SeriesDataLookup = {
    Atendimentos: totais,
    Novos: novos,
    Recorrentes: recorrentes,
  }

  return {
    mode: 'todos',
    tag,
    hasData: months.length > 0,
    option: {
      ...evolutionBase(),
      tooltip: { ...chartTooltip(), trigger: 'axis', formatter: makeTooltipFormatter(statusToLabel(status), lookup) },
      grid: { left: 40, right: 12, top: 16, bottom: hasMultipleYears ? 92 : 60, containLabel: false },
      legend: { textStyle: { color: CHART_COLORS.textSecondary }, bottom: 0 },
      xAxis: categoryAxis(labels, hasMultipleYears ? 40 : 0),
      yAxis: valueAxis(),
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

  const color = STATUS_COLOR[status]
  const statusLabel = status === 'Novo' ? 'Novos' : status === 'Recorrente' ? 'Recorrentes' : 'Total'

  const series: NonNullable<EChartsOption['series']> = [
    lineSeries(`${year} — ${statusLabel}`, curVals, color, { small: true }),
  ]
  if (hasPrev) {
    series.push(lineSeries(prevYear, prevVals, color, { dashed: true }))
  }

  const lookup: SeriesDataLookup = {
    [`${year} — ${statusLabel}`]: curVals,
    ...(hasPrev ? { [prevYear]: prevVals } : {}),
  }

  return {
    mode: 'ano',
    tag: hasPrev ? `${year} vs ${prevYear}` : year,
    hasData: true,
    option: {
      ...evolutionBase(),
      tooltip: { ...chartTooltip(), trigger: 'axis', formatter: makeTooltipFormatter(statusToLabel(status), lookup) },
      grid: { left: 40, right: 12, top: 16, bottom: 72, containLabel: false },
      legend: { textStyle: { color: CHART_COLORS.textSecondary }, bottom: 0 },
      xAxis: categoryAxis([...MONTH_NAMES], 30),
      yAxis: valueAxis(),
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
      itemStyle: { color: CHART_COLORS.novo, borderRadius: [4, 4, 0, 0] },
    })
  }
  if (status !== 'Novo') {
    series.push({
      name: 'Recorrentes',
      type: 'bar',
      data: recData,
      itemStyle: { color: CHART_COLORS.recorrente, borderRadius: [4, 4, 0, 0] },
    })
  }

  return {
    mode: 'mes',
    tag: `${mLabel} ${year} vs ${mLabel} ${prevYear}`,
    hasData: cur.hasData || prev.hasData,
    option: {
      ...evolutionBase(),
      legend: { textStyle: { color: CHART_COLORS.textSecondary }, bottom: 0 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: categoryAxisLine(),
        axisLabel: axisLabelStyle(),
      },
      yAxis: valueAxis(),
      series,
    },
  }
}
