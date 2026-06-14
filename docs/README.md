# Documentação do PosturaCerta

Documentação de desenvolvimento do PosturaCerta. Toda a copy visível ao usuário fica em pt-BR; o código e os comentários ficam em inglês.

## Índice

- [README.md](./README.md) - visão geral do produto, stack e este índice.
- [ARQUITETURA.md](./ARQUITETURA.md) - processos Electron, janelas, IPC, fluxo de dados, persistência e pipeline de postura/pose.
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - tokens MD3, átomos, moléculas, sistema de tema claro/escuro e convenções de UI.
- [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) - setup, comandos, estrutura de pastas, como adicionar config/átomo, release e roadmap.
- [AUDIT.md](./AUDIT.md) - relatório completo da auditoria técnica.

## Visão geral do produto

PosturaCerta é um app de desktop que ajuda a pessoa a manter uma boa postura enquanto trabalha. A câmera observa os ombros, o pescoço e a cabeça, o app detecta quando a postura piora e avisa de forma leve para a pessoa se reajustar.

Pontos centrais:

- **Processamento 100% local.** A detecção de pose roda dentro do próprio app via MediaPipe (WASM + modelo `.task`). Nenhuma imagem sai da máquina e não há chamada de rede no pipeline.
- **Sem PII.** O app não coleta nome, e-mail ou qualquer dado pessoal. A linha do tempo guarda só estados de postura agregados localmente.
- **Calibração personalizada.** A pessoa calibra a postura de referência uma vez; os limites de alerta passam a respeitar o corpo dela.
- **Avisos discretos.** Janela de alerta, notificação nativa e uma pílula flutuante que fica por cima das outras janelas mostrando o estado atual.
- **Modo compartilhado de câmera.** No Linux usa o portal PipeWire para dividir a webcam com Meet, Zoom e OBS.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Electron 42 + electron-vite |
| UI | React 19, TypeScript (strict), CSS custom properties (tokens Material Design 3) |
| Detecção de pose | MediaPipe Pose Landmarker (WASM local + `pose_landmarker_lite.task`) |
| Ícones | lucide-react (nunca SVG de ícone à mão) |
| Build | electron-builder (AppImage/deb, NSIS/portable, DMG/zip) |
| Testes | Vitest + Testing Library (jsdom) |
| Lint | ESLint 10 + typescript-eslint |
| Atualização | electron-updater (GitHub releases) |

## Mapa rápido do código

```
src/
├── main/                # Processo principal: janelas, IPC, storage em disco, updater
├── preload/             # contextBridge: expõe window.postureApp ao renderer
└── renderer/src/
    ├── components/       # Telas e componentes de UI
    ├── design-system/    # Átomos, moléculas e CSS do design system
    └── lib/              # Pose, postura, alertas, settings, timeline, tema, mídia
public/
├── models/               # pose_landmarker_lite.task
└── mediapipe/wasm/       # copiado de @mediapipe/tasks-vision no build
landing-next/             # Site de marketing (Next.js, deploy separado)
```

Para entender o fluxo de uma mudança, comece por [ARQUITETURA.md](./ARQUITETURA.md). Para mexer na UI, vá direto ao [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).
</content>
</invoke>
