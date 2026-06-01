import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentos } from './useAtendimentos'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { useMapaFiltroStore } from '@/stores/useMapaFiltroStore'
import { resolverNomeEstado, ESTADOS_BRASIL } from '@/utils/estadoMap'

const ESTADOS_VALIDOS = new Set(ESTADOS_BRASIL)

export interface Kpi {
  color: 'purple' | 'green' | 'orange' | 'blue' | 'pink'
  label: string
  value: string
  sub: string
  badge?: { tone: 'up' | 'down'; text: string }
}

export function useKpis() {
  const { atendimentos } = useAtendimentos()
  const filtrosStore = useFiltrosAtendimentoStore()
  const { filtro } = storeToRefs(filtrosStore)
  const { tipo: tipoMapa } = storeToRefs(useMapaFiltroStore())

  const stats = computed(() => {
    const data = atendimentos.value
    const total = data.length
    const novos = data.filter((a) => a.status === 'Novo').length
    const recorrentes = data.filter((a) => a.status === 'Recorrente').length

    const diasUnicos = new Set<string>()
    const revendedoresUnicos = new Set<string>()
    const estadosUnicos = new Set<string>()
    const modoRevenda = tipoMapa.value === 'revenda'

    for (const a of data) {
      diasUnicos.add(a.iso)
      if (a.revendedor && a.revendedor !== '--' && a.revendedor !== 'Brinde') revendedoresUnicos.add(a.revendedor)

      if (modoRevenda) {
        const nome = a.estadoNome
        if (nome && nome !== '--' && ESTADOS_VALIDOS.has(nome)) estadosUnicos.add(nome)
      } else {
        if (a.estado) {
          const nome = resolverNomeEstado(a.estado)
          if (nome) estadosUnicos.add(nome)
        }
      }
    }

    const media = diasUnicos.size ? total / diasUnicos.size : 0
    const taxaRecorrencia = total ? (recorrentes / total) * 100 : 0
    const taxaNovos = total ? (novos / total) * 100 : 0

    return {
      total,
      novos,
      recorrentes,
      mediaPorDia: media,
      revendedoresAtivos: revendedoresUnicos.size,
      estadosAlcancados: estadosUnicos.size,
      taxaRecorrencia,
      taxaNovos,
    }
  })

  const kpis = computed<Kpi[]>(() => {
    const s = stats.value
    const media = s.mediaPorDia.toFixed(1).replace('.', ',')
    const status = filtro.value.status
    const subEstados =
      tipoMapa.value === 'revenda' ? 'cobertura revenda' : 'cobertura sublimador'

    const kpiEstados: Kpi = {
      color: 'pink',
      label: 'Estados Alcançados',
      value: String(s.estadosAlcancados),
      sub: subEstados,
    }

    if (status === 'Todos') {
      return [
        {
          color: 'purple',
          label: 'Total Atendimentos',
          value: s.total.toLocaleString('pt-BR'),
          sub: `${media} por dia em média`,
        },
        {
          color: 'green',
          label: 'Novos Clientes',
          value: s.novos.toLocaleString('pt-BR'),
          sub: 'do total',
          badge: { tone: 'up', text: `▲ ${s.taxaNovos.toFixed(1)}%` },
        },
        {
          color: 'orange',
          label: 'Recorrentes',
          value: s.recorrentes.toLocaleString('pt-BR'),
          sub: 'taxa recorrência',
          badge: {
            tone: s.taxaRecorrencia > 40 ? 'up' : 'down',
            text: `${s.taxaRecorrencia.toFixed(1)}%`,
          },
        },
        {
          color: 'blue',
          label: 'Revendedores Ativos',
          value: String(s.revendedoresAtivos),
          sub: 'no período selecionado',
        },
        kpiEstados,
      ]
    }

    if (status === 'Novo') {
      return [
        {
          color: 'green',
          label: 'Novos Atendimentos',
          value: s.novos.toLocaleString('pt-BR'),
          sub: `${media} por dia em média`,
        },
        {
          color: 'blue',
          label: 'Revendedores Ativos',
          value: String(s.revendedoresAtivos),
          sub: 'no período selecionado',
        },
        kpiEstados,
      ]
    }

    return [
      {
        color: 'orange',
        label: 'Atendimentos Recorrentes',
        value: s.recorrentes.toLocaleString('pt-BR'),
        sub: `${media} por dia em média`,
      },
      {
        color: 'blue',
        label: 'Revendedores Ativos',
        value: String(s.revendedoresAtivos),
        sub: 'no período selecionado',
      },
      kpiEstados,
    ]
  })

  return { stats, kpis }
}
