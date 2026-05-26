# AI_CONTEXT — dashboard-jetink

Contexto arquitetural operacional. Reflete o estado atual do código. Leia antes de qualquer modificação.

---

## 1. Natureza do sistema

SPA 100% client-side. Sem backend, sem API, sem persistência.

- **Única fonte de dados**: arquivo `.xlsx` carregado pelo usuário via `<input type="file">` ou drag-and-drop
- **Ciclo de vida de dados**: upload → parse → memória Pinia → computed → UI. Reload = reset total
- **Única feature**: Dashboard de atendimentos técnicos JETINK

---

## 2. Stack (versões exatas do package.json)

| Dependência | Versão | Padrão de uso |
|---|---|---|
| vue | ^3.5.34 | `<script setup>` + TypeScript, Composition API |
| pinia | ^3.0.4 | composition-style stores (`defineStore(() => {})`) |
| echarts | ^6.1.0 | tree-shaken via `use([...])` em `BaseChart.vue` |
| vue-echarts | ^8.0.1 | `VChart` global em `main.ts` |
| vue-router | ^4.6.4 | `createWebHistory`, rota única `/` |
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
    maps/
      brazil-states.json     ← GeoJSON IBGE qualidade mínima (97 KB, 27 estados)
  components/
    shared/                  ← componentes reutilizáveis com props (KpiCard, HBarList, RankingList, EmptyState, FileUpload)
    ui/                      ← primitivos (BaseChart, BaseCard, BaseButton, BaseSelect, BaseTabs)
  composables/               ← view-model layer (sem side effects, exceto useExcelUpload)
  pages/
    Dashboard/
      DashboardPage.vue
      components/            ← Dashboard<X>.vue, cada um consome 1 composable
  router/
  services/                  ← boundary de IO (atendimentoService.ts)
  stores/                    ← fonte de verdade (Pinia)
  types/                     ← contratos de domínio (Atendimento.ts)
  utils/                     ← funções puras (excelMapper, grouping, dateHelpers, estadoMap)
  main.ts
  style.css                  ← @theme Tailwind + @media print
```

### Direção de dependência (estrita, não inverter)

```
UI components
  └→ composables
       └→ stores (via storeToRefs)
            └→ types
       └→ utils (grouping, dateHelpers, estadoMap)
services
  └→ utils/excelMapper
       └→ utils/estadoMap
       └→ types
composables/useExcelUpload  ← único que importa service
```

**Proibido**: service importar composable ou store. Componente importar service diretamente.

---

## 4. Fluxo de dados real

```
<FileUpload> @file
  → useExcelUpload.carregar(file)
    1. filtrosStore.limpar()
    2. atendimentoService.lerArquivo(file)
         → FileReader (Promise)
         → xlsx.read(uint8, { type: 'array', cellDates: true })
         → workbook.SheetNames[0]  ← apenas primeira aba
         → utils.sheet_to_json<AtendimentoExcelRow>(sheet)
         → mapExcelRows(rows)
              → mapExcelRow(row) para cada linha
                   → parseDate(row.Data)  ← null = linha descartada
                   → parseStatus(row.Status)
                   → cleanText(row.Estado), etc.
                   → cleanText(row['Estado Revenda'])
                        → getEstadoNome(uf.toUpperCase())
                   → retorna Atendimento | null
    3. atendimentosStore.setAtendimentos(items, file.name)
    4. filtrosStore.ajustarParaDados(items)

Pinia stores (fonte de verdade)
  ↓ storeToRefs
useAtendimentos()  ← PORTA ÚNICA para lista filtrada
  → computed filtrados (por ano, mes, status)
  ↓
useKpis, useRanking, useDistribuicao, useGraficosResumo
  → EChartsOption via computed<EChartsOption | null>
  → BaseChart.vue (VChart)

useEvolucao  ← exceção: usa todos atendimentos (raw store, sem filtro)
  → EChartsOption via computed<EvolutionResult>
