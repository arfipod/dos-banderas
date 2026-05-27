/// <reference types="node" />
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import type { Difficulty, GameMode, GameState } from './game/state';
import { runAutomatedGame } from './game/engine';

type MetricName = 'communion' | 'attachment' | 'desolation' | 'consolation' | 'fruits' | 'rounds';
type WorkerMessage =
  | { type: 'progress'; completed: number }
  | { type: 'done'; summary: SimulationSummary };

interface CliOptions {
  games: number;
  mode: GameMode;
  difficulty: Difficulty;
  workers: number;
  batchSize: number;
  progress: boolean;
  pretty: boolean;
}

interface MetricAccumulator {
  sum: number;
  sumSquares: number;
  min: number;
  max: number;
  histogram: Record<string, number>;
}

interface SimulationSummary {
  games: number;
  wins: number;
  fullVictories: number;
  soberVictories: number;
  dispersions: number;
  lowCommunionEndings: number;
  highDesolationEndings: number;
  metrics: Record<MetricName, MetricAccumulator>;
}

interface FinalReport {
  games: number;
  mode: GameMode;
  difficulty: Difficulty;
  workers: number;
  batchSize: number;
  elapsedMs: number;
  gamesPerSecond: number;
  rates: {
    win: number;
    fullVictory: number;
    soberVictory: number;
    dispersion: number;
    lowCommunionEnding: number;
    highDesolationEnding: number;
  };
  averages: Record<MetricName, number>;
  stdev: Record<MetricName, number>;
  percentiles: Record<MetricName, { p10: number; p25: number; p50: number; p75: number; p90: number }>;
  ranges: Record<MetricName, { min: number; max: number }>;
  distributions: Record<MetricName, Record<string, number>>;
}

const METRICS: MetricName[] = ['communion', 'attachment', 'desolation', 'consolation', 'fruits', 'rounds'];
const VALID_MODES: GameMode[] = ['solo', 'coop'];
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

if (!isMainThread) {
  const options = workerData as CliOptions;
  const summary = runSimulations(options.games, options.mode, options.difficulty, options.batchSize, (completed) => {
    parentPort?.postMessage({ type: 'progress', completed } satisfies WorkerMessage);
  });
  parentPort?.postMessage({ type: 'done', summary } satisfies WorkerMessage);
} else {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const started = Date.now();
  const summary = options.workers <= 1 ? runSequential(options) : await runParallel(options);
  const elapsedMs = Date.now() - started;
  const report = createReport(summary, options, elapsedMs);
  console.log(JSON.stringify(report, null, options.pretty ? 2 : 0));
}

function runSequential(options: CliOptions): SimulationSummary {
  let completed = 0;
  const progress = createProgressReporter(options);
  return runSimulations(options.games, options.mode, options.difficulty, options.batchSize, (delta) => {
    completed += delta;
    progress(completed);
  });
}

function parseOptions(args: string[]): CliOptions {
  const games = readNumberArg(args, 'games', 1000, 1);
  const mode = readChoiceArg(args, 'mode', 'solo', VALID_MODES);
  const difficulty = readChoiceArg(args, 'difficulty', 'normal', VALID_DIFFICULTIES);
  const defaultWorkers = Math.max(1, Math.min(games, availableParallelism()));
  const workers = readNumberArg(args, 'workers', defaultWorkers, 1);
  const batchSize = readNumberArg(args, 'batch-size', 10_000, 1);
  return {
    games,
    mode,
    difficulty,
    workers: Math.min(workers, games),
    batchSize,
    progress: readBooleanArg(args, 'progress', false),
    pretty: readBooleanArg(args, 'pretty', true),
  };
}

function readArg(args: string[], name: string): string | null {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function readNumberArg(args: string[], name: string, fallback: number, min: number): number {
  const raw = readArg(args, name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`Invalid --${name}: expected a number >= ${min}.`);
  }
  return Math.floor(value);
}

function readChoiceArg<T extends string>(args: string[], name: string, fallback: T, choices: T[]): T {
  const raw = readArg(args, name);
  if (raw === null) return fallback;
  if (!choices.includes(raw as T)) {
    throw new Error(`Invalid --${name}: expected one of ${choices.join(', ')}.`);
  }
  return raw as T;
}

