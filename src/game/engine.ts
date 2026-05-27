import { cards } from '../data/cards';
import type { Card, RuntimeCard } from '../types/cards';
import type { BannerChoice, Difficulty, GameMode, GameState, PlayerState, RuleConfig, Score } from './state';
import { createEmptyGameState, DEFAULT_RULES } from './state';
import { createRuntimeCard, getCardCost, getDarkness, isExamenCard, shuffle, STARTER_CARD_NAMES } from './rules';

export interface StrategyContext {
  state: GameState;
  score: Score;
  hand: RuntimeCard[];
}

export interface RunnerStrategy {
  chooseBanner(context: StrategyContext): Exclude<BannerChoice, null>;
  chooseCardsToPlay(context: StrategyContext): string[];
  chooseBuyCardUid(context: StrategyContext): string | null;
}

export const baselineStrategy: RunnerStrategy = {
  chooseBanner: ({ state, hand }) => (projectBestVisibleScore(state, hand).success ? 'christ' : 'shortcut'),
  chooseCardsToPlay: ({ state, hand }) => chooseBestVisibleCards(state, hand).map((card) => card.uid),
  chooseBuyCardUid: ({ state }) => {
    const options = [...state.churchRow]
      .filter((card) => getCardCost(card) <= state.fruits)
      .sort((a, b) => cardPurchaseValue(b) - cardPurchaseValue(a));
    return options[0]?.uid ?? null;
  },
};

const VIRTUE_TARGETS: Record<string, string> = {
  Humility: 'pride',
  Generosity: 'greed',
  Chastity: 'lust',
  Patience: 'wrath',
  Temperance: 'gluttony',
  Charity: 'envy',
  Diligence: 'sloth',
};

type RoundOutcome = 'cleanVictory' | 'mixedVictory' | 'failedWithExamen' | 'failedClosed';

function createPlayer(name: string): PlayerState {
  const starterCards = STARTER_CARD_NAMES
    .map((cardName) => cards.find((card) => card.name === cardName))
    .filter((card): card is Card => Boolean(card))
    .map(createRuntimeCard);

  return { name, deck: shuffle(starterCards), discard: [], hand: [], played: [] };
}

function activePlayer(state: GameState): PlayerState {
  return state.players[state.activePlayer];
}

function otherPlayer(state: GameState): PlayerState {
  return state.players[(state.activePlayer + 1) % state.players.length];
}

function drawOne(player: PlayerState): PlayerState {
  let deck = [...player.deck];
  let discard = [...player.discard];

  if (deck.length === 0 && discard.length > 0) {
    deck = shuffle(discard);
    discard = [];
  }

  const [drawn, ...rest] = deck;
  if (!drawn) return { ...player, deck, discard };

  return { ...player, deck: rest, discard, hand: [...player.hand, drawn] };
}

function drawTo(player: PlayerState, target: number): PlayerState {
  let next = player;
  while (next.hand.length < target) {
    const before = next.hand.length;
    next = drawOne(next);
    const after = next.hand.length;
    if (before === after) break;
  }
  return next;
}

