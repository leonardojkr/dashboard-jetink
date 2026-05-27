import type { EChartsOption } from 'echarts'
import type { StatusFiltro } from '@/types/Atendimento'

export const CHART_COLORS = {
  novo: '#00D68F',
  recorrente: '#FFA44F',
  accent: '#6C5CE7',
  accentLight: '#A29BFE',
  textPrimary: '#F0F2F8',
  textSecondary: '#8B92A8',
  bgCard: '#12161F',
  bgCardHover: '#181D29',
  border: '#1E2433',
  borderLight: '#2A3044',
} as const

export const STATUS_COLOR: Record<StatusFiltro, string> = {
  Todos: CHART_COLORS.accentLight,
  Novo: CHART_COLORS.novo,
  Recorrente: CHART_COLORS.recorrente,
}

export const MAP_COLORS = {
  highlight: ['#6C5CE7', '#8174E9', '#A29BFE'] as const,
  hasData: '#3D3A5C',
  neutral: '#1A1F2E',
  border: CHART_COLORS.borderLight,
  emphasisBorder: CHART_COLORS.accentLight,
}

export function chartTooltip(): NonNullable<EChartsOption['tooltip']> {
  return {
    backgroundColor: CHART_COLORS.bgCardHover,
    borderColor: CHART_COLORS.borderLight,
    textStyle: { color: CHART_COLORS.textPrimary, fontFamily: 'DM Sans, sans-serif' },
  }
}

export function chartBase(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: CHART_COLORS.textPrimary, fontFamily: 'DM Sans, sans-serif' },
    tooltip: chartTooltip(),
  }
}

export function axisLabelStyle() {
  return { color: CHART_COLORS.textSecondary }
}

export function categoryAxisLine() {
  return { lineStyle: { color: CHART_COLORS.borderLight } }
}

export function valueSplitLine() {
  return { lineStyle: { color: CHART_COLORS.border } }
}
