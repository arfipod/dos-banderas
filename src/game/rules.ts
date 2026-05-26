import type { Card, RuntimeCard } from '../types/cards';

export const STARTER_CARD_NAMES = [
  'Simple Prayer',
  'Simple Prayer',
  'Attention',
  'Attention',
  'Service',
  'Service',
  'Resistance',
  'Resistance',
  'Brief Examen',
  'Fragility',
];

export const MAX_PLAYED_CARDS = 4;

export function createRuntimeCard(card: Card): RuntimeCard {
  return {
    ...card,
    uid: `${card.id}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`,
  };
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getDarkness(card: Card | null): number {
  if (!card) return 0;
  const match = card.text.match(/Darkness\s+(\d+)/i);
  return match ? Number(match[1]) : 10;
}

export function getCardCost(card: Card): number {
  if (card.type === 'Weapon of Light') return 1;
  if (card.type === 'Virtue') return 2;
  if (card.type === 'Gift of the Holy Spirit') return 3;
  if (card.type === 'Sacrament') return 4;
  if (card.type === 'Ally') return 4;
  if (card.type === 'Mystery') return 5;
  return card.cost ?? 2;
}

export function isExamenCard(card: Card): boolean {
  const haystack = `${card.name} ${card.text}`.toLowerCase();
  return haystack.includes('examen') || card.name === 'Reconciliation';
}

export function getOpposedSinHint(card: Card, trial: Card | null): string | null {
  if (!trial || card.type !== 'Virtue') return null;
  const text = `${trial.name} ${trial.text}`.toLowerCase();
  const pairs: Record<string, string> = {
    Humility: 'pride',
    Generosity: 'greed',
    Chastity: 'lust',
    Patience: 'wrath',
    Temperance: 'gluttony',
    Charity: 'envy',
    Diligence: 'sloth',
  };

  const target = pairs[card.name];
  if (!target || !text.includes(target)) return null;
  return `${card.name} directly answers ${target}. Consider adding +4 Light manually before resolving.`;
}
