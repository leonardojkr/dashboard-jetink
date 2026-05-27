# AI_CONTEXT — dashboard-jetink

Documentação arquitetural operacional. Reflete o estado atual do código. Leia antes de qualquer modificação.

---

## 1. Natureza do sistema

SPA 100% client-side. Sem backend, sem API, sem persistência.

- **Única fonte de dados**: arquivo `.xlsx` carregado pelo usuário via `<input type="file">` ou drag-and-drop.
- **Ciclo de vida dos dados**: upload → parse → memória Pinia → computed → UI. Reload do navegador = reset total.
- **Única feature**: Dashboard de Atendimentos Técnicos JETINK.

---

## 2. Stack

| Dependência | Versão | Padrão de uso |
|---|---|---|
| vue | ^3.5.34 | `<script setup>` + TypeScript, Composition API |
| pinia | ^3.0.4 | stores composition-style (`defineStore(() => {})`) |
| echarts | ^6.1.0 | tree-shaken via `use([...])` em `BaseChart.vue` |
| vue-echarts | ^8.0.1 | `VChart` registrado globalmente em `main.ts` |
| vue-router | ^4.6.4 | `createWebHistory`, rota única `/dashboard` |
| tailwindcss | ^4.3.0 | tokens via `@theme` em `src/style.css`. Sem `tailwind.config.js` |
| @tailwindcss/vite | ^4.3.0 | plugin Vite para Tailwind v4 |
| xlsx | ^0.18.5 | SheetJS, parse client-side, `cellDates: true` obrigatório |
| typescript | ~6.0.2 | strict mode |
| vite | ^8.0.12 | bundler |

---

## 3. Arquitetura

### Estrutura de pastas

```
src/
  assets/
    maps/brazil-states.json   ← GeoJSON IBGE qualidade mínima (~97 KB, 27 estados)
  components/
    shared/                   ← componentes reutilizáveis com props (KpiCard, HBarList, RankingList, EmptyState, FileUpload)
    ui/                       ← primitivos (BaseChart, BaseCard, BaseButton, BaseSelect, BaseTabs)
  composables/                ← view-model layer (puros, exceto useExcelUpload)
  pages/
    Dashboard/
      DashboardPage.vue
      components/             ← Dashboard<X>.vue, cada um consome 1 composable de domínio
  router/
  services/                   ← boundary de IO (atendimentoService.ts)
  stores/                     ← fonte de verdade (Pinia)
  types/                      ← contratos de domínio (Atendimento.ts)
  utils/                      ← funções puras (excelMapper, grouping, dateHelpers, estadoMap, chartTheme)
  main.ts
  style.css                   ← tokens Tailwind via @theme + @media print
```

### Direção de dependência (estrita, não inverter)

```
UI components
  └→ composables
       └→ stores (via storeToRefs)
            └→ types
       └→ utils (grouping, dateHelpers, estadoMap, chartTheme)
services
  └→ utils/excelMapper
       └→ utils/estadoMap
       └→ types
composables/useExcelUpload     ← único composable que importa service
```

**Proibido**: service importar composable ou store. Componente importar service diretamente.

---

## 4. Fluxo de dados

```
<FileUpload> @file
  → useExcelUpload.carregar(file)
    1. atendimentoService.lerArquivo(file)
         FileReader (Promise)
         → xlsx.read(uint8, { type: 'array', cellDates: true })
         → workbook.SheetNames[0]  ← apenas primeira aba
         → utils.sheet_to_json<AtendimentoExcelRow>(sheet)
         → mapExcelRows(rows)
              → mapExcelRow(row) por linha
                   → parseDate(row.Data)  ← null = linha descartada
                   → parseStatus(row.Status)
                   → cleanText(row.Estado), etc.
                   → cleanText(row['Estado Revenda'] ?? row['Estado Revendedor'])
                        → uf.toUpperCase()
                        → getEstadoNome(uf)
                   → retorna Atendimento | null
    2. Valida atendimentos.length > 0 (senão throw)
    3. filtrosStore.limpar()
    4. atendimentosStore.setAtendimentos(items, file.name)
    5. filtrosStore.ajustarParaDados(items)

Pinia stores (fonte de verdade)
  ↓ storeToRefs
useAtendimentos()              ← PORTA ÚNICA para lista filtrada
  → computed filtrados por ano / mes / status
  ↓
useKpis, useRanking, useDistribuicao, useGraficosResumo, DashboardMapa
  → EChartsOption via computed<EChartsOption | null>
  → BaseChart.vue (VChart)

useEvolucao                    ← EXCEÇÃO: usa raw store (sem filtro) para comparação inter-anual
  → EChartsOption via computed<EvolutionResult>
```

