import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentos } from './useAtendimentos'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { groupByDetail } from '@/utils/grouping'

export function useRanking(limit = 5) {
  const { atendimentos } = useAtendimentos()
  const { filtro } = storeToRefs(useFiltrosAtendimentoStore())

  const todos = computed(() => groupByDetail(atendimentos.value, 'revendedor'))
  const top = computed(() => todos.value.slice(0, limit))
  const mostrarDetalhe = computed(() => filtro.value.status === 'Todos')

  const titulo = computed(() => {
    if (filtro.value.status === 'Novo') return 'Top 5 Revendedores (conversão)'
    if (filtro.value.status === 'Recorrente') return 'Top 5 Revendedores (recorrência)'
    return 'Top 5 Revendedores (atendimento)'
  })

  return {
    top,
    titulo,
    totalRevendedores: computed(() => todos.value.length),
    mostrarDetalhe,
  }
}
