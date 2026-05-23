import type { Atendimento, AtendimentoExcelRow, AtendimentoStatus } from '@/types/Atendimento'

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseStatus(value: unknown): AtendimentoStatus {
  const v = String(value ?? '').trim().toLowerCase()
  if (v.startsWith('rec')) return 'Recorrente'
  return 'Novo'
}

function cleanText(value: unknown): string {
  if (value == null) return ''
  const v = String(value).trim()
  return v === '--' ? '' : v
}

export function mapExcelRow(row: AtendimentoExcelRow): Atendimento | null {
  const date = parseDate(row.Data)
  if (!date) return null

  const iso = date.toISOString().slice(0, 10)
  const ym = iso.slice(0, 7)
  const year = iso.slice(0, 4)

  return {
    data: date,
    iso,
    ym,
    year,
    dow: date.getDay(),
    status: parseStatus(row.Status),
    revendedor: cleanText(row.Revendedor),
    estado: cleanText(row.Estado),
    programa: cleanText(row.Programa),
    impressora: cleanText(row.Impressora),
  }
}

export function mapExcelRows(rows: AtendimentoExcelRow[]): Atendimento[] {
  const result: Atendimento[] = []
  for (const row of rows) {
    const mapped = mapExcelRow(row)
    if (mapped) result.push(mapped)
  }
  return result
}
