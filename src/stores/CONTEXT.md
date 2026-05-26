# CONTEXT — stores

Fonte de verdade do estado. Dois stores Pinia, composition-style. Todo o app deriva daqui.

## Stores

### `useAtendimentosStore` (`stores/useAtendimentosStore.ts`)

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

### `useFiltrosAtendimentoStore` (`stores/useFiltrosAtendimentoStore.ts`)

| Estado | Tipo | Regra |
|---|---|---|
| `filtro` | `reactive<AtendimentoFiltro>` | Inicializa com `filtroInicial()` |

```typescript
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
| `ajustarParaDados` | `(atendimentos)` | Snapa filtro para os dados disponíveis |

---

## Regras críticas

### 1. `filtroInicial()` retorna o mês anterior ao atual

```typescript
const curMonth = now.getMonth() // 0-indexed
const ano = curMonth === 0 ? String(curYear - 1) : String(curYear)
const prevMonth = curMonth === 0 ? 12 : curMonth   // 1-indexed
const mes = `${ano}-${String(prevMonth).padStart(2, '0')}`
// status: 'Todos'
```

- Janeiro → `mes = 'YYYY-12'` do ano anterior
- Demais → mês atual − 1, ano corrente
- `status` inicia sempre em `'Todos'`

### 2. Mudança de `ano` força `mes = 'Todos'`

```typescript
function atualizar(chave, valor) {
  filtro[chave] = valor
  if (chave === 'ano') filtro.mes = 'Todos'
}
```

Nunca mutar `filtro.ano` diretamente — usar `atualizar('ano', ...)` para herdar esse comportamento.

### 3. `ajustarParaDados` — snap inteligente do filtro

Chamada após `setAtendimentos`. Comportamento:

- `atendimentos.length === 0` → no-op
- `atendimentos.some(a => a.ym === filtro.mes)` → mantém filtro atual (dados existem para o período)
- Caso contrário → snapa para o último `ym` do dataset (`filtro.ano` e `filtro.mes` são atualizados diretamente)

**Importante**: mutação direta de `filtro.ano` e `filtro.mes` aqui é intencional — não passa por `atualizar()`, portanto não dispara o reset de mês.

### 4. `'Todos'` é sentinel literal

Em `filtro.ano`, `filtro.mes` e `filtro.status`. Consumidores fazem `if (filtro.X === 'Todos')` para pular aquela dimensão de filtro. **Não substituir por `null`/`undefined`** — quebraria todos os composables.

### 5. `limpar()` reflete todos os campos

`useExcelUpload.reset()` chama `limpar()` em ambos os stores. Adicionar campo novo a qualquer store exige atualizar `limpar()` correspondente, ou o reset fica inconsistente.

---

## Acoplamentos

- **`useExcelUpload` orquestra ambos em ordem rígida**: `filtros.limpar()` → `setAtendimentos()` → `filtros.ajustarParaDados()`. Não reordenar.
- **`useAtendimentos`** une os dois via `storeToRefs` — porta canônica para UI.
- **`useAtendimentoFilters`** combina os dois para expor `anos`/`meses` derivados + estado do filtro para a UI.
- **`useEvolucao`** usa `storeToRefs(useAtendimentosStore())` diretamente (dataset completo, intencionalmente sem filtro).

---

## Proibições

- Não persistir stores em `localStorage` sem decisão de produto. Hoje reload = reset deliberado.
- Não criar terceiro store sem necessidade clara. Os dois cobrem o domínio.
- Não mutar `filtro` diretamente de fora do store — usar `atualizar()`.
- Não retornar `filtro` como `ref` cru — é `reactive`. Acessar via `storeToRefs` ou `useAtendimentoFilters`.
