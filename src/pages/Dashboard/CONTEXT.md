# CONTEXT — pages/Dashboard

Única feature do app. Toda a UI de visualização vive aqui.

---

## Responsabilidade

- Renderizar o dashboard de Atendimentos Técnicos JETINK.
- Gerenciar os dois estados de tela: **upload** (sem dados) e **dashboard** (com dados).
- Disparar impressão de relatório PDF via `window.print()`.

**Não faz**: lógica de dados, parsing, agregações — tudo delegado a composables.

---

## Papel na arquitetura

Camada de apresentação. Cada `Dashboard<X>.vue` é uma seção visual da página. Compostas pela `DashboardPage.vue`. Renderização condicional única: presença ou ausência de dados.

---

## Composição de `DashboardPage.vue`

```
v-if !temDados   → DashboardUploadScreen
v-else
  DashboardTopbar           (sticky, data-print="hide")
  main:
    DashboardPrintHeader    (print-only, data-print="show")
    DashboardFiltros        (data-print="hide")
    DashboardKpis
    DashboardEvolucao       (data-print="hide")
    grid 2 colunas (lg, min-h-[480px]):
      DashboardRanking
      DashboardMapa         (data-print="hide")
    grid 1 coluna OU 2 colunas (lg, conforme status):
      DashboardDonut        (renderiza apenas se filtro.status === 'Todos')
      DashboardWeekday
    DashboardDistribuicao
```

**`temDados`** vem de `storeToRefs(useAtendimentosStore())`. É o único switch entre os dois estados de tela. Não criar flag alternativa.

**A ordem dos componentes em `DashboardPage.vue` define a ordem do PDF.** Reordenar = mudar layout do relatório impresso.

---

## Convenções visuais

- Container principal: `max-w-[1480px] mx-auto px-8 pt-7 pb-16`.
- Espaçamento entre seções: `mb-7`.
- Gaps de grid: `gap-5`.
- Toda seção usa `BaseCard` + `class="animate-fade-up"`.
- Dimensões dos charts secundários (Donut e Weekday) padronizadas em `height="180px"` para equilíbrio visual.

---

## Regras por componente

### `DashboardUploadScreen`
- Instancia `useExcelUpload()` e lê `carregando`, `erro`, `carregar`.
- Única instância que exibe feedback de loading/error do upload.
- Renderiza tela centralizada com branding JETINK e `FileUpload`.

### `DashboardTopbar`
- `data-print="hide"` — nunca aparece no PDF.
- Instancia `useExcelUpload()` **apenas para `reset()`**. Não ler `carregando`/`erro` desta instância.
- `podeGerarRelatorio` de `useAtendimentoFilters` habilita botão "Gerar Relatório".
- `nomeArquivo` exibido via `storeToRefs(useAtendimentosStore())`.
- `imprimir()`: chama `window.print()`.

### `DashboardFiltros`
- `data-print="hide"`.
- Select de `Mês` é `disabled` quando `filtro.ano === 'Todos'`.
- Usa `useAtendimentoFilters()` — não acessa store diretamente.
- Sentinels `'Todos'` injetados como primeira opção dos selects.

### `DashboardKpis`
- Grid dinâmico via `kpis.value.length`: 5 colunas (lg) se `length === 5`, 3 colunas se 3.
- Sem `data-print` declarado → aparece no PDF.
- `delay` por índice anima cards em cascata.

### `DashboardEvolucao`
- `data-print="hide"` — excluído do PDF por decisão atual.
- Renderiza `BaseChart` se `resultado.option && resultado.hasData`; senão `EmptyState`.
- `tag` do composable vira `count` no header do card (período resumido).

### `DashboardDonut`
- **`v-if filtro.status === 'Todos'`**: o componente inteiro não é montado para outros status.
- Lê `filtro` via `storeToRefs(useFiltrosAtendimentoStore())` (exceção aceita por ser componente visual simples).
- Renderiza `EmptyState` se `donutOption` é null.
- Legenda exibe Novos/Recorrentes com valor absoluto e %.

### `DashboardRanking`
- `useRanking(5)`. Renderiza `EmptyState` se `top.length === 0`.
- `mostrarDetalhe` controla breakdown Novo/Recorrente nos itens.

