<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useEvolucao } from '@/composables/useEvolucao'

const { resultado } = useEvolucao()
</script>

<template>
  <BaseCard title="Evolução Mensal" :count="resultado.tag ?? undefined" class="mb-7 animate-fade-up" data-print="hide">
    <BaseChart v-if="resultado.option && resultado.hasData" :option="resultado.option" height="220px" />
    <EmptyState v-else title="Sem dados no período selecionado" />
  </BaseCard>
</template>
