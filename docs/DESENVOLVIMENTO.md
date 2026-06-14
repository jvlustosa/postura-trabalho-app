# Desenvolvimento

Guia prático para trabalhar no PosturaCerta: setup, comandos, estrutura, convenções e release.

## Setup

```bash
npm install
```

A primeira instalação já deixa o ambiente pronto. Os assets do MediaPipe são copiados de `@mediapipe/tasks-vision` para `public/mediapipe/wasm/` pelo script `copy:mediapipe`, que roda automaticamente no build.

## Comandos

```bash
npm run dev          # Electron em modo dev (electron-vite dev)
npm test             # Testes (vitest run)
npm run test:watch   # Testes em watch
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # copy:mediapipe + typecheck + electron-vite build -> out/
npm run dist         # build + electron-builder (todos os targets do config)
```

Distribuição por plataforma:

```bash
npm run postura:dist     # Linux AppImage
npm run postura:dist:deb # Linux AppImage + deb
npm run dist:win         # Windows NSIS + portable (precisa de wine no Linux)
npm run dist:mac         # macOS DMG + zip (só em macOS)
```

Atalhos de instalação local no Linux:

```bash
npm run postura:install    # instala o AppImage gerado
npm run postura:reinstall  # rebuild + reinstala (alias: npm run reinstall)
```

## Estrutura de pastas

```
src/
├── main/                       # Processo principal (Node)
│   ├── index.ts                # Janelas, IPC, permissões, updater
│   ├── persistentStore.ts      # Leitura/escrita de JSON em disco
│   ├── postureFloatingWindow.ts# Pílula flutuante (PiP de status)
│   └── postureAlertWindow.ts   # Janela de alerta de postura
├── preload/
│   └── index.ts                # contextBridge -> window.postureApp
└── renderer/src/
    ├── main.tsx                # Bootstrap React + applyTheme pré-paint
    ├── App.tsx                 # Shell do app
    ├── styles.css              # Tokens MD3 + tema claro/escuro
    ├── components/             # Telas (PostureCheck, SettingsPanel, Onboarding, ...)
    │   └── timeline/           # Gráficos da linha do tempo
    ├── design-system/
    │   ├── design-system.css   # CSS dos átomos
    │   ├── atoms/              # Button, IconButton, Switch, Card, ...
    │   └── molecules/          # SettingRow, ToggleField, ModalShell, ...
    └── lib/
        ├── pose/               # MediaPipe: landmarker, mapeamento, overlay
        ├── posture/            # analyzePosture, smoothers, thresholds, types
        ├── alerts/             # watcher, mensagens, som
        ├── settings/           # types, storage, schedule, hooks
        ├── timeline/           # recorder, stats, export CSV
        ├── theme/              # applyTheme
        ├── media/              # diagnóstico/erros de câmera
        └── session/            # storage de sessão
public/
├── models/                     # pose_landmarker_lite.task
└── mediapipe/wasm/             # copiado no build
```

## Convenções de código

- **TypeScript strict.** Tipos explícitos, `unknown` em vez de `any`, sem casts soltos. Validação de dados externos sempre por funções de parse (ver `lib/settings/storage.ts`).
- **Inglês no código, pt-BR na UI.** Nomes, comentários e tipos em inglês; toda copy visível ao usuário em português, sem travessão, tom leve.
- **Diff mínimo.** Resolva o que foi pedido, sem refatorar o que está em volta. Combine com a convenção do arquivo vizinho.
- **Ícones lucide.** Sempre `lucide-react`; nunca SVG de ícone à mão.
- **Sem `console.log` solto.** O main tem um wrapper `debug()` que só loga em dev. Evite logs crus no renderer (ver roadmap).
- **Camada `lib/*` é pura e testável.** Lógica de postura/alertas/timeline fica em funções puras com testes Vitest ao lado (`*.test.ts`).

## Como adicionar uma nova configuração

Fluxo de três passos: `types` -> `storage` -> `SettingsPanel`.

1. **Tipo e default** (`src/renderer/src/lib/settings/types.ts`): adicione o campo em `AppSettings` e o valor inicial em `defaultSettings`.

   ```ts
   export interface AppSettings {
     // ...
     theme: ThemePreference;
   }

   export const defaultSettings: AppSettings = {
     // ...
     theme: 'dark',
   };
   ```

