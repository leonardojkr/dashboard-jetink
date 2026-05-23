<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import DashboardUploadScreen from './components/DashboardUploadScreen.vue'
import DashboardTopbar from './components/DashboardTopbar.vue'
import DashboardPrintHeader from './components/DashboardPrintHeader.vue'
import DashboardFiltros from './components/DashboardFiltros.vue'
import DashboardKpis from './components/DashboardKpis.vue'
import DashboardEvolucao from './components/DashboardEvolucao.vue'
import DashboardRanking from './components/DashboardRanking.vue'
import DashboardDonut from './components/DashboardDonut.vue'
import DashboardWeekday from './components/DashboardWeekday.vue'
import DashboardDistribuicao from './components/DashboardDistribuicao.vue'

const { temDados } = storeToRefs(useAtendimentosStore())
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        <DashboardRanking />
        <div class="flex flex-col gap-5">
          <DashboardDonut />
          <DashboardWeekday />
        </div>
      </div>

      <DashboardDistribuicao />
    </main>
  </div>
</template>