export function buildInitialState(mode: GameMode, difficulty: Difficulty, rules: RuleConfig = DEFAULT_RULES): GameState {
  const state = createEmptyGameState();
  state.startedAt = new Date().toISOString();
  state.mode = mode;
  state.difficulty = difficulty;
  state.phase = 'ready';
  state.rules = structuredClone(rules);
  state.communion = difficulty === 'easy' ? state.rules.easyStartingCommunion : 0;
  state.desolation = difficulty === 'hard' ? state.rules.hardStartingDesolation : 0;

  const trialCards = cards.filter((card) => card.type === 'Life Trial');
  const finalTrial = trialCards.find((card) => card.name.startsWith('Final Choice'));
  const normalTrials = trialCards.filter((card) => card.id !== finalTrial?.id);
  state.situationDeck = shuffle(normalTrials).slice(0, state.rules.roundsBeforeFinal).map(createRuntimeCard);
  if (finalTrial) state.situationDeck.push(createRuntimeCard(finalTrial));

  state.darkDeck = shuffle(cards.filter((card) => card.type === 'Dark Banner' || card.type === 'Capital Sin').map(createRuntimeCard));
  state.lightDeck = shuffle(cards.filter((card) => !['Starter', 'Life Trial', 'Dark Banner', 'Capital Sin'].includes(card.type)).map(createRuntimeCard));
  state.players = [createPlayer('Player 1')];
  if (mode === 'coop') state.players.push(createPlayer('Player 2'));

  while (state.churchRow.length < state.rules.churchRowSize && state.lightDeck.length > 0) {
    const next = state.lightDeck.shift();
    if (next) state.churchRow.push(next);
  }

  state.players[0] = drawTo(state.players[0], state.rules.starterHandSolo);
  if (mode === 'coop') state.players[1] = drawTo(state.players[1], state.rules.starterHandCoopSupport);
  return state;
}

export function calculateScore(state: GameState): Score {
  const player = state.players.length > 0 ? activePlayer(state) : null;
  const baseLight = player?.played.reduce((sum, card) => sum + (card.light ?? 0), 0) ?? 0;
  const baseFervor = 1 + (player?.played.reduce((sum, card) => sum + (card.fervor ?? 0), 0) ?? 0);
  const finalExtra = state.currentTrial?.name.startsWith('Final Choice')
    ? Math.max(0, state.attachment - state.rules.finalChoiceAttachmentThreshold) * state.rules.finalChoiceDarknessPerAttachmentOverThreshold
    : 0;

  const light = Math.max(0, baseLight + state.bonusLight);
  const fervor = Math.max(1, baseFervor + state.bonusFervor);
  const darkness = Math.max(0, getDarkness(state.currentTrial) + state.darknessModifier + finalExtra);
  const result = light * fervor;
  return { light, fervor, darkness, result, success: result >= darkness };
}

function projectBestVisibleScore(state: GameState, hand: RuntimeCard[]): Score {
  const projected = structuredClone(state);
  projected.players[projected.activePlayer].hand = [...hand];
  projected.players[projected.activePlayer].played = chooseBestVisibleCards(projected, hand);
  applyVisibleTableBonuses(projected);
  return calculateScore(projected);
}

function chooseBestVisibleCards(state: GameState, hand: RuntimeCard[]): RuntimeCard[] {
  const maxCards = state.rules.maxPlayedCards;
  const candidates = combinationsUpTo(hand, maxCards);
  let bestCards: RuntimeCard[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = scoreVisibleCards(state, candidate);
    if (score > bestScore) {
      bestCards = candidate;
      bestScore = score;
    }
  }

  return bestCards;
}

function combinationsUpTo(cardsInHand: RuntimeCard[], maxCards: number): RuntimeCard[][] {
  const output: RuntimeCard[][] = [[]];

  for (const card of cardsInHand) {
    const existing = [...output];
    for (const combo of existing) {
      if (combo.length < maxCards) output.push([...combo, card]);
    }
  }

  return output.filter((combo) => combo.length > 0);
}

function scoreVisibleCards(state: GameState, played: RuntimeCard[]): number {
  const baseLight = played.reduce((sum, card) => sum + (card.light ?? 0), 0);
  const baseFervor = 1 + played.reduce((sum, card) => sum + (card.fervor ?? 0), 0);
  const bonusLight = visibleBonusLight(state, played);
  const bonusFervor = visibleBonusFervor(played);
  const light = Math.max(0, baseLight + bonusLight);
  const fervor = Math.max(1, baseFervor + bonusFervor);
  return light * fervor;
}

function applyVisibleTableBonuses(state: GameState): void {
  const played = activePlayer(state).played;
  state.bonusLight += visibleBonusLight(state, played);
  state.bonusFervor += visibleBonusFervor(played);
}

