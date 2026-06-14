# Design System

O design system do PosturaCerta segue uma estrutura atômica em quatro camadas, do mais primitivo ao mais concreto:

```
Tokens (variáveis MD3 em styles.css)
  └─ Átomos (design-system/atoms)
       └─ Moléculas (design-system/molecules)
            └─ Componentes de tela (components/*)
```

A regra geral: componentes de tela compõem moléculas e átomos; moléculas compõem átomos; átomos consomem tokens. Estilo concreto (cores, raios, sombras) sempre vem dos tokens, nunca de valores fixos no componente.

## 1. Tokens

Os tokens são variáveis CSS Material Design 3 definidas em `src/renderer/src/styles.css`. Eles cobrem cores (primary, surface, on-surface, success, warning, error, etc.), elevação (`--md-elev-1/2`) e formas (`--md-shape-sm/md/lg/xl`).

Os tokens de cor existem em três blocos:

- `:root, :root[data-theme="light"]` - valores claros (fallback padrão).
- `:root[data-theme="dark"]` - valores escuros (override manual).
- `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }` - espelho dos valores escuros, aplicado só quando não há `data-theme` (caso pré-hidratação / sem JS).

Os átomos referenciam os tokens, por exemplo:

```css
.ds-button--filled {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
```

O CSS dos átomos fica em `src/renderer/src/design-system/design-system.css` e o das moléculas em `src/renderer/src/design-system/molecules/molecules.css`.

## 2. Átomos

Componentes primitivos, sem lógica de domínio. Todos exportados por `design-system/atoms/index.ts`. Ícones sempre via prop `LucideIcon` (nunca SVG inline).

### Button

`design-system/atoms/Button.tsx` - botão padrão; estende `ButtonHTMLAttributes<HTMLButtonElement>`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `variant` | `'filled' \| 'tonal' \| 'text' \| 'outlined'` | `'filled'` | Estilo visual. |
| `size` | `'sm' \| 'md'` | `'md'` | Tamanho. |
| `icon` | `LucideIcon` | - | Ícone lucide antes do label. |
| `fullWidth` | `boolean` | `false` | Estica para preencher o container. |

```tsx
import { Button } from '../design-system/atoms';
import { Play } from 'lucide-react';

<Button variant="filled" icon={Play} onClick={start}>Começar</Button>
```

### IconButton

