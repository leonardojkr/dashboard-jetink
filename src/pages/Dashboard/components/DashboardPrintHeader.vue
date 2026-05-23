<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { formatMonth } from '@/utils/dateHelpers'

const { filtro } = storeToRefs(useFiltrosAtendimentoStore())

const periodo = computed(() => {
  if (filtro.value.mes !== 'Todos') return formatMonth(filtro.value.mes)
  if (filtro.value.ano !== 'Todos') return filtro.value.ano
  return 'Todo o Período'
})

const dataGeracao = computed(() => {
  const now = new Date()
  const data = now.toLocaleDateString('pt-BR')
  const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `Gerado em ${data} às ${hora}`
})
</script>

<template>
  <header
    class="hidden print:flex justify-between items-end pb-1.5 border-b-2 border-accent mb-2 text-[8pt] text-zinc-600"
    data-print="show"
  >
    <div>
      <div class="font-mono text-[12pt] font-bold text-accent">Atendimento Técnico JETINK</div>
      <div class="text-[7.5pt] text-zinc-600 mt-0.5">Período: {{ periodo }}</div>
    </div>
    <div class="text-right leading-tight">
      <div>{{ dataGeracao }}</div>
      <div>Relatório de Atendimentos</div>
    </div>
  </header>
</template>
