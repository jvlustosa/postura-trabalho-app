import type { PostureReason } from '../posture/types';
import type { AlertLevel } from './createPostureWatcher';

const FALLBACK = 'Reajuste sua postura.';

export const reasonMessages: Record<PostureReason, { warning: string; bad: string }> = {
  'low-confidence': {
    warning: 'Enquadre melhor cabeça e ombros.',
    bad: 'Enquadre melhor cabeça e ombros.',
  },
  'head-forward': {
    warning: 'Sua cabeça está um pouco à frente. Recue levemente.',
    bad: 'Sua cabeça está muito projetada à frente. Reajuste agora.',
  },
  'shoulder-tilt': {
    warning: 'Seus ombros estão levemente desnivelados.',
    bad: 'Seus ombros estão muito desnivelados. Nivele-os.',
  },
  'neck-tilt': {
    warning: 'Pescoço levemente inclinado. Alinhe a cabeça.',
    bad: 'Seu pescoço está muito inclinado. Corrija a posição.',
  },
  slouch: {
    warning: 'Você está curvando levemente as costas. Endireite-se.',
    bad: 'Suas costas estão muito curvadas. Sente-se ereto agora.',
  },
  'head-down': {
    warning: 'Sua cabeça está caindo um pouco. Levante o olhar.',
    bad: 'Sua cabeça está muito baixa. Levante a cabeça.',
  },
};

export const buildAlertMessage = (level: AlertLevel, reasons: PostureReason[]): string => {
  const relevant = reasons.filter((r) => r !== 'low-confidence');
  if (relevant.length === 0) return FALLBACK;
  return reasonMessages[relevant[0]]?.[level] ?? FALLBACK;
};