`IconButton.tsx` - botão só de ícone. `aria-label` é obrigatório.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` | `LucideIcon` | - | Ícone (obrigatório). |
| `aria-label` | `string` | - | Rótulo acessível (obrigatório). |
| `size` | `'sm' \| 'md'` | `'md'` | Tamanho. |

```tsx
<IconButton icon={X} aria-label="Fechar" onClick={close} />
```

### Switch

`Switch.tsx` - toggle on/off com `role="switch"`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `checked` | `boolean` | - | Estado. |
| `onChange` | `(checked: boolean) => void` | - | Callback. |
| `disabled` | `boolean` | `false` | Desabilita. |
| `aria-label` / `aria-labelledby` | `string` | - | Rótulo acessível. |
| `id` | `string` | - | Para associar a um label externo. |

### SegmentedControl

`SegmentedControl.tsx` - grupo de opções mutuamente exclusivas (`role="radiogroup"`). Genérico em `T extends string`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `options` | `ReadonlyArray<SegmentedOption<T>>` | - | Opções (`{ value, label, icon?, disabled? }`). |
| `value` | `T` | - | Valor selecionado. |
| `onChange` | `(value: T) => void` | - | Callback. |
| `aria-label` / `aria-labelledby` | `string` | - | Rótulo do grupo. |

```tsx
<SegmentedControl
  options={[{ value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Escuro', icon: Moon }]}
  value={theme}
  onChange={setTheme}
  aria-label="Tema do aplicativo"
/>
```

### Card / Surface

`Card.tsx` exporta `Surface` (container genérico) e `Card` (surface com padding padrão).

`SurfaceProps` (estende `HTMLAttributes<HTMLDivElement>`):

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `shape` | `'sm' \| 'md' \| 'lg'` | `'md'` | Raio das bordas. |
| `elevation` | `'flat' \| 'raised' \| 'high' \| 'outlined'` | `'flat'` | Sombra/borda. |

`CardProps` adiciona:

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `padded` | `boolean` | `true` | Remove o padding de 24px quando `false`. |

O `Card` usa por padrão `shape="lg"`, `elevation="raised"`.

### Badge

`Badge.tsx` - rótulo de status pequeno.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'error'` | `'neutral'` | Cor. |
| `icon` | `LucideIcon` | - | Ícone à esquerda. |

### Text

`Text.tsx` - texto tipográfico.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `as` | `'p' \| 'span' \| 'div' \| 'label'` | `'p'` | Elemento. |
| `variant` | `'body' \| 'body-sm' \| 'label' \| 'eyebrow'` | `'body'` | Estilo. |
| `tone` | `'default' \| 'muted' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'default'` | Cor. |

### Heading

`Heading.tsx` - título.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4'` | `h{level}` | Elemento semântico. |
| `level` | `1 \| 2 \| 3` | `2` | Tamanho visual. |
| `tone` | `Tone` | `'default'` | Cor (mesma escala do Text). |

### Stack / Row

`Stack.tsx` (coluna) e `Row.tsx` (linha) - layout flex com gap em pixels.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `gap` | `number` | `0` | Espaço entre filhos, em px. |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | Row: `'center'` | `align-items`. |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around'` | - | `justify-content`. |
| `wrap` (só Row) | `boolean` | `false` | Permite quebra de linha. |

```tsx
<Stack gap={16}>
  <Heading level={2}>Configurações</Heading>
  <Row gap={8} justify="between">...</Row>
</Stack>
```

### Spinner

`Spinner.tsx` - indicador de carregamento (`role="status"`, `aria-live="polite"`).

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `size` | `number` | `20` | Diâmetro em px. |
| `thickness` | `number` | `2` | Espessura do traço em px. |
| `label` | `string` | `'Carregando'` | Texto anunciado por leitores de tela. |

## 3. Moléculas

Combinações de átomos com um propósito mais específico. Exportadas por `design-system/molecules/index.ts`.

### SettingRow

`SettingRow.tsx` - linha de configuração: label + descrição à esquerda, controle à direita (ou abaixo quando `stacked`). É a base de `ToggleField` e `OptionField`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `ReactNode` | - | Rótulo principal. |
| `description` | `ReactNode` | - | Texto de apoio abaixo do label. |
| `control` | `ReactNode` | - | Controle renderizado à direita. |
| `stacked` | `boolean` | `false` | Empilha o controle abaixo do texto. |
| `htmlFor` | `string` | - | Associa o `<label>` ao controle (acessibilidade). |

### ToggleField

`ToggleField.tsx` - `SettingRow` + `Switch`, com `id` gerado por `useId()` para amarrar label e switch.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `ReactNode` | - | Rótulo. |
| `description` | `ReactNode` | - | Descrição. |
| `checked` | `boolean` | - | Estado. |
| `onChange` | `(checked: boolean) => void` | - | Callback. |
| `disabled` | `boolean` | `false` | Desabilita. |

```tsx
<ToggleField
  label="Som no alerta"
  description="Toca um aviso suave quando a postura passa do limite."
  checked={settings.alertSound}
  onChange={(v) => onChange({ alertSound: v })}
/>
```

### OptionField

`OptionField.tsx` - `SettingRow` + `SegmentedControl`. Genérico em `T extends string`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `ReactNode` | - | Rótulo. |
| `description` | `ReactNode` | - | Descrição. |
| `options` | `ReadonlyArray<SegmentedOption<T>>` | - | Opções. |
| `value` | `T` | - | Valor atual. |
| `onChange` | `(value: T) => void` | - | Callback. |
| `groupLabel` | `string` | - | `aria-label` do grupo. |
| `stacked` | `boolean` | `true` | Controle abaixo do label. |

### ModalShell

`ModalShell.tsx` - casca de modal com backdrop, ícone opcional em badge, título, mensagem, conteúdo e área de ações. Fecha ao clicar no backdrop.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `open` | `boolean` | - | Quando `false`, não renderiza nada. |
| `title` | `ReactNode` | - | Título. |
| `message` | `ReactNode` | - | Mensagem de apoio. |
| `icon` | `LucideIcon` | - | Ícone em badge circular. |
| `danger` | `boolean` | `false` | Tinge o badge com a paleta de erro. |
| `actions` | `ReactNode` | - | Botões do rodapé. |
| `onBackdropClick` | `() => void` | - | Chamado ao clicar fora. |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` | Papel ARIA. |
| `aria-labelledby` / `aria-describedby` | `string` | - | Amarra título/mensagem por id. |

### StatCard

`StatCard.tsx` - cartão de métrica (label + valor em destaque + dica opcional).

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `ReactNode` | - | Legenda curta. |
| `value` | `ReactNode` | - | Valor em destaque. |
| `icon` | `LucideIcon` | - | Ícone à esquerda. |
| `hint` | `ReactNode` | - | Texto auxiliar abaixo do valor. |
| `tone` | `Tone` | `'default'` | Cor aplicada ao valor. |

## Tema (claro / escuro)

O app tem **dois temas**: claro e escuro. **O padrão é escuro.** Não existe opção "Sistema".

### Como funciona o `data-theme`

O tema ativo é controlado pelo atributo `data-theme` no elemento `<html>`. A função `applyTheme` (`src/renderer/src/lib/theme/applyTheme.ts`) faz só isso:

```ts
export const applyTheme = (theme: ThemePreference): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
};
```

O CSS reage ao atributo: `:root[data-theme="light"]` aplica os tokens claros e `:root[data-theme="dark"]` aplica os escuros. Como os seletores `[data-theme]` têm especificidade maior que o `:root` dentro do `@media (prefers-color-scheme: dark)`, o atributo sempre vence a preferência do SO.

### Como o padrão é escuro

Em `src/renderer/src/main.tsx`, o tema é lido do localStorage de forma síncrona e aplicado antes do primeiro paint, com fallback para `'dark'`:

```ts
const readPersistedTheme = (): ThemePreference => {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw) as { theme?: unknown };
    return parsed.theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

applyTheme(readPersistedTheme());
```

`defaultSettings.theme` também é `'dark'` em `lib/settings/types.ts`. Aplicar antes do React montar evita o flash de cor errada. Depois, o `App` reaplica o tema via efeito sempre que `settings.theme` muda.

### Como o usuário troca em Configurações

No `SettingsPanel.tsx`, há um grupo "Tema" com um `SegmentedControl` (claro/escuro), usando ícones lucide `Sun` e `Moon`:

```tsx
const themeOptions: ReadonlyArray<SegmentedOption<ThemePreference>> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
];

<SegmentedControl
  aria-label="Tema do aplicativo"
  options={themeOptions}
  value={settings.theme}
  onChange={(next) => onChange({ theme: next })}
/>
```

`onChange({ theme })` atualiza `AppSettings`, o que persiste em disco + localStorage e dispara `applyTheme` pelo efeito no `App`.

### Como adicionar ou alterar um token de cor

Para manter a paridade claro/escuro, todo token de cor precisa existir nos **três** blocos de `styles.css`:

1. `:root, :root[data-theme="light"]` - valor claro.
2. `:root[data-theme="dark"]` - valor escuro.
3. `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }` - mesmo valor escuro (espelho para o caso sem `data-theme`).

Esquecer o terceiro bloco causa cor errada no instante antes da hidratação em quem usa SO escuro. Depois de adicionar, consuma sempre via `var(--md-sys-color-...)`, nunca com hex fixo no componente.

## Convenções de UI

- **Ícones só lucide.** Use `lucide-react` (prop `icon: LucideIcon` nos átomos). Nunca crie `<svg>`/`<path>` de ícone à mão; use a logo existente quando precisar da marca.
- **Copy em pt-BR, sem travessão.** Toda string visível ao usuário fica em português, tom leve e conversacional, sem em-dash. Código e comentários ficam em inglês.
- **Botões são `<button>`.** Nunca `<div onClick>`. Botões só de ícone exigem `aria-label`.
- **Estilo vem de token.** Cores, raios e sombras saem das variáveis MD3, não de valores fixos.
</content>
