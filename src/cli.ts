/// <reference types="node" />
import type { Difficulty, GameMode } from './game/state';
import { runAutomatedGame } from './game/engine';

function parseArg(name: string, fallback: string): string {
  const idx = process.argv.findIndex((arg: string) => arg === `--${name}`);
  return idx >= 0 ? process.argv[idx + 1] ?? fallback : fallback;
}

const games = Number(parseArg('games', '1000'));
const mode = parseArg('mode', 'solo') as GameMode;
const difficulty = parseArg('difficulty', 'normal') as Difficulty;

const started = Date.now();
let wins = 0;
let communionSum = 0;
let attachmentSum = 0;
let desolationSum = 0;

for (let i = 0; i < games; i += 1) {
  const result = runAutomatedGame(mode, difficulty);
  if (result.communion >= 5 && result.attachment < 7) wins += 1;
  communionSum += result.communion;
  attachmentSum += result.attachment;
  desolationSum += result.desolation;
}

const elapsedMs = Date.now() - started;
const report = {
  games,
  mode,
  difficulty,
  elapsedMs,
  gamesPerSecond: Number((games / Math.max(elapsedMs / 1000, 0.001)).toFixed(2)),
  winRate: Number(((wins / games) * 100).toFixed(2)),
  averages: {
    communion: Number((communionSum / games).toFixed(2)),
    attachment: Number((attachmentSum / games).toFixed(2)),
    desolation: Number((desolationSum / games).toFixed(2)),
  },
};

console.log(JSON.stringify(report, null, 2));
