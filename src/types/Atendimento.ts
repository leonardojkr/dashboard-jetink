export type AtendimentoStatus = 'Novo' | 'Recorrente'
export type StatusFiltro = AtendimentoStatus | 'Todos'

export interface AtendimentoExcelRow {
  Data?: Date | string | number
  Status?: string
  Revendedor?: string
  Estado?: string
  Programa?: string
  Impressora?: string
  [key: string]: unknown
}

export interface Atendimento {
  data: Date
  iso: string
  ym: string
  year: string
  dow: number
  status: AtendimentoStatus
  revendedor: string
  estado: string
  programa: string
  impressora: string
}

export interface AtendimentoFiltro {
  ano: string
  mes: string
  status: StatusFiltro
}
