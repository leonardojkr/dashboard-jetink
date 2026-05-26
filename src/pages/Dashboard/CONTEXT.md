# CONTEXT — pages/Dashboard

Única feature do app. Toda a UI de visualização vive aqui.

## Responsabilidade

- Renderizar dashboard de atendimentos técnicos (JETINK).
- Gerenciar dois estados de tela: **upload screen** (sem dados) vs **dashboard** (com dados).
- Composição visual + impressão (PDF via `window.print()`).

**Não faz**: lógica de dados, parsing, agregações. Tudo delegado a composables.

## Composição (DashboardPage.vue)

```
v-if !temDados   → DashboardUploadScreen
v-else           → DashboardTopbar (sticky)
                   main:
                     DashboardPrintHeader (print-only)
                     DashboardFiltros
                     DashboardKpis
                     DashboardEvolucao
                     grid 2 col:
                       DashboardRanking | (DashboardDonut + DashboardWeekday)
                     DashboardDistribuicao
```

## Regras críticas

- **Switch upload ↔ dashboard governado por `useAtendimentosStore.temDados`**. Não invente outra flag.
- **Cada componente `Dashboard<X>.vue` consome 1 composable próprio** (`useKpis`, `useEvolucao`, `useGraficosResumo`, `useRanking`, `useDistribuicao`). Sem props de dados.
- Componentes "puros" recebem props: `KpiCard`, `HBarList`, `RankingList`, `BaseChart`, `BaseCard`, `EmptyState`. Esses **não** chamam composables de domínio.
- Todo card de seção usa `BaseCard` + `class="animate-fade-up"` (consistência visual exigida).
- ECharts options **nunca** inline no template — sempre vêm de um composable via `computed`.

## Print mode

- Ativado por `window.print()` no `DashboardTopbar.imprimir()` (botão "Gerar Relatório").
- Botão fica desabilitado se `!podeGerarRelatorio` (composable `useAtendimentoFilters`) — exige ano ou mês específico.
- `DashboardPrintHeader` é o **único** elemento com `print:flex` que aparece só na impressão.
- **Convenção `data-print`**:
  - `data-print="hide"` → some na impressão (Filtros, Topbar, Evolução estão marcados)
  - `data-print="show"` → aparece só na impressão (PrintHeader)
- Regras de @media print vivem em `src/style.css`. A4 landscape, fundo branco.
- **Ao adicionar nova seção**: decidir se entra no relatório. Se não, marcar `data-print="hide"`.
- **DashboardEvolucao está marcado `data-print="hide"`** — não aparece no PDF por decisão atual. Cuidado ao reposicionar.

## KPIs condicionais por status (`DashboardKpis` + `useKpis`)

- Status `Todos` → **5 KPIs** (grid 5 colunas em desktop)
- Status `Novo` → **3 KPIs**
- Status `Recorrente` → **3 KPIs**
- Grid se ajusta dinamicamente via `gridCols` computed em `DashboardKpis.vue`.

## Donut condicional

`DashboardDonut` só renderiza se `filtro.status === 'Todos'` (não faz sentido com filtro de status aplicado).

## Estados vazios

- `EmptyState` é o padrão visual quando uma seção fica sem dados após filtro.
- `DashboardEvolucao` usa `resultado.hasData` do composable para decidir empty state.
- `DashboardRanking` usa `top.length`.
- `DashboardDonut` checa `donutOption` truthy.

## Acoplamentos a observar

- `DashboardTopbar` instancia `useExcelUpload()` para usar `reset()`. **Cuidado**: cada instância tem suas próprias refs `carregando`/`erro` (composable não é singleton). Hoje topbar só usa `reset()`, mas adicionar leitura desses refs aqui não vai refletir o estado real do upload.
- `DashboardFiltros` usa o composable `useAtendimentoFilters` (não o store direto). Manter essa via para futuras telas de filtro.
- `DashboardPrintHeader` lê `filtro` direto do store. Aceitável por ser apenas visual.

## Quando criar novo componente aqui

- Se for nova **seção** do dashboard → `DashboardXxx.vue` neste folder, com composable próprio em `src/composables/`.
- Se for **componente reutilizável** entre seções → `src/components/shared/`.
- Se for primitivo visual → `src/components/ui/`.

## Riscos locais

- Ordem dos componentes em `DashboardPage.vue` define ordem do PDF. Mudar ordem = mudar layout do relatório impresso.
- Adicionar seção pesada (muito DOM) impacta tempo de impressão.
- Botão "Nova Planilha" (`reset()`) **não** confirma com usuário — clique acidental perde os dados em memória.
