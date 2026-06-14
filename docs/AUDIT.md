# PosturaCerta — Revisão técnica completa

> Auditoria read-only feita lendo o código real. Cada achado traz severidade, `arquivo:linha`, problema e recomendação concreta.
> Severidades: **Crítico** (corrigir antes de release) · **Alto** · **Médio** · **Baixo**.

---

## 1. Arquitetura

### Visão geral

- **Main** (`src/main/index.ts`): cria a janela principal, gerencia o ciclo das janelas auxiliares, registra os handlers de IPC, trata permissões de mídia, auto-update (`electron-updater`) e persistência em disco (`persistentStore.ts`).
- **Preload** (`src/preload/index.ts`): expõe `window.postureApp` via `contextBridge`. Superfície enxuta: alertas, floating, mini, controles de janela, update, e `storage` (settings/timeline).
- **Renderer** (`src/renderer/src`): React 19. `App.tsx` decide entre `MainApp` e `MiniApp` pelo hash (`#mini`). `PostureCheck.tsx` contém o loop de análise (câmera + MediaPipe + watcher + alertas).

### Janelas

| Janela | Onde | Conteúdo | Preload | Sandbox |
|---|---|---|---|---|
| Principal | `index.ts:253` | `index.html` (Vite) | sim | sim |
| Mini/flutuante (PiP) | `index.ts:129` | `index.html#mini` | sim | sim |
| Pill flutuante | `postureFloatingWindow.ts:342` | `data:` HTML inline | sim | sim |
| Alerta de postura | `postureAlertWindow.ts:194` | `data:` HTML inline | **não** | sim |

### Fluxo de dados

`PostureCheck.runFrame` (`PostureCheck.tsx:509`) → `analyzePosture` → `createPostureSmoother` → `createPostureWatcher.observe` → `onAlert` → `window.postureApp.showAlert/notify` → IPC `posture-alert:show` (`index.ts:324`) → `showPostureAlert`. Em paralelo, `pushFloating` envia estado para a pill (`posture-floating:update`, `index.ts:357`), e `timelineRecorder` grava segmentos.

### IPC surface (preload)

Tudo via `ipcRenderer.send`/`invoke`; nenhum objeto Node vaza. `onMiniActive`/`onUpdateStatus` retornam unsubscribe corretamente (`preload/index.ts:24,55`). **Bom.**

### Achados de arquitetura

- **Médio** — `PostureCheck.tsx:460-838`: o `useEffect` do loop de câmera tem ~380 linhas, com `start`, `runFrame`, `enterIdle`, `enterBusyPaused`, `messageForCameraError`, `restartCameraRef` aninhados e ~20 refs. É o coração do app e o mais difícil de manter/testar. Extrair para um hook `useCameraLoop`/`usePostureEngine` com retorno tipado tornaria a lógica testável isoladamente (hoje ela só é exercida via UI, sem cobertura).
- **Médio** — duplicação de estado de update: o enum `UpdateStatus` existe em `index.ts:68`, em `App.tsx:149-151` (string union duplicada) e no typedef do preload como `string` solto. Centralizar o union em um tipo compartilhado evitaria divergência.
- **Baixo** — `App.tsx:680-686` `closeAppWindow` faz fallback para `window.close()`, mas o handler `window:close` no main já trata o caso de análise ativa (`index.ts:452`). O fallback nunca dispara em produção; é dead-ish code defensivo aceitável.
- **Baixo** — sessão (`lib/session/storage.ts`) e settings (`lib/settings/storage.ts`) usam chaves e mecanismos diferentes (`postura-certa-session` só localStorage vs `postura-certa.settings.v1` localStorage+bridge). Sessão não sobrevive a limpeza de localStorage; aceitável pois é efêmera, mas vale documentar.

---

## 2. Segurança

