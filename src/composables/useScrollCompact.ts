import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * Observa o scroll vertical da janela e indica quando a navbar deve entrar
 * em modo compacto (`scrollY > threshold`).
 *
 * O listener é `passive` e atualiza o estado dentro de um `requestAnimationFrame`
 * para evitar trabalho excessivo a cada evento de scroll.
 *
 * @param threshold Ponto de scroll (em px) que aciona o estado compacto.
 */
export function useScrollCompact(threshold: number): { isCompact: Ref<boolean> } {
  const isCompact = ref(false)
  let ticking = false

  function update(): void {
    isCompact.value = window.scrollY > threshold
    ticking = false
  }

  function onScroll(): void {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { isCompact }
}
