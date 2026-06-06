import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { useRelatorioStore } from '@/stores/useRelatorioStore'
import type { AtendimentoFiltro } from '@/types/Atendimento'

/**
 * Resolve o filtro ativo de uma seção do relatório.
 *
 * No modo impressão cada seção pode ter seu próprio filtro
 * (`relatorioStore.printFiltros[secao]`, definido pelo modal). Fora do modo
 * impressão (`printFiltros === null`) todas as seções caem no filtro global.
 *
 * Centraliza o padrão `printFiltros?.[secao] ?? filtroGlobal` antes espalhado
 * por useRanking, useDistribuicao e useGraficosResumo.
 */
export function usePrintFiltro(secao: string): ComputedRef<AtendimentoFiltro> {
  const { filtro: filtroGlobal } = storeToRefs(useFiltrosAtendimentoStore())
  const relatorioStore = useRelatorioStore()
  return computed(() => relatorioStore.printFiltros?.[secao] ?? filtroGlobal.value)
}
