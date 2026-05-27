<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import { useGraficosResumo } from '@/composables/useGraficosResumo'

const { weekdayOption } = useGraficosResumo()
</script>

<template>
  <BaseCard title="Atendimentos por Dia da Semana" class="animate-fade-up">
    <BaseChart :option="weekdayOption" height="180px" />
  </BaseCard>
</template>
