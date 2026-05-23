<script setup lang="ts">
import FileUpload from '@/components/shared/FileUpload.vue'
import { useExcelUpload } from '@/composables/useExcelUpload'

const { carregar, carregando, erro } = useExcelUpload()
</script>

<template>
  <section class="flex items-center justify-center min-h-screen relative z-10">
    <div class="text-center animate-fade-up">
      <div class="font-mono text-lg font-bold tracking-[4px] uppercase mb-1 text-accent-light">
        Atendimento Técnico
      </div>
      <h1 class="font-mono text-[46px] font-bold tracking-[-2px] mb-2 bg-gradient-to-br from-accent-light to-jet-cyan bg-clip-text text-transparent">
        JETINK
      </h1>
      <p class="text-text-muted text-sm mb-12 tracking-[3px] uppercase">
        Dashboard de Atendimentos
      </p>
      <FileUpload :loading="carregando" :error="erro" @file="carregar" />
    </div>
  </section>
</template>
