export interface GroupEntry {
  key: string
  total: number
}

export interface GroupDetailEntry {
  key: string
  total: number
  novos: number
  recorrentes: number
}

const INVALID = new Set(['', '--'])

function normalize(value: unknown): string | null {
  if (value == null) return null
  const v = String(value).trim()
  if (INVALID.has(v)) return null
  return v
}

export function groupBy<T>(arr: T[], field: keyof T): GroupEntry[] {
  const map = new Map<string, number>()
  for (const row of arr) {
    const key = normalize(row[field])
    if (!key) continue
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total)
}

export function groupByDetail<T extends { status: 'Novo' | 'Recorrente' }>(
  arr: T[],
  field: keyof T,
): GroupDetailEntry[] {
  const map = new Map<string, GroupDetailEntry>()
  for (const row of arr) {
    const key = normalize(row[field])
    if (!key) continue
    let entry = map.get(key)
    if (!entry) {
      entry = { key, total: 0, novos: 0, recorrentes: 0 }
      map.set(key, entry)
    }
    entry.total++
    if (row.status === 'Novo') entry.novos++
    else entry.recorrentes++
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}
