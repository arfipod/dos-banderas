import type { Card } from '../types/cards';
import { getCardCost } from '../game/rules';

interface CardViewProps {
  card: Card;
  compact?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  onAction?: () => void;
}

export function CardView({ card, compact = false, actionLabel, disabled, onAction }: CardViewProps) {
  return (
    <article className={`card-view ${classNameForType(card.type)} ${compact ? 'compact' : ''}`}>
      <header>
        <h4>{card.name}</h4>
        <p>{card.type} · {card.subtype}</p>
      </header>
      <div className="card-stats">
        <span><b>{card.cost ?? '—'}</b><small>Cost</small></span>
        <span><b>{card.light ?? '—'}</b><small>Light</small></span>
        <span><b>{card.fervor ?? '—'}</b><small>Fervor</small></span>
      </div>
      <p className="card-text">{card.text}</p>
      {card.tags.length > 0 && <p className="card-tags">{card.tags.join(' · ')}</p>}
      {actionLabel && (
        <button type="button" disabled={disabled} onClick={onAction}>
          {actionLabel}{actionLabel === 'Buy' ? ` (${getCardCost(card)})` : ''}
        </button>
      )}
    </article>
  );
}

function classNameForType(type: Card['type']): string {
  return `type-${type.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`;
}
