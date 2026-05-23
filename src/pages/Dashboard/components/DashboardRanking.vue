<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import RankingList from '@/components/shared/RankingList.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useRanking } from '@/composables/useRanking'

const { top, titulo, totalRevendedores, mostrarDetalhe } = useRanking(5)
</script>

<template>
  <BaseCard
    :title="titulo"
    :count="`${totalRevendedores} revendedores`"
    class="animate-fade-up"
  >
    <RankingList v-if="top.length" :items="top" :show-detail="mostrarDetalhe" />
    <EmptyState v-else title="Sem revendedores registrados" />
  </BaseCard>
</template>
