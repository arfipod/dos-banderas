import type { Card } from '../types/cards';
import { getCardCost } from '../game/rules';

interface CardViewProps {
  card: Card;
  lang?: 'en' | 'es';
  compact?: boolean;
  actionLabel?: string;
  buyLabel?: string;
  labels?: {
    cost: string;
    light: string;
    fervor: string;
  };
  disabled?: boolean;
  onAction?: () => void;
}

export function CardView({ card, lang = 'en', compact = false, actionLabel, buyLabel = 'Buy', labels, disabled, onAction }: CardViewProps) {
  const statLabels = labels ?? { cost: 'Cost', light: 'Light', fervor: 'Fervor' };
  return (
    <article className={`card-view ${classNameForType(card.type)} ${compact ? 'compact' : ''}`}>
      <header>
        <h4>{card.name}</h4>
        <p>{translateType(card.type, lang)} · {card.subtype}</p>
      </header>
      <div className="card-stats">
        <span><b>{card.cost ?? '—'}</b><small>{statLabels.cost}</small></span>
        <span><b>{card.light ?? '—'}</b><small>{statLabels.light}</small></span>
        <span><b>{card.fervor ?? '—'}</b><small>{statLabels.fervor}</small></span>
      </div>
      <p className="card-text">{card.text}</p>
      {card.tags.length > 0 && <p className="card-tags">{card.tags.join(' · ')}</p>}
      {actionLabel && (
        <button type="button" disabled={disabled} onClick={onAction}>
          {actionLabel}{actionLabel === buyLabel ? ` (${getCardCost(card)})` : ''}
        </button>
      )}
    </article>
  );
}

function translateType(type: Card['type'], lang: 'en' | 'es'): string {
  if (lang === 'en') return type;
  const map: Record<Card['type'], string> = {
    Starter: 'Inicial',
    'Capital Sin': 'Pecado Capital',
    Virtue: 'Virtud',
    'Gift of the Holy Spirit': 'Don del Espíritu Santo',
    Sacrament: 'Sacramento',
    'Dark Banner': 'Bandera Oscura',
    Mystery: 'Misterio',
    Ally: 'Aliado',
    'Weapon of Light': 'Arma de Luz',
    'Life Trial': 'Prueba de Vida',
  };
  return map[type];
}

function classNameForType(type: Card['type']): string {
  return `type-${type.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`;
}
