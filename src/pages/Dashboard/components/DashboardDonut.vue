<script setup lang="ts">
import { storeToRefs } from 'pinia'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useGraficosResumo } from '@/composables/useGraficosResumo'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'

const { donutOption, donutData } = useGraficosResumo()
const { filtro } = storeToRefs(useFiltrosAtendimentoStore())

defineOptions({ name: 'DashboardDonut' })
</script>

<template>
  <BaseCard v-if="filtro.status === 'Todos'" title="Novo vs Recorrente" class="animate-fade-up">
    <div v-if="donutOption" class="flex items-center gap-8 justify-center">
      <BaseChart :option="donutOption" height="180px" class="!w-[180px]" />
      <ul class="flex flex-col gap-2.5">
        <li class="flex items-center gap-2.5 text-[13px] text-text-secondary">
          <span class="w-3 h-3 rounded bg-jet-green" />
          Novos
          <span class="font-mono font-bold text-text-primary ml-3">
            {{ donutData.novos }} ({{ donutData.total ? ((donutData.novos / donutData.total) * 100).toFixed(1) : '0' }}%)
          </span>
        </li>
        <li class="flex items-center gap-2.5 text-[13px] text-text-secondary">
          <span class="w-3 h-3 rounded bg-jet-orange" />
          Recorrentes
          <span class="font-mono font-bold text-text-primary ml-3">
            {{ donutData.rec }} ({{ donutData.total ? ((donutData.rec / donutData.total) * 100).toFixed(1) : '0' }}%)
          </span>
        </li>
      </ul>
    </div>
    <EmptyState v-else title="Sem dados" />
  </BaseCard>
</template>
