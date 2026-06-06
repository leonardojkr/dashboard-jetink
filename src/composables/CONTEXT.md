# CONTEXT — composables

View-model layer. Cada composable expõe `ref`s/`computed`s para a UI consumir. Sem side effects — exceto `useExcelUpload`.

---

## Responsabilidade

- Adaptar o estado dos stores para o formato consumido pela UI.
- Produzir `EChartsOption` para os componentes de gráfico.
- Encapsular regras de filtragem, agregação e ordenação.
- Servir como única ponte autorizada entre componentes e o domínio.

**Não fazem**: IO direto (com exceção de `useExcelUpload`), persistência, render.

---

## Papel na arquitetura

Camada intermediária entre stores e componentes. Componente nunca toca o store de domínio diretamente (exceto exceções declaradas em `pages/Dashboard/CONTEXT.md`). Todo gráfico nasce aqui como `computed<EChartsOption>`.

---

## Mapa de dependências

```
usePrintFiltro(secao)    ← resolve printFiltros[secao] ?? filtroGlobal
                            (uma instância por seção de relatório)

useAtendimentos(filtro?) ← porta única para dados filtrados; aceita filtroOverride
    ├── useKpis           (filtro global)
    ├── useRanking        (filtro via usePrintFiltro('ranking'))
    ├── useDistribuicao   (6 seções, cada uma via usePrintFiltro)
    │      └── weekday reusado por useGraficosResumo
    └── useGraficosResumo (filtro via usePrintFiltro('donut'))

useEvolucao              ← exceção: usa storeToRefs(useAtendimentosStore()) direto
useAtendimentoFilters    ← wrapper de useFiltrosAtendimentoStore para a UI
useExcelUpload           ← orquestra ambos os stores (único com side effect)
```

**Mecanismo de filtro do relatório**: no Dashboard `printFiltros === null`, então
`usePrintFiltro` cai sempre no filtro global. No modo relatório, o `RelatorioModal`
grava `printFiltros` como `Record<secaoId, AtendimentoFiltro>` e cada seção lê o seu.
As chaves passadas a `usePrintFiltro(secao)` **devem casar** com os `id` de
`SECOES_BASE` em `useRelatorioStore` (ranking, donut, weekday, interestaduais,
impressoras, programas, estadosRevenda, estadosSubli).

---

## Convenção arquitetural obrigatória

- **`useAtendimentos()` é a única porta para dados filtrados**. Nenhum composable derivado acessa `atendimentosStore.atendimentos` diretamente.
  - **Exceção real e documentada**: `useEvolucao` usa o store raw porque precisa do dataset completo para comparações inter-anuais.
- Composables retornam objetos com `ref`/`computed` destrutruráveis. UI faz `const { x } = useFoo()`.
- `EChartsOption` é sempre construída dentro de `computed<EChartsOption | null>`. Nunca em função síncrona chamada do template.
- Composables não importam `atendimentoService` diretamente. Exceção: `useExcelUpload`.
- Cores ECharts vêm de `utils/chartTheme.ts`. Não declarar hex literal em composable.

---

## Documentação por composable

### `useAtendimentos`
- Combina `useAtendimentosStore` + `useFiltrosAtendimentoStore` via `storeToRefs`.
- Retorna:
  - `atendimentos`: `computed<Atendimento[]>` filtrado por `ano`, `mes`, `status`. `'Todos'` = sem filtro na dimensão.
  - `todosAtendimentos`: ref raw do store (sem filtro).
- Regra de filtro: `a.year === ano`, `a.ym === mes`, `a.status === status`.

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
- **`Kpi` type é exportado daqui** e importado por `KpiCard.vue`. Não mover sem atualizar `KpiCard`.
- **`kpis` muda em quantidade e shape conforme `filtro.status`**:
  - `'Todos'` → 5 KPIs: Total, Novos, Recorrentes, Revendedores Ativos, Estados Alcançados.
  - `'Novo'` → 3 KPIs: Novos, Revendedores Ativos, Estados Alcançados.
  - `'Recorrente'` → 3 KPIs: Recorrentes, Revendedores Ativos, Estados Alcançados.
- `stats.estadosAlcancados`: conta valores únicos de `a.estado` (campo livre, não `estadoUf`).
- `stats.mediaPorDia`: `total / diasUnicos.size`. Zero se nenhum dia único.

### `usePrintFiltro(secao)`
- Retorna `computed<AtendimentoFiltro>`: `relatorioStore.printFiltros?.[secao] ?? filtroGlobal`.
- Primitiva única para "qual filtro esta seção usa", usada por `useRanking`, `useDistribuicao` e `useGraficosResumo`.
- Substitui o padrão antes duplicado (`printFiltros?.['x'] ?? filtroGlobal.value`) em ~8 pontos.
- A chave `secao` deve ser um `id` de `SECOES_BASE` (ver `useRelatorioStore`).

### `useEvolucao`
- **Exceção à regra**: usa `storeToRefs(useAtendimentosStore())` diretamente — dataset completo sem filtro, para poder comparar com ano anterior.
- Retorna: `{ resultado: computed<EvolutionResult> }`.
- **3 modos exclusivos**, determinados por `(ano, mes)` do filtro:

