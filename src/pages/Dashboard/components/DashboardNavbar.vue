<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import DashboardFiltros from './DashboardFiltros.vue'
import { useScrollCompact } from '@/composables/useScrollCompact'
import { useDashboardActions } from '@/composables/useDashboardActions'

// Ponto de scroll (px) que ativa o estado compacto. Definido um pouco abaixo da
// altura do cabeçalho de marca (DashboardTopbar) para que o fundo glass termine
// de entrar quando a barra encosta no topo. Ajuste único e centralizado aqui.
const THRESHOLD = 56

const { isCompact } = useScrollCompact(THRESHOLD)
const { nomeArquivo, podeGerarRelatorio, reset, abrirModal } = useDashboardActions()

// Fecha o menu ao voltar para o estado completo (o gatilho deixa de existir).
const menuRef = ref<InstanceType<typeof BaseDropdown> | null>(null)
watch(isCompact, (compact) => {
  if (!compact) menuRef.value?.close()
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300"
    :class="isCompact ? 'border-border bg-[rgba(12,16,23,0.88)]' : 'border-transparent bg-transparent'"
    data-print="hide"
  >
    <div class="flex items-center max-w-[1480px] mx-auto px-8 py-5">
      <!-- Mesma instância dos filtros usada no estado completo -->
      <DashboardFiltros class="flex-1" />

      <!-- Menu de ações: só aparece (e ocupa espaço) no estado compacto -->
      <BaseDropdown
        ref="menuRef"
        class="shrink-0 transition-all duration-300 ease-out"
        :class="isCompact
          ? 'w-9 ml-3 opacity-100 overflow-visible'
          : 'w-0 ml-0 opacity-0 pointer-events-none overflow-hidden'"
      >
        <template #trigger="{ toggle, open }">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border bg-bg-elevated text-text-secondary transition-colors hover:text-text-primary hover:border-accent"
            :class="open ? 'border-accent text-text-primary' : 'border-border'"
            aria-label="Mais ações"
            @click="toggle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </template>

        <template #default="{ close }">
          <div
            v-if="nomeArquivo"
            class="flex items-center gap-1.5 px-3 py-2 text-xs text-text-secondary"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-jet-green animate-pulse-dot shrink-0" />
            <span class="truncate">{{ nomeArquivo }}</span>
          </div>
          <div v-if="nomeArquivo" class="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            @click="reset(); close()"
          >
            <span class="text-base leading-none">↻</span>
            Nova Planilha
          </button>

          <button
            type="button"
            role="menuitem"
            :disabled="!podeGerarRelatorio"
            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none"
            @click="abrirModal(); close()"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Gerar Relatório
          </button>
        </template>
      </BaseDropdown>
    </div>
  </header>
</template>
