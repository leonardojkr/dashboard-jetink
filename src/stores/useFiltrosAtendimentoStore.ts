import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { AtendimentoFiltro } from '@/types/Atendimento'

function filtroInicial(): AtendimentoFiltro {
  return {
    ano: '2026',
    mes: 'Todos',
    status: 'Todos',
  }
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

  return { filtro, atualizar, limpar }
})