function visibleBonusLight(state: GameState, played: RuntimeCard[]): number {
  return played.reduce((sum, card) => sum + virtueMatchBonus(card, state), 0);
}

function visibleBonusFervor(played: RuntimeCard[]): number {
  const hasPrayer = played.some((card) => card.name === 'Prayer' || card.name === 'Simple Prayer');
  const hasGift = played.some((card) => card.type === 'Gift of the Holy Spirit');
  return hasPrayer && hasGift ? 1 : 0;
}

function virtueMatchBonus(card: Card, state: GameState): number {
  if (card.type !== 'Virtue') return 0;
  const target = VIRTUE_TARGETS[card.name];
  if (!target) return 0;
  return visibleChallengeText(state).includes(target) ? 4 : 0;
}

function visibleChallengeText(state: GameState): string {
  return [state.currentTrial?.name, state.currentTrial?.text, state.currentDarkCard?.name, state.currentDarkCard?.text]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function cardPurchaseValue(card: Card): number {
  const light = card.light ?? 0;
  const fervor = card.fervor ?? 0;
  const typeBonus =
    card.type === 'Virtue' ? 4 :
    card.type === 'Gift of the Holy Spirit' ? 3 :
    card.type === 'Sacrament' ? 2 :
    card.type === 'Weapon of Light' ? 1 :
    0;
  return light + fervor * 3 + typeBonus - getCardCost(card) * 0.1;
}

function applyShortcutEffects(state: GameState): void {
  const shortcutText = shortcutTextFor(state.currentTrial);
  if (!shortcutText) return;

  state.bonusLight += sumSignedMatches(shortcutText, /\+(\d+)\s+Light/gi);
  state.attachment += sumSignedMatches(shortcutText, /\+(\d+)\s+Attachment/gi);
  state.desolation += sumSignedMatches(shortcutText, /\+(\d+)\s+Desolation/gi);
  state.fruits += sumSignedMatches(shortcutText, /\+(\d+)\s+Fruits?/gi);

  const healDesolation = firstNumber(shortcutText, /heal\s+(\d+)\s+Desolation/i);
  if (healDesolation > 0) state.desolation = Math.max(0, state.desolation - healDesolation);

  const cardsToDraw = firstNumber(shortcutText, /draw\s+(\d+)/i);
  for (let index = 0; index < cardsToDraw; index += 1) {
    state.players[state.activePlayer] = drawOne(state.players[state.activePlayer]);
  }

  const cardsToDiscard = firstNumber(shortcutText, /discard\s+(\d+)/i);
  for (let index = 0; index < cardsToDiscard; index += 1) {
    discardLowestValueCard(activePlayer(state));
  }

  for (const sinName of ['Envy', 'World', 'Wrath', 'Devil']) {
    if (new RegExp(`add\\s+${sinName}`, 'i').test(shortcutText)) addCardByNameToDiscard(state, sinName);
  }
}

function shortcutTextFor(card: Card | null): string {
  if (!card) return '';
  const match = card.text.match(/Shortcut:\s*([^.]*(?:\.[^A-Z]*)?)/);
  return match?.[1] ?? '';
}

function sumSignedMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].reduce((sum, match) => sum + Number(match[1]), 0);
}

function firstNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? Number(match[1]) : 0;
}

function discardLowestValueCard(player: PlayerState): void {
  if (player.hand.length === 0) return;
  let discardIndex = 0;
  let discardValue = cardPlayValue(player.hand[0]);

  for (let index = 1; index < player.hand.length; index += 1) {
    const value = cardPlayValue(player.hand[index]);
    if (value < discardValue) {
      discardIndex = index;
      discardValue = value;
    }
  }

  player.discard.push(...player.hand.splice(discardIndex, 1));
}

function cardPlayValue(card: Card): number {
  return (card.light ?? 0) + (card.fervor ?? 0) * 3;
}

