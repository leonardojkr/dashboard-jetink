import { ref } from 'vue'
import { defineStore } from 'pinia'

export type TipoMapa = 'sublimador' | 'revenda'

export const useMapaFiltroStore = defineStore('mapa-filtro', () => {
  const tipo = ref<TipoMapa>('revenda')
  return { tipo }
})
