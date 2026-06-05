<script setup lang="ts">
import { computed } from 'vue'
import { useRelatorioStore } from '@/stores/useRelatorioStore'
import { useDistribuicao } from '@/composables/useDistribuicao'
import HBarList from '@/components/shared/HBarList.vue'
import RelatorioPrintCard from './RelatorioPrintCard.vue'

const relatorioStore = useRelatorioStore()

const { impressoras, programas, interestaduais, estadosRevenda, estadosSubli } = useDistribuicao(3)

const showImpressoras    = computed(() => !!relatorioStore.printFiltros?.['impressoras'])
const showProgramas      = computed(() => !!relatorioStore.printFiltros?.['programas'])
const showInterestaduais = computed(() => !!relatorioStore.printFiltros?.['interestaduais'])
const showEstadosRevenda = computed(() => !!relatorioStore.printFiltros?.['estadosRevenda'])
const showEstadosSubli   = computed(() => !!relatorioStore.printFiltros?.['estadosSubli'])
const showSection = computed(() =>
  showImpressoras.value || showProgramas.value || showInterestaduais.value ||
  showEstadosRevenda.value || showEstadosSubli.value
)

const colCount = computed(() =>
  [showImpressoras.value, showProgramas.value, showInterestaduais.value, showEstadosRevenda.value, showEstadosSubli.value]
    .filter(Boolean).length
)
const gridClass = computed(() => ({
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}[colCount.value] ?? 'grid-cols-5'))
</script>

<template>
  <section v-if="showSection" class="mt-2">
    <div class="grid gap-2" :class="gridClass">
      <RelatorioPrintCard v-if="showImpressoras" title="Impressoras">
        <HBarList :items="impressoras" tone="cyan" compact />
      </RelatorioPrintCard>

      <RelatorioPrintCard v-if="showProgramas" title="Programas">
        <HBarList :items="programas" tone="accent" compact />
      </RelatorioPrintCard>

      <RelatorioPrintCard v-if="showInterestaduais" title="Interestaduais">
        <HBarList :items="interestaduais" tone="green" compact />
      </RelatorioPrintCard>

      <RelatorioPrintCard v-if="showEstadosRevenda" title="Est. Revenda">
        <HBarList :items="estadosRevenda" tone="cyan" compact />
      </RelatorioPrintCard>

      <RelatorioPrintCard v-if="showEstadosSubli" title="Est. Sublimador">
        <HBarList :items="estadosSubli" tone="green" compact />
      </RelatorioPrintCard>
    </div>
  </section>
</template>