```

---

## 5. Contrato de domínio — `Atendimento`

```typescript
interface Atendimento {
  // Obrigatórios — derivados do parsing
  data: Date           // objeto Date nativo
  iso: string          // 'YYYY-MM-DD' (date.toISOString().slice(0, 10))
  ym: string           // 'YYYY-MM' (iso.slice(0, 7))
  year: string         // 'YYYY'    (iso.slice(0, 4))
  dow: number          // 0=Dom, 1=Seg … 6=Sáb (date.getDay())
  status: 'Novo' | 'Recorrente'
  revendedor: string   // '' se ausente
  estado: string       // coluna "Estado" — texto livre, '' se ausente
  programa: string     // '' se ausente
  impressora: string   // '' se ausente
  // Opcionais — da coluna "Estado Revenda"
  estadoUf?: string    // UF uppercase ('SP', 'RJ'). undefined se coluna ausente/vazia
  estadoNome?: string  // Nome completo derivado via estadoMap ('São Paulo'). undefined se estadoUf undefined
}
```

**Distinção crítica**: `estado` (campo livre da coluna "Estado") ≠ `estadoUf`/`estadoNome` (derivados da coluna "Estado Revenda" via `estadoMap.ts`).

`estadoUf` e `estadoNome` são `undefined` quando a coluna "Estado Revenda" está ausente ou vazia — **não são string vazia**.

Campos derivados (`ym`, `year`, `dow`, `iso`, `estadoNome`) são calculados **uma única vez** em `mapExcelRow`. Não recalcular em composables ou componentes.

---

## 6. Regras de normalização (excelMapper.ts)

### Coluna `Data`
- Aceita: `Date`, `number` (serial Excel), `string` parseável por `new Date()`
- Inválida → linha descartada silenciosamente (`mapExcelRow` retorna `null`)
- `cellDates: true` é obrigatório no `xlsx.read` — sem isso, datas chegam como número serial

### Coluna `Status`
- `parseStatus`: case-insensitive, checa prefixo `'rec'` → `'Recorrente'`
- Qualquer outro valor → `'Novo'` (default seguro)
- Aceita: "Rec", "rec", "RECORRENTE", "recurring", etc.

### Campos texto (`cleanText`)
- `null`/`undefined` → `''`
- String `'--'` → `''` (sentinel de "sem dado")
- Outros: trim

### Coluna `'Estado Revenda'`
- Texto lido via `cleanText`, depois `.toUpperCase()`
- Se vazio → `estadoUf = undefined`, `estadoNome = undefined`
- Se preenchido → `getEstadoNome(uf)`: busca em `UF_TO_ESTADO`; UF desconhecida → retorna a própria UF como fallback

### Normalização de estado (`estadoMap.ts`)
- **Fonte única**: `UF_TO_ESTADO` (27 entradas: AC→Acre … TO→Tocantins)
- `ESTADO_TO_UF`: inverso calculado no módulo
- `getEstadoNome(uf)`: UF sempre uppercase. Fallback = retorna uf
- `getEstadoUF(nome)`: fallback = retorna nome
- **Conversão ocorre exclusivamente em `mapExcelRow`**. Nunca em composable, componente ou store

---

## 7. Invariantes — NÃO QUEBRAR

1. **`useAtendimentos()` é a única porta para dados filtrados.** Exceção documentada: `useEvolucao` usa raw store para comparações inter-anuais.

2. **`'Todos'` é sentinel literal** em `filtro.ano`, `filtro.mes` e `filtro.status`. Nunca substituir por `null`/`undefined`.

3. **Mudança de `ano` reseta `mes` para `'Todos'`** em `useFiltrosAtendimentoStore.atualizar`. Não mutar `filtro` diretamente — usar sempre `atualizar()`.

4. **`filtroInicial()` retorna o mês anterior**, não o mês atual. Janeiro → dezembro do ano anterior.

5. **Sequência de `useExcelUpload.carregar`** é rígida: `filtros.limpar()` → `service.lerArquivo` → `setAtendimentos` → `filtros.ajustarParaDados`. Mudar ordem = bug de estado.

6. **`mapExcelRows` é síncrono**. Não introduzir `await` no loop.

7. **Linhas sem `Data` válida são descartadas silenciosamente**. Exceção só se zero linhas válidas.

8. **`BaseChart.vue` é o único ponto de registro de chart types ECharts** via `use([...])` e `registerMap`. Todo novo tipo de chart deve ser adicionado lá antes de ser usado.

9. **GeoJSON `properties.name`** = nome completo idêntico ao valor em `UF_TO_ESTADO`. Qualquer divergência quebra o choropleth silenciosamente.

10. **ECharts options são sempre `computed<EChartsOption | null>`**, nunca funções síncronas no template.

11. **`useExcelUpload` não é singleton**. Cada instância tem refs independentes. `DashboardTopbar` usa apenas `reset()` da sua instância.

12. **`limpar()` em ambos os stores reflete todos os campos**. Adicionar campo novo → atualizar `limpar()`.

---

## 8. Integração com ECharts

### Componentes registrados em `BaseChart.vue use([...])`
```
CanvasRenderer, LineChart, BarChart, PieChart, MapChart,
TitleComponent, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent,
GeoComponent, VisualMapComponent
```

### Registro do mapa
```typescript
import { registerMap } from 'echarts/core'
import brazilMap from '@/assets/maps/brazil-states.json'
registerMap('brazil', brazilMap as never)
```
Chamado no nível do módulo em `BaseChart.vue`. Usa `echarts/core` (tree-shaking preservado).

### GeoJSON: `src/assets/maps/brazil-states.json`
- Fonte: IBGE API qualidade mínima, 27 features
- Tamanho: ~97 KB
- Propriedade de nome: `properties.name` = nome completo (ex: "São Paulo")
- Nomes devem ser idênticos aos valores de `UF_TO_ESTADO`

### Falhas silenciosas
Chart type não registrado → gráfico não renderiza, sem erro no console.

### Restrição
Nunca usar `import * as echarts from 'echarts'` — importa bundle completo.

---

## 9. Convenções implícitas

- Composables retornam objetos com `ref`/`computed` destrutruráveis
- ECharts options sempre em `computed`, nunca criadas em função síncrona
- `darkBase()` e `baseTheme()`: helpers locais em `useGraficosResumo` e `useEvolucao` (duplicação deliberada — não consolidar sem testar ambos)
- `Dashboard<X>.vue`: sem props de dados, cada um instancia seu próprio composable
- Componentes "puros" (KpiCard, HBarList, etc.): recebem props, não chamam composables de domínio
- Toda seção do dashboard usa `BaseCard` + `class="animate-fade-up"`
- `data-print="hide"` / `"show"`: toda nova seção deve declarar explicitamente

---

## 10. Acoplamentos críticos

| Acoplamento | Arquivos | Risco |
|---|---|---|
| `Kpi` type exportado de `useKpis` | `useKpis.ts` → `KpiCard.vue` | Mover type quebra KpiCard |
| Cores hardcoded ≡ tokens `@theme` | `useEvolucao.ts`, `useGraficosResumo.ts` ↔ `style.css` | Dessincronização silenciosa |
| Nomes em `UF_TO_ESTADO` ≡ `properties.name` GeoJSON | `estadoMap.ts` ↔ `brazil-states.json` | Divergência = estados sem dado no mapa |
| Sequência de `useExcelUpload.carregar` | `useExcelUpload.ts` ↔ ambos os stores | Mudar ordem → snap de filtro antes dos dados |
| `useGraficosResumo` depende de `useDistribuicao.weekday` | `useGraficosResumo.ts` ↔ `useDistribuicao.ts` | `weekday` não pode ser removido |
| Ordem de componentes em `DashboardPage.vue` = ordem do PDF | `DashboardPage.vue` | Reordenar = mudar layout impresso |

---

## 11. Anti-patterns

| Anti-pattern | Consequência |
|---|---|
| Filtrar `atendimentosStore.atendimentos` direto | Filtros não se aplicam |
| Lógica de negócio em `atendimentoService` | Service é boundary puro de IO |
| Lançar exceção por linha inválida em `mapExcelRow` | Derruba o lote inteiro |
| `import * as echarts from 'echarts'` | Anula tree-shaking |
| Chart type não registrado em `BaseChart.vue` | Falha silenciosa |
| Mutar `filtro` diretamente | Bypassa reset de `mes` ao mudar `ano` |
| Converter UF↔nome fora de `mapExcelRow` | Duplica lógica de `estadoMap.ts` |
| Ler `carregando`/`erro` da instância `useExcelUpload` do Topbar | Não reflete estado real do upload |
| Nova seção sem `data-print` | Aparece no PDF inesperadamente |
| Usar `null`/`undefined` como sentinel de filtro | Quebra todos os composables |

---

## 12. Hotspots e limitações

- **Parsing xlsx na thread principal**: arquivo grande congela UI. Sem validação de tamanho.
- **Sem contagem de linhas descartadas**: usuário não vê quantas linhas foram ignoradas.
- **Sem validação de schema**: colunas em inglês → todas linhas inválidas → erro genérico.
- **Cores hardcoded duplicadas** em composables vs tokens `@theme`.
- **`estadoUf`/`estadoNome` são opcionais**: planilhas sem "Estado Revenda" são válidas. Código que usa esses campos deve tratar `undefined`.
- **`xlsx` 0.18.5** tem CVEs históricos. Atualizar exige checar nomes de export.
- **GeoJSON (~97 KB)** importado estaticamente no bundle.
- **Sem persistência**: reload = perda de todos os dados.

---

## 13. Índice de contextos locais

| Arquivo | Escopo |
|---|---|
| `src/services/CONTEXT.md` | Contrato Excel, parsing, invariantes do service |
| `src/stores/CONTEXT.md` | Regras dos dois stores, filtro inicial, snap de dados |
| `src/composables/CONTEXT.md` | Mapa de dependências, convenções, documentação por composable |
| `src/pages/Dashboard/CONTEXT.md` | Composição da página, print mode, condicionais de renderização |

**Precedência**: CONTEXT.md local > este arquivo global.
