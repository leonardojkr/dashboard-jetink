<script setup lang="ts">
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useAtendimentoFilters } from '@/composables/useAtendimentoFilters'
import { useExcelUpload } from '@/composables/useExcelUpload'

const { nomeArquivo } = storeToRefs(useAtendimentosStore())
const { podeGerarRelatorio } = useAtendimentoFilters()
const { reset } = useExcelUpload()

function imprimir(): void {
  window.print()
}
</script>

<template>
  <header
    class="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 px-8 py-3 bg-[rgba(12,16,23,0.88)] backdrop-blur-xl border-b border-border"
    data-print="hide"
  >
    <div class="flex items-center gap-3.5">
      <div>
        <div class="font-mono text-[10px] font-bold tracking-[2.5px] uppercase text-text-muted leading-none">
          Atendimento Técnico
        </div>
        <div class="font-mono text-xl font-bold tracking-[-1px] leading-tight bg-gradient-to-br from-accent-light to-jet-cyan bg-clip-text text-transparent">
          JETINK
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <span
        v-if="nomeArquivo"
        class="flex items-center gap-1.5 px-3.5 py-1.5 bg-bg-elevated rounded-full text-xs text-text-secondary border border-border"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-jet-green animate-pulse-dot" />
        {{ nomeArquivo }}
      </span>
      <BaseButton variant="secondary" @click="reset">↻ Nova Planilha</BaseButton>
      <BaseButton variant="accent" :disabled="!podeGerarRelatorio" @click="imprimir">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Gerar Relatório
      </BaseButton>
    </div>
  </header>
</template>
