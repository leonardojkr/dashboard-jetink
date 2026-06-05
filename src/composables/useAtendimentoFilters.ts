import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'

export function useAtendimentoFilters() {
  const filtrosStore = useFiltrosAtendimentoStore()
  const atendimentosStore = useAtendimentosStore()
  const { filtro } = storeToRefs(filtrosStore)
  const { atendimentos } = storeToRefs(atendimentosStore)

  const anos = computed<string[]>(() => {
    const set = new Set<string>()
    for (const a of atendimentos.value) set.add(a.year)
    return [...set].sort()
  })

  const meses = computed<string[]>(() => {
    const src = filtro.value.ano === 'Todos'
      ? atendimentos.value
      : atendimentos.value.filter((a) => a.year === filtro.value.ano)
    const set = new Set<string>()
    for (const a of src) set.add(a.ym)
    return [...set].sort()
  })

  const podeGerarRelatorio = computed(
    () => filtro.value.mes !== 'Todos',
  )

  return {
    filtro,
    anos,
    meses,
    podeGerarRelatorio,
    atualizar: filtrosStore.atualizar,
    limpar: filtrosStore.limpar,
  }
}