2. **Validação** (`src/renderer/src/lib/settings/storage.ts`): valide o campo em `parseSettings`, caindo para o default quando o valor for inválido.

   ```ts
   theme: themeValues.includes(c.theme as ThemePreference)
     ? (c.theme as ThemePreference)
     : defaultSettings.theme,
   ```

   Com isso a persistência funciona dos dois lados (disco via `persistentStore` + localStorage), sem mais nada.

3. **UI** (`src/renderer/src/components/SettingsPanel.tsx`): adicione o controle usando moléculas do design system (`ToggleField` para booleano, `OptionField`/`SegmentedControl` para enum) e chame `onChange({ campo: valor })`.

## Como criar um novo átomo ou molécula

1. Crie o arquivo em `design-system/atoms/` (ou `molecules/`) seguindo o padrão dos vizinhos: `forwardRef` quando faz sentido, props tipadas exportadas, classes `ds-*`, ícones via `LucideIcon`.
2. Use tokens MD3 no CSS correspondente (`design-system.css` para átomos, `molecules/molecules.css` para moléculas). Nada de hex fixo.
3. Exporte o componente e seus tipos no `index.ts` da pasta:

   ```ts
   export { Badge } from './Badge';
   export type { BadgeProps, BadgeTone } from './Badge';
   ```

4. Moléculas devem compor átomos (ex.: `ToggleField` = `SettingRow` + `Switch`), nunca reimplementar primitivos.

## Fluxo de release

A versão fica em `package.json` (atualmente `1.0.0`). Para publicar:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

O push da tag dispara o GitHub Actions, que builda Linux, Windows e macOS e publica um **draft release**. O app usa `electron-updater` apontando para os releases do GitHub: ele baixa updates em background (`autoDownload = true`), instala ao sair (`autoInstallOnAppQuit = true`) e expõe o status ao renderer via `onUpdateStatus`. O atalho `Ctrl/Cmd+Shift+R` reinicia já na versão nova quando há update baixado.

---

# Pendências e Roadmap

Resumo dos achados da auditoria técnica. O relatório completo está em [AUDIT.md](./AUDIT.md).

**Crítico:** nenhum.

## Alto

- **Segurança das permissões.** `setPermissionRequestHandler` (`src/main/index.ts`) concede `media` sem checar a origem; só o ramo `unknown` valida a URL. Não há `setWindowOpenHandler` nem bloqueio de `will-navigate`. Exigir `isAppRendererUrl` também para `media` e negar navegação/abertura externa.
- **`PostureCheck.tsx` gigante.** ~1190 linhas concentrando máquina de estados de câmera, calibração, watcher e dois modos de render num único `useEffect` de ~380 linhas. Sem testes. Candidato a quebra em hooks/módulos menores.
- **Performance do `runFrame`.** Dispara vários `setState` por frame (até 10x/s) re-renderizando o componente inteiro; `pushFloating` tem throttle, mas `setAnalysis`/`setStreakMs` não.
- **Cobertura de teste do componente crítico.** `PostureCheck` não tem nenhuma cobertura.

## Médio

- **Logs no renderer.** `console.warn` em produção em `PostureCheck.tsx`, `App.tsx` e `CalibrationStep.tsx` viola o padrão. O main tem `debug()` dev-only; o renderer precisa de um wrapper equivalente.
- **`BlueFlameSVG` desenhado à mão.** Ícone `<path>` em `PostureCheck.tsx`, contra a regra de usar lucide.
- **Janelas `data:`/HTML inline e ARIA.** A pílula/alerta usam HTML inline; o radiogroup do `SegmentedControl` não tem navegação por seta.

> Observação: o item de tema claro/escuro que aparecia como "Médio" na auditoria original já foi resolvido. Existe o campo `theme` em `AppSettings`, override por `data-theme`, default escuro e troca em Configurações (ver [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)).

## Baixo

- Duplicação do union `UpdateStatus` (main e preload/renderer).
- Helpers de tempo duplicados.
- Host em segundo plano marcado `aria-hidden` mas ainda focável; trocar por `inert`.
- Lacunas de teste em settings/session storage.

## Pontos fortes confirmados

- `contextIsolation` / `sandbox` / `nodeIntegration: false` em todas as janelas.
- CSP restritiva, sem rede.
- Processamento 100% local, sem PII.
- Cobertura sólida da camada `lib/*`.
</content>