### `DashboardMapa`
- Choropleth do Brasil baseado em ECharts `MapChart` + GeoJSON registrado em `BaseChart.vue`.
- Toggle local entre `'sublimador'` (campo `estado`) e `'revenda'` (campo `estadoNome`).
  - `'sublimador'`: chave por `resolverNomeEstado(a.estado)`.
  - `'revenda'`: chave por `a.estadoNome` (vem do `estadoMap`).
- Top 3 estados destacados em 3 tons do accent. Demais com `MAP_COLORS.hasData`/`neutral`.
- Cores e tema vêm de `chartTheme.ts` (`MAP_COLORS`, `chartTooltip`).
- `data-print="hide"` — não aparece no PDF.
- Card usa `flex flex-col h-full` para preencher altura do grid; gráfico ocupa altura restante via `-mx-6 -mb-6`.

### `DashboardWeekday`
- `useGraficosResumo().weekdayOption` — sempre retorna option (nunca null).
- Altura padronizada em 180px para equilíbrio visual com o Donut.

### `DashboardDistribuicao`
- `useDistribuicao(3)` para `programas`, `impressoras`, `interestaduais`.
- 3 colunas md. `interestaduais` = UF de revenda diferente da UF do sublimador.
- Outras fatias de `useDistribuicao` (`weekday`, `estadosRevenda`, `estadosSubli`) são consumidas pelo relatório, não aqui.

### `DashboardPrintHeader`
- `data-print="show"` — só aparece no PDF.
- Lê `filtro` diretamente do store (exceção aceita: componente puramente visual, sem lógica).
- Exibe período formatado e timestamp de geração.

---

## Print mode

> **Caminho principal do relatório = página dedicada `/relatorio`**, não a impressão in-place descrita abaixo.
> `DashboardTopbar` "Gerar Relatório" abre `RelatorioModal` → grava `printFiltros`/`kpisParaImprimir` no `useRelatorioStore` → navega para `RelatorioPage` (folha A4). Ver `src/pages/Relatorio/` e a memória do subsistema de relatório. Os toggles `data-print` abaixo seguem válidos para impressão direta do dashboard, mas não são o fluxo do relatório.

### Ativação
`DashboardTopbar` abre o `RelatorioModal` (`relatorioStore.abrirModal`). A impressão real ocorre na `RelatorioPage` via `window.print()`. Botão desabilitado se `!podeGerarRelatorio` (exige um mês selecionado).

### Regras `@media print` (em `src/style.css`)
- `@page`: A4 landscape, margens `8mm 10mm`.
- `body`: background branco, cor escura.
- `[data-print="hide"]` → `display: none !important`.
- `[data-print="show"]` → `display: flex !important`.

### Componentes por status de impressão

| Componente | `data-print` | Aparece no PDF? |
|---|---|---|
| DashboardTopbar | `"hide"` | Não |
| DashboardFiltros | `"hide"` | Não |
| DashboardEvolucao | `"hide"` | Não |
| DashboardMapa | `"hide"` | Não |
| DashboardPrintHeader | `"show"` | Sim (exclusivo print) |
| DashboardKpis | — | Sim |
| DashboardRanking | — | Sim |
| DashboardDonut | — | Sim (se `filtro.status === 'Todos'`) |
| DashboardWeekday | — | Sim |
| DashboardDistribuicao | — | Sim |

### Regra para novas seções
Ao adicionar nova seção: decidir se entra no PDF. Se não → marcar `data-print="hide"`. Sem atributo = aparece no PDF.

---

## Dependências reais

| Componente | Composables / stores |
|---|---|
| `DashboardPage` | `useAtendimentosStore` (apenas `temDados`), `useFiltrosAtendimentoStore` (apenas `filtro` para grid condicional) |
| `DashboardUploadScreen` | `useExcelUpload` |
| `DashboardTopbar` | `useAtendimentosStore` (`nomeArquivo`), `useAtendimentoFilters`, `useExcelUpload` (`reset`) |
| `DashboardFiltros` | `useAtendimentoFilters` |
| `DashboardKpis` | `useKpis` |
| `DashboardEvolucao` | `useEvolucao` |
| `DashboardRanking` | `useRanking` |
| `DashboardMapa` | `useAtendimentos`, `estadoMap`, `chartTheme` |
| `DashboardDonut` | `useGraficosResumo`, `useFiltrosAtendimentoStore` (filtro) |
| `DashboardWeekday` | `useGraficosResumo` |
| `DashboardDistribuicao` | `useDistribuicao` |
| `DashboardPrintHeader` | `useFiltrosAtendimentoStore` (filtro) |

