export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const

export const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] as const

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MONTH_NAMES[idx]}`
}

export function monthLabel(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] ?? ''
}

export function buildYm(year: string, monthIndex0: number): string {
  const mm = String(monthIndex0 + 1).padStart(2, '0')
  return `${year}-${mm}`
}

export function previousYear(year: string): string {
  return String(parseInt(year, 10) - 1)
}