### Pontos fortes

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` em **todas** as janelas (`index.ts:150-156, 264-270`; `postureFloatingWindow.ts:359-364`; `postureAlertWindow.ts:211-215`). **Excelente.**
- CSP restritiva no renderer principal (`index.html:6-8`): `default-src 'self'`, sem `unsafe-eval` (só `wasm-unsafe-eval`, necessário ao MediaPipe). `connect-src` não é declarado, então cai no `default-src 'self'` — bloqueia exfiltração de rede. Processamento local confirmado.
- `app.requestSingleInstanceLock()` (`index.ts:25`).
- Auto-update só ativa em build empacotado e com `app-update.yml` presente (`index.ts:507`).
- Pill e alerta usam CSP `default-src 'none'` (`postureFloatingWindow.ts:21`, `postureAlertWindow.ts:46`).
- `escapeHtml` aplicado à mensagem do alerta antes de injetar no HTML (`postureAlertWindow.ts:31,40`). **Bom.**

### Achados de segurança

- **Alto** — `index.ts:485-502`: o `setPermissionRequestHandler` concede **qualquer** request `media` sem checar a origem (`granted = permission === 'media' || ...`). Só o ramo `unknown` valida `isAppRendererUrl(pageUrl)`. Como não há `setWindowOpenHandler` nem `will-navigate` bloqueando navegação, uma navegação inesperada para uma URL externa ainda receberia permissão de câmera. Recomendação: exigir `isAppRendererUrl(pageUrl)` também para `permission === 'media'`, e adicionar `webContents.setWindowOpenHandler(() => ({ action: 'deny' }))` + handler de `will-navigate` que cancele navegação fora de `isAppRendererUrl`.
- **Médio** — ausência de bloqueio de navegação/abertura de janelas. Em Electron é prática padrão registrar `app.on('web-contents-created', ...)` com `will-navigate` (deny externo) e `setWindowOpenHandler` (deny). Hoje não existe; um link `target=_blank` (ex.: `SettingsPanel.tsx:656` `posturacerta.com`) abriria dentro do Electron como nova janela com o mesmo preload. O link usa `rel="noopener noreferrer"`, mas sem `setWindowOpenHandler` ele não vira `shell.openExternal` — abre uma BrowserWindow interna ou é bloqueado de forma inconsistente.
- **Médio** — janelas `data:` URL (`postureFloatingWindow.ts:389`, `postureAlertWindow.ts:229`): conteúdo é estático/escapado, então não há injeção hoje. Porém `data:` URLs herdam origem opaca e dificultam CSP por header. Preferível carregar um arquivo local (`loadFile`) com os mesmos HTMLs; mantém CSP por meta e evita o risco de alguém futuramente concatenar dados não escapados na string (a pill, por ex., **não** escapa `label`/`meta` no HTML inicial — hoje são literais, mas o padrão `data:` + template string é frágil).
- **Baixo** — `updatePostureFloating` (`postureFloatingWindow.ts:412-416`) injeta `JSON.stringify(payload)` em `executeJavaScript`. `JSON.stringify` neutraliza aspas, então é seguro contra a `label` vinda do renderer; manter assim. Apenas registrar que `executeJavaScript` com string concatenada é um padrão a vigiar.
- **Baixo** — `autoUpdater.logger = null` (`index.ts:37`) silencia erros de update; ok para privacidade, mas dificulta diagnóstico. O estado de erro é propagado à UI via `broadcastUpdateStatus`, o que compensa.
- **Bom (LGPD/local)** — nenhum `fetch`/rede no renderer; câmera processada só localmente; settings/timeline só em disco local. Não há PII enviada a lugar nenhum. Alinhado ao posicionamento "100% local".

---

## 3. Acessibilidade (WCAG AA)

### Pontos fortes

- Botões de ícone têm `aria-label` consistentemente: `App.tsx:359,409,425,690,698,706`; `PostureCheck.tsx:919,931,942,998,1011`; `WindowControls`. Ícones decorativos com `aria-hidden="true"`. **Muito bom.**
- `role="radiogroup"`/`role="radio"` + `aria-checked` nos segmented (`SettingsPanel.tsx:196,205`); `role="switch"` nos toggles (`:805`); `role="progressbar"` com `aria-valuenow` na calibração (`PostureCheck.tsx:1062-1066`); `aria-live="polite"` em status.
- Pill flutuante: `role="button"`, `tabindex="0"`, handlers de teclado Enter/Space/Escape (`postureFloatingWindow.ts:216-218,302-312`). Alerta: `role="alertdialog"` + `aria-labelledby`/`describedby` (`postureAlertWindow.ts:159`).

### Achados de acessibilidade

- **Médio** — `SettingsPanel.tsx:363` usa `role="checkbox"` em `<button>` dentro de um wrapper `role="group"`, mas o grupo de dias da semana deveria ser `role="group"` com label (está) — ok; porém os chips de dia, quando `disabled`, ainda recebem `aria-checked`, o que é válido. O problema real: os `role="radio"` (segmented) **não** implementam navegação por seta (apenas Tab entre botões). WCAG não obriga, mas o padrão ARIA de radiogroup espera setas + roving tabindex. Recomendação: ou adicionar roving tabindex + setas, ou trocar `role="radio"` por botões simples com `aria-pressed` (menos promessa de comportamento).
- **Médio** — checklist usa caracteres `✓`/`✗` como conteúdo textual (`PostureCheck.tsx:1107`) com `aria-label` no span pai (`Ok`/`Corrigir`). O glifo ainda é lido por alguns leitores. Marcar o glifo com `aria-hidden` e deixar só o `aria-label` resolve. (Memória do usuário pede ícones de biblioteca; aqui são glifos de texto, não SVG, mas valeria `lucide` Check/X.)
- **Médio** — contraste: tokens MD3 em tema escuro (`styles.css:48+`) têm bom contraste, mas `card__meta`/hints usam `opacity: 0.6` (`postureFloatingWindow.ts:119`) e `on-surface-variant` em hints pequenos. Não verifiquei cada par de cores com ferramenta; recomendo rodar um checker (axe/Lighthouse) nos estados warning/bad onde texto fica sobre fundos tintados.
- **Baixo** — `posture-host--background` usa `aria-hidden={view !== 'active'}` (`App.tsx:465`) mas o nó continua no DOM e focável; conteúdo `aria-hidden` com elementos focáveis dentro é um anti-padrão (foco "fantasma"). Adicionar `inert` ao host em background (ou não renderizar) elimina o problema.
- **Baixo** — `<img className="app-bar__logo" alt="" />` (`App.tsx:336,362`) com alt vazio é correto (decorativo, há `<h1>` ao lado). Ok.

---

## 4. Performance

### Achados

- **Alto** — `runFrame` (`PostureCheck.tsx:509-673`) roda em `requestAnimationFrame` (~60fps) mas faz `detectForVideo` no máx. a cada 100ms (`:518`). Bom throttle. Porém **cada frame chama vários `setState`** (`setAnalysis`, `pushFloating`, `setStreakMs`, `setScoreHistory`) — até 10x/s de re-render do componente de 1190 linhas. `pushFloating` já tem throttle de 500ms (`:271`), mas `setAnalysis`/`setStreakMs` não. Recomendação: agrupar updates ou mover o que é puramente visual para refs + escrita direta no DOM/canvas, reduzindo re-render do React. Hoje funciona, mas é o maior custo de CPU fora do MediaPipe.
- **Médio** — `setStreakMs(now - streakStartRef.current)` (`PostureCheck.tsx:660`) dispara a cada frame de "good" (até 10x/s) só para atualizar um cronômetro que muda visualmente 1x/s. Atualizar `streakMs` no máximo 1x/s (ou derivar via `performance.now()` num intervalo) corta re-renders.
- **Médio** — MediaPipe: tenta GPU e cai para CPU (`createPoseLandmarker.ts`). `numPoses: 1` e modelo `lite` são as escolhas certas para custo. `backgroundThrottling: false` (`index.ts:155,269`) mantém o loop rodando minimizado — intencional para o modo background, mas significa CPU contínua mesmo oculto; o modo `shared` mitiga liberando a câmera. Documentar o trade-off de bateria.
- **Médio** — listeners/timers: a maioria é limpa corretamente. Pontos a conferir: `idleTimeoutRef` é limpo no cleanup (`:807`); `setInterval` de `sharedNow` (`:304`) e de elapsed (`:305`) têm clear. **Bom.** Único risco: `restartCameraRef.current` é setado dentro do effect e zerado no cleanup (`:813`) — ok.
- **Baixo** — `buildSparklineSegments` recalcula a cada render quando `scoreHistory` muda (1x/s), tamanho ≤60; custo desprezível.
- **Baixo** — `App.tsx` re-renderiza `PostureCheck` em background (`posture-host--background`) mesmo quando view ≠ active; mantê-lo montado é intencional (não perder o stream), aceitável.

---

## 5. Qualidade / manutenção

### Achados

- **Alto** — `PostureCheck.tsx` (1190 linhas) concentra: máquina de estados de câmera, calibração, watcher, streak, sparkline, dois modos de render (mini e principal) e UI de erro. Quebrar em: hook de engine, `MiniPanel`, `MainPanel`, `CameraErrorNote`. Reduz risco de regressão e abre caminho para testes.
- **Médio** — `SettingsPanel.tsx` (816 linhas) é grande mas relativamente plano (seções declarativas). `CameraDevicePicker` e `AboutPanel` já são subcomponentes. Extrair cada `SettingsSection` para arquivo próprio seria opcional; prioridade menor que `PostureCheck`.
- **Médio** — `BlueFlameSVG` (`PostureCheck.tsx:171-193`) é um ícone desenhado à mão com `<path>`. Contraria a regra do projeto ("nunca criar `<path>`/`<svg>` de ícone à mão; usar lucide-react"). Trocar por um ícone `lucide` (ex.: `Flame`) estilizado, ou mover para asset, se o efeito de chama for essencial.
- **Médio** — `console.warn` em produção: `PostureCheck.tsx:709,734,754,768`; `App.tsx:579`; `CalibrationStep.tsx:182`. O CLAUDE.md proíbe `console.*` em produção. No main há um wrapper `debug()` que só loga em dev (`index.ts:31`); o renderer não tem equivalente. Recomendação: criar um `logger` de renderer que só emite em `import.meta.env.DEV`, e trocar os `console.warn`. (São erros de câmera, sem PII, mas a regra é clara.)
- **Médio** — **tema claro/escuro só segue o SO** (`styles.css:47` `@media (prefers-color-scheme: dark)`). A decisão do produto é dois temas com padrão **escuro** e override manual via `data-theme` no `<html>`. Hoje não existe: nenhum `data-theme`, nenhum campo de tema em `AppSettings` (`types.ts:33`), nenhum seletor em `SettingsPanel`. **Gap funcional** a implementar: (a) campo `theme: 'dark' | 'light'` com default `'dark'`, validado em `parseSettings`; (b) duplicar o bloco dark para `:root[data-theme='dark']` além do `@media`; (c) aplicar `document.documentElement.dataset.theme` no boot.
- **Baixo** — duplicação do union de status de update (ver Arquitetura). 
- **Baixo** — `formatElapsed`/`formatStreak` (`App.tsx:44`, `PostureCheck.tsx:120`) são utilitários de tempo quase idênticos em dois arquivos; poderiam compartilhar `lib/timeline/format.ts` (que já existe).
- **Baixo** — type safety: muito boa no geral (`strict`, `unknown` nos boundaries de IPC, parsing defensivo em `storage.ts`). Casts `as` aparecem só em `includes(x as T)` de validação, padrão aceitável. Nenhum `any` encontrado.

---

## 6. Cobertura de testes

### O que está testado (lib — boa cobertura)

`analyzePosture`, `createPersonalizedThresholds`, `createPostureSmoother`, `createPostureWatcher`, `buildAlertMessage`, `playAlertTone`, `mapPoseLandmarks`, `poseOverlay`, `createPoseLandmarker`, `schedule`, `scheduleAutoStart`, `formatScheduleSummary`, `timeline` (recorder/storage/stats/exportCsv/buildQualityLine), `media` (classifyMediaError/buildCameraDiagnosticReport). Também há `App.test.tsx`.

### Lacunas

- **Alto** — `PostureCheck.tsx`, o componente mais complexo e crítico, **não tem teste**. A máquina de estados (calibrating → away → good/warning/bad, ciclo shared idle/warmup/sampling, camera-busy → resume) é inteiramente não coberta. Extrair a engine para um hook/função pura habilitaria testes de transição de estado sem jsdom de câmera.
- **Médio** — `SettingsPanel.tsx`, `TimelineView.tsx`, `Onboarding.tsx`, `CalibrationStep.tsx`, `ConfirmDialog.tsx`, `Tooltip.tsx`, `ScreenHeightPicker.tsx` sem testes de UI. Pelo menos os de interação (toggles persistem patch correto; confirm dialog resolve true/false; tooltip abre por teclado) trariam cobertura real.
- **Médio** — `lib/settings/storage.ts` (parsing/migração Linux→shared, fallback localStorage↔bridge) e `lib/session/storage.ts` não têm teste, apesar de serem o ponto de persistência. A migração silenciosa de `cameraMode` no Linux (`storage.ts:227`) merece um teste.
- **Baixo** — `useSettings.ts` (hydrate + save gating via `hydratedRef`) sem teste; lógica sutil de "não salvar antes de hidratar".
- **Baixo** — main process (`index.ts`, `postureFloatingWindow.ts`, `postureAlertWindow.ts`, `persistentStore.ts`) sem testes; típico em Electron, mas `escapeHtml` e `queueWrite` (serialização de writes) são puros e testáveis.

---

## Roadmap sugerido

1. **Segurança (antes do próximo release)** — fechar o permission handler para exigir origem do app em `media`; adicionar `setWindowOpenHandler` (deny + `shell.openExternal` para links externos) e `will-navigate` bloqueando navegação externa. (`index.ts:485`, novo `web-contents-created`).
2. **Tema claro/escuro manual** — adicionar `theme` ao `AppSettings` (default `dark`), `:root[data-theme]` no `styles.css`, aplicação no boot e seletor no `SettingsPanel`. Fecha o gap funcional pedido pelo produto.
3. **Refatorar `PostureCheck`** — extrair `usePostureEngine` (loop/câmera/estado) e dividir render em `MiniPanel`/`MainPanel`/`CameraErrorNote`. Pré-requisito para testes e para reduzir re-renders.
4. **Performance de render** — throttlar `setStreakMs`/`setScoreHistory` e considerar refs+DOM para visuais de alta frequência; medir CPU antes/depois.
5. **Logging** — criar `logger` de renderer dev-only e remover os `console.warn` de produção; alinhar com a regra do CLAUDE.md.
6. **Testes** — cobrir a engine extraída de `PostureCheck`, `settings/storage` (incl. migração Linux) e os componentes de interação (`SettingsPanel`, `ConfirmDialog`).
7. **Limpeza** — `BlueFlameSVG` para ícone de biblioteca/asset; centralizar `UpdateStatus` e os helpers de formatação de tempo; tornar o host em background `inert`.
