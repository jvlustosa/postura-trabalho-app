import { describe, expect, it } from 'vitest';

import { buildAlertMessage } from './buildAlertMessage';

describe('buildAlertMessage', () => {
  describe('quando não há motivos relevantes', () => {
    it('retorna fallback genérico se a lista estiver vazia', () => {
      expect(buildAlertMessage('bad', [])).toBe('Reajuste sua postura.');
    });

    it('retorna fallback se o único motivo for low-confidence', () => {
      expect(buildAlertMessage('warning', ['low-confidence'])).toBe('Reajuste sua postura.');
    });
  });

  describe('mensagem de warning (alerta leve / toast suave)', () => {
    it('descreve cabeça projetada à frente em tom leve', () => {
      expect(buildAlertMessage('warning', ['head-forward'])).toBe(
        'Sua cabeça está um pouco à frente. Recue levemente.',
      );
    });

    it('descreve ombros desnivelados em tom leve', () => {
      expect(buildAlertMessage('warning', ['shoulder-tilt'])).toBe(
        'Seus ombros estão levemente desnivelados.',
      );
    });

    it('descreve inclinação leve de pescoço', () => {
      expect(buildAlertMessage('warning', ['neck-tilt'])).toBe(
        'Pescoço levemente inclinado. Alinhe a cabeça.',
      );
    });

    it('descreve curvatura leve das costas (slouch)', () => {
      expect(buildAlertMessage('warning', ['slouch'])).toBe(
        'Você está curvando levemente as costas. Endireite-se.',
      );
    });

    it('descreve cabeça caindo levemente (head-down)', () => {
      expect(buildAlertMessage('warning', ['head-down'])).toBe(
        'Sua cabeça está caindo um pouco. Levante o olhar.',
      );
    });
  });

  describe('mensagem de bad (alerta crítico / notificação urgente)', () => {
    it('descreve cabeça muito projetada em tom firme', () => {
      expect(buildAlertMessage('bad', ['head-forward'])).toBe(
        'Sua cabeça está muito projetada à frente. Reajuste agora.',
      );
    });

    it('descreve ombros muito desnivelados em tom firme', () => {
      expect(buildAlertMessage('bad', ['shoulder-tilt'])).toBe(
        'Seus ombros estão muito desnivelados. Nivele-os.',
      );
    });

    it('descreve pescoço muito inclinado em tom firme', () => {
      expect(buildAlertMessage('bad', ['neck-tilt'])).toBe(
        'Seu pescoço está muito inclinado. Corrija a posição.',
      );
    });

    it('descreve costas muito curvadas em tom firme', () => {
      expect(buildAlertMessage('bad', ['slouch'])).toBe(
        'Suas costas estão muito curvadas. Sente-se ereto agora.',
      );
    });

    it('descreve cabeça muito baixa em tom firme', () => {
      expect(buildAlertMessage('bad', ['head-down'])).toBe(
        'Sua cabeça está muito baixa. Levante a cabeça.',
      );
    });
  });

  describe('prioridade de motivos', () => {
    it('usa o primeiro motivo relevante quando há múltiplos', () => {
      expect(buildAlertMessage('bad', ['slouch', 'shoulder-tilt'])).toBe(
        'Suas costas estão muito curvadas. Sente-se ereto agora.',
      );
    });

    it('ignora low-confidence quando há outros motivos válidos', () => {
      expect(buildAlertMessage('warning', ['low-confidence', 'head-forward'])).toBe(
        'Sua cabeça está um pouco à frente. Recue levemente.',
      );
    });
  });

  describe('robustez do contrato de saída', () => {
    it('sempre retorna string não vazia para qualquer combinação válida', () => {
      const reasons = [
        'head-forward',
        'shoulder-tilt',
        'neck-tilt',
        'slouch',
        'head-down',
      ] as const;
      const levels = ['warning', 'bad'] as const;
      for (const reason of reasons) {
        for (const level of levels) {
          const msg = buildAlertMessage(level, [reason]);
          expect(typeof msg).toBe('string');
          expect(msg.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
