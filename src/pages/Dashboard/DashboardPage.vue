<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import DashboardUploadScreen from './components/DashboardUploadScreen.vue'
import DashboardTopbar from './components/DashboardTopbar.vue'
import DashboardNavbar from './components/DashboardNavbar.vue'
import DashboardPrintHeader from './components/DashboardPrintHeader.vue'
import DashboardKpis from './components/DashboardKpis.vue'
import DashboardEvolucao from './components/DashboardEvolucao.vue'
import DashboardRanking from './components/DashboardRanking.vue'
import DashboardMapa from './components/DashboardMapa.vue'
import DashboardDonut from './components/DashboardDonut.vue'
import DashboardWeekday from './components/DashboardWeekday.vue'
import DashboardDistribuicao from './components/DashboardDistribuicao.vue'
import RelatorioModal from './components/RelatorioModal.vue'

const { temDados } = storeToRefs(useAtendimentosStore())
const { filtro } = storeToRefs(useFiltrosAtendimentoStore())
</script>

<template>
  <DashboardUploadScreen v-if="!temDados" />

  <div v-else>
    <RelatorioModal />
    <DashboardTopbar />
    <DashboardNavbar />

    <main class="max-w-[1480px] mx-auto px-8 pt-2 pb-16">
      <DashboardPrintHeader />
      <DashboardKpis />
      <DashboardEvolucao />

      <div class="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[480px] gap-5 mb-7">
        <div data-secao="ranking" class="h-full min-h-0"><DashboardRanking /></div>
        <div data-secao="mapa" class="h-full min-h-0"><DashboardMapa /></div>
      </div>

      <div
        class="grid grid-cols-1 gap-5 mb-7"
        :class="{ 'lg:grid-cols-2': filtro.status === 'Todos' }"
      >
        <div data-secao="donut"><DashboardDonut /></div>
        <div data-secao="weekday"><DashboardWeekday /></div>
      </div>

      <DashboardDistribuicao />
    </main>
  </div>
</template>
