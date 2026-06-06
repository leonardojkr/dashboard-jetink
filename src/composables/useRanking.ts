import { computed } from 'vue'
import { useAtendimentos } from './useAtendimentos'
import { usePrintFiltro } from './usePrintFiltro'
import { groupByDetail } from '@/utils/grouping'

export function useRanking(limit = 5) {
  const filtroAtivo = usePrintFiltro('ranking')
  const { atendimentos } = useAtendimentos(filtroAtivo)

  const todos = computed(() => groupByDetail(atendimentos.value, 'revendedor'))
  const top = computed(() => todos.value.slice(0, limit))
  const mostrarDetalhe = computed(() => filtroAtivo.value.status === 'Todos')

  const titulo = computed(() => {
    if (filtroAtivo.value.status === 'Novo') return 'Top 5 Revendedores (conversão)'
    if (filtroAtivo.value.status === 'Recorrente') return 'Top 5 Revendedores (recorrência)'
    return 'Top 5 Revendedores (atendimento)'
  })

  return {
    top,
    titulo,
    totalRevendedores: computed(() => todos.value.length),
    mostrarDetalhe,
  }
}