function readBooleanArg(args: string[], name: string, fallback: boolean): boolean {
  const raw = readArg(args, name);
  if (raw === null) return args.includes(`--${name}`) ? true : fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(raw.toLowerCase())) return false;
  throw new Error(`Invalid --${name}: expected true or false.`);
}

async function runParallel(options: CliOptions): Promise<SimulationSummary> {
  const aggregate = createEmptySummary();
  let completed = 0;
  const progress = createProgressReporter(options);
  const workerRuns = distributeGames(options.games, options.workers);

  await Promise.all(
    workerRuns.map(
      (games, workerIndex) =>
        new Promise<void>((resolve, reject) => {
          const worker = new Worker(new URL(import.meta.url), {
            workerData: { ...options, games, workers: 1 } satisfies CliOptions,
          });

          worker.on('message', (message: WorkerMessage) => {
            if (message.type === 'progress') {
              completed += message.completed;
              progress(completed);
              return;
            }

            mergeSummary(aggregate, message.summary);
          });
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Worker ${workerIndex + 1} exited with code ${code}.`));
          });
        }),
    ),
  );

  return aggregate;
}

function distributeGames(games: number, workers: number): number[] {
  const base = Math.floor(games / workers);
  const remainder = games % workers;
  return Array.from({ length: workers }, (_, index) => base + (index < remainder ? 1 : 0)).filter((count) => count > 0);
}

function createProgressReporter(options: CliOptions): (completed: number) => void {
  let lastPrintedAt = 0;
  return (completed) => {
    if (!options.progress) return;
    const now = Date.now();
    if (completed < options.games && now - lastPrintedAt < 500) return;
    lastPrintedAt = now;
    const pct = ((completed / options.games) * 100).toFixed(1);
    process.stderr.write(`\rSimulated ${completed.toLocaleString()}/${options.games.toLocaleString()} games (${pct}%)`);
    if (completed >= options.games) process.stderr.write('\n');
  };
}

function runSimulations(
  games: number,
  mode: GameMode,
  difficulty: Difficulty,
  batchSize: number,
  onProgress?: (completed: number) => void,
): SimulationSummary {
  const summary = createEmptySummary();
  let completedSinceProgress = 0;

  for (let index = 0; index < games; index += 1) {
    recordGame(summary, runAutomatedGame(mode, difficulty));
    completedSinceProgress += 1;

    if (completedSinceProgress >= batchSize || index === games - 1) {
      onProgress?.(completedSinceProgress);
      completedSinceProgress = 0;
    }
  }

  return summary;
}

function createEmptySummary(): SimulationSummary {
  return {
    games: 0,
    wins: 0,
    fullVictories: 0,
    soberVictories: 0,
    dispersions: 0,
    lowCommunionEndings: 0,
    highDesolationEndings: 0,
    metrics: Object.fromEntries(METRICS.map((metric) => [metric, createMetricAccumulator()])) as Record<MetricName, MetricAccumulator>,
  };
}

function createMetricAccumulator(): MetricAccumulator {
  return {
    sum: 0,
    sumSquares: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    histogram: {},
  };
}

function recordGame(summary: SimulationSummary, state: GameState): void {
  const won = state.communion >= 5 && state.attachment < 7;
  const fullVictory = state.communion >= 7 && state.attachment < 7;
  const soberVictory = state.communion >= 5 && state.communion < 7 && state.attachment < 7;
  const dispersion = state.attachment >= 7;
  const lowCommunionEnding = state.communion < 5 && state.attachment < 7;
  const highDesolationEnding = state.desolation >= 4;

  summary.games += 1;
  if (won) summary.wins += 1;
  if (fullVictory) summary.fullVictories += 1;
  if (soberVictory) summary.soberVictories += 1;
  if (dispersion) summary.dispersions += 1;
  if (lowCommunionEnding) summary.lowCommunionEndings += 1;
  if (highDesolationEnding) summary.highDesolationEndings += 1;

  recordMetric(summary.metrics.communion, state.communion);
  recordMetric(summary.metrics.attachment, state.attachment);
  recordMetric(summary.metrics.desolation, state.desolation);
  recordMetric(summary.metrics.consolation, state.consolation);
  recordMetric(summary.metrics.fruits, state.fruits);
  recordMetric(summary.metrics.rounds, state.round);
}

function recordMetric(metric: MetricAccumulator, value: number): void {
  metric.sum += value;
  metric.sumSquares += value * value;
  metric.min = Math.min(metric.min, value);
  metric.max = Math.max(metric.max, value);
  const bucket = String(value);
  metric.histogram[bucket] = (metric.histogram[bucket] ?? 0) + 1;
}

function mergeSummary(target: SimulationSummary, source: SimulationSummary): void {
  target.games += source.games;
  target.wins += source.wins;
  target.fullVictories += source.fullVictories;
  target.soberVictories += source.soberVictories;
  target.dispersions += source.dispersions;
  target.lowCommunionEndings += source.lowCommunionEndings;
  target.highDesolationEndings += source.highDesolationEndings;

  for (const metricName of METRICS) {
    mergeMetric(target.metrics[metricName], source.metrics[metricName]);
  }
}

function mergeMetric(target: MetricAccumulator, source: MetricAccumulator): void {
  target.sum += source.sum;
  target.sumSquares += source.sumSquares;
  target.min = Math.min(target.min, source.min);
  target.max = Math.max(target.max, source.max);
  for (const [bucket, count] of Object.entries(source.histogram)) {
    target.histogram[bucket] = (target.histogram[bucket] ?? 0) + count;
  }
}

function createReport(summary: SimulationSummary, options: CliOptions, elapsedMs: number): FinalReport {
  return {
    games: summary.games,
    mode: options.mode,
    difficulty: options.difficulty,
    workers: options.workers,
    batchSize: options.batchSize,
    elapsedMs,
    gamesPerSecond: round(summary.games / Math.max(elapsedMs / 1000, 0.001), 2),
    rates: {
      win: rate(summary.wins, summary.games),
      fullVictory: rate(summary.fullVictories, summary.games),
      soberVictory: rate(summary.soberVictories, summary.games),
      dispersion: rate(summary.dispersions, summary.games),
      lowCommunionEnding: rate(summary.lowCommunionEndings, summary.games),
      highDesolationEnding: rate(summary.highDesolationEndings, summary.games),
    },
    averages: Object.fromEntries(METRICS.map((name) => [name, average(summary.metrics[name], summary.games)])) as Record<MetricName, number>,
    stdev: Object.fromEntries(METRICS.map((name) => [name, stdev(summary.metrics[name], summary.games)])) as Record<MetricName, number>,
    percentiles: Object.fromEntries(METRICS.map((name) => [name, percentiles(summary.metrics[name], summary.games)])) as FinalReport['percentiles'],
    ranges: Object.fromEntries(
      METRICS.map((name) => [
        name,
        {
          min: Number.isFinite(summary.metrics[name].min) ? summary.metrics[name].min : 0,
          max: Number.isFinite(summary.metrics[name].max) ? summary.metrics[name].max : 0,
        },
      ]),
    ) as FinalReport['ranges'],
    distributions: Object.fromEntries(METRICS.map((name) => [name, sortHistogram(summary.metrics[name].histogram)])) as FinalReport['distributions'],
  };
}

function average(metric: MetricAccumulator, games: number): number {
  return games > 0 ? round(metric.sum / games, 3) : 0;
}

function stdev(metric: MetricAccumulator, games: number): number {
  if (games <= 0) return 0;
  const mean = metric.sum / games;
  return round(Math.sqrt(Math.max(0, metric.sumSquares / games - mean * mean)), 3);
}

function percentiles(metric: MetricAccumulator, games: number): FinalReport['percentiles'][MetricName] {
  return {
    p10: percentile(metric.histogram, games, 0.1),
    p25: percentile(metric.histogram, games, 0.25),
    p50: percentile(metric.histogram, games, 0.5),
    p75: percentile(metric.histogram, games, 0.75),
    p90: percentile(metric.histogram, games, 0.9),
  };
}

function percentile(histogram: Record<string, number>, games: number, target: number): number {
  if (games <= 0) return 0;
  const threshold = Math.ceil(games * target);
  let seen = 0;
  for (const [bucket, count] of Object.entries(histogram).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    seen += count;
    if (seen >= threshold) return Number(bucket);
  }
  return 0;
}

function sortHistogram(histogram: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(histogram).sort((a, b) => Number(a[0]) - Number(b[0])));
}

function rate(count: number, games: number): number {
  return games > 0 ? round((count / games) * 100, 3) : 0;
}

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}
