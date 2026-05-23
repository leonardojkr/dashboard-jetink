import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtendimentos } from './useAtendimentos'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'

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

  const stats = computed(() => {
    const data = atendimentos.value
    const total = data.length
    const novos = data.filter((a) => a.status === 'Novo').length
    const recorrentes = data.filter((a) => a.status === 'Recorrente').length

    const diasUnicos = new Set<string>()
    const revendedoresUnicos = new Set<string>()
    const estadosUnicos = new Set<string>()
    for (const a of data) {
      diasUnicos.add(a.iso)
      if (a.revendedor) revendedoresUnicos.add(a.revendedor)
      if (a.estado) estadosUnicos.add(a.estado)
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
        {
          color: 'pink',
          label: 'Estados Alcançados',
          value: String(s.estadosAlcancados),
          sub: 'cobertura nacional',
        },
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
        {
          color: 'pink',
          label: 'Estados Alcançados',
          value: String(s.estadosAlcancados),
          sub: 'cobertura nacional',
        },
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
      {
        color: 'pink',
        label: 'Estados Alcançados',
        value: String(s.estadosAlcancados),
        sub: 'cobertura nacional',
      },
    ]
  })

  return { stats, kpis }
}
