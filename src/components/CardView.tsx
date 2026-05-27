import type { Card } from '../types/cards';
import { getCardCost } from '../game/rules';
import { localizeText } from '../i18n/cards';
import type { Language } from '../i18n/cards';

interface CardViewProps {
  card: Card;
  lang?: Language;
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

export function CardView({ card, lang = 'en', compact = false, actionLabel, buyLabel, labels, disabled, onAction }: CardViewProps) {
  const statLabels = labels ?? {
    cost: lang === 'es' ? 'Coste' : 'Cost',
    light: lang === 'es' ? 'Luz' : 'Light',
    fervor: 'Fervor',
  };
  const resolvedBuyLabel = buyLabel ?? (lang === 'es' ? 'Comprar' : 'Buy');
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
          {actionLabel}{actionLabel === resolvedBuyLabel ? ` (${getCardCost(card)})` : ''}
        </button>
      )}
    </article>
  );
}

function translateType(type: Card['type'], lang: Language): string {
  return localizeText(type, lang);
}

function classNameForType(type: Card['type']): string {
  return `type-${type.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`;
}