---

## Invariantes obrigatórias

1. **Cada `Dashboard<X>.vue` consome no máximo 1 composable de domínio**, sem props de dados.
2. **`temDados` é o único switch upload ↔ dashboard**. Não criar flag alternativa.
3. **Ordem dos componentes em `DashboardPage.vue` = ordem do PDF**. Reordenar = mudar layout impresso.
4. **`data-print` declarado explicitamente** em toda seção. Sem atributo = aparece no PDF.
5. **Donut só monta se `filtro.status === 'Todos'`**. Outras seções não dependem disso.
6. **Card visual = `BaseCard` + `animate-fade-up`**.

---

## Acoplamentos críticos

- `DashboardTopbar` cria instância própria de `useExcelUpload` isolada de `DashboardUploadScreen` — separação intencional.
- `DashboardDonut` lê `filtro` diretamente do store (aceito por renderização condicional).
- `DashboardPrintHeader` lê `filtro` diretamente do store (aceito por ser label visual).
- `DashboardKpis` adapta `grid-cols-N` conforme `kpis.value.length`. Mudar a quantidade de KPIs em `useKpis` exige ajustar a fórmula do grid.

---

## Convenções implícitas

- Componentes desta pasta são "burros": apenas templates + composable de domínio.
- Componentes desta pasta nunca importam outros `Dashboard<X>.vue`.
- `defineOptions({ name })` não é usado — Vue infere via filename.

---

## Limitações reais

- Botão "Nova Planilha" (`reset()`) não confirma com usuário — clique acidental destrói dados em memória.
- Mapa não tem fallback para datasets onde `a.estado` está vazio em todas as linhas (toggle `sublimador` cai em mapa em cinza).
- Não há paginação no Ranking — limit fixo via parâmetro do composable.

---

## Hotspots

- `DashboardMapa` recalcula `totaisPorEstado` e `top3` em todo update do filtro. Custo proporcional a `atendimentos.length`.
- Adicionar seção pesada (muito DOM) impacta tempo de renderização do PDF.

---

## Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Passar props de dados entre `Dashboard<X>.vue` | Quebra isolamento de seções |
| Adicionar lógica de filtro/agregação em componente | Sai do contrato de "componente burro" |
| Reordenar `DashboardPage.vue` sem checar PDF | Layout do relatório muda silenciosamente |
| Esquecer `data-print` em nova seção | Vaza no PDF inesperadamente |
| Importar service direto em componente | Quebra direção de dependência |

---

## Regras de extensão

- **Nova seção do dashboard** → `Dashboard<X>.vue` nesta pasta, com composable próprio em `src/composables/`.
- **Componente reutilizável entre seções** → `src/components/shared/`.
- **Primitivo visual** → `src/components/ui/`.
- **Novo gráfico ECharts** → registrar tipo em `BaseChart.vue use([...])` antes de usar; consumir `chartTheme.ts`.
- **Nova condicional de renderização** → preferir `v-if` no nível de seção, não nas subáreas.

---

## Relação com outros módulos

```
DashboardPage
  → DashboardUploadScreen   → useExcelUpload → service + stores
  → DashboardTopbar         → useExcelUpload (reset) + useAtendimentoFilters
  → DashboardPrintHeader    → useFiltrosAtendimentoStore (filtro)
  → DashboardFiltros        → useAtendimentoFilters
  → DashboardKpis           → useKpis → useAtendimentos
  → DashboardEvolucao       → useEvolucao → useAtendimentosStore (raw)
  → DashboardRanking        → useRanking → useAtendimentos
  → DashboardMapa           → useAtendimentos + estadoMap + chartTheme
  → DashboardDonut          → useGraficosResumo → useAtendimentos
  → DashboardWeekday        → useGraficosResumo → useDistribuicao → useAtendimentos
  → DashboardDistribuicao   → useDistribuicao → useAtendimentos
```
