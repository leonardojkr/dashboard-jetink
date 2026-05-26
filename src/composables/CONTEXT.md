# CONTEXT — composables

View-model layer. Cada composable expõe `ref`s/`computed`s para a UI consumir. Sem side effects — exceto `useExcelUpload`.

## Mapa de dependências

```
useAtendimentos          ← porta única para dados filtrados
    ├── useKpis
    ├── useRanking
    ├── useDistribuicao  ← usado por useGraficosResumo (weekday)
    └── useGraficosResumo

useEvolucao              ← usa storeToRefs direto (NÃO passa por useAtendimentos)
useAtendimentoFilters    ← wrapper de useFiltrosAtendimentoStore para a UI
useExcelUpload           ← orquestra ambos os stores (único com side effect)
```

## Convenção obrigatória

- **`useAtendimentos()` é a única porta para dados filtrados**. Nenhum composable derivado acessa `atendimentosStore.atendimentos` diretamente.
  - **Exceção real e documentada**: `useEvolucao` usa o store raw porque precisa do dataset completo para comparações inter-anuais.
- Composables retornam objetos com `ref`/`computed` destrutruráveis. UI faz `const { x } = useFoo()`.
- `EChartsOption` é sempre construída dentro de `computed<EChartsOption | null>`. Nunca em função síncrona chamada do template.
- Composables não importam `atendimentoService` diretamente. Exceção: `useExcelUpload`.

---

## Documentação por composable

### `useAtendimentos`
- Combina `useAtendimentosStore` + `useFiltrosAtendimentoStore` via `storeToRefs`.
- Retorna:
  - `atendimentos`: `computed<Atendimento[]>` — filtrado por `ano`, `mes`, `status`. `'Todos'` = sem filtro na dimensão.
  - `todosAtendimentos`: ref raw do store (sem filtro).
- Regra de filtro: `a.year === ano` (ano), `a.ym === mes` (mes), `a.status === status`.

### `useAtendimentoFilters`
- Wrapper de `useFiltrosAtendimentoStore` + derivações de `useAtendimentosStore`.
- Retorna: `filtro`, `anos`, `meses`, `podeGerarRelatorio`, `atualizar`, `limpar`.
- `anos`: anos únicos de `atendimentos.value`, ordenados.
- `meses`: se `ano='Todos'` → todos `ym`; senão → `ym` do ano selecionado. Ordenados.
- `podeGerarRelatorio`: `filtro.ano !== 'Todos' || filtro.mes !== 'Todos'`. Habilita botão de impressão.
- **Motivação**: UI não acessa o store diretamente. Manter essa via para futuras telas.

### `useKpis`
- Usa `useAtendimentos()` (filtrado).
- Retorna: `stats` (dados crus), `kpis` (array renderizável).
- **`Kpi` type é exportado daqui** e importado por `KpiCard.vue`. Não mover sem atualizar KpiCard.
- **`kpis` muda em quantidade e shape conforme `filtro.status`**:
  - `'Todos'` → 5 KPIs: Total, Novos, Recorrentes, Revendedores Ativos, Estados Alcançados
  - `'Novo'` → 3 KPIs: Novos, Revendedores Ativos, Estados Alcançados
  - `'Recorrente'` → 3 KPIs: Recorrentes, Revendedores Ativos, Estados Alcançados
- `stats.estadosAlcancados`: conta valores únicos de `a.estado` (campo livre, não `estadoUf`).
- `stats.mediaPorDia`: `total / diasUnicos.size`. Zero se nenhum dia único.

### `useEvolucao`
- **Exceção à regra**: usa `storeToRefs(useAtendimentosStore())` diretamente — dataset completo sem filtro, para poder comparar com ano anterior.
- Retorna: `{ resultado: computed<EvolutionResult> }`.
- **3 modos exclusivos**, determinados por `(ano, mes)` do filtro:

| ano | mes | mode | Tipo de chart |
|---|---|---|---|
| `'Todos'` | qualquer | `'todos'` | Linha(s) por todos os meses do dataset |
| `≠ 'Todos'` | `'Todos'` | `'ano'` | Linha 12 meses do ano + linha tracejada do ano anterior |
| `≠ 'Todos'` | `≠ 'Todos'` | `'mes'` | Barras: mês atual vs mesmo mês do ano anterior |

- `EvolutionResult`: `{ mode, option: EChartsOption | null, tag: string | null, hasData: boolean }`
- Filtro `status` afeta quais séries aparecem (Novo/Recorrente/ambos).
- Cores: `Todos='#A29BFE'`, `Novo='#00D68F'`, `Recorrente='#FFA44F'`.

