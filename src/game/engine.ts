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
  chooseBanner: ({ score }) => (score.success ? 'christ' : 'shortcut'),
  chooseCardsToPlay: ({ hand }) =>
    [...hand]
      .sort((a, b) => (b.light ?? 0) + (b.fervor ?? 0) - ((a.light ?? 0) + (a.fervor ?? 0)))
      .slice(0, DEFAULT_RULES.maxPlayedCards)
      .map((card) => card.uid),
  chooseBuyCardUid: ({ state }) => {
    const options = [...state.churchRow]
      .filter((card) => getCardCost(card) <= state.fruits)
      .sort((a, b) => (b.light ?? 0) + (b.fervor ?? 0) - ((a.light ?? 0) + (a.fervor ?? 0)));
    return options[0]?.uid ?? null;
  },
};

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
    const before = next.hand.length + next.deck.length + next.discard.length;
    next = drawOne(next);
    const after = next.hand.length + next.deck.length + next.discard.length;
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

export function runAutomatedGame(mode: GameMode, difficulty: Difficulty, strategy: RunnerStrategy = baselineStrategy): GameState {
  const state = buildInitialState(mode, difficulty);

  while (state.phase !== 'ended') {
    if (state.phase === 'ready') revealRound(state);
    if (state.phase === 'choose-banner') state.banner = strategy.chooseBanner({ state, score: calculateScore(state), hand: [...activePlayer(state).hand] });
    if (state.phase === 'choose-banner') {
      state.acceptedShortcut = state.banner === 'shortcut';
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
  draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], draft.rules.starterHandCoopActive);
  if (draft.mode === 'coop') {
    const otherIndex = (draft.activePlayer + 1) % draft.players.length;
    draft.players[otherIndex] = drawTo(draft.players[otherIndex], draft.rules.starterHandCoopSupport);
  }
}

function resolveRound(draft: GameState) {
  const currentScore = calculateScore(draft);
  const currentPlayer = draft.players[draft.activePlayer];
  const hasExamen = currentPlayer.played.some(isExamenCard);

  if (currentScore.success && !draft.acceptedShortcut) {
    draft.communion += draft.rules.rewards.cleanVictory.communion;
    draft.fruits += draft.rules.rewards.cleanVictory.fruits;
    draft.attachment += draft.rules.rewards.cleanVictory.attachment;
  } else if (currentScore.success && draft.acceptedShortcut) {
    draft.communion += draft.rules.rewards.mixedVictory.communion;
    draft.fruits += draft.rules.rewards.mixedVictory.fruits;
    draft.attachment += draft.rules.rewards.mixedVictory.attachment;
  } else if (!currentScore.success && hasExamen) {
    draft.desolation += draft.rules.rewards.failedWithExamen.desolation;
    draft.consolation += draft.rules.rewards.failedWithExamen.consolation;
    draft.fruits += draft.rules.rewards.failedWithExamen.fruits;
  } else {
    draft.desolation += draft.rules.rewards.failedClosed.desolation;
  }

  if (draft.currentTrial?.name.startsWith('Final Choice')) {
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
  draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], draft.rules.starterHandCoopActive);
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
