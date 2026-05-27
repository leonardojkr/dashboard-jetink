<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useGraficosResumo } from '@/composables/useGraficosResumo'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'

const { donutOption, donutData } = useGraficosResumo()
const { filtro } = storeToRefs(useFiltrosAtendimentoStore())

function pct(value: number): string {
  if (!donutData.value.total) return '0'
  return ((value / donutData.value.total) * 100).toFixed(1)
}

const legenda = computed(() => [
  { color: 'bg-jet-green', label: 'Novos', value: donutData.value.novos, pct: pct(donutData.value.novos) },
  { color: 'bg-jet-orange', label: 'Recorrentes', value: donutData.value.rec, pct: pct(donutData.value.rec) },
])
</script>

<template>
  <BaseCard v-if="filtro.status === 'Todos'" title="Novo vs Recorrente" class="animate-fade-up">
    <div v-if="donutOption" class="flex items-center gap-8 justify-center">
      <BaseChart :option="donutOption" height="180px" class="!w-[180px]" />
      <ul class="flex flex-col gap-2.5">
        <li
          v-for="item in legenda"
          :key="item.label"
          class="flex items-center gap-2.5 text-[13px] text-text-secondary"
        >
          <span :class="['w-3 h-3 rounded', item.color]" />
          {{ item.label }}
          <span class="font-mono font-bold text-text-primary ml-3">
            {{ item.value }} ({{ item.pct }}%)
          </span>
        </li>
      </ul>
    </div>
    <EmptyState v-else title="Sem dados" />
  </BaseCard>
</template>
