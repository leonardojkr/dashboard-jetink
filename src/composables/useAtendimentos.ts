import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import type { Atendimento, AtendimentoFiltro } from '@/types/Atendimento'

export function matchFiltro(a: Atendimento, filtro: AtendimentoFiltro): boolean {
  const { ano, mes, status } = filtro
  return (ano === 'Todos' || a.year === ano)
    && (mes === 'Todos' || a.ym === mes)
    && (status === 'Todos' || a.status === status)
}

export function useAtendimentos(filtroOverride?: Ref<AtendimentoFiltro> | ComputedRef<AtendimentoFiltro>) {
  const atendimentosStore = useAtendimentosStore()
  const filtrosStore = useFiltrosAtendimentoStore()
  const { atendimentos } = storeToRefs(atendimentosStore)
  const { filtro } = storeToRefs(filtrosStore)

  const filtroAtivo = computed<AtendimentoFiltro>(() => filtroOverride?.value ?? filtro.value)

  const filtrados = computed<Atendimento[]>(() =>
    atendimentos.value.filter((a) => matchFiltro(a, filtroAtivo.value)),
  )

  return {
    atendimentos: filtrados,
    todosAtendimentos: atendimentos,
  }
}
