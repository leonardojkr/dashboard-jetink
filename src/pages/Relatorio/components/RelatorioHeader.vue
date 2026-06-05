<script setup lang="ts">
import { computed } from 'vue'
import { useRelatorioStore } from '@/stores/useRelatorioStore'

const relatorioStore = useRelatorioStore()

const periodoLabel = computed(() => relatorioStore.printPeriodo ?? 'Todos os períodos')
</script>

<template>
  <header class="flex items-center justify-between mb-3 pb-2 border-b border-[#2a3142]">
    <div class="text-[11px] font-semibold text-[#c8d0e8]">
      Relatório de Atendimento
    </div>
    <div class="text-[11px] font-semibold text-[#c8d0e8]">
      {{ periodoLabel }}
    </div>
  </header>
</template>
