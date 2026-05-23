import { ref } from 'vue'
import { atendimentoService } from '@/services/atendimentoService'
import { useAtendimentosStore } from '@/stores/useAtendimentosStore'
import { useFiltrosAtendimentoStore } from '@/stores/useFiltrosAtendimentoStore'

export function useExcelUpload() {
  const atendimentosStore = useAtendimentosStore()
  const filtrosStore = useFiltrosAtendimentoStore()

  const carregando = ref(false)
  const erro = ref<string | null>(null)

  async function carregar(file: File): Promise<void> {
    carregando.value = true
    erro.value = null
    try {
      const atendimentos = await atendimentoService.lerArquivo(file)
      if (!atendimentos.length) {
        throw new Error('A planilha não contém registros válidos.')
      }
      filtrosStore.limpar()
      atendimentosStore.setAtendimentos(atendimentos, file.name)
    } catch (e) {
      erro.value = (e as Error).message ?? 'Falha ao processar arquivo'
    } finally {
      carregando.value = false
    }
  }

  function reset(): void {
    atendimentosStore.limpar()
    filtrosStore.limpar()
    erro.value = null
  }

  return { carregando, erro, carregar, reset }
}
