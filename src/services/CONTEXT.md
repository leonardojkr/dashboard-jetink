# CONTEXT — services

Boundary de IO. Único fluxo de entrada externa: leitura de `.xlsx`.

## Fluxo

```
File (do <input type=file> ou drop)
  → readArrayBuffer (FileReader, Promise wrapper)
  → xlsx.read(uint8, { type: 'array', cellDates: true })
  → workbook.SheetNames[0] (APENAS primeira sheet)
  → utils.sheet_to_json<AtendimentoExcelRow>(sheet)
  → mapExcelRows (utils/excelMapper)
  → Atendimento[]
```

## Contrato Excel (rígido)

**Colunas exigidas pelo header da primeira sheet:**

| Coluna | Tipo esperado | Comportamento se ausente/inválido |
|---|---|---|
| `Data` | Date / number serial / string parseável | **Linha descartada silenciosamente** |
| `Status` | string contendo "rec" → Recorrente; resto → Novo | Vira `Novo` (default) |
| `Revendedor` | string | Vira `''` |
| `Estado` | string (UF ou nome — sistema não impõe) | Vira `''` |
| `Programa` | string | Vira `''` |
| `Impressora` | string | Vira `''` |

Strings `'--'` viram `''` (sentinel de "sem dado"). Definido em `excelMapper.cleanText`.

## Invariantes do parsing

1. **Apenas a primeira sheet é lida.** `workbook.SheetNames[0]`. Sheets adicionais são ignoradas. Se a planilha não tem aba → erro `'Planilha sem abas'`.
2. **`cellDates: true`** é obrigatório no `xlsx.read`. Sem isso, `Data` vem como número serial Excel e o parseDate falha.
3. **`parseDate`** aceita: `Date`, número (timestamp ou serial Excel já convertido), string parseável por `new Date()`. Inválido → linha descartada.
4. **`parseStatus`** é case-insensitive e checa **prefixo** `"rec"`. Aceita "Rec", "Recorrente", "RECORRENTE", "recurring" (sim, qualquer coisa começando com rec). Default → `Novo`.
5. **Campos derivados** (`iso`, `ym`, `year`, `dow`) são computados **uma única vez** aqui. Não recalcular em composables.
6. **Linhas inválidas são descartadas silenciosamente.** `mapExcelRows` apenas omite. `useExcelUpload` joga erro só se zero linhas válidas (mensagem "A planilha não contém registros válidos.").

## Riscos / dívida

- **Sem contagem de linhas descartadas.** Usuário sobe planilha com 1000 linhas, 200 inválidas, vê 800 sem aviso. **Dívida UX.** (Roadmap em AI_CONTEXT §16, prio P0.)
- **Sem validação de tamanho.** Arquivo de 50MB roda parsing na thread principal — UI congela.
- **Sem validação de schema.** Se as colunas vierem em inglês ("Date" em vez de "Data"), todas linhas viram inválidas (sem data) → erro genérico.
- **`xlsx` library tem CVEs históricos.** Versão 0.18.5 é antiga. Atualizar exige cuidado (algumas versões mudaram nome de export).
- **`sheet_to_json` ignora linhas vazias por padrão** mas tipos numéricos esquisitos (formula errors, datas malformadas) podem virar `undefined`/`NaN`.

## Quando mexer aqui

- **Mudar nome de coluna do Excel** → atualizar `AtendimentoExcelRow` (em `types/Atendimento.ts`) E `mapExcelRow` (em `utils/excelMapper.ts`). O service em si não muda.
- **Adicionar nova coluna** → mesmo combo. Adicionar campo em `Atendimento`, em `AtendimentoExcelRow`, e mapear em `mapExcelRow`.
- **Suportar múltiplas sheets** → mudança grande. Hoje só primeira é lida. Decidir produto antes.
- **Adicionar fonte alternativa (CSV, API)** → criar serviço irmão (`atendimentoServiceCsv.ts`) ou polimorfizar atrás de uma interface comum.

## Anti-patterns a evitar

- Adicionar lógica de negócio aqui. Service é fronteira **pura** de IO + parse. Regras (filtragem, agregação) vão em composables.
- Throw em parsing por linha. O contrato é: ignorar linha ruim, não derrubar lote.
- Logar `console.error` no parse. Erros sobem como `Error` jogado, capturados por `useExcelUpload`.
- Importar Pinia/composables aqui. Service não sabe que estado existe.

## Para IA agents

- Não trocar `xlsx` por outra lib sem checar todos os call sites e o cellDates behaviour.
- Não mudar `parseStatus` para regex/lookup table sem confirmar que "Rec...", "rec...", "REC..." continuam funcionando — é a única lógica de classificação de status no sistema.
- Não introduzir `await` no laço de `mapExcelRows`. Hoje é síncrono — preserva.
