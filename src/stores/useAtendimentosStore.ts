import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Atendimento } from '@/types/Atendimento'

export const useAtendimentosStore = defineStore('atendimentos', () => {
  const atendimentos = ref<Atendimento[]>([])
  const nomeArquivo = ref<string | null>(null)

  const temDados = computed(() => atendimentos.value.length > 0)
  const total = computed(() => atendimentos.value.length)

  function setAtendimentos(items: Atendimento[], fileName: string | null = null): void {
    atendimentos.value = items
    nomeArquivo.value = fileName
  }

  function limpar(): void {
    atendimentos.value = []
    nomeArquivo.value = null
  }

  return {
    atendimentos,
    nomeArquivo,
    temDados,
    total,
    setAtendimentos,
    limpar,
  }
})
