import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Kpi } from '@/composables/useKpis'
import type { AtendimentoFiltro, StatusFiltro } from '@/types/Atendimento'
import type { TipoMapa } from '@/stores/useMapaFiltroStore'

export type KpiStatKey = 'total' | 'novos' | 'recorrentes' | 'revendedoresAtivos' | 'estadosAlcancados'

export interface KpiRelatorioConfig {
  id: string
  label: string
  color: Kpi['color']
  statKey: KpiStatKey
  incluido: boolean
  filtro: AtendimentoFiltro
}

export interface SecaoVisualConfig {
  id: string
  label: string
  incluido: boolean
  filtro: AtendimentoFiltro
  statusFixo?: StatusFiltro
  tipoMapa?: TipoMapa
}

export const KPI_LABEL_TO_STAT: Record<string, KpiStatKey> = {
  'Total Atendimentos': 'total',
  'Novos Clientes': 'novos',
  'Novos Atendimentos': 'novos',
  'Recorrentes': 'recorrentes',
  'Atendimentos Recorrentes': 'recorrentes',
  'Revendedores Ativos': 'revendedoresAtivos',
  'Estados Alcançados': 'estadosAlcancados',
}

type SecaoBase = Omit<SecaoVisualConfig, 'filtro'>

const SECOES_BASE: SecaoBase[] = [
  { id: 'mapa', label: 'Mapa', incluido: true },
  { id: 'ranking', label: 'TOP 5 Revendedores', incluido: true },
  { id: 'donut', label: 'Novo vs Recorrente', incluido: true, statusFixo: 'Todos' },
  { id: 'weekday', label: 'Atendimentos por Dia da Semana', incluido: true },
  { id: 'interestaduais', label: 'Interestaduais', incluido: true },
  { id: 'impressoras', label: 'Impressoras', incluido: true },
  { id: 'programas', label: 'Programas', incluido: true },
]

export const useRelatorioStore = defineStore('relatorio', () => {
  const modalAberto = ref(false)
  const kpisConfig = ref<KpiRelatorioConfig[]>([])
  const secoesConfig = ref<SecaoVisualConfig[]>([])
  const kpisParaImprimir = ref<Kpi[] | null>(null)
  const printFiltros = ref<Record<string, AtendimentoFiltro> | null>(null)
  const printTipoMapa = ref<TipoMapa | null>(null)

  function abrirModal(configs: KpiRelatorioConfig[], filtroGlobal: AtendimentoFiltro, tipoMapaAtual: TipoMapa) {
    kpisConfig.value = configs
    secoesConfig.value = SECOES_BASE.map((s) => ({
      ...s,
      filtro: {
        ...filtroGlobal,
        ...(s.statusFixo ? { status: s.statusFixo } : {}),
      },
      ...(s.id === 'mapa' ? { tipoMapa: tipoMapaAtual } : {}),
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

  return {
    modalAberto,
    kpisConfig,
    secoesConfig,
    kpisParaImprimir,
    printFiltros,
    printTipoMapa,
    abrirModal,
    fecharModal,
    setKpisParaImprimir,
    clearKpisParaImprimir,
    setPrintFiltros,
    clearPrintFiltros,
    setPrintTipoMapa,
    clearPrintTipoMapa,
  }
})