---

## 5. Contrato de domínio — `Atendimento`

```
interface Atendimento {
  // Derivados em mapExcelRow — uma única vez
  data: Date           // objeto Date nativo
  iso: string          // 'YYYY-MM-DD'
  ym: string           // 'YYYY-MM'
  year: string         // 'YYYY'
  dow: number          // 0=Dom, 1=Seg … 6=Sáb (date.getDay())

  status: 'Novo' | 'Recorrente'
  revendedor: string   // '' se ausente
  estado: string       // coluna "Estado" — texto livre, '' se ausente
  programa: string     // '' se ausente
  impressora: string   // '' se ausente

  estadoUf?: string    // UF uppercase derivada da coluna "Estado Revenda"
  estadoNome?: string  // Nome completo derivado via UF_TO_ESTADO
}
```

**Distinção crítica**: `estado` (campo livre da coluna "Estado") ≠ `estadoUf`/`estadoNome` (derivados da coluna "Estado Revenda" via `estadoMap.ts`).

`estadoUf` e `estadoNome` são `undefined` quando "Estado Revenda" (ou alias "Estado Revendedor") está ausente — **não são string vazia**.

Campos derivados (`ym`, `year`, `dow`, `iso`, `estadoNome`) são calculados **uma única vez** em `mapExcelRow`. Não recalcular em composables ou componentes.

---

## 6. Regras de normalização (excelMapper.ts)

### Coluna `Data`
- Aceita: `Date`, `number` (serial Excel), `string` parseável por `new Date()`.
- Inválida → linha descartada silenciosamente (`mapExcelRow` retorna `null`).
- `cellDates: true` é obrigatório no `xlsx.read`. Sem isso, datas chegam como número serial.

### Coluna `Status`
- `parseStatus`: case-insensitive, prefixo `'rec'` → `'Recorrente'`.
- Qualquer outro valor → `'Novo'` (default seguro).
- Aceita: "Rec", "rec", "RECORRENTE", "recurring", etc.

### Campos de texto (`cleanText`)
- `null`/`undefined` → `''`.
- String `'--'` → `''` (sentinel de "sem dado").
- Outros: trim.

### Coluna de estado da revenda
- Lida com fallback: `row['Estado Revenda'] ?? row['Estado Revendedor']`.
- Texto cleanText → `.toUpperCase()`.
- Vazio → `estadoUf = undefined`, `estadoNome = undefined`.
- Preenchido → `getEstadoNome(uf)`; UF desconhecida → retorna a própria UF como fallback.

### Normalização de estado (`estadoMap.ts`)
- **Fonte única**: `UF_TO_ESTADO` (27 entradas: AC→Acre … TO→Tocantins).
- `ESTADOS_BRASIL`: `Object.values(UF_TO_ESTADO)` exportado para o mapa.
- `getEstadoNome(uf)`: UF sempre uppercase. Fallback = retorna `uf`.
- `resolverNomeEstado(raw)`: aceita UF ou nome (com/sem acentos), retorna nome canônico ou `undefined`.
- **Conversão ocorre exclusivamente em `mapExcelRow` e `DashboardMapa`**. Nunca em outro composable ou store.

---

## 7. Invariantes — NÃO QUEBRAR

1. **`useAtendimentos()` é a única porta para dados filtrados.** Exceção documentada: `useEvolucao` usa raw store para comparações inter-anuais.

2. **`'Todos'` é sentinel literal** em `filtro.ano`, `filtro.mes` e `filtro.status`. Nunca substituir por `null`/`undefined`.

