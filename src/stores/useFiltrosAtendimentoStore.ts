import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { AtendimentoFiltro, Atendimento } from '@/types/Atendimento'

function filtroInicial(): AtendimentoFiltro {
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() // 0-indexed

  const ano = curMonth === 0 ? String(curYear - 1) : String(curYear)
  const prevMonth = curMonth === 0 ? 12 : curMonth
  const mes = `${ano}-${String(prevMonth).padStart(2, '0')}`

  return { ano, mes, status: 'Todos' }
}

export const useFiltrosAtendimentoStore = defineStore('filtros-atendimento', () => {
  const filtro = reactive<AtendimentoFiltro>(filtroInicial())

  function atualizar<K extends keyof AtendimentoFiltro>(chave: K, valor: AtendimentoFiltro[K]): void {
    filtro[chave] = valor
    if (chave === 'ano') {
      filtro.mes = 'Todos'
    }
  }

  function limpar(): void {
    Object.assign(filtro, filtroInicial())
  }

  function ajustarParaDados(atendimentos: Atendimento[]): void {
    if (!atendimentos.length) return
    if (atendimentos.some((a) => a.ym === filtro.mes)) return

    const yms = [...new Set(atendimentos.map((a) => a.ym))].sort()
    const ultimoYm = yms[yms.length - 1]
    const [ano] = ultimoYm.split('-')
    filtro.ano = ano
    filtro.mes = ultimoYm
  }

  return { filtro, atualizar, limpar, ajustarParaDados }
})
