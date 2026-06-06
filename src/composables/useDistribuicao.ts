import { computed } from 'vue'
import { useAtendimentos } from './useAtendimentos'
import { usePrintFiltro } from './usePrintFiltro'
import { groupBy, groupByResolver, type GroupEntry } from '@/utils/grouping'
import { resolveToUF } from '@/utils/estadoMap'
import { WEEKDAYS_PT } from '@/utils/dateHelpers'

export interface WeekdayBucket {
  label: string
  total: number
}

export function useDistribuicao(limit = 3) {
  const { atendimentos: atProgramas } = useAtendimentos(usePrintFiltro('programas'))
  const { atendimentos: atImpressoras } = useAtendimentos(usePrintFiltro('impressoras'))
  const { atendimentos: atInterestaduais } = useAtendimentos(usePrintFiltro('interestaduais'))
  const { atendimentos: atWeekday } = useAtendimentos(usePrintFiltro('weekday'))
  const { atendimentos: atEstadosRevenda } = useAtendimentos(usePrintFiltro('estadosRevenda'))
  const { atendimentos: atEstadosSubli } = useAtendimentos(usePrintFiltro('estadosSubli'))

  const programas = computed<GroupEntry[]>(
    () => groupBy(atProgramas.value, 'programa').slice(0, limit),
  )
  const impressoras = computed<GroupEntry[]>(
    () => groupBy(atImpressoras.value, 'impressora').slice(0, limit),
  )

  // Interestadual = UF de revenda diferente da UF do sublimador (ambas resolvíveis).
  const interestaduais = computed<GroupEntry[]>(() =>
    groupByResolver(atInterestaduais.value, (a) => {
      const ufSubli = resolveToUF(a.estado)
      const ufRevenda = resolveToUF(a.estadoUf)
      if (!ufSubli || !ufRevenda || ufSubli === ufRevenda) return null
      return ufRevenda
    }).slice(0, limit),
  )

  const weekday = computed<WeekdayBucket[]>(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const a of atWeekday.value) {
      if (a.dow >= 1 && a.dow <= 5) counts[a.dow - 1]++
    }
    return WEEKDAYS_PT.map((label, i) => ({ label, total: counts[i] }))
  })

  const estadosRevenda = computed<GroupEntry[]>(() =>
    groupByResolver(atEstadosRevenda.value, (a) => a.estadoUf ?? null).slice(0, limit),
  )

  const estadosSubli = computed<GroupEntry[]>(() =>
    groupByResolver(atEstadosSubli.value, (a) => resolveToUF(a.estado)).slice(0, limit),
  )

  return { programas, impressoras, interestaduais, weekday, estadosRevenda, estadosSubli }
}