### `useGraficosResumo`
- Usa `useAtendimentos()` (filtrado) + `useDistribuicao().weekday`.
- Retorna: `donutData`, `donutOption`, `weekdayOption`.
- `donutOption`: `EChartsOption | null`. `null` se `total === 0`. Renderiza PieChart Novo vs Recorrente.
- `weekdayOption`: sempre retorna `EChartsOption` (nunca null). BarChart Seg→Sex.
- Helper local `darkBase()` define tema escuro para tooltip/textStyle. Duplicado em `useEvolucao` (dívida conhecida).

### `useRanking(limit = 5)`
- Usa `useAtendimentos()` (filtrado).
- Agrupa por `revendedor` via `groupByDetail` (com breakdown Novo/Recorrente).
- Retorna: `top` (slice(0, limit)), `titulo`, `totalRevendedores`, `mostrarDetalhe`.
- `mostrarDetalhe`: `filtro.status === 'Todos'` — oculta breakdown quando há filtro de status.
- `titulo`: muda conforme `filtro.status` ("conversão" / "recorrência" / "atendimento").

### `useDistribuicao(limit = 3)`
- Usa `useAtendimentos()` (filtrado).
- Retorna: `programas`, `impressoras`, `estados`, `weekday`.
- `programas`, `impressoras`, `estados`: `groupBy` nos campos homônimos de `Atendimento`, top N.
- **`estados` usa `a.estado` (campo livre)**, não `a.estadoUf`. Para choropleth usar `estadoUf`/`estadoNome`.
- `weekday`: conta `a.dow` de 1 (Seg) a 5 (Sex), retorna `WeekdayBucket[]` com labels `WEEKDAYS_PT`.

### `useExcelUpload` ⚠️
- **Único composable com side effect**: chama service, muta stores.
- **NÃO é singleton**. Cada instância cria `carregando` e `erro` independentes.
- Instâncias ativas: `DashboardUploadScreen` (lê `carregando`/`erro`), `DashboardTopbar` (usa apenas `reset()`).
- **Não ler `carregando`/`erro` da instância do Topbar** — não reflete o estado real.
- `carregar(file)`:
  1. `filtrosStore.limpar()`
  2. `atendimentoService.lerArquivo(file)` (pode lançar)
  3. Valida `atendimentos.length > 0`; se não → `throw new Error('A planilha não contém registros válidos.')`
  4. `atendimentosStore.setAtendimentos(items, file.name)`
  5. `filtrosStore.ajustarParaDados(items)`
  - Erros capturados em `erro.value` (string). Não relança.
- `reset()`: `atendimentosStore.limpar()` + `filtrosStore.limpar()` + `erro.value = null`.

---

## Cores ECharts (hardcoded — dívida)

Valores duplicados entre composables e tokens `@theme` em `style.css`:

| Hex | Token `@theme` | Uso |
|---|---|---|
| `#00D68F` | `jet-green` | Novo |
| `#FFA44F` | `jet-orange` | Recorrente |
| `#A29BFE` | `accent-light` | Total/Todos (linhas) |
| `#6C5CE7` | `accent` | Weekday bars (gradiente) |
| `#F0F2F8` | `text-primary` | textStyle |
| `#8B92A8` | `text-secondary` | axisLabel, legend |
| `#181D29` | `bg-card-hover` | tooltip background |
| `#2A3044` | `border-light` | tooltip border, axisLine |
| `#1E2433` | `border` | splitLine |
| `#12161F` | `bg-card` | item border (separação) |

Se tokens de `style.css` mudarem, atualizar manualmente nos composables.

---

## Quando criar novo composable

- Derivação de dados filtrados → consumir `useAtendimentos()`.
- Dataset completo (comparações inter-anuais) → `storeToRefs(useAtendimentosStore())` direto. **Documentar o motivo no arquivo.**
- Produz `EChartsOption` → registrar o chart type em `BaseChart.vue use([...])` antes de testar.
- Manter helper de tooltip local (`darkBase()`) até refatoração centralizadora ser feita.

## Riscos

- **Sem memoização entre composables**: cada um refiltra/reagrega independentemente. Em datasets grandes, duplica trabalho.
- **Nenhum composable é defensivo**: assumem `Atendimento` bem formado. `mapExcelRows` é a única defesa.
- **`estadoUf`/`estadoNome` são opcionais**: composables futuros que usarem esses campos devem tratar `undefined` explicitamente.
