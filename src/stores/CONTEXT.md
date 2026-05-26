# CONTEXT — stores

Fonte da verdade do estado. **Dois stores acoplados**, ambos Pinia composition-style.

## Stores

### `useAtendimentosStore`
- Estado: `atendimentos: Atendimento[]`, `nomeArquivo: string | null`.
- Derivado: `temDados` (≡ length>0), `total`.
- API: `setAtendimentos(items, fileName)`, `limpar()`.
- **Único storage do dataset.** Tudo no app deriva daqui.

### `useFiltrosAtendimentoStore`
- Estado: `filtro: AtendimentoFiltro` (`reactive`, não `ref`).
- API: `atualizar(chave, valor)`, `limpar()`, `ajustarParaDados(atendimentos)`.

## Regras escondidas que precisam ser preservadas

### 1. Filtro inicial não é `'Todos'`
`filtroInicial()` retorna o **mês anterior ao atual**:
- Janeiro → dezembro do ano passado.
- Demais → mês atual − 1, ano corrente.
- `status` inicia em `'Todos'`.

Motivo: dashboard de fechamento mensal. Usuário tipicamente quer ver o último mês fechado.

### 2. Mudança de ano força mês para `'Todos'`
Implementado em `atualizar()`:
```ts
if (chave === 'ano') filtro.mes = 'Todos'
```
**Não remover.** Evita estado inválido (mes de um ano que não tem mais dados).

### 3. `ajustarParaDados` faz snap inteligente do filtro
Após carregar planilha:
- Se o `ym` corrente do filtro **existe** nos dados → mantém.
- Se **não existe** → snapa para o último `ym` da planilha (filtro `ano` e `mes` se ajustam).
- Se planilha vazia → no-op (mas `useExcelUpload` joga erro antes de chegar aqui).

**Sempre chamar após `setAtendimentos`.** Já está orquestrado em `useExcelUpload.carregar`.

### 4. `'Todos'` é sentinel literal
Em `filtro.ano`, `filtro.mes`, `filtro.status`. Consumidores fazem `if (filtro.X === 'Todos')` para pular a dimensão. **Não trocar para `null`/`undefined`.** Quebraria N composables.

### 5. `limpar()` em ambos stores zera tudo
`useExcelUpload.reset()` chama os dois. Adicionar campo novo a qualquer store exige refletir em `limpar()` ou o reset vira inconsistente.

## Acoplamentos

- **`useExcelUpload` muta os dois stores em sequência**: filtros.limpar → atendimentos.setAtendimentos → filtros.ajustarParaDados. Mudar ordem = bug sutil (snap acontece antes dos dados existirem).
- **`useAtendimentos` (composable) une os dois via `storeToRefs`**. É a porta canônica para a UI ler dados filtrados.
- **`useAtendimentoFilters` (composable) também combina os dois** para expor `anos`/`meses` derivados dos dados + estado do filtro.

## Anti-patterns a evitar

- **Não persistir** dos stores em localStorage sem alinhar com produto. Hoje reload é "reset" deliberado.
- **Não criar terceiro store** sem necessidade clara. Os dois cobrem o domínio inteiro.
- **Não mutar `filtro` direto** (ex.: `filtrosStore.filtro.ano = '2024'`). Use `atualizar()` para herdar a regra do reset de mês.
- **Não retornar `filtro` como `ref` cru** de fora do store — ele é `reactive`. Use `storeToRefs` ou destruture via wrapper composable.

## Para IA agents

- Adicionar campo em `Atendimento` (ex.: `categoria`) → ajustar `Atendimento` type, `AtendimentoExcelRow`, `mapExcelRow`, e qualquer composable que agrega por esse campo. Store em si não precisa mudar (é só `Atendimento[]`).
- Adicionar dimensão de filtro (ex.: `categoria`) → atualizar `AtendimentoFiltro` type, `filtroInicial()`, possivelmente `atualizar()` (se houver reset cascata), `useAtendimentos.filtrados`, UI.
- Adicionar derivado novo (ex.: `temDadosRecentes`) → preferir computed dentro do store em vez de spalhar em vários lugares.
