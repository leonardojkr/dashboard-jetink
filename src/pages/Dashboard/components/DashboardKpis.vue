<script setup lang="ts">
import { computed } from 'vue'
import KpiCard from '@/components/shared/KpiCard.vue'
import { useKpis } from '@/composables/useKpis'

const { kpis } = useKpis()

const gridCols = computed(() =>
  kpis.value.length === 5
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
)
</script>

<template>
  <section :class="['grid gap-5 mb-7', gridCols]">
    <KpiCard v-for="(kpi, i) in kpis" :key="kpi.label" :kpi="kpi" :delay="i + 1" />
  </section>
</template>
