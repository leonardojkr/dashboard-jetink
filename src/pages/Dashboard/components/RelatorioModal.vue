<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useRelatorioStore, type KpiRelatorioConfig } from '@/stores/useRelatorioStore'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useMapaFiltroStore } from '@/stores/useMapaFiltroStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'
import { computeRawStats, type Kpi } from '@/composables/useKpis'
import type { StatusFiltro } from '@/types/Atendimento'
import { MONTH_NAMES } from '@/utils/dateHelpers'

const router = useRouter()

const relatorioStore = useRelatorioStore()
const { atendimentos: todosAtendimentos } = storeToRefs(useAtendimentosStore())
const { tipo: tipoMapa } = storeToRefs(useMapaFiltroStore())
const { filtro: filtroGlobal } = storeToRefs(useFiltrosAtendimentoStore())

watch(() => relatorioStore.modalAberto, (aberto) => {
  document.body.style.overflow = aberto ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Novo', value: 'Novo' },
  { label: 'Recorrente', value: 'Recorrente' },
]

const periodoValido = computed(() => filtroGlobal.value.mes !== 'Todos')

const periodoLabel = computed(() => {
  const mes = filtroGlobal.value.mes
  if (mes === 'Todos') return null
  const [y, m] = mes.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
})

function filtrarAtendimentos(config: KpiRelatorioConfig) {
  const { ano, mes } = config.filtro
  const status = config.statusFixo ?? config.filtro.status
  return todosAtendimentos.value.filter((a) => {
    const okAno = ano === 'Todos' || a.year === ano
    const okMes = mes === 'Todos' || a.ym === mes
    const okStatus = status === 'Todos' || a.status === status
    return okAno && okMes && okStatus
  })
}

const previews = computed(() =>
  relatorioStore.kpisConfig.map((config) => {
    const stats = computeRawStats(filtrarAtendimentos(config), tipoMapa.value)
    const val = stats[config.statKey]
    return typeof val === 'number' ? val.toLocaleString('pt-BR') : String(val)
  }),
)

function buildKpiFromConfig(config: KpiRelatorioConfig, previewValue: string): Kpi {
  return {
    color: config.color,
    label: config.label,
    value: previewValue,
    sub: config.sub,
    badge: config.badge,
  }
}

const todosIncluidos = computed(() =>
  relatorioStore.kpisConfig.every((c) => c.incluido) &&
  relatorioStore.secoesConfig.every((c) => c.incluido),
)

function toggleTodos() {
  const novoValor = !todosIncluidos.value
  relatorioStore.kpisConfig.forEach((c) => { c.incluido = novoValor })
  relatorioStore.secoesConfig.forEach((c) => { c.incluido = novoValor })
}

const totalIncluidos = computed(
  () =>
    relatorioStore.kpisConfig.filter((c) => c.incluido).length +
    relatorioStore.secoesConfig.filter((c) => c.incluido).length,
)

const totalCards = computed(
  () => relatorioStore.kpisConfig.length + relatorioStore.secoesConfig.length,
)

function confirmarEGerar() {
  const kpis = relatorioStore.kpisConfig
    .filter((c) => c.incluido)
    .map((c) => buildKpiFromConfig(c, previews.value[relatorioStore.kpisConfig.indexOf(c)]))

  relatorioStore.setKpisParaImprimir(kpis)

  const filtrosMap: Record<string, import('@/types/Atendimento').AtendimentoFiltro> = {}
  for (const secao of relatorioStore.secoesConfig) {
    if (secao.incluido) {
      filtrosMap[secao.id] = {
        ...secao.filtro,
        ...(secao.statusFixo ? { status: secao.statusFixo } : {}),
      }
    }
  }
  relatorioStore.setPrintFiltros(filtrosMap)
  relatorioStore.setPrintPeriodo(periodoLabel.value ?? 'Todos os períodos')
  relatorioStore.fecharModal()
  router.push({ name: 'relatorio' })
}

const colorValueClass: Record<Kpi['color'], string> = {
  purple: 'text-accent-light',
  green: 'text-jet-green',
  orange: 'text-jet-orange',
  blue: 'text-jet-blue',
  pink: 'text-jet-pink',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="relatorioStore.modalAberto"
      class="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="relatorioStore.fecharModal()"
      />

      <div
        class="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-bg-card border border-border rounded-2xl shadow-2xl mx-4"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div class="font-semibold text-text-primary text-sm">Configurar Relatório</div>
            <div class="text-xs text-text-muted mt-0.5">
              <template v-if="periodoLabel">
                Período:
                <span class="font-medium text-text-secondary">{{ periodoLabel }}</span>
              </template>
              <template v-else>
                <span class="text-jet-orange">Selecione um mês no dashboard para gerar o relatório</span>
              </template>
            </div>
          </div>
          <button
            class="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
            @click="relatorioStore.fecharModal()"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Select all bar -->
        <div
          class="flex items-center justify-between px-6 py-2 border-b border-border/50 bg-bg-elevated/20 shrink-0"
        >
          <span class="text-xs text-text-muted">{{ totalIncluidos }} de {{ totalCards }} itens</span>
          <button
            type="button"
            class="text-xs font-medium text-accent-light hover:opacity-75 transition-opacity"
            @click="toggleTodos"
          >
            {{ todosIncluidos ? 'Desmarcar todos' : 'Selecionar todos' }}
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="overflow-y-auto px-6 py-4 space-y-3">
          <!-- KPI section -->
          <p class="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Indicadores KPI
          </p>

          <div
            v-for="(config, i) in relatorioStore.kpisConfig"
            :key="config.id"
            :class="[
              'border rounded-xl p-4 transition-all',
              config.incluido
                ? 'border-border bg-bg-elevated'
                : 'border-border/40 bg-bg-elevated/20 opacity-50',
            ]"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="config.incluido"
                class="w-4 h-4 rounded cursor-pointer accent-violet-500 shrink-0"
                @change="config.incluido = ($event.target as HTMLInputElement).checked"
              />
              <span class="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted flex-1">
                {{ config.label }}
              </span>
              <span class="font-mono text-xl font-bold" :class="colorValueClass[config.color]">
                {{ previews[i] }}
              </span>
            </div>

            <!-- KPIs de total: sem filtro de status. Outros KPIs: seletor de status. -->
            <div
              v-if="config.incluido && !config.statusFixo"
              class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/40"
            >
              <BaseSelect
                :model-value="config.filtro.status"
                :options="statusOptions"
                label="Status"
                @update:model-value="config.filtro.status = $event as StatusFiltro"
              />
            </div>
          </div>

          <!-- Visual sections -->
          <p class="text-[10px] font-bold uppercase tracking-widest text-text-muted pt-2">
            Seções Visuais
          </p>

          <div
            v-for="config in relatorioStore.secoesConfig"
            :key="config.id"
            :class="[
              'border rounded-xl p-4 transition-all',
              config.incluido
                ? 'border-border bg-bg-elevated'
                : 'border-border/40 bg-bg-elevated/20 opacity-50',
            ]"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="config.incluido"
                class="w-4 h-4 rounded cursor-pointer accent-violet-500 shrink-0"
                @change="config.incluido = ($event.target as HTMLInputElement).checked"
              />
              <span class="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted flex-1">
                {{ config.label }}
              </span>
            </div>

            <div
              v-if="config.incluido"
              class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/40"
            >
              <!-- Status locked for Novo vs Recorrente; normal dropdown for others -->
              <BaseSelect
                v-if="config.statusFixo"
                :model-value="config.statusFixo"
                :options="[{ label: config.statusFixo, value: config.statusFixo }]"
                :disabled="true"
                label="Status"
              />
              <BaseSelect
                v-else
                :model-value="config.filtro.status"
                :options="statusOptions"
                label="Status"
                @update:model-value="config.filtro.status = $event as StatusFiltro"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <BaseButton variant="secondary" @click="relatorioStore.fecharModal()">Cancelar</BaseButton>
          <BaseButton
            variant="accent"
            :disabled="totalIncluidos === 0 || !periodoValido"
            @click="confirmarEGerar"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Confirmar e Gerar
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
