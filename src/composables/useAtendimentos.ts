import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import type { Atendimento } from '@/types/Atendimento'

export function useAtendimentos() {
  const atendimentosStore = useAtendimentosStore()
  const filtrosStore = useFiltrosAtendimentoStore()
  const { atendimentos } = storeToRefs(atendimentosStore)
  const { filtro } = storeToRefs(filtrosStore)

  const filtrados = computed<Atendimento[]>(() => {
    const { ano, mes, status } = filtro.value
    return atendimentos.value.filter((a) => {
      const okAno = ano === 'Todos' || a.year === ano
      const okMes = mes === 'Todos' || a.ym === mes
      const okStatus = status === 'Todos' || a.status === status
      return okAno && okMes && okStatus
    })
  })

  return {
    atendimentos: filtrados,
    todosAtendimentos: atendimentos,
  }
}
