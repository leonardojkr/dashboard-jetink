import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentos } from './useAtendimentos'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { useRelatorioStore } from '@/stores/useRelatorioStore'
import { groupBy, type GroupEntry } from '@/utils/grouping'
import { resolveToUF } from '@/utils/estadoMap'
import { WEEKDAYS_PT } from '@/utils/dateHelpers'

export interface WeekdayBucket {
  label: string
  total: number
}

export function useDistribuicao(limit = 3) {
  const { filtro: filtroGlobal } = storeToRefs(useFiltrosAtendimentoStore())
  const relatorioStore = useRelatorioStore()

  const filtroProgramas = computed(() => relatorioStore.printFiltros?.['programas'] ?? filtroGlobal.value)
  const filtroImpressoras = computed(() => relatorioStore.printFiltros?.['impressoras'] ?? filtroGlobal.value)
  const filtroInterestaduais = computed(() => relatorioStore.printFiltros?.['interestaduais'] ?? filtroGlobal.value)
  const filtroWeekday = computed(() => relatorioStore.printFiltros?.['weekday'] ?? filtroGlobal.value)
  const filtroEstadosRevenda = computed(() => relatorioStore.printFiltros?.['estadosRevenda'] ?? filtroGlobal.value)
  const filtroEstadosSubli = computed(() => relatorioStore.printFiltros?.['estadosSubli'] ?? filtroGlobal.value)

  const { atendimentos: atProgramas } = useAtendimentos(filtroProgramas)
  const { atendimentos: atImpressoras } = useAtendimentos(filtroImpressoras)
  const { atendimentos: atInterestaduais } = useAtendimentos(filtroInterestaduais)
  const { atendimentos: atWeekday } = useAtendimentos(filtroWeekday)
  const { atendimentos: atEstadosRevenda } = useAtendimentos(filtroEstadosRevenda)
  const { atendimentos: atEstadosSubli } = useAtendimentos(filtroEstadosSubli)

  const programas = computed<GroupEntry[]>(
    () => groupBy(atProgramas.value, 'programa').slice(0, limit),
  )
  const impressoras = computed<GroupEntry[]>(
    () => groupBy(atImpressoras.value, 'impressora').slice(0, limit),
  )

  const interestaduais = computed<GroupEntry[]>(() => {
    const map = new Map<string, number>()
    for (const a of atInterestaduais.value) {
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
    for (const a of atWeekday.value) {
      if (a.dow >= 1 && a.dow <= 5) counts[a.dow - 1]++
    }
    return WEEKDAYS_PT.map((label, i) => ({ label, total: counts[i] }))
  })

  const estadosRevenda = computed<GroupEntry[]>(() =>
    groupBy(
      atEstadosRevenda.value.filter((a) => !!a.estadoUf),
      'estadoUf',
    ).slice(0, limit),
  )

  const estadosSubli = computed<GroupEntry[]>(() => {
    const map = new Map<string, number>()
    for (const a of atEstadosSubli.value) {
      const uf = resolveToUF(a.estado)
      if (!uf) continue
      map.set(uf, (map.get(uf) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  })

  return { programas, impressoras, interestaduais, weekday, estadosRevenda, estadosSubli }
}
