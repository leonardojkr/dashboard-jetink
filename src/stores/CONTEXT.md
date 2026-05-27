# CONTEXT — stores

Fonte de verdade do estado. Dois stores Pinia, composition-style. Todo o app deriva daqui.

---

## Responsabilidade

- Manter em memória a lista de atendimentos importada do Excel.
- Manter o estado atual do filtro selecionado pelo usuário.
- Orquestrar mutações de forma previsível e atomizada.

**Não faz**: parsing, agregação, IO, formatação.

---

## Papel na arquitetura

Camada mais interna do app. Composables só leem via `storeToRefs`. Componentes nunca leem store diretamente, salvo exceções declaradas (`DashboardDonut`, `DashboardPrintHeader`, `DashboardTopbar` para `nomeArquivo`).

---

## Stores

### `useAtendimentosStore` (`useAtendimentosStore.ts`)

| Estado | Tipo | Inicial |
|---|---|---|
| `atendimentos` | `ref<Atendimento[]>` | `[]` |
| `nomeArquivo` | `ref<string \| null>` | `null` |

| Derivado | Tipo | Regra |
|---|---|---|
| `temDados` | `computed<boolean>` | `atendimentos.value.length > 0` |
| `total` | `computed<number>` | `atendimentos.value.length` |

| API | Assinatura | Comportamento |
|---|---|---|
| `setAtendimentos` | `(items, fileName?)` | Substitui array e nome do arquivo |
| `limpar` | `()` | Zera array e nome |

### `useFiltrosAtendimentoStore` (`useFiltrosAtendimentoStore.ts`)

| Estado | Tipo | Regra |
|---|---|---|
| `filtro` | `reactive<AtendimentoFiltro>` | Inicializa com `filtroInicial()` |

```
interface AtendimentoFiltro {
  ano: string     // 'YYYY' ou 'Todos'
  mes: string     // 'YYYY-MM' ou 'Todos'
  status: 'Todos' | 'Novo' | 'Recorrente'
}
```

| API | Assinatura | Comportamento |
|---|---|---|
| `atualizar` | `(chave, valor)` | Seta `filtro[chave]`; se `chave === 'ano'` → força `filtro.mes = 'Todos'` |
| `limpar` | `()` | `Object.assign(filtro, filtroInicial())` |
| `ajustarParaDados` | `(atendimentos)` | Snap inteligente do filtro para o último ym do dataset, se o atual não existir |

---

## Fluxos principais

### Boot do filtro — `filtroInicial()`

Retorna o **mês anterior** ao atual:
- Janeiro → `ano = anoCorrente − 1`, `mes = 'YYYY-12'` do ano anterior.
- Demais meses → `ano = anoCorrente`, `mes = '{ano}-{mêsAtual−1}'`.
- `status` sempre `'Todos'`.

### Atualização — `atualizar('ano', valor)`
Reset implícito de `mes` para `'Todos'` toda vez que o ano muda. Garantia anti-inconsistência.

### Snap pós-upload — `ajustarParaDados(items)`
1. `items.length === 0` → no-op.
2. Se existe atendimento com `ym === filtro.mes` → mantém filtro atual.
3. Caso contrário → snapa `filtro.ano` e `filtro.mes` para o último `ym` ordenado do dataset, **mutação direta** (não passa por `atualizar()` para não disparar reset de mês).

### Limpeza — `limpar()`
Ambos os stores expõem `limpar()`. `useExcelUpload.reset()` chama os dois em sequência. Adicionar campo novo em qualquer store exige refletir em `limpar()`.

---

## Dependências reais

| Store | Importa | Propósito |
|---|---|---|
| `useAtendimentosStore` | `vue`, `pinia`, `types/Atendimento` | Estado e contrato |
| `useFiltrosAtendimentoStore` | `vue`, `pinia`, `types/Atendimento` | Estado e contrato |

Sem dependência de composables, services ou componentes. Stores são folhas.

---

## Invariantes obrigatórias

1. **`'Todos'` é sentinel literal** em `ano`, `mes` e `status`. Nunca substituir por `null`/`undefined` — quebra todos os composables consumidores.
2. **Mudança de `ano` reseta `mes`** — garantida em `atualizar`. Nunca mutar `filtro` direto de fora.
3. **`ajustarParaDados` muta `ano`/`mes` direto** — intencional. Único caminho que pode pular o reset de `atualizar`.
4. **`setAtendimentos` substitui, não acumula**. Importar nova planilha apaga a anterior.
5. **`limpar()` reflete todos os campos do store**. Adicionar campo → atualizar `limpar`.
6. **Stores são consumidos via `storeToRefs`** para preservar reatividade. Acessar `store.atendimentos.value` direto fora de `storeToRefs` rompe destruct seguro.

---

## Acoplamentos críticos

- **`useExcelUpload` orquestra ambos em ordem rígida**: lê arquivo → valida → `filtros.limpar()` → `setAtendimentos()` → `filtros.ajustarParaDados()`. Não reordenar.
- **`useAtendimentos`** combina os dois via `storeToRefs` — porta canônica para UI.
- **`useAtendimentoFilters`** combina os dois para expor `anos`/`meses` derivados + estado do filtro para a UI.
- **`useEvolucao`** usa `storeToRefs(useAtendimentosStore())` diretamente (dataset completo, sem filtro — intencional).
- **`DashboardDonut` e `DashboardPrintHeader`** leem `filtro` direto via `storeToRefs(useFiltrosAtendimentoStore())` (exceção aceita para renderização condicional/label).

---

## Convenções implícitas

- Composition-style (`defineStore(id, () => {...})`) — não Options API.
- `ref` para valores primitivos/arrays substituíveis. `reactive` para objeto cujo identity é estável (filtro).
- Funções de mutação ficam dentro do store, não em utilitários externos.

---

## Limitações reais

- **Sem persistência** (localStorage, sessionStorage). Reload = reset.
- **Sem histórico/undo**: substituição é destrutiva.
- **Sem versão concorrente**: cada upload sobrescreve completamente.

---

## Hotspots

- **`ajustarParaDados` ordena os ym a cada chamada** — barato (set + sort no tamanho dos meses), mas executa em todo upload.
- **`atualizar('ano', ...)` com o mesmo ano já selecionado** ainda força `mes = 'Todos'`. Comportamento aceito.

---

## Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Persistir stores em localStorage sem decisão de produto | Reload deixa de ser reset deliberado |
| Criar terceiro store | Os dois cobrem o domínio completo hoje |
| Mutar `filtro` direto de fora | Bypassa reset de `mes` ao mudar `ano` |
| Retornar `filtro` como `ref` cru | É `reactive` — usar `storeToRefs` |
| Acumular atendimentos em `setAtendimentos` | Quebra contrato de "fonte única por upload" |

---

## Regras de extensão

- **Novo campo de filtro** → adicionar em `AtendimentoFiltro`, em `filtroInicial()` e em consumidores (`useAtendimentos`).
- **Novo derivado simples** → `computed` dentro do store.
- **Novo derivado que cruza ambos os stores** → composable (`useAtendimentoFilters` é o modelo).
- **Lógica de side effect que toca os dois stores** → composable orquestrador (`useExcelUpload` é o modelo).

---

## Relação com outros módulos

```
useExcelUpload                    → muta ambos os stores
useAtendimentos                   → lê ambos via storeToRefs
useAtendimentoFilters             → lê ambos via storeToRefs
useEvolucao                       → lê useAtendimentosStore via storeToRefs (raw)
DashboardDonut, DashboardPrintHeader, DashboardTopbar → leem stores via storeToRefs (exceções declaradas)
```