3. **Mudança de `ano` reseta `mes` para `'Todos'`** em `useFiltrosAtendimentoStore.atualizar`. Não mutar `filtro` diretamente — usar sempre `atualizar()`.

4. **`filtroInicial()` retorna o mês anterior**, não o mês atual. Janeiro → dezembro do ano anterior.

5. **Sequência de `useExcelUpload.carregar`** é rígida: lê arquivo → valida não-vazio → `filtros.limpar()` → `setAtendimentos` → `filtros.ajustarParaDados`. Mudar ordem = bug de estado.

6. **`mapExcelRows` é síncrono**. Não introduzir `await` no loop.

7. **Linhas sem `Data` válida são descartadas silenciosamente**. Exceção só se zero linhas válidas no total.

8. **`BaseChart.vue` é o único ponto de registro de chart types ECharts** via `use([...])` e `registerMap`. Todo novo tipo deve ser adicionado lá antes de ser usado.

9. **GeoJSON `properties.name`** = nome completo idêntico ao valor em `UF_TO_ESTADO`. Qualquer divergência quebra o choropleth silenciosamente.

10. **ECharts options são sempre `computed<EChartsOption | null>`**, nunca funções síncronas no template.

11. **`useExcelUpload` não é singleton**. Cada instância tem refs próprias. `DashboardTopbar` usa apenas `reset()` da sua instância.

12. **`limpar()` em ambos os stores deve refletir todos os campos**. Adicionar campo novo → atualizar `limpar()`.

13. **Cores ECharts vêm de `utils/chartTheme.ts`**. Não declarar hex literal em composables ou componentes — quebra fonte única.

---

## 8. Integração com ECharts

### Componentes registrados em `BaseChart.vue use([...])`
```
CanvasRenderer
LineChart, BarChart, PieChart, MapChart
TitleComponent, TooltipComponent, LegendComponent, GridComponent
MarkLineComponent, GeoComponent, VisualMapComponent
```

### Registro do mapa
- `registerMap('brazil', brazilMap)` no nível do módulo em `BaseChart.vue`.
- Usa `echarts/core` (tree-shaking preservado).

### GeoJSON: `src/assets/maps/brazil-states.json`
- Fonte: IBGE API qualidade mínima, 27 features.
- Tamanho: ~97 KB.
- `properties.name` = nome completo (ex: "São Paulo"), idêntico a `UF_TO_ESTADO`.

### Falhas silenciosas
- Chart type não registrado → gráfico não renderiza, sem erro no console.
- Nome de estado divergente entre GeoJSON e `UF_TO_ESTADO` → estado aparece em cinza sem dado.

### Restrição
Nunca usar `import * as echarts from 'echarts'`. Quebra tree-shaking.

---

## 9. Tema de gráficos (`utils/chartTheme.ts`)

Centraliza cores, helpers de tooltip e axis styles consumidos por todo composable/componente que produz `EChartsOption`.

### Exports
- `CHART_COLORS`: paleta semântica (novo, recorrente, accent, accentLight, textPrimary, textSecondary, bgCard, bgCardHover, border, borderLight).
- `STATUS_COLOR`: `Record<StatusFiltro, string>` para mapear filtro de status → cor.
- `MAP_COLORS`: cores específicas do choropleth (highlight top3, hasData, neutral, borders).
- `chartBase()`: backgroundColor + textStyle + tooltip padrão.
- `chartTooltip()`: configuração de tooltip dark (cor de fundo, borda, textStyle).
- `axisLabelStyle()`, `categoryAxisLine()`, `valueSplitLine()`: helpers de eixo.

### Regra
Hex literal só pode aparecer em `chartTheme.ts` e em `style.css` (`@theme`). Nenhum outro arquivo deve declarar hex de cor de gráfico.

---

## 10. Convenções implícitas

