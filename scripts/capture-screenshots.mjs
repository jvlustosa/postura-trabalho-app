// Captura screenshots reais do app para a landing page.
//
// Abordagem: o Playwright lança o próprio Electron do PosturaCerta e dirige a
// captura. Você fica na frente da webcam de verdade; o script prepara cada tela
// (onboarding/calibração, timeline, alerta), espera você se posicionar e captura
// a janela certa quando você aperta ENTER.
//
// Pré-requisitos:
//   npm run build            # gera out/ atualizado (faça isso ANTES de capturar)
//   node scripts/capture-screenshots.mjs
//
// Saída: landing-next/public/assets/app/*.png

import { _electron as electron } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_ENTRY = join(ROOT, 'out', 'main', 'index.cjs');
const OUT_DIR = join(ROOT, 'landing-next', 'public', 'assets', 'app');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((res) => rl.question(question, () => res()));

/** Settings parciais bastam: parseSettings preenche o resto com os defaults. */
const seedSettings = async (page, patch) => {
  await page.evaluate(async (data) => {
    await window.postureApp?.storage?.writeSettings?.(data);
  }, patch);
};

/** Semeia um dia de trabalho plausível para a timeline não ficar vazia. */
const seedTimeline = async (page) => {
  const now = Date.now();
  const start = now - 3 * 60 * 60 * 1000; // 3h atrás
  const segments = [];
  let t = start;
  // Maioria boa, com alguns trechos de atenção/ruim no meio do dia.
  const plan = [
    ['good', 28], ['warning', 6], ['good', 22], ['bad', 8], ['good', 34],
    ['good', 18], ['warning', 9], ['good', 25], ['bad', 5], ['good', 30],
  ];
  for (const [state, minutes] of plan) {
    const endedAt = t + minutes * 60 * 1000;
    segments.push({ state, startedAt: t, endedAt });
    t = endedAt;
  }
  await page.evaluate(async (data) => {
    await window.postureApp?.storage?.writeTimeline?.(data);
  }, segments);
};

const shot = async (page, name) => {
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`  ✓ salvo: ${file}`);
};

const main = async () => {
  if (!existsSync(MAIN_ENTRY)) {
    console.error(`\n✗ Build não encontrado em ${MAIN_ENTRY}.\n  Rode "npm run build" antes de capturar.\n`);
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  console.log('\n▶ Abrindo o PosturaCerta...\n');
  const app = await electron.launch({ args: [MAIN_ENTRY] });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  // 1) Onboarding / calibração ------------------------------------------------
  await seedSettings(page, { onboardingCompleted: false, cameraPermissionGranted: true });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  console.log('1/3 — ONBOARDING / CALIBRAÇÃO');
  console.log('     Avance no app até a tela de calibração e fique na postura ideal.');
  await ask('     Quando estiver enquadrado, aperte ENTER para capturar... ');
  await shot(page, 'onboarding-calibracao');

  // 2) Timeline / estatísticas ------------------------------------------------
  await seedSettings(page, { onboardingCompleted: true, cameraPermissionGranted: true });
  await seedTimeline(page);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: 'Abrir histórico' }).click();
  await page.waitForTimeout(600); // deixa os gráficos animarem
  console.log('\n2/3 — TIMELINE / ESTATÍSTICAS (semeada com um dia de exemplo)');
  await ask('     Revise a tela e aperte ENTER para capturar... ');
  await shot(page, 'timeline-estatisticas');

  // 3) Alerta de postura ------------------------------------------------------
  console.log('\n3/3 — ALERTA DE POSTURA');
  await ask('     Aperte ENTER para disparar o alerta e capturá-lo... ');
  await page.evaluate(() => {
    window.postureApp?.showAlert?.('bad', 'Você está curvado. Alinhe as costas e o pescoço.');
  });
  // A janela de alerta é separada (data: URL). Espera ela aparecer.
  let alertPage = null;
  for (let i = 0; i < 40 && !alertPage; i++) {
    alertPage = app.windows().find((w) => w.url().startsWith('data:')) ?? null;
    if (!alertPage) await page.waitForTimeout(100);
  }
  if (!alertPage) {
    console.error('  ✗ não consegui localizar a janela de alerta.');
  } else {
    await alertPage.waitForTimeout(500); // animação slide-in
    await alertPage.screenshot({ path: join(OUT_DIR, 'alerta-postura.png'), omitBackground: true });
    console.log(`  ✓ salvo: ${join(OUT_DIR, 'alerta-postura.png')}`);
  }

  console.log('\n✔ Captura concluída. Arquivos em landing-next/public/assets/app/\n');
  rl.close();
  await app.close();
};

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
