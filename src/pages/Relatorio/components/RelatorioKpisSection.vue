<script setup lang="ts">
import { computed } from 'vue'
import KpiCard from '@/components/shared/KpiCard.vue'
import { useRelatorioStore } from '@/stores/useRelatorioStore'

const relatorioStore = useRelatorioStore()

const kpis = computed(() => relatorioStore.kpisParaImprimir ?? [])

const gridStyle = computed(() => {
  const count = kpis.value.length
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${count}, 1fr)`,
    gap: '12px',
  }
})
</script>

<template>
  <section>
    <div :style="gridStyle">
      <KpiCard v-for="kpi in kpis" :key="kpi.label" :kpi="kpi" :delay="0" />
    </div>
  </section>
</template>
