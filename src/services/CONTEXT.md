# CONTEXT — services

Boundary de IO. Único ponto de entrada de dados externos no sistema.

## Fluxo

```
File (do <input type=file> ou drop)
  → readArrayBuffer(file)          ← FileReader, Promise wrapper
  → xlsx.read(uint8, { type: 'array', cellDates: true })
  → workbook.SheetNames[0]         ← APENAS primeira aba
  → utils.sheet_to_json<AtendimentoExcelRow>(sheet)
  → mapExcelRows(rows)             ← em utils/excelMapper.ts
  → Atendimento[]
```

## Contrato Excel — colunas da primeira aba

| Coluna | Tipo esperado | Comportamento se ausente/inválido |
|---|---|---|
| `Data` | Date / number serial / string parseável | **Linha descartada silenciosamente** |
| `Status` | string com prefixo "rec" → Recorrente | Default → `'Novo'` |
| `Revendedor` | string | Vira `''` |
| `Estado` | string (texto livre) | Vira `''` |
| `Programa` | string | Vira `''` |
| `Impressora` | string | Vira `''` |
| `Estado Revenda` | string UF (ex: "SP") | `estadoUf`/`estadoNome` ficam `undefined` |

Strings `'--'` viram `''` via `cleanText`. Colunas ausentes também viram `''` (ou `undefined` para `Estado Revenda`).

## Invariantes

1. **`cellDates: true` é obrigatório** em `xlsx.read`. Sem isso, `Data` chega como número serial e `parseDate` falha.
2. **Apenas a primeira aba é lida**: `workbook.SheetNames[0]`. Abas adicionais são ignoradas. Sem abas → lança `'Planilha sem abas'`.
3. **Linhas sem `Data` válida são descartadas silenciosamente**. `mapExcelRow` retorna `null`; `mapExcelRows` omite.
4. **`mapExcelRows` é síncrono**. Não introduzir `await` no loop.
5. **Sem tratamento de linha inválida**: erros de parse por linha não são capturados — a linha é descartada. Só lança exceção no nível do arquivo.
6. **Zero linhas válidas**: não lança o service — é `useExcelUpload` que detecta e lança `'A planilha não contém registros válidos.'`.

## Responsabilidades do service

- Leitura do File via FileReader
- Parse do Excel via `xlsx`
- Delegação do mapeamento a `mapExcelRows`

**Não faz**: lógica de negócio, filtros, agregações, acesso a stores ou composables.

## Riscos

- **Sem validação de tamanho**: arquivo grande executa parsing na thread principal → UI congela.
- **Sem validação de schema**: colunas em inglês ("Date" em vez de "Data") → todas linhas descartadas → erro genérico "sem registros válidos".
- **Sem contagem de linhas descartadas**: planilha com linhas inválidas silencia o descarte.
- **`xlsx` 0.18.5** tem CVEs históricos. Atualizar exige verificar nomes de export (algumas versões mudaram).

## Quando modificar

- **Renomear coluna Excel** → atualizar `AtendimentoExcelRow` (em `types/Atendimento.ts`) E `mapExcelRow` (em `utils/excelMapper.ts`). O service não muda.
- **Adicionar coluna** → mesmo combo. Adicionar campo em `Atendimento`, em `AtendimentoExcelRow`, mapear em `mapExcelRow`.
- **Suportar múltiplas abas** → mudança grande. Hoje só a primeira é lida. Decisão de produto antes.
- **Adicionar fonte alternativa (CSV, API)** → criar serviço irmão ou polimorfizar atrás de interface.

## Proibições

- Não adicionar lógica de negócio aqui.
- Não usar `console.error` para erros de parse — erros sobem como `Error` capturado por `useExcelUpload`.
- Não importar Pinia, composables ou stores.
- Não trocar `xlsx` por outra lib sem checar todos os call sites e o comportamento de `cellDates`.
