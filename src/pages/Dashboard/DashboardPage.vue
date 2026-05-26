<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import DashboardUploadScreen from './components/DashboardUploadScreen.vue'
import DashboardTopbar from './components/DashboardTopbar.vue'
import DashboardPrintHeader from './components/DashboardPrintHeader.vue'
import DashboardFiltros from './components/DashboardFiltros.vue'
import DashboardKpis from './components/DashboardKpis.vue'
import DashboardEvolucao from './components/DashboardEvolucao.vue'
import DashboardRanking from './components/DashboardRanking.vue'
import DashboardMapa from './components/DashboardMapa.vue'
import DashboardDonut from './components/DashboardDonut.vue'
import DashboardWeekday from './components/DashboardWeekday.vue'
import DashboardDistribuicao from './components/DashboardDistribuicao.vue'

const { temDados } = storeToRefs(useAtendimentosStore())
const { filtro } = storeToRefs(useFiltrosAtendimentoStore())
</script>

<template>
  <DashboardUploadScreen v-if="!temDados" />

  <div v-else>
    <DashboardTopbar />

    <main class="max-w-[1480px] mx-auto px-8 pt-7 pb-16">
      <DashboardPrintHeader />
      <DashboardFiltros />
      <DashboardKpis />
      <DashboardEvolucao />

      <div class="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[480px] gap-5 mb-7">
        <DashboardRanking />
        <DashboardMapa />
      </div>

      <div
        class="grid grid-cols-1 gap-5 mb-7"
        :class="{ 'lg:grid-cols-2': filtro.status === 'Todos' }"
      >
        <DashboardDonut />
        <DashboardWeekday />
      </div>

      <DashboardDistribuicao />
    </main>
  </div>
</template>
