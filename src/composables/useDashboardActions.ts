import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useAtendimentoFilters } from '@/composables/useAtendimentoFilters'
import { useExcelUpload } from '@/composables/useExcelUpload'
import { useKpis } from '@/composables/useKpis'
import { useRelatorioStore, KPI_METADATA, type KpiRelatorioConfig } from '@/stores/useRelatorioStore'
import { useMapaFiltroStore } from '@/stores/useMapaFiltroStore'

/**
 * Superfície de ações da navbar do dashboard (arquivo atual, Nova Planilha e
 * Gerar Relatório), centralizada para ser reutilizada tanto pelos botões do
 * `DashboardTopbar` quanto pelo menu de três pontos do `DashboardNavbar`,
 * evitando duplicação de comportamento.
 */
export function useDashboardActions() {
  const { nomeArquivo } = storeToRefs(useAtendimentosStore())
  const { podeGerarRelatorio, filtro } = useAtendimentoFilters()
  const { reset } = useExcelUpload()
  const { kpis } = useKpis()
  const relatorioStore = useRelatorioStore()
  const { tipo: tipoMapa } = storeToRefs(useMapaFiltroStore())

  function abrirModal(): void {
    const configs: KpiRelatorioConfig[] = kpis.value.map((kpi) => {
      const meta = KPI_METADATA[kpi.label]
      const config: KpiRelatorioConfig = {
        id: kpi.label.toLowerCase().replace(/\s+/g, '_'),
        label: kpi.label,
        color: kpi.color,
        statKey: meta?.statKey ?? 'total',
        incluido: true,
        sub: kpi.sub,
        badge: kpi.badge,
        filtro: {
          ...filtro.value,
          status: meta?.statusFixo ?? meta?.statusDefault ?? filtro.value.status,
        },
      }
      if (meta?.statusFixo !== undefined) config.statusFixo = meta.statusFixo
      return config
    })
    relatorioStore.abrirModal(configs, { ...filtro.value }, tipoMapa.value)
  }

  return { nomeArquivo, podeGerarRelatorio, reset, abrirModal }
}