function addCardByNameToDiscard(state: GameState, cardName: string): void {
  const card = cards.find((candidate) => candidate.name === cardName);
  if (card) activePlayer(state).discard.push(createRuntimeCard(card));
}

export function runAutomatedGame(
  mode: GameMode,
  difficulty: Difficulty,
  strategy: RunnerStrategy = baselineStrategy,
  rules: RuleConfig = DEFAULT_RULES,
): GameState {
  const state = buildInitialState(mode, difficulty, rules);

  while (state.phase !== 'ended') {
    if (state.phase === 'ready') revealRound(state);
    if (state.phase === 'choose-banner') state.banner = strategy.chooseBanner({ state, score: calculateScore(state), hand: [...activePlayer(state).hand] });
    if (state.phase === 'choose-banner') {
      state.acceptedShortcut = state.banner === 'shortcut';
      if (state.acceptedShortcut) applyShortcutEffects(state);
      state.phase = 'play';
    }

    if (state.phase === 'play') {
      const current = activePlayer(state);
      const picks = strategy.chooseCardsToPlay({ state, score: calculateScore(state), hand: [...current.hand] });
      for (const uid of picks) {
        if (current.played.length >= state.rules.maxPlayedCards) break;
        const idx = current.hand.findIndex((card) => card.uid === uid);
        if (idx >= 0) current.played.push(...current.hand.splice(idx, 1));
      }
      applyVisibleTableBonuses(state);
      resolveRound(state);
    }

    if (state.phase === 'shop') {
      while (true) {
        const uid = strategy.chooseBuyCardUid({ state, score: calculateScore(state), hand: [...activePlayer(state).hand] });
        if (!uid) break;
        const bought = buyCard(state, uid);
        if (!bought) break;
      }
      endShop(state);
    }
  }

  return state;
}

function revealRound(draft: GameState) {
  const trial = draft.situationDeck.shift();
  if (!trial) {
    draft.phase = 'ended';
    draft.endedAt = new Date().toISOString();
    return;
  }
  if (draft.darkDeck.length === 0) {
    draft.darkDeck = shuffle(cards.filter((card) => card.type === 'Dark Banner' || card.type === 'Capital Sin').map(createRuntimeCard));
  }
  draft.currentTrial = trial;
  draft.currentDarkCard = draft.darkDeck.shift() ?? null;
  draft.round += 1;
  draft.phase = 'choose-banner';
  draft.banner = null;
  draft.acceptedShortcut = false;
  draft.bonusLight = 0;
  draft.bonusFervor = 0;
  draft.darknessModifier = 0;
  const activeHandTarget = draft.mode === 'coop' ? draft.rules.starterHandCoopActive : draft.rules.starterHandSolo;
  draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], activeHandTarget);
  if (draft.mode === 'coop') {
    const otherIndex = (draft.activePlayer + 1) % draft.players.length;
    draft.players[otherIndex] = drawTo(draft.players[otherIndex], draft.rules.starterHandCoopSupport);
  }
}

function resolveRound(draft: GameState) {
  const currentScore = calculateScore(draft);
  const currentPlayer = draft.players[draft.activePlayer];
  const hasExamen = currentPlayer.played.some(isExamenCard);
  let outcome: RoundOutcome;

  if (currentScore.success && !draft.acceptedShortcut) {
    draft.communion += draft.rules.rewards.cleanVictory.communion;
    draft.fruits += draft.rules.rewards.cleanVictory.fruits;
    draft.attachment += draft.rules.rewards.cleanVictory.attachment;
    outcome = 'cleanVictory';
  } else if (currentScore.success && draft.acceptedShortcut) {
    draft.communion += draft.rules.rewards.mixedVictory.communion;
    draft.fruits += draft.rules.rewards.mixedVictory.fruits;
    draft.attachment += draft.rules.rewards.mixedVictory.attachment;
    outcome = 'mixedVictory';
  } else if (!currentScore.success && hasExamen) {
    draft.desolation += draft.rules.rewards.failedWithExamen.desolation;
    draft.consolation += draft.rules.rewards.failedWithExamen.consolation;
    draft.fruits += draft.rules.rewards.failedWithExamen.fruits;
    outcome = 'failedWithExamen';
  } else {
    draft.desolation += draft.rules.rewards.failedClosed.desolation;
    outcome = 'failedClosed';
  }

  const isFinalChoice = draft.currentTrial?.name.startsWith('Final Choice') ?? false;
  recordAutomatedOutcome(draft, outcome, currentScore, isFinalChoice);

  if (isFinalChoice) {
    draft.endedAt = new Date().toISOString();
    draft.phase = 'ended';
    return;
  }

  cleanupAfterRound(draft);
  draft.phase = 'shop';
}

