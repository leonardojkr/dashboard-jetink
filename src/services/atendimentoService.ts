import { read, utils } from 'xlsx'
import { mapExcelRows } from '@/utils/excelMapper'
import type { Atendimento, AtendimentoExcelRow } from '@/types/Atendimento'

async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsArrayBuffer(file)
  })
}

async function lerArquivo(file: File): Promise<Atendimento[]> {
  const buffer = await readArrayBuffer(file)
  const workbook = read(new Uint8Array(buffer), { type: 'array', cellDates: true })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Planilha sem abas')

  const sheet = workbook.Sheets[sheetName]
  const rows = utils.sheet_to_json<AtendimentoExcelRow>(sheet)

  return mapExcelRows(rows)
}

export const atendimentoService = {
  lerArquivo,
}
