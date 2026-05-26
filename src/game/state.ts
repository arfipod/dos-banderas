import type { RuntimeCard } from '../types/cards';

export type GameMode = 'solo' | 'coop';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'setup' | 'ready' | 'choose-banner' | 'play' | 'shop' | 'ended';
export type BannerChoice = 'christ' | 'shortcut' | null;

export interface PlayerState {
  name: string;
  deck: RuntimeCard[];
  discard: RuntimeCard[];
  hand: RuntimeCard[];
  played: RuntimeCard[];
}

export interface Score {
  light: number;
  fervor: number;
  darkness: number;
  result: number;
  success: boolean;
}

export interface PlaytestEvent {
  timestamp: string;
  type: string;
  message: string;
  payload?: unknown;
  snapshot: {
    phase: GamePhase;
    round: number;
    activePlayer: number;
    communion: number;
    attachment: number;
    desolation: number;
    consolation: number;
    fruits: number;
    banner: BannerChoice;
    score: Score;
    currentTrial: string | null;
    currentDarkCard: string | null;
    hand: string[];
    played: string[];
    deckCount: number;
    discardCount: number;
  };
}

export interface RuleConfig {
  maxPlayedCards: number;
  starterHandSolo: number;
  starterHandCoopActive: number;
  starterHandCoopSupport: number;
  churchRowSize: number;
  roundsBeforeFinal: number;
  easyStartingCommunion: number;
  hardStartingDesolation: number;
  rewards: {
    cleanVictory: { communion: number; fruits: number; attachment: number };
    mixedVictory: { communion: number; fruits: number; attachment: number };
    failedWithExamen: { desolation: number; consolation: number; fruits: number };
    failedClosed: { desolation: number };
  };
  finalChoiceAttachmentThreshold: number;
  finalChoiceDarknessPerAttachmentOverThreshold: number;
}

export interface GameState {
  version: string;
  startedAt: string | null;
  endedAt: string | null;
  mode: GameMode;
  difficulty: Difficulty;
  phase: GamePhase;
  round: number;
  activePlayer: number;
  communion: number;
  attachment: number;
  desolation: number;
  consolation: number;
  fruits: number;
  banner: BannerChoice;
  acceptedShortcut: boolean;
  bonusLight: number;
  bonusFervor: number;
  darknessModifier: number;
  situationDeck: RuntimeCard[];
  darkDeck: RuntimeCard[];
  lightDeck: RuntimeCard[];
  churchRow: RuntimeCard[];
  currentTrial: RuntimeCard | null;
  currentDarkCard: RuntimeCard | null;
  players: PlayerState[];
  playtestLog: PlaytestEvent[];
  rules: RuleConfig;
}

export const DEFAULT_RULES: RuleConfig = {
  maxPlayedCards: 4,
  starterHandSolo: 5,
  starterHandCoopActive: 5,
  starterHandCoopSupport: 3,
  churchRowSize: 4,
  roundsBeforeFinal: 5,
  easyStartingCommunion: 1,
  hardStartingDesolation: 1,
  rewards: {
    cleanVictory: { communion: 1, fruits: 3, attachment: 0 },
    mixedVictory: { communion: 0, fruits: 2, attachment: 1 },
    failedWithExamen: { desolation: 1, consolation: 1, fruits: 1 },
    failedClosed: { desolation: 1 },
  },
  finalChoiceAttachmentThreshold: 5,
  finalChoiceDarknessPerAttachmentOverThreshold: 2,
};

export function createEmptyGameState(): GameState {
  return {
    version: '0.1.0',
    startedAt: null,
    endedAt: null,
    mode: 'solo',
    difficulty: 'normal',
    phase: 'setup',
    round: 0,
    activePlayer: 0,
    communion: 0,
    attachment: 0,
    desolation: 0,
    consolation: 0,
    fruits: 0,
    banner: null,
    acceptedShortcut: false,
    bonusLight: 0,
    bonusFervor: 0,
    darknessModifier: 0,
    situationDeck: [],
    darkDeck: [],
    lightDeck: [],
    churchRow: [],
    currentTrial: null,
    currentDarkCard: null,
    players: [],
    playtestLog: [],
    rules: structuredClone(DEFAULT_RULES),
  };
}
