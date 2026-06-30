import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Kpi } from '@/composables/useKpis'
import type { AtendimentoFiltro, StatusFiltro } from '@/types/Atendimento'
import type { TipoMapa } from '@/stores/useMapaFiltroStore'

export type KpiStatKey = 'total' | 'novos' | 'recorrentes' | 'revendedoresAtivos' | 'estadosAlcancados'

export interface KpiMetadata {
  statKey: KpiStatKey
  statusFixo?: StatusFiltro
  statusDefault?: StatusFiltro
}

export const KPI_METADATA: Record<string, KpiMetadata> = {
  'Total Atendimentos':       { statKey: 'total',              statusFixo: 'Todos' },
  'Novos Clientes':           { statKey: 'novos',              statusFixo: 'Todos' },
  'Novos Atendimentos':       { statKey: 'novos' },
  'Recorrentes':              { statKey: 'recorrentes',        statusFixo: 'Todos' },
  'Atendimentos Recorrentes': { statKey: 'recorrentes' },
  'Revendedores Ativos':      { statKey: 'revendedoresAtivos', statusDefault: 'Novo' },
  'Estados Alcançados':       { statKey: 'estadosAlcancados', statusDefault: 'Novo' },
}

export interface KpiRelatorioConfig {
  id: string
  label: string
  color: Kpi['color']
  statKey: KpiStatKey
  incluido: boolean
  filtro: AtendimentoFiltro
  statusFixo?: StatusFiltro
  sub: string
  badge?: Kpi['badge']
}

export interface SecaoVisualConfig {
  id: string
  label: string
  incluido: boolean
  filtro: AtendimentoFiltro
  statusFixo?: StatusFiltro
  tipoMapa?: TipoMapa
}

type SecaoBase = Omit<SecaoVisualConfig, 'filtro'> & { statusDefault?: StatusFiltro }

const SECOES_BASE: SecaoBase[] = [
  { id: 'ranking',        label: 'TOP 5 Revendedores',             incluido: true, statusDefault: 'Novo' },
  { id: 'donut',          label: 'Novo vs Recorrente',             incluido: true, statusFixo: 'Todos' },
  { id: 'weekday',        label: 'Atendimentos por Dia da Semana', incluido: true, statusDefault: 'Todos' },
  { id: 'interestaduais', label: 'Interestaduais',                 incluido: true, statusDefault: 'Novo' },
  { id: 'impressoras',    label: 'Impressoras',                    incluido: true, statusDefault: 'Novo' },
  { id: 'programas',      label: 'Programas',                      incluido: true, statusDefault: 'Novo' },
  { id: 'estadosRevenda', label: 'Revenda por Est. (Top 3)',       incluido: true, statusDefault: 'Novo' },
  { id: 'estadosSubli',   label: 'Sublimador por Est. (Top 3)',    incluido: true, statusDefault: 'Novo' },
]

export const useRelatorioStore = defineStore('relatorio', () => {
  const modalAberto = ref(false)
  const kpisConfig = ref<KpiRelatorioConfig[]>([])
  const secoesConfig = ref<SecaoVisualConfig[]>([])
  const kpisParaImprimir = ref<Kpi[] | null>(null)
  const printFiltros = ref<Record<string, AtendimentoFiltro> | null>(null)
  const printTipoMapa = ref<TipoMapa | null>(null)
  const printPeriodo = ref<string | null>(null)

  function abrirModal(configs: KpiRelatorioConfig[], filtroGlobal: AtendimentoFiltro, _tipoMapaAtual: TipoMapa) {
    kpisConfig.value = configs
    secoesConfig.value = SECOES_BASE.map(({ statusDefault, ...s }) => ({
      ...s,
      filtro: {
        ...filtroGlobal,
        ...(s.statusFixo ? { status: s.statusFixo } : statusDefault ? { status: statusDefault } : {}),
      },
    }))
    modalAberto.value = true
  }

  function fecharModal() {
    modalAberto.value = false
  }

  function setKpisParaImprimir(kpis: Kpi[]) {
    kpisParaImprimir.value = kpis
  }

  function clearKpisParaImprimir() {
    kpisParaImprimir.value = null
  }

  function setPrintFiltros(filtros: Record<string, AtendimentoFiltro>) {
    printFiltros.value = filtros
  }

  function clearPrintFiltros() {
    printFiltros.value = null
  }

  function setPrintTipoMapa(tipo: TipoMapa) {
    printTipoMapa.value = tipo
  }

  function clearPrintTipoMapa() {
    printTipoMapa.value = null
  }

  function setPrintPeriodo(periodo: string) {
    printPeriodo.value = periodo
  }

  function clearPrintPeriodo() {
    printPeriodo.value = null
  }

  function clearSecoesConfig() {
    secoesConfig.value = []
  }

  return {
    modalAberto,
    kpisConfig,
    secoesConfig,
    kpisParaImprimir,
    printFiltros,
    printTipoMapa,
    printPeriodo,
    abrirModal,
    fecharModal,
    setKpisParaImprimir,
    clearKpisParaImprimir,
    setPrintFiltros,
    clearPrintFiltros,
    setPrintTipoMapa,
    clearPrintTipoMapa,
    setPrintPeriodo,
    clearPrintPeriodo,
    clearSecoesConfig,
  }
})
