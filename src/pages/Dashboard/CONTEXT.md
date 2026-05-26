# CONTEXT — pages/Dashboard

Única feature do app. Toda a UI de visualização vive aqui.

## Responsabilidade

- Renderizar dashboard de atendimentos técnicos JETINK
- Gerenciar dois estados de tela: **upload** (sem dados) vs **dashboard** (com dados)
- Impressão de relatório PDF via `window.print()`

**Não faz**: lógica de dados, parsing, agregações — tudo delegado a composables.

---

## Composição de `DashboardPage.vue`

```
v-if !temDados   → DashboardUploadScreen
v-else
  DashboardTopbar         (sticky, data-print="hide")
  main:
    DashboardPrintHeader  (print-only, data-print="show")
    DashboardFiltros      (data-print="hide")
    DashboardKpis
    DashboardEvolucao     (data-print="hide")
    grid 2 colunas:
      DashboardRanking
      DashboardMapa       (placeholder, data-print="hide")
    grid 2 colunas:
      DashboardDonut      (condicional: só se filtro.status === 'Todos')
      DashboardWeekday
    DashboardDistribuicao
```

**`temDados`** vem de `storeToRefs(useAtendimentosStore())`. É o único switch entre os dois estados de tela. Não criar flag alternativa.

**A ordem dos componentes em `DashboardPage.vue` define a ordem do PDF.** Reordenar = mudar layout do relatório impresso.

---

## Regras por componente

### `DashboardUploadScreen`
- Instancia `useExcelUpload()` e lê `carregando`, `erro`, `carregar`.
- Única instância que exibe feedback de loading/error do upload.

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

### `DashboardKpis`
- Grid dinâmico via `kpis.value.length`: 5 colunas (lg) se `length === 5`, 3 colunas se 3.
- Não tem `data-print` declarado → aparece no PDF.

### `DashboardEvolucao`
- `data-print="hide"` — excluído do PDF por decisão atual.
- Renderiza `BaseChart` se `resultado.option && resultado.hasData`; senão `EmptyState`.

### `DashboardDonut`
- **`v-if filtro.status === 'Todos'`**: o componente inteiro não é montado para outros status.
- Lê `filtro` via `storeToRefs(useFiltrosAtendimentoStore())` (exceção aceita por ser componente visual simples).
- Renderiza `EmptyState` se `donutOption` é null.

### `DashboardRanking`
- `useRanking(5)`. Renderiza `EmptyState` se `top.length === 0`.

### `DashboardMapa`
- Placeholder sem dados. Ocupa a posição ao lado de `DashboardRanking`.
- `data-print="hide"` — não aparece no PDF até ter implementação real.
- Sem acesso a store. Sem composable. Apenas visual de espaço reservado.

### `DashboardWeekday`
- `useGraficosResumo().weekdayOption` — sempre retorna option (nunca null).

### `DashboardDistribuicao`
- `useDistribuicao(3)` para `programas`, `impressoras`, `estados`.
- 3 colunas md. `estados` usa `a.estado` (campo livre), não `estadoUf`.

### `DashboardPrintHeader`
- `data-print="show"` — só aparece no PDF.
- Lê `filtro` diretamente do store (exceção aceita: componente puramente visual, sem lógica).
- Exibe período formatado e timestamp de geração.

---

## Print mode

### Ativação
`DashboardTopbar.imprimir()` → `window.print()`. Botão desabilitado se `!podeGerarRelatorio`.

### Regras `@media print` (em `src/style.css`)
- `@page`: A4 landscape, margens 8mm 10mm
- `body`: background branco, cor escura
- `[data-print="hide"]` → `display: none !important`
- `[data-print="show"]` → `display: flex !important`

### Componentes por status de impressão

| Componente | `data-print` | Aparece no PDF? |
|---|---|---|
| DashboardTopbar | `"hide"` | Não |
| DashboardFiltros | `"hide"` | Não |
| DashboardEvolucao | `"hide"` | Não |
| DashboardPrintHeader | `"show"` | Sim (exclusivo print) |
| DashboardKpis | — | Sim |
| DashboardRanking | — | Sim |
| DashboardMapa | `"hide"` | Não (placeholder sem dados) |
| DashboardDonut | — | Sim (se filtro.status='Todos') |
| DashboardWeekday | — | Sim |
| DashboardDistribuicao | — | Sim |

### Regra para novas seções
Ao adicionar nova seção: decidir se entra no PDF. Se não → marcar `data-print="hide"`. Sem atributo = aparece no PDF.

---

## KPIs condicionais

`DashboardKpis` adapta o grid automaticamente via `kpis.value.length`:
- `status = 'Todos'` → 5 KPIs → `grid-cols-5` (lg)
- `status = 'Novo'` ou `'Recorrente'` → 3 KPIs → `grid-cols-3` (lg)

---

## Regras de criação de componentes

- **Nova seção do dashboard** → `Dashboard<X>.vue` nesta pasta, com composable próprio em `src/composables/`.
- **Componente reutilizável entre seções** → `src/components/shared/`.
- **Primitivo visual** → `src/components/ui/`.
- Cada `Dashboard<X>.vue` consome exatamente 1 composable de domínio. Sem props de dados.
- Todo card usa `BaseCard` + `class="animate-fade-up"`.

---

## Acoplamentos locais

- `DashboardTopbar` cria instância própria de `useExcelUpload` isolada de `DashboardUploadScreen`.
- `DashboardDonut` lê `filtro` diretamente do store — aceito porque é só renderização condicional.
- `DashboardPrintHeader` lê `filtro` diretamente do store — aceito porque é só exibição de label.

---

## Riscos

- Botão "Nova Planilha" (`reset()`) não confirma com usuário — clique acidental destrói dados em memória.
- Adicionar seção pesada (muito DOM) impacta tempo de renderização do PDF.
- Reordenar componentes muda layout do relatório impresso sem aviso.
