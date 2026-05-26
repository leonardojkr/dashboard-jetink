# AI_CONTEXT — dashboard-jetink

Contexto arquitetural denso para agentes de IA e mantenedores. Lê isso antes de tocar qualquer coisa.

---

## 1. Natureza do sistema

- SPA client-side **100% no navegador**. Sem backend, sem API, sem banco, sem auth.
- Fonte de dados única: planilha `.xlsx` que o usuário faz upload manualmente.
- Estado vive em memória (Pinia). **Reload → perde tudo.** Não há persistência (nem localStorage).
- Domínio único: dashboard de "atendimentos técnicos" da JETINK (status `Novo` / `Recorrente`).
- Não é multi-tenant, não tem usuários, não tem permissões. Single-user, single-session.

## 2. Stack real (versões em `package.json`)

| Camada | Tech |
|---|---|
| UI | Vue 3.5 (`<script setup>`, Composition API) |
| Build | Vite 8 + `@vitejs/plugin-vue` 6 |
| Linguagem | TypeScript ~6.0 (strict via `vue-tsc`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`) |
| Estado | Pinia 3 (stores **composition-style**, não options-style) |
| Routing | vue-router 4 (`createWebHistory`) |
| Estilo | **Tailwind v4** via `@tailwindcss/vite`. **Sem `tailwind.config.js`** — tema fica em `src/style.css` no bloco `@theme`. |
| Charts | `echarts` 6 (tree-shaken) + `vue-echarts` 8 registrado globalmente como `<VChart>` em `main.ts` |
| Excel | `xlsx` 0.18 (SheetJS, parsing client-side) |
| Path alias | `@/*` → `./src/*` (definido em `vite.config.ts` E `tsconfig.app.json` — manter os dois sincronizados) |

Não existe: testes, lint config (eslint/prettier), CI, env vars, Docker, prerender/SSR.

## 3. Arquitetura

**Modular feature-based + camadas**, monolítica frontend. Estrutura:

```
src/
  pages/Dashboard/         ← única feature; page + componentes feature-scoped
  components/
    ui/                    ← primitivos (Base*)
    shared/                ← reuso cross-feature (FileUpload, KpiCard, ...)
  composables/             ← view-model: derivações + opções ECharts
  stores/                  ← fonte da verdade (Pinia)
  services/                ← IO (Excel)
  utils/                   ← funções puras (dateHelpers, grouping, excelMapper)
  types/                   ← contratos de domínio
  layouts/                 ← shell de rotas
  router/                  ← config vue-router
  style.css                ← tema Tailwind v4 (@theme) + animações + print rules
  main.ts                  ← bootstrap
```

Direção de dependência permitida:

```
pages → components(shared, ui) → (apenas types)
pages/components → composables → stores → utils/types
                              → services → utils/types
```

**Nunca**: store importando composable; util importando store; component importando service direto (composable é a porta).

## 4. Fluxo de dados real

### Upload (entrada)
```
FileUpload.vue (drag/click) ──emit('file')──> useExcelUpload.carregar(file)
  → atendimentoService.lerArquivo(file)
      → FileReader.readAsArrayBuffer → xlsx.read({ cellDates: true })
      → utils.sheet_to_json (primeira sheet apenas) → mapExcelRows
  → useAtendimentosStore.setAtendimentos(items, fileName)
  → useFiltrosAtendimentoStore.ajustarParaDados(items)  ← snap filtro p/ último ym dos dados
```

### Render (saída)
```
DashboardPage v-if temDados ──> renderiza topbar+filtros+seções
Filtros mudam ──> useFiltrosAtendimentoStore.atualizar
useAtendimentos.filtrados (computed) ──> recomputa
Todos composables de leitura (useKpis, useEvolucao, useGraficosResumo, useRanking, useDistribuicao)
  derivam DESSE computed e regeram suas próprias options ECharts
```

### Reset
`DashboardTopbar` → `useExcelUpload().reset()` → limpa AMBOS stores → `temDados` vira false → volta para `DashboardUploadScreen`.

## 5. Invariantes — **NÃO QUEBRAR**

1. **`useAtendimentos()` é a porta única** para dados filtrados. Todo gráfico/KPI consome ele. Não filtrar `atendimentosStore.atendimentos` diretamente em componentes.
2. **`AtendimentoFiltro` tem exatamente 3 campos**: `ano`, `mes`, `status`. Adicionar campo exige atualizar: type + `filtroInicial()` + `atualizar()` + `useAtendimentos.filtrados` + todos consumidores.
3. **Formato de chaves temporais é fixo**:
   - `Atendimento.ym` = `"YYYY-MM"` (usado como filtro de mês e chave de agregação)
   - `Atendimento.year` = `"YYYY"`
   - `Atendimento.iso` = `"YYYY-MM-DD"`
   - `Atendimento.dow` = 0..6 (domingo=0); gráfico de weekday só usa 1..5.
   - Esses campos são computados **uma única vez** em `excelMapper.mapExcelRow` e nunca recalculados.
4. **Parsing de status**: qualquer string começando com `"rec"` (case-insensitive) → `'Recorrente'`. Qualquer outra coisa (incluindo vazio, lixo) → `'Novo'`. Default = `Novo`. Isso é regra de negócio, não bug.
5. **Colunas do Excel são hardcoded** (`Data`, `Status`, `Revendedor`, `Estado`, `Programa`, `Impressora`). Linha sem `Data` válida = descartada **silenciosamente**.
6. **Mudança de ano resseta mês**: `atualizar('ano', ...)` força `mes = 'Todos'` (regra implícita em `useFiltrosAtendimentoStore.atualizar`).
7. **ECharts tree-shaking centralizado em `components/ui/BaseChart.vue`**: o `use([...])` lista exatamente os tipos/components ECharts disponíveis. Usar um chart/component não registrado lá → **falha silenciosa em runtime** (gráfico em branco, sem erro no console).
8. **`<VChart>` está globalmente registrado em `main.ts`** mas `BaseChart.vue` também importa `VChart` localmente. As duas formas funcionam — **não remover nenhuma sem revisar a outra**.
9. **Filtro inicial favorece mês anterior** (`filtroInicial()` em `useFiltrosAtendimentoStore.ts`). Se janeiro, retorna dezembro do ano anterior. Mantém continuidade entre meses.
10. **`ajustarParaDados`**: se o filtro inicial não bate com nenhum `ym` da planilha, o filtro snapa para o último `ym` disponível. Sempre chamar após `setAtendimentos`.

## 6. Acoplamentos críticos

- **Cores hex duplicadas** em 2 lugares: `style.css` `@theme` (`--color-jet-*`, `--color-accent*`) **E** strings hex literais nas options ECharts (`useGraficosResumo`, `useEvolucao`). Trocar cor exige atualizar os dois. **Dívida real.**
- **`darkBase()` duplicado**: `useGraficosResumo.ts` e `useEvolucao.ts` ambos definem helper local `darkBase()/baseTheme()` com a mesma estrutura de tooltip/textStyle. Copy-paste.
- **Type `Kpi` mora em `composables/useKpis.ts`** e é importado por `components/shared/KpiCard.vue`. Component depende de tipo de composable (acoplamento ascendente, mas tolerável).
- **Dois stores acoplados em `useExcelUpload`**: ele ortografa as duas mutações (`atendimentosStore` + `filtrosStore`). Adicionar store novo de domínio sem atualizar `useExcelUpload.carregar`/`reset` = inconsistência.
- **`useAtendimentoFilters` é wrapper sobre `useFiltrosAtendimentoStore`**: duas superfícies para a mesma coisa. Composable expõe `anos`, `meses`, `podeGerarRelatorio` derivados; resto delega ao store. Não criar uma terceira superfície.

## 7. Anti-patterns existentes (dívida técnica real)

| # | Item | Risco |
|---|---|---|
| 1 | Hex codes hardcoded em composables (`#00D68F`, `#FFA44F`, `#6C5CE7`, etc.) duplicando `@theme` | Drift visual quando trocar paleta |
| 2 | `darkBase()/baseTheme()` duplicado em 2 composables | Drift de estilo dos tooltips |
| 3 | `useExcelUpload` não é singleton — instanciado por `DashboardUploadScreen` E `DashboardTopbar`. `carregando`/`erro` refs não são compartilhados | Footgun: topbar nunca lê esses refs hoje, mas se ler vai falhar |
| 4 | `mapExcelRow` descarta linhas inválidas **silenciosamente** (sem contagem nem warning) | Usuário não sabe quantas linhas foram ignoradas |
| 5 | Sem validação de tamanho/MIME do arquivo. xlsx parsing roda na thread principal | Bloqueia UI em arquivos grandes |
| 6 | Nenhuma camada de error boundary | Composable que joga = dashboard inteiro quebra |
| 7 | Magic numbers: `limit = 3`, `limit = 5`, `maxVal * 1.18`, `top: 30`, `bottom: 24` | OK por enquanto; vira ruído quando crescer |
| 8 | `DashboardDonut` é o único componente com `defineOptions({ name: ... })` | Inconsistência menor |
| 9 | Formatação de números espalhada (`toLocaleString('pt-BR')`, `.toFixed(1).replace('.', ',')`) | Não há helper central |
| 10 | Print styles via `data-print="hide/show"` espalhados — esquecer atributo num componente novo o quebra na impressão | Convenção frágil sem enforcement |

## 8. Hotspots / gargalos de escalabilidade

- **Filtragem N×M**: cada chart composable refiltra `atendimentos.value`. Hoje com Excel típico (poucos milhares de linhas) é negligível. Acima de ~50k linhas vira problema — derivar **uma vez** em `useAtendimentos` e passar adiante.
- **xlsx síncrono na thread principal**: arquivos grandes congelam a UI. Solução futura: web worker.
- **Pasta `composables/` flat**: hoje 7 arquivos. Se virar 25+, deveria virar `composables/atendimento/`, `composables/charts/`, etc.
- **`pages/` tem só `Dashboard/`**: estrutura suporta multi-feature, mas se nunca surgir outra feature, a indireção é desnecessária.
- **Sem code-splitting além da rota lazy do Dashboard**: bundle inclui ECharts + xlsx no chunk principal do dashboard. `xlsx` poderia ser lazy import só quando o user clica em upload.

## 9. Decisões arquiteturais importantes (preservar)

- **Tudo client-side, deliberado.** Não sugerir backend "porque é o normal". Se precisar de persistência, primeiro destino é `localStorage`/IndexedDB.
- **Pinia composition stores** (não options). Manter o estilo.
- **ECharts tree-shaken**, não import full. Cada `use([...])` adicionado em `BaseChart.vue` é deliberado.
- **Tailwind v4 sem config file.** Tema vive em `src/style.css` `@theme`. Não criar `tailwind.config.js` — ele não vai funcionar com o plugin Vite v4.
- **TypeScript strict** com `noUnusedLocals`/`noUnusedParameters` ligados — `vue-tsc -b` no build vai estourar se sobrar variável.
- **`<script setup>` em tudo.** Sem Options API. Sem `defineComponent`.
- **i18n: pt-BR hardcoded.** Strings em português direto no JSX. Não preparado para i18n.

## 10. Convenções implícitas (não documentadas em lugar nenhum no projeto)

- Arquivos `Dashboard<X>.vue` em `pages/Dashboard/components/` recebem dados via composable próprio, nunca via props (exceto componentes "puros" como `KpiCard`, `HBarList`, `RankingList`).
- `BaseCard` envolve toda seção de gráfico/lista.
- Animação `animate-fade-up` é aplicada em todo card do dashboard (consistência visual).
- ECharts options sempre construídas em `computed` dentro de composable, nunca inline no template.
- Helpers de tema ECharts (`darkBase`/`baseTheme`) são privados ao composable (não exportados).
- Composables retornam `ref`s/`computed`s **destructuráveis** — chamador faz `const { x, y } = useFoo()` direto, não `.value` no retorno.

## 11. O que IA agents tipicamente erram aqui

1. **Adicionar `tailwind.config.js`** achando que vai ser pego (não vai, é v4 + plugin).
2. **Adicionar novo tipo de chart** sem registrar em `BaseChart.vue` `use([...])` → gráfico em branco sem erro.
3. **Adicionar `fetch()` / API call** assumindo backend — não existe.
4. **Mudar nomes de coluna do Excel** sem mexer em `AtendimentoExcelRow` (type) E `mapExcelRow` (parser).
5. **Adicionar campo em `AtendimentoFiltro`** sem propagar para os 5+ pontos de uso.
6. **Trocar `<script setup>` por `defineComponent`** por hábito de outros projetos Vue.
7. **Persistir dados em algum lugar** sem perceber que o reset funciona pela ausência de persistência.
8. **Mexer em cor no `@theme`** e esquecer dos hex literais nos composables ECharts.
9. **Filtrar `atendimentosStore.atendimentos` direto** em componente ignorando `useAtendimentos()`.
10. **Renomear chave de filtro `'Todos'`** sem perceber que é sentinel literal usado em vários `if`s.

## 12. Trade-offs identificados

- **Stateless reload vs. simplicidade**: aceitam-se reloads destruindo dados em favor de fluxo de upload limpo. Trade-off explícito do produto.
- **Composables vs Pinia**: a equipe escolheu composables para view-model e Pinia só para state cru. Mantém Pinia pequeno mas cria dois lugares para procurar lógica.
- **xlsx no client vs server**: cliente puro = zero infra; em troca, parsing pesa na thread principal e arquivos grandes sofrem.

## 13. Diretrizes para contribuição segura

- **Antes de criar arquivo novo**: confira convenção de pasta (composable? store? component shared? feature?).
- **Antes de mexer no Excel**: alterações em colunas exigem migração de `AtendimentoExcelRow` + `excelMapper` + possivelmente o tipo `Atendimento`.
- **Antes de adicionar gráfico**: registre o chart type + components necessários em `BaseChart.vue use([...])`.
- **Antes de adicionar cor**: extenda `@theme` em `style.css` **E** use a mesma cor nas options ECharts.
- **Antes de adicionar filtro**: atualize type, store, `filtroInicial`, `useAtendimentos.filtrados`, UI.
- **Antes de adicionar seção impressa**: defina `data-print="hide"` ou `data-print="show"` consistente com o resto.
- **Não introduza dependência nova** sem necessidade clara. O bundle atual é parcimonioso.
- **Não introduza testes/lint** sem alinhar com o dono — o projeto deliberadamente não tem.

## 14. Onde tem CONTEXT.md local

- `src/pages/Dashboard/CONTEXT.md` — composição da página, regras de print, KPIs condicionais por status
- `src/composables/CONTEXT.md` — view-model layer, padrões de composables, derivações
- `src/stores/CONTEXT.md` — fonte da verdade, regras escondidas do filtro inicial e `ajustarParaDados`
- `src/services/CONTEXT.md` — boundary de IO, contrato Excel, parsing/normalização

## 15. Estrutura futura ideal (quando justificar)

- `composables/` agrupado por domínio: `composables/atendimento/`, `composables/charts/`
- Tokens ECharts em `utils/chartTheme.ts` (helpers + paleta) para eliminar duplicação de cores e `darkBase()`
- `useExcelUpload` virar um Pinia store (`useUploadStore`) para `carregando`/`erro` serem globais
- `services/atendimentoService` rodar parsing em Web Worker para arquivos grandes
- Persistência opcional em IndexedDB (preservar sessões)
- Helper de formatação `utils/format.ts` (`formatNumber`, `formatPercent`, `formatDateBR`) centralizado
- Camada de `errors/` com error boundary no nível de rota
- Quando surgir nova feature: `pages/<Feature>/` com mesma estrutura do Dashboard

## 16. Roadmap de evolução estrutural (priorizado por ROI)

| Prio | Item | Esforço | Benefício |
|---|---|---|---|
| P0 | Centralizar paleta ECharts em `utils/chartTheme.ts` | 1h | Elimina drift de cor (dívida #1 + #2) |
| P0 | Surfaceear linhas descartadas no upload (warning na UI) | 1h | Visibilidade pro usuário |
| P1 | Transformar `useExcelUpload` em store Pinia | 2h | Estado de upload compartilhado/correto |
| P1 | Lazy import `xlsx` só ao clicar em upload | 30min | Bundle inicial menor |
| P2 | Helpers de formatação centralizados | 2h | Tira ruído + consistência |
| P2 | Validação de arquivo (tamanho/MIME) | 1h | UX defensiva |
| P3 | xlsx em Web Worker | 4h | Escala para arquivos grandes |
| P3 | Persistência IndexedDB opcional | 4h | Não perder dados em reload |
| P3 | ErrorBoundary no nível de rota | 2h | Tolerância a falhas |

## 17. Problemas reais vs preferências estéticas

**Problemas reais** (resolver):
- Cor duplicada (drift garantido a médio prazo)
- Linhas Excel descartadas silenciosamente (UX)
- `useExcelUpload` não singleton (footgun esperando)

**Preferências estéticas** (não tocar sem motivo):
- `defineOptions` em só um componente
- Magic numbers em options de gráfico
- Composables flat (cresce se precisar)
- Wrapper `useAtendimentoFilters` vs store direto
