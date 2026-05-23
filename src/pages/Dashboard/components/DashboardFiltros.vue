<script setup lang="ts">
import { computed } from 'vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import { useAtendimentoFilters } from '@/composables/useAtendimentoFilters'
import { formatMonth } from '@/utils/dateHelpers'
import type { StatusFiltro } from '@/types/Atendimento'

const { filtro, anos, meses, atualizar } = useAtendimentoFilters()

const optAnos = computed(() => [
  { label: 'Todos os Anos', value: 'Todos' },
  ...anos.value.map((y) => ({ label: y, value: y })),
])

const optMeses = computed(() => [
  { label: 'Todos os Meses', value: 'Todos' },
  ...meses.value.map((m) => ({ label: formatMonth(m), value: m })),
])

const statusTabs: { label: string; value: StatusFiltro }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Novos', value: 'Novo' },
  { label: 'Recorrentes', value: 'Recorrente' },
]
</script>

<template>
  <div class="flex items-center gap-4 flex-wrap mb-7" data-print="hide">
    <BaseSelect
      label="Ano"
      :model-value="filtro.ano"
      :options="optAnos"
      @update:model-value="(v) => atualizar('ano', v)"
    />
    <BaseSelect
      label="Mês"
      :model-value="filtro.mes"
      :options="optMeses"
      :disabled="filtro.ano === 'Todos'"
      @update:model-value="(v) => atualizar('mes', v)"
    />
    <BaseTabs
      class="ml-auto"
      :model-value="filtro.status"
      :tabs="statusTabs"
      @update:model-value="(v) => atualizar('status', v)"
    />
  </div>
</template>