| ano | mes | mode | Tipo de chart |
|---|---|---|---|
| `'Todos'` | qualquer | `'todos'` | Linhas por todos os meses do dataset |
| `≠ 'Todos'` | `'Todos'` | `'ano'` | Linha de 12 meses do ano + linha tracejada do ano anterior |
| `≠ 'Todos'` | `≠ 'Todos'` | `'mes'` | Barras: mês atual vs mesmo mês do ano anterior |

- `EvolutionResult`: `{ mode, option: EChartsOption | null, tag: string | null, hasData: boolean }`.
- Filtro `status` afeta quais séries aparecem (Novo/Recorrente/ambos).
- Cores vêm de `STATUS_COLOR` em `chartTheme.ts`.
- Helpers internos puros: `statusToLabel`, `makeTooltipFormatter`, `evolutionBase`, `categoryAxis`, `valueAxis`, `lineSeries`.
- **Agregação single-pass**: os três modos bucketizam o dataset por `ym` numa única varredura (Map por mês), sem `all.filter` por mês dentro de loop.

### `useGraficosResumo`
- Usa `useAtendimentos(usePrintFiltro('donut'))` + `useDistribuicao().weekday`.
- Retorna: `donutData`, `donutOption`, `weekdayOption`.
- `donutData`: conta Novo/Recorrente numa única varredura.
- `donutOption`: `EChartsOption | null`. `null` se `total === 0`. Renderiza PieChart Novo vs Recorrente com label central no donut.
- `weekdayOption`: sempre retorna `EChartsOption` (nunca null). BarChart Seg→Sex com gradiente accent.
- Tema/cores vêm de `chartTheme.ts` (`chartBase`, `chartTooltip`, `CHART_COLORS`, helpers de eixo).

### `useRanking(limit = 5)`
- Usa `useAtendimentos(usePrintFiltro('ranking'))`.
- Agrupa por `revendedor` via `groupByDetail` (com breakdown Novo/Recorrente).
- Retorna: `top` (slice(0, limit)), `titulo`, `totalRevendedores`, `mostrarDetalhe`.
- `mostrarDetalhe`: `filtro.status === 'Todos'` — oculta breakdown quando há filtro de status.
- `titulo`: muda conforme `filtro.status` ("conversão" / "recorrência" / "atendimento").

### `useDistribuicao(limit = 3)`
- Cria 6 fatias de dados, cada uma filtrada por `usePrintFiltro(<id>)`.
- Retorna: `programas`, `impressoras`, `interestaduais`, `weekday`, `estadosRevenda`, `estadosSubli`.
- `programas`, `impressoras`: `groupBy` nos campos homônimos, top N.
- `interestaduais`, `estadosSubli`, `estadosRevenda`: `groupByResolver` (Map por UF derivada), top N.
  - `interestaduais`: conta UF de revenda quando difere da UF do sublimador (ambas resolvíveis).
  - `estadosSubli`: conta `resolveToUF(a.estado)` (campo livre).
  - `estadosRevenda`: conta `a.estadoUf` (derivado de "Estado Revenda").
- `weekday`: conta `a.dow` de 1 (Seg) a 5 (Sex), retorna `WeekdayBucket[]` com labels `WEEKDAYS_PT`.
- **Lazy**: os 6 `computed` são preguiçosos — só as fatias realmente lidas pelo componente são processadas (Dashboard lê 3; Relatório lê até 5).

### `useExcelUpload` ⚠️
- **Único composable com side effect**: chama service, muta stores.
- **NÃO é singleton**. Cada instância cria `carregando` e `erro` independentes.
- Instâncias ativas: `DashboardUploadScreen` (lê `carregando`/`erro`), `DashboardTopbar` (usa apenas `reset()`).
- **Não ler `carregando`/`erro` da instância do Topbar** — não reflete o estado real do upload.
- `carregar(file)`:
  1. `atendimentoService.lerArquivo(file)` (pode lançar).
  2. Valida `atendimentos.length > 0`; se não → `throw new Error('A planilha não contém registros válidos.')`.
  3. `filtrosStore.limpar()`.
  4. `atendimentosStore.setAtendimentos(items, file.name)`.
  5. `filtrosStore.ajustarParaDados(items)`.
  - Erros capturados em `erro.value` (string). Não relança.
- `reset()`: `atendimentosStore.limpar()` + `filtrosStore.limpar()` + `erro.value = null`.

---

## Dependências reais

| Composable | Importa |
|---|---|
| `useAtendimentos` | `vue`, `pinia`, stores, `types` |
| `useAtendimentoFilters` | `vue`, `pinia`, stores |
| `usePrintFiltro` | `vue`, `pinia`, `useFiltrosAtendimentoStore`, `useRelatorioStore`, `types` |
| `useKpis` | `useAtendimentos`, `useFiltrosAtendimentoStore`, `useMapaFiltroStore`, `estadoMap` |
| `useDistribuicao` | `useAtendimentos`, `usePrintFiltro`, `utils/grouping`, `utils/estadoMap`, `utils/dateHelpers` |
| `useRanking` | `useAtendimentos`, `usePrintFiltro`, `utils/grouping` |
| `useGraficosResumo` | `useAtendimentos`, `useDistribuicao`, `usePrintFiltro`, `utils/chartTheme` |
| `useEvolucao` | `useAtendimentosStore`, `useFiltrosAtendimentoStore`, `utils/dateHelpers`, `utils/chartTheme`, `types` |
| `useExcelUpload` | `services/atendimentoService`, ambos os stores |

