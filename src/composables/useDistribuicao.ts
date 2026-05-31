import { computed } from 'vue'
import { useAtendimentos } from './useAtendimentos'
import { groupBy, type GroupEntry } from '@/utils/grouping'
import { resolveToUF } from '@/utils/estadoMap'
import { WEEKDAYS_PT } from '@/utils/dateHelpers'

export interface WeekdayBucket {
  label: string
  total: number
}

export function useDistribuicao(limit = 3) {
  const { atendimentos } = useAtendimentos()

  const programas = computed<GroupEntry[]>(
    () => groupBy(atendimentos.value, 'programa').slice(0, limit),
  )
  const impressoras = computed<GroupEntry[]>(
    () => groupBy(atendimentos.value, 'impressora').slice(0, limit),
  )

  const interestaduais = computed<GroupEntry[]>(() => {
    const map = new Map<string, number>()
    for (const a of atendimentos.value) {
      const ufSubli = resolveToUF(a.estado)
      const ufRevenda = resolveToUF(a.estadoUf)
      if (!ufSubli || !ufRevenda) continue
      if (ufSubli === ufRevenda) continue
      map.set(ufRevenda, (map.get(ufRevenda) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  })

  const weekday = computed<WeekdayBucket[]>(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const a of atendimentos.value) {
      if (a.dow >= 1 && a.dow <= 5) counts[a.dow - 1]++
    }
    return WEEKDAYS_PT.map((label, i) => ({ label, total: counts[i] }))
  })

  return { programas, impressoras, interestaduais, weekday }
}
