export const UF_TO_ESTADO: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

export const ESTADO_TO_UF: Record<string, string> = Object.fromEntries(
  Object.entries(UF_TO_ESTADO).map(([uf, nome]) => [nome, uf]),
)

export function getEstadoNome(uf: string): string {
  return UF_TO_ESTADO[uf.toUpperCase()] ?? uf
}

export function getEstadoUF(nome: string): string {
  return ESTADO_TO_UF[nome] ?? nome
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const NOME_NORMALIZADO_TO_NOME: Record<string, string> = Object.fromEntries(
  Object.values(UF_TO_ESTADO).map((nome) => [normalizar(nome), nome]),
)

export function resolverNomeEstado(raw: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  const ufUpper = trimmed.toUpperCase()
  if (UF_TO_ESTADO[ufUpper]) return UF_TO_ESTADO[ufUpper]

  return NOME_NORMALIZADO_TO_NOME[normalizar(trimmed)]
}