---

## Invariantes obrigatórias

1. **`useAtendimentos` é a porta única para dados filtrados**. Exceção: `useEvolucao`.
2. **Cores ECharts via `chartTheme.ts`**. Hex literal direto em composable é proibido.
3. **`EChartsOption` em `computed`**. Função síncrona no template quebra reatividade do VChart.
4. **Composables não importam service**. Exceção: `useExcelUpload`.
5. **`useExcelUpload` não é singleton**. Cada instância tem ref local — não compartilhar `carregando`/`erro` entre instâncias.

---

## Acoplamentos críticos

| Acoplamento | Risco |
|---|---|
| `Kpi` type exportado de `useKpis` → consumido por `KpiCard` | Mover type quebra `KpiCard` |
| `matchFiltro` exportado de `useAtendimentos` → consumido por `RelatorioModal` (preview KPIs) | Regra de filtro única; divergir quebra paridade dashboard ↔ relatório |
| `useGraficosResumo` consome `useDistribuicao().weekday` | Remover `weekday` quebra `weekdayOption` |
| `useEvolucao` ↔ raw store | Adicionar filtro a essa via mascara comparações inter-anuais |
| `chartTheme` ↔ tokens `@theme` em `style.css` | Divergência silenciosa entre dashboard e gráficos |

---

## Convenções implícitas

- Composables que produzem gráfico retornam `option: computed<EChartsOption | null>`.
- Composables que produzem dados tabulares retornam arrays via `computed<T[]>`.
- Nomes em português (domínio do produto): `atendimentos`, `filtro`, `kpis`, `programas`, `impressoras`, `estados`, `weekday`.
- `limit` é parâmetro do composable, não config global.

---

## Limitações reais

- **Sem memoização entre composables distintos**: cada composable refiltra/reagrega o dataset por conta própria. Dentro de cada composable a agregação já é single-pass; o que não há é cache compartilhado entre `useKpis`, `useRanking`, etc.
- **Nenhum composable é defensivo**: assumem `Atendimento` bem formado. `mapExcelRows` é a única defesa.
- **`estadoUf`/`estadoNome` são opcionais**: composables futuros que usarem esses campos devem tratar `undefined`.

---

## Hotspots

- **Agregações single-pass** (estado atual): `computeRawStats` (useKpis), `donutData` (useGraficosResumo) e os três modos de `useEvolucao` varrem o dataset uma única vez por avaliação. `groupBy`/`groupByResolver` também são uma varredura + sort.
- **`useDistribuicao` declara 6 fatias**, mas os `computed` são lazy: só as fatias lidas pelo componente disparam filtragem/agregação.
- **Custo dominante**: `useAtendimentos.filtrados` reavalia o `.filter` do dataset inteiro quando `atendimentos` ou o filtro mudam. Proporcional a `atendimentos.length`.

---

## Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Filtrar `atendimentosStore.atendimentos` direto | Filtros não se aplicam |
| Construir `EChartsOption` em função síncrona | Não reage a mudanças |
| Hex literal em composable | Desincroniza tema visual |
| Importar service em composable que não é `useExcelUpload` | Quebra direção de dependência |
| Acessar `carregando` da instância do Topbar | Estado fantasma |

---

## Regras de extensão

- **Derivação de dados filtrados** → consumir `useAtendimentos()`.
- **Seção que participa do relatório** → resolver o filtro com `usePrintFiltro(<secaoId>)` e passar a `useAtendimentos`. Não reescrever `printFiltros?.[x] ?? filtroGlobal` à mão.
- **Nova seção de relatório** → adicionar o `id` em `SECOES_BASE` (`useRelatorioStore`) **e** usar o mesmo `id` em `usePrintFiltro` no composable. Os dois lados têm de casar.
- **Contagem agrupada por chave derivada** (ex.: UF) → `groupByResolver(arr, resolver)`. Por campo direto → `groupBy(arr, campo)`.
- **Dataset completo (comparações inter-anuais)** → `storeToRefs(useAtendimentosStore())` direto. **Documentar motivo.**
- **Produz `EChartsOption`** → registrar chart type em `BaseChart.vue use([...])` antes de testar; consumir `chartTheme.ts`.
- **Lógica de filtro nova** → estender `useAtendimentoFilters` (UI) ou `useAtendimentos` (regra), não duplicar.

---

## Relação com outros módulos

```
Componente Dashboard<X>
  → composable de domínio
       → useAtendimentos (filtrado) OU store raw (exceção)
            → stores via storeToRefs
       → utils (grouping, dateHelpers, chartTheme)
useExcelUpload (lado de fora do fluxo de leitura)
  → service
  → ambos os stores
```
