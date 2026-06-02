<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import HBarList from '@/components/shared/HBarList.vue'
import { useDistribuicao } from '@/composables/useDistribuicao'

const { programas, impressoras, interestaduais } = useDistribuicao(3)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
    <BaseCard title="Programas" class="animate-fade-up" data-secao="programas">
      <HBarList :items="programas" tone="accent" />
    </BaseCard>
    <BaseCard title="Impressoras" class="animate-fade-up" data-secao="impressoras">
      <HBarList :items="impressoras" tone="cyan" />
    </BaseCard>
    <BaseCard title="Interestaduais" class="animate-fade-up" data-secao="interestaduais">
      <HBarList :items="interestaduais" tone="green" />
    </BaseCard>
  </div>
</template>