- Composables retornam objetos com `ref`/`computed` destrutruráveis.
- ECharts options sempre em `computed`. Nunca função síncrona chamada do template.
- `Dashboard<X>.vue`: sem props de dados. Cada um instancia seu próprio composable de domínio.
- Componentes "puros" (KpiCard, HBarList, etc.): recebem props tipadas, não chamam composables de domínio.
- Toda seção do dashboard usa `BaseCard` + `class="animate-fade-up"`.
- `data-print="hide"` / `data-print="show"`: toda nova seção declara explicitamente sua presença no PDF.
- Grids do dashboard usam `gap-5` e `mb-7` para espaçamento consistente.

---

## 11. Acoplamentos críticos

| Acoplamento | Arquivos | Risco se quebrado |
|---|---|---|
| `Kpi` type exportado de `useKpis` | `useKpis.ts` → `KpiCard.vue` | Mover type quebra KpiCard |
| Cores `chartTheme` ≡ tokens `@theme` | `utils/chartTheme.ts` ↔ `style.css` | Dessincronização visual silenciosa |
| Nomes em `UF_TO_ESTADO` ≡ `properties.name` GeoJSON | `estadoMap.ts` ↔ `brazil-states.json` | Estados sem dado no mapa |
| Sequência de `useExcelUpload.carregar` | `useExcelUpload.ts` ↔ ambos os stores | Snap de filtro antes dos dados |
| `useGraficosResumo` consome `useDistribuicao().weekday` | `useGraficosResumo.ts` ↔ `useDistribuicao.ts` | `weekday` não pode ser removido |
| Ordem de componentes em `DashboardPage.vue` = ordem do PDF | `DashboardPage.vue` | Reordenar = mudar layout impresso |
| `useEvolucao` usa raw store | `useEvolucao.ts` ↔ `useAtendimentosStore` | Exceção arquitetural justificada |

---

## 12. Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Filtrar `atendimentosStore.atendimentos` diretamente | Filtros do usuário não se aplicam |
| Lógica de negócio em `atendimentoService` | Service é boundary puro de IO |
| Lançar exceção por linha inválida em `mapExcelRow` | Derruba o lote inteiro |
| `import * as echarts from 'echarts'` | Anula tree-shaking |
| Chart type não registrado em `BaseChart.vue` | Falha silenciosa de renderização |
| Mutar `filtro` diretamente sem `atualizar()` | Bypassa reset de `mes` ao mudar `ano` |
| Converter UF↔nome fora de `mapExcelRow`/`DashboardMapa` | Duplica lógica de `estadoMap.ts` |
| Ler `carregando`/`erro` da instância de `useExcelUpload` do Topbar | Não reflete o estado real do upload |
| Nova seção sem `data-print` | Aparece no PDF sem intenção |
| Usar `null`/`undefined` como sentinel de filtro | Quebra todos os composables |
| Hex de cor fora de `chartTheme.ts` ou `style.css` | Quebra fonte única visual |

---

## 13. Hotspots e limitações

- **Parsing xlsx na thread principal**: arquivo grande congela UI. Sem validação de tamanho.
- **Sem contagem de linhas descartadas**: usuário não vê quantas linhas foram ignoradas.
- **Sem validação de schema**: colunas em inglês → todas as linhas inválidas → erro genérico.
- **`estadoUf`/`estadoNome` são opcionais**: planilhas sem "Estado Revenda" são válidas. Código que usa esses campos deve tratar `undefined`.
- **`xlsx` 0.18.5** tem CVEs históricos. Atualizar exige verificar nomes de export e comportamento de `cellDates`.
- **GeoJSON (~97 KB)** importado estaticamente no bundle.
- **Sem persistência**: reload = perda total dos dados.
- **Sem memoização entre composables**: cada um refiltra/reagrega independentemente.
- **Botão "Nova Planilha" não confirma**: clique acidental destrói dados em memória.

---

## 14. Índice de contextos locais

| Arquivo | Escopo |
|---|---|
| `src/services/CONTEXT.md` | Contrato Excel, parsing, invariantes do service |
| `src/stores/CONTEXT.md` | Regras dos dois stores, filtro inicial, snap de dados |
| `src/composables/CONTEXT.md` | Mapa de dependências, responsabilidades, documentação por composable |
| `src/pages/Dashboard/CONTEXT.md` | Composição da página, print mode, condicionais |

**Precedência**: CONTEXT.md local > este arquivo global.