function buyCard(draft: GameState, uid: string): boolean {
  const index = draft.churchRow.findIndex((card) => card.uid === uid);
  if (index < 0) return false;
  const card = draft.churchRow[index];
  const cost = getCardCost(card);
  if (draft.fruits < cost) return false;
  draft.fruits -= cost;
  draft.churchRow.splice(index, 1);
  draft.players[draft.activePlayer].discard.push(card);
  while (draft.churchRow.length < draft.rules.churchRowSize && draft.lightDeck.length > 0) {
    const next = draft.lightDeck.shift();
    if (next) draft.churchRow.push(next);
  }
  return true;
}

function endShop(draft: GameState) {
  draft.phase = 'ready';
  if (draft.mode === 'coop') draft.activePlayer = (draft.activePlayer + 1) % draft.players.length;
  const activeHandTarget = draft.mode === 'coop' ? draft.rules.starterHandCoopActive : draft.rules.starterHandSolo;
  draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], activeHandTarget);
  if (draft.mode === 'coop') {
    const otherIndex = (draft.activePlayer + 1) % draft.players.length;
    draft.players[otherIndex] = drawTo(draft.players[otherIndex], draft.rules.starterHandCoopSupport);
  }
}

function cleanupAfterRound(draft: GameState) {
  const currentPlayer = draft.players[draft.activePlayer];
  currentPlayer.discard.push(...currentPlayer.played, ...currentPlayer.hand);
  currentPlayer.played = [];
  currentPlayer.hand = [];
  if (draft.mode === 'coop') {
    const companion = otherPlayer(draft);
    companion.discard.push(...companion.hand);
    companion.hand = [];
  }
  draft.currentTrial = null;
  draft.currentDarkCard = null;
  draft.banner = null;
  draft.acceptedShortcut = false;
  draft.bonusLight = 0;
  draft.bonusFervor = 0;
  draft.darknessModifier = 0;
}

function recordAutomatedOutcome(draft: GameState, outcome: RoundOutcome, score: Score, finalChoice: boolean): void {
  draft.playtestLog.push({
    timestamp: new Date().toISOString(),
    type: 'automated-outcome',
    message: outcome,
    payload: {
      outcome,
      finalChoice,
      success: score.success,
      score,
      acceptedShortcut: draft.acceptedShortcut,
    },
    snapshot: snapshot(draft),
  });
}

function snapshot(state: GameState) {
  const player = state.players.length > 0 ? activePlayer(state) : null;
  return {
    phase: state.phase,
    round: state.round,
    activePlayer: state.activePlayer,
    communion: state.communion,
    attachment: state.attachment,
    desolation: state.desolation,
    consolation: state.consolation,
    fruits: state.fruits,
    banner: state.banner,
    score: calculateScore(state),
    currentTrial: state.currentTrial?.name ?? null,
    currentDarkCard: state.currentDarkCard?.name ?? null,
    hand: player?.hand.map((card) => card.name) ?? [],
    played: player?.played.map((card) => card.name) ?? [],
    deckCount: player?.deck.length ?? 0,
    discardCount: player?.discard.length ?? 0,
  };
}
