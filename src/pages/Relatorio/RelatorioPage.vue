<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRelatorioStore } from '@/stores/useRelatorioStore'
import RelatorioHeader from './components/RelatorioHeader.vue'
import RelatorioKpisSection from './components/RelatorioKpisSection.vue'
import RelatorioEvolucao from './components/RelatorioEvolucao.vue'
import RelatorioGraficos from './components/RelatorioGraficos.vue'
import RelatorioDistribuicao from './components/RelatorioDistribuicao.vue'

const router = useRouter()
const relatorioStore = useRelatorioStore()

onMounted(() => {
  if (!relatorioStore.kpisParaImprimir) {
    router.replace({ name: 'dashboard' })
  }
})

onUnmounted(() => {
  relatorioStore.clearKpisParaImprimir()
  relatorioStore.clearPrintFiltros()
  relatorioStore.clearPrintTipoMapa()
  relatorioStore.clearPrintPeriodo()
  relatorioStore.clearSecoesConfig()
})
</script>

<template>
  <div class="relatorio-outer">
    <div class="relatorio-toolbar">
      <button class="relatorio-back-btn" @click="router.push({ name: 'dashboard' })">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Voltar ao Dashboard
      </button>
    </div>

    <div class="a4-sheet">
      <RelatorioHeader />
      <RelatorioKpisSection />
      <RelatorioEvolucao />
      <RelatorioGraficos />
      <RelatorioDistribuicao />
    </div>
  </div>
</template>

<style scoped>
.relatorio-outer {
  min-height: 100vh;
  background: #111827;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 48px;
  gap: 16px;
}

.relatorio-toolbar {
  width: 297mm;
  max-width: 100%;
  display: flex;
  align-items: center;
}

.relatorio-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #2a3142;
  background: #161d2e;
  color: #8899bb;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.relatorio-back-btn:hover {
  color: #c8d0e8;
  border-color: #4a5568;
}

@media print {
  .relatorio-toolbar {
    display: none;
  }
}

.a4-sheet {
  width: 297mm;
  min-height: 210mm;
  padding: 10mm 12mm;
  background: #0c1017;
  border: 1px solid #2a3142;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}
</style>
