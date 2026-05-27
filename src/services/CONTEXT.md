# CONTEXT — services

Boundary de IO. Único ponto de entrada de dados externos no sistema.

---

## Responsabilidade

- Ler arquivos `.xlsx` enviados pelo usuário.
- Delegar parse e mapeamento ao `utils/excelMapper`.
- Devolver `Atendimento[]` pronto para os stores.

**Não faz**: lógica de negócio, filtros, agregações, acesso a stores ou composables.

---

## Papel na arquitetura

Fronteira entre o mundo externo (arquivos do usuário) e o domínio em memória. Único módulo autorizado a invocar `xlsx`. Tudo a partir daqui já trabalha com `Atendimento` tipado.

---

## Fluxo principal — `lerArquivo(file)`

```
File (de <input type=file> ou drop)
  → readArrayBuffer(file)                                 ← FileReader, Promise wrapper
  → xlsx.read(uint8, { type: 'array', cellDates: true })
  → workbook.SheetNames[0]                                ← APENAS primeira aba (lança se ausente)
  → utils.sheet_to_json<AtendimentoExcelRow>(sheet)
  → mapExcelRows(rows)                                    ← em utils/excelMapper.ts
  → Atendimento[]
```

---

## Contrato Excel — colunas da primeira aba

| Coluna | Tipo esperado | Comportamento se ausente / inválido |
|---|---|---|
| `Data` | Date / number serial / string parseável | **Linha descartada silenciosamente** |
| `Status` | string com prefixo "rec" → Recorrente | Default → `'Novo'` |
| `Revendedor` | string | Vira `''` |
| `Estado` | string (texto livre) | Vira `''` |
| `Programa` | string | Vira `''` |
| `Impressora` | string | Vira `''` |
| `Estado Revenda` *(ou `Estado Revendedor` como alias)* | string UF (ex: "SP") | `estadoUf`/`estadoNome` ficam `undefined` |

Strings `'--'` viram `''` via `cleanText`. Colunas ausentes também viram `''` (ou `undefined` no caso de Estado Revenda).

---

## Dependências reais

| Dependência | Tipo | Uso |
|---|---|---|
| `xlsx` | runtime | `read`, `utils.sheet_to_json` |
| `utils/excelMapper` | módulo | `mapExcelRows` |
| `types/Atendimento` | tipos | `Atendimento`, `AtendimentoExcelRow` |

Sem dependência de Pinia, composables, Vue ou stores. Service é arquitetura-mente puro.

---

## Invariantes obrigatórias

1. **`cellDates: true` é obrigatório em `xlsx.read`**. Sem isso, `Data` chega como número serial e `parseDate` falha.
2. **Apenas a primeira aba é lida** (`workbook.SheetNames[0]`). Sem abas → lança `'Planilha sem abas'`. Abas adicionais ignoradas.
3. **Linhas sem `Data` válida são descartadas silenciosamente**. `mapExcelRow` retorna `null`; `mapExcelRows` omite.
4. **`mapExcelRows` é síncrono**. Não introduzir `await` no loop.
5. **Sem tratamento de linha inválida**: erros de parse por linha não são capturados — a linha é descartada. O service só lança no nível do arquivo (FileReader / sem abas).
6. **Validação de "zero linhas válidas" é responsabilidade de `useExcelUpload`**, não do service.

---

## Acoplamentos críticos

- **`xlsx` ↔ contrato de colunas**: trocar SheetJS exige reverificar `read`, `cellDates` e `sheet_to_json`.
- **`AtendimentoExcelRow` ↔ schema Excel**: renomear coluna na planilha exige atualizar o tipo + `mapExcelRow`.
- **Service ↔ `useExcelUpload`**: única chamada de produção. Não há outro consumidor.

---

## Convenções implícitas

- Erros sobem como `Error` puro. Quem chama formata mensagem.
- Função `readArrayBuffer` mantida separada para ser substituível por mock em teste futuro.
- `lerArquivo` é exportado dentro do objeto `atendimentoService` — facilita stub.

---

## Limitações reais

- **Sem validação de tamanho**: arquivo grande executa parsing na thread principal → UI congela.
- **Sem validação de schema**: colunas em inglês ("Date" em vez de "Data") → todas as linhas descartadas → erro genérico "sem registros válidos".
- **Sem contagem de descartes**: planilhas com linhas inválidas silenciam o descarte.
- **Sem suporte a múltiplas abas**: hoje só a primeira é lida.

---

## Hotspots

- **`xlsx@0.18.5`**: tem CVEs históricos. Atualizar exige checar nomes de export e comportamento de `cellDates`.
- **`parseDate` permissivo**: aceita qualquer string parseável por `Date`. Strings como `'2024'` viram `2024-01-01` válido.

---

## Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Adicionar lógica de negócio aqui | Service deixa de ser boundary puro |
| `console.error` para erros de parse | Erros devem subir como `Error` |
| Importar Pinia, composables ou stores | Quebra direção de dependência |
| Trocar `xlsx` sem checar todos os call sites | Pode quebrar `cellDates` silenciosamente |
| Capturar erro e devolver `[]` | Mascara falha de leitura |

---

## Regras de extensão

- **Renomear coluna Excel** → atualizar `AtendimentoExcelRow` (em `types/Atendimento.ts`) E `mapExcelRow` (em `utils/excelMapper.ts`). O service não muda.
- **Adicionar coluna** → mesmo combo. Adicionar campo em `Atendimento`, em `AtendimentoExcelRow`, mapear em `mapExcelRow`.
- **Suportar múltiplas abas** → mudança grande. Decisão de produto antes.
- **Adicionar fonte alternativa (CSV, API)** → criar serviço irmão. Não polimorfizar dentro deste arquivo.

---

## Relação com outros módulos

```
useExcelUpload (composable)
  → atendimentoService.lerArquivo
       → utils/excelMapper.mapExcelRows
            → utils/estadoMap.getEstadoNome
```

Nenhum componente, store ou outro composable importa este módulo diretamente.
