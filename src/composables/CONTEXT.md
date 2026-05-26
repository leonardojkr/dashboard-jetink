# CONTEXT — composables

View-model layer. Cada composable expõe `ref`s/`computed`s para a UI consumir. **Sem side effects** (exceto `useExcelUpload`).

## Mapa de dependências

```
useAtendimentos  ←─ porta única para dados filtrados
    ├── useKpis
    ├── useRanking
    ├── useDistribuicao  ←── usado por useGraficosResumo (weekday)
    └── (usado por componentes diretamente quando precisam de lista filtrada)

useEvolucao         ←─ usa storeToRefs direto dos dois stores (não passa por useAtendimentos)
useGraficosResumo   ←─ usa useAtendimentos + useDistribuicao

useAtendimentoFilters ←─ wrapper sobre useFiltrosAtendimentoStore (UI-friendly)
useExcelUpload        ←─ orquestra os dois stores na entrada de dados (único com side effect)
```

## Convenção obrigatória

- **`useAtendimentos()` é a única porta** para a lista filtrada. Todo composable derivado consome ela. Não filtrar `atendimentosStore.atendimentos` direto aqui.
  - **Exceção real**: `useEvolucao` opera sobre **todos** os dados (não filtrados) para poder comparar com ano anterior. É deliberado.
- Composables retornam objetos com `ref`/`computed` **destructuráveis**. UI faz `const { x, y } = useFoo()`. Não retornar valor cru.
- `EChartsOption` é sempre construída dentro de `computed<EChartsOption | null>`. Nunca em função síncrona chamada do template.
- Cada composable que produz option ECharts define helper local `darkBase()`/`baseTheme()` para tooltip+textStyle. **Dívida conhecida**: copy-paste entre `useEvolucao` e `useGraficosResumo`. Ver AI_CONTEXT §7 para plano de unificação.

## Cada composable

### `useAtendimentos`
- Combina `useAtendimentosStore` + `useFiltrosAtendimentoStore`.
- Retorna `atendimentos` (filtrados pelo filtro corrente) e `todosAtendimentos` (cru).
- Regra do filtro: `'Todos'` é sentinel literal (não filtra nessa dimensão).

### `useAtendimentoFilters`
- Wrapper sobre o store de filtros + derivações (`anos`, `meses`, `podeGerarRelatorio`).
- Existe para a UI não importar o store direto. Mantém superfície limpa.
- `podeGerarRelatorio` = ano OU mês específicos (não ambos `'Todos'`). Usado para habilitar botão de impressão.

### `useKpis`
- 3 outputs: `stats` (cru) + `kpis` (renderizável).
- **`kpis` muda de quantidade e shape conforme `filtro.status`** (5/3/3). Grid de `DashboardKpis` se adapta.
- Type `Kpi` exportado daqui é importado por `KpiCard`. **Acoplamento ascendente conhecido** (component → composable type). Não mover sem revisar.
- Métricas: total, novos, recorrentes, média/dia (sobre dias únicos com atendimento), revendedores únicos, estados únicos, taxas %.

### `useEvolucao`
- 3 modos exclusivos (`mode`): `'todos'` (todos os meses, linhas), `'ano'` (12 meses do ano selecionado, linha com comparação opcional do ano anterior tracejada), `'mes'` (barras comparando o mês selecionado vs mesmo mês do ano anterior).
- Determinado por combinação `(ano, mes)`. Filtro `status` afeta quais séries entram.
- Opera sobre `atendimentos` **cru** do store (não passa por `useAtendimentos`), porque precisa do dataset inteiro para comparações inter-anuais.
- Retorna `{ option, hasData, tag, mode }`. `tag` é label do período mostrado.

### `useGraficosResumo`
- 2 outputs: `donutOption` (Novo vs Recorrente, só faz sentido com `status='Todos'`) + `weekdayOption` (Seg-Sex).
- `donutOption` é `null` quando total=0; UI usa pra renderizar empty state.
- Weekday usa `useDistribuicao().weekday` (Seg=1..Sex=5).

### `useRanking`
- Top N revendedores agregados via `groupByDetail` (com breakdown novo/recorrente).
- Default `limit = 5`.
- Título muda conforme `filtro.status`. `mostrarDetalhe` é falso quando há filtro de status (não mostra breakdown N/R).

### `useDistribuicao`
- Top N por `programa`, `impressora`, `estado` via `groupBy` (sem breakdown).
- Default `limit = 3`.
- Também expõe `weekday` (contagem Seg-Sex).

### `useExcelUpload` ⚠️
- **Único composable com side effect**: chama serviço, muta stores.
- **Não é singleton**. Cada chamada cria seus próprios `carregando`/`erro` refs.
- Quem instancia: `DashboardUploadScreen` (para mostrar loading/error) e `DashboardTopbar` (só para chamar `reset()`).
- `reset()` limpa AMBOS stores (atendimentos + filtros).
- `carregar(file)`:
  1. limpa filtros
  2. delega ao serviço
  3. seta dados na store
  4. chama `filtrosStore.ajustarParaDados(items)` para snap do filtro
- **Importante**: erros do serviço viram string em `erro.value` (não throw). UI mostra inline.

## Cores ECharts (dívida)

Hex codes hardcoded em `useGraficosResumo` e `useEvolucao`:

| Cor | Hex | Uso |
|---|---|---|
| `#00D68F` | jet-green | Novo |
| `#FFA44F` | jet-orange | Recorrente |
| `#6C5CE7` | accent | Atendimentos (total) — em weekday/visuals |
| `#A29BFE` | accent-light | Total (linhas) |
| `#F0F2F8` | text-primary | textStyle |
| `#8B92A8` | text-secondary | axisLabel/legend |
| `#181D29` | bg tooltip | tooltip background |
| `#2A3044` | border tooltip | tooltip border |
| `#1E2433` | border | splitLine |
| `#12161F` | bg-card | item border (separação) |

**Estes valores também vivem em `src/style.css` `@theme`**. Manter os dois sincronizados ou centralizar (ver roadmap em AI_CONTEXT §16).

## Quando criar novo composable

- Se a derivação envolve `atendimentos filtrados` → consuma `useAtendimentos()`.
- Se precisa do dataset cru (comparações inter-anuais etc.) → `storeToRefs(useAtendimentosStore())` direto, como `useEvolucao` faz. **Documente o motivo no próprio arquivo.**
- Se produz `EChartsOption` → registre o chart type em `BaseChart.vue use([...])` ANTES de testar.
- Mantenha o helper de tooltip `darkBase()` local até refatoração centralizadora chegar.

## Riscos

- **Sem memoização entre composables** — cada um refiltra/reagrega independente. Em datasets grandes pode duplicar trabalho. Hoje aceitável.
- **Nenhum composable é defensivo** — assumem que `Atendimento` está bem formado. `mapExcelRows` é a única defesa.
- **`reactive` vs `ref`**: store de filtros usa `reactive(filtro)`. Se passar `filtro` cru via props/emit, perde reatividade. Use `storeToRefs` ou o wrapper `useAtendimentoFilters`.
