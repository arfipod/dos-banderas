import { useMemo, useState } from 'react';
import { cards } from './data/cards';
import type { Card, RuntimeCard } from './types/cards';
import type { BannerChoice, Difficulty, GameMode, GameState, PlayerState, Score } from './game/state';
import { createEmptyGameState } from './game/state';
import {
  createRuntimeCard,
  getCardCost,
  getDarkness,
  getOpposedSinHint,
  isExamenCard,
  MAX_PLAYED_CARDS,
  shuffle,
  STARTER_CARD_NAMES,
} from './game/rules';
import { downloadJson, timestampForFilename } from './utils/download';
import { CardView } from './components/CardView';
import { RulesReference } from './components/RulesReference';
import './styles.css';

type Tab = 'simulator' | 'cards' | 'print' | 'rules';

function createPlayer(name: string): PlayerState {
  const starterCards = STARTER_CARD_NAMES
    .map((cardName) => cards.find((card) => card.name === cardName))
    .filter((card): card is Card => Boolean(card))
    .map(createRuntimeCard);

  return {
    name,
    deck: shuffle(starterCards),
    discard: [],
    hand: [],
    played: [],
  };
}

function activePlayer(state: GameState): PlayerState {
  return state.players[state.activePlayer];
}

function otherPlayer(state: GameState): PlayerState {
  return state.players[(state.activePlayer + 1) % state.players.length];
}

function drawOne(player: PlayerState, log?: (type: string, message: string, payload?: unknown) => void): PlayerState {
  let deck = [...player.deck];
  let discard = [...player.discard];

  if (deck.length === 0 && discard.length > 0) {
    deck = shuffle(discard);
    discard = [];
    log?.('shuffle', `${player.name} shuffled the discard into a new deck.`);
  }

  const [drawn, ...rest] = deck;
  if (!drawn) return { ...player, deck, discard };

  log?.('draw', `${player.name} drew ${drawn.name}.`, { card: drawn });
  return {
    ...player,
    deck: rest,
    discard,
    hand: [...player.hand, drawn],
  };
}

function drawTo(player: PlayerState, target: number, log?: (type: string, message: string, payload?: unknown) => void): PlayerState {
  let next = player;
  while (next.hand.length < target) {
    const before = next.hand.length + next.deck.length + next.discard.length;
    next = drawOne(next, log);
    const after = next.hand.length + next.deck.length + next.discard.length;
    if (before === after) break;
  }
  return next;
}

function buildInitialState(mode: GameMode, difficulty: Difficulty): GameState {
  const state = createEmptyGameState();
  state.startedAt = new Date().toISOString();
  state.mode = mode;
  state.difficulty = difficulty;
  state.phase = 'ready';
  state.communion = difficulty === 'easy' ? 1 : 0;
  state.desolation = difficulty === 'hard' ? 1 : 0;

  const trialCards = cards.filter((card) => card.type === 'Life Trial');
  const finalTrial = trialCards.find((card) => card.name.startsWith('Final Choice'));
  const normalTrials = trialCards.filter((card) => card.id !== finalTrial?.id);
  state.situationDeck = shuffle(normalTrials).slice(0, 5).map(createRuntimeCard);
  if (finalTrial) state.situationDeck.push(createRuntimeCard(finalTrial));

  state.darkDeck = shuffle(
    cards
      .filter((card) => card.type === 'Dark Banner' || card.type === 'Capital Sin')
      .map(createRuntimeCard),
  );

  state.lightDeck = shuffle(
    cards
      .filter((card) => !['Starter', 'Life Trial', 'Dark Banner', 'Capital Sin'].includes(card.type))
      .map(createRuntimeCard),
  );

  state.players = [createPlayer('Player 1')];
  if (mode === 'coop') state.players.push(createPlayer('Player 2'));

  while (state.churchRow.length < 4 && state.lightDeck.length > 0) {
    const next = state.lightDeck.shift();
    if (next) state.churchRow.push(next);
  }

  state.players[0] = drawTo(state.players[0], 5);
  if (mode === 'coop') state.players[1] = drawTo(state.players[1], 3);
  return state;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('simulator');
  const [mode, setMode] = useState<GameMode>('solo');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [state, setState] = useState<GameState>(() => createEmptyGameState());

  const player = state.players.length > 0 ? activePlayer(state) : null;
  const score = useMemo(() => calculateScore(state), [state]);

  function commit(mutator: (draft: GameState, addLog: (type: string, message: string, payload?: unknown) => void) => void) {
    setState((previous) => {
      const draft: GameState = structuredClone(previous);
      const addLog = (type: string, message: string, payload?: unknown) => {
        draft.playtestLog.push({
          timestamp: new Date().toISOString(),
          type,
          message,
          payload,
          snapshot: snapshot(draft),
        });
      };
      mutator(draft, addLog);
      return draft;
    });
  }

  function startGame() {
    const nextState = buildInitialState(mode, difficulty);
    nextState.playtestLog.push({
      timestamp: new Date().toISOString(),
      type: 'start',
      message: `Game started in ${mode} mode with ${difficulty} difficulty.`,
      payload: { mode, difficulty },
      snapshot: snapshot(nextState),
    });
    setState(nextState);
    setTab('simulator');
  }

  function revealRound() {
    commit((draft, addLog) => {
      if (draft.phase !== 'ready') {
        addLog('warning', `Cannot reveal a Trial during phase ${draft.phase}.`);
        return;
      }

      const trial = draft.situationDeck.shift();
      if (!trial) {
        draft.phase = 'ended';
        draft.endedAt = new Date().toISOString();
        addLog('end', 'No more Trials available.');
        return;
      }

      if (draft.darkDeck.length === 0) {
        draft.darkDeck = shuffle(
          cards
            .filter((card) => card.type === 'Dark Banner' || card.type === 'Capital Sin')
            .map(createRuntimeCard),
        );
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

      draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], 5, addLog);
      if (draft.mode === 'coop') {
        const otherIndex = (draft.activePlayer + 1) % draft.players.length;
        draft.players[otherIndex] = drawTo(draft.players[otherIndex], 3, addLog);
      }

      addLog('reveal', `Round ${draft.round}: ${trial.name}.`, {
        trial,
        darkCard: draft.currentDarkCard,
      });
    });
  }

  function chooseBanner(choice: Exclude<BannerChoice, null>) {
    commit((draft, addLog) => {
      if (!draft.currentTrial) {
        addLog('warning', 'Reveal a Trial before choosing a banner.');
        return;
      }
      draft.banner = choice;
      draft.acceptedShortcut = choice === 'shortcut';
      draft.phase = 'play';
      addLog('banner', choice === 'christ' ? "Chose Christ's Banner." : 'Accepted the shortcut.');
    });
  }

  function playCard(uid: string) {
    commit((draft, addLog) => {
      if (draft.phase !== 'play') {
        addLog('warning', 'Choose a banner before playing cards.');
        return;
      }

      const currentPlayer = draft.players[draft.activePlayer];
      if (currentPlayer.played.length >= MAX_PLAYED_CARDS) {
        addLog('warning', `Cannot play more than ${MAX_PLAYED_CARDS} cards.`);
        return;
      }

      const cardIndex = currentPlayer.hand.findIndex((card) => card.uid === uid);
      if (cardIndex < 0) return;

      const [card] = currentPlayer.hand.splice(cardIndex, 1);
      currentPlayer.played.push(card);

      const hint = getOpposedSinHint(card, draft.currentTrial);
      addLog('play', `${currentPlayer.name} played ${card.name}.`, { card, hint });
      if (hint) addLog('hint', hint);
      if (card.name.includes('Prayer')) addLog('hint', 'If you play a Gift after Prayer, add +1 Fervor manually.');
    });
  }

  function undoLastPlayed() {
    commit((draft, addLog) => {
      const currentPlayer = draft.players[draft.activePlayer];
      const card = currentPlayer.played.pop();
      if (!card) return;
      currentPlayer.hand.push(card);
      addLog('undo', `Returned ${card.name} to hand.`);
    });
  }

  function adjust(field: 'bonusLight' | 'bonusFervor' | 'darknessModifier', delta: number) {
    commit((draft, addLog) => {
      draft[field] += delta;
      addLog('adjust', `${field} ${delta > 0 ? '+' : ''}${delta}.`, { field, delta, value: draft[field] });
    });
  }

  function adjustMeter(field: 'communion' | 'attachment' | 'desolation' | 'consolation' | 'fruits', delta: number) {
    commit((draft, addLog) => {
      draft[field] = Math.max(0, draft[field] + delta);
      addLog('meter', `${field} ${delta > 0 ? '+' : ''}${delta}.`, { field, delta, value: draft[field] });
    });
  }

  function resolveRound() {
    commit((draft, addLog) => {
      if (draft.phase !== 'play') {
        addLog('warning', 'You cannot resolve before playing.');
        return;
      }

      const currentScore = calculateScore(draft);
      const currentPlayer = draft.players[draft.activePlayer];
      const hasExamen = currentPlayer.played.some(isExamenCard);

      if (currentScore.success && !draft.acceptedShortcut) {
        draft.communion += 1;
        draft.fruits += 3;
        addLog('resolve', 'Clean Victory: +1 Communion, +3 Fruits.', { score: currentScore });
      } else if (currentScore.success && draft.acceptedShortcut) {
        draft.fruits += 2;
        draft.attachment += 1;
        addLog('resolve', 'Mixed Victory: +2 Fruits, +1 Attachment.', { score: currentScore });
      } else if (!currentScore.success && hasExamen) {
        draft.desolation += 1;
        draft.consolation += 1;
        draft.fruits += 1;
        addLog('resolve', 'Failure with Examen: +1 Desolation, +1 Consolation, +1 Fruit.', { score: currentScore });
      } else {
        draft.desolation += 1;
        addLog('resolve', 'Closed Failure: +1 Desolation.', { score: currentScore });
      }

      if (draft.currentTrial?.name.startsWith('Final Choice')) {
        endGameInDraft(draft, addLog);
        return;
      }

      cleanupAfterRound(draft);
      draft.phase = 'shop';
    });
  }

  function buyCard(uid: string) {
    commit((draft, addLog) => {
      if (draft.phase !== 'shop') {
        addLog('warning', 'Cards can only be bought during the shop phase.');
        return;
      }

      const index = draft.churchRow.findIndex((card) => card.uid === uid);
      if (index < 0) return;
      const card = draft.churchRow[index];
      const cost = getCardCost(card);

      if (draft.fruits < cost) {
        addLog('warning', `Not enough Fruits to buy ${card.name}.`, { cost, fruits: draft.fruits });
        return;
      }

      draft.fruits -= cost;
      draft.churchRow.splice(index, 1);
      draft.players[draft.activePlayer].discard.push(card);

      while (draft.churchRow.length < 4 && draft.lightDeck.length > 0) {
        const next = draft.lightDeck.shift();
        if (next) draft.churchRow.push(next);
      }

      addLog('buy', `Bought ${card.name} for ${cost} Fruits.`, { card, cost });
    });
  }

  function endShop() {
    commit((draft, addLog) => {
      if (draft.phase !== 'shop') {
        addLog('warning', 'You are not in the shop phase.');
        return;
      }

      draft.phase = 'ready';
      if (draft.mode === 'coop') {
        draft.activePlayer = (draft.activePlayer + 1) % draft.players.length;
      }

      draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], 5, addLog);
      if (draft.mode === 'coop') {
        const otherIndex = (draft.activePlayer + 1) % draft.players.length;
        draft.players[otherIndex] = drawTo(draft.players[otherIndex], 3, addLog);
      }

      addLog('phase', 'Shop phase ended. Ready for the next Trial.');
    });
  }

  function drawManual() {
    commit((draft, addLog) => {
      draft.players[draft.activePlayer] = drawOne(draft.players[draft.activePlayer], addLog);
    });
  }

  function resetToSetup() {
    setState(createEmptyGameState());
    setTab('simulator');
  }

  function nextAction() {
    if (state.phase === 'ready') revealRound();
    else if (state.phase === 'play') resolveRound();
    else if (state.phase === 'shop') endShop();
  }

  function exportLog() {
    downloadJson(`dos-banderas-playtest-${timestampForFilename()}.json`, {
      exportedAt: new Date().toISOString(),
      state,
      score,
      activePlayer: player,
      log: state.playtestLog,
    });
  }

  function exportState() {
    downloadJson(`dos-banderas-state-${timestampForFilename()}.json`, state);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Dos Banderas</h1>
          <p>Spiritual combat card game prototype · React + TypeScript + Vite</p>
        </div>
        <nav>
          <button className={tab === 'simulator' ? 'active' : ''} onClick={() => setTab('simulator')}>Simulator</button>
          <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')}>Cards</button>
          <button className={tab === 'print' ? 'active' : ''} onClick={() => setTab('print')}>Print</button>
          <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>Rules</button>
        </nav>
      </header>

      {tab === 'simulator' && (
        <main className="simulator-layout">
          <section className="panel setup-panel">
            <h2>Game Setup</h2>
            <div className="controls-row">
              <label>
                Mode
                <select value={mode} onChange={(event) => setMode(event.target.value as GameMode)}>
                  <option value="solo">Solo</option>
                  <option value="coop">Local cooperative</option>
                </select>
              </label>
              <label>
                Difficulty
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
                  <option value="easy">Contemplative</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Intense combat</option>
                </select>
              </label>
              <button className="primary" onClick={startGame}>Start Game</button>
              <button onClick={resetToSetup}>Reset</button>
              <button onClick={exportLog}>Download Playtest Log</button>
              <button onClick={exportState}>Download State</button>
            </div>
          </section>

          {state.phase !== 'setup' && player && (
            <>
              <section className="panel meters-panel">
                <h2>Meters</h2>
                <div className="meters-grid">
                  {([
                    ['communion', 'Communion', state.communion],
                    ['attachment', 'Attachment', state.attachment],
                    ['desolation', 'Desolation', state.desolation],
                    ['consolation', 'Consolation', state.consolation],
                    ['fruits', 'Fruits', state.fruits],
                  ] as const).map(([field, label, value]) => (
                    <div className="meter" key={field}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <div>
                        <button onClick={() => adjustMeter(field, -1)}>-</button>
                        <button onClick={() => adjustMeter(field, +1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="phase-line">Phase: <strong>{state.phase}</strong> · Round: <strong>{state.round}/6</strong> · Active: <strong>{player.name}</strong></p>
              </section>

              <section className="battle-grid">
                <div className="panel">
                  <h2>Current Trial</h2>
                  {state.currentTrial ? <CardView card={state.currentTrial} /> : <p className="empty">Reveal a Trial to begin the round.</p>}
                </div>
                <div className="panel">
                  <h2>Dark Banner</h2>
                  {state.currentDarkCard ? <CardView card={state.currentDarkCard} /> : <p className="empty">No Dark Banner card revealed.</p>}
                </div>
              </section>

              <section className="panel score-panel">
                <h2>Resolution</h2>
                <div className="score-grid">
                  <div><strong>{score.light}</strong><span>Light</span></div>
                  <div><strong>×{score.fervor}</strong><span>Fervor</span></div>
                  <div><strong>{score.result}</strong><span>Result</span></div>
                  <div><strong>{score.darkness}</strong><span>Darkness</span></div>
                </div>
                <div className="controls-row">
                  <button className="primary" onClick={revealRound} disabled={state.phase !== 'ready'}>Reveal Trial</button>
                  <button className="good" onClick={() => chooseBanner('christ')} disabled={!state.currentTrial}>Christ's Banner</button>
                  <button className="danger" onClick={() => chooseBanner('shortcut')} disabled={!state.currentTrial}>Accept Shortcut</button>
                  <button className="primary" onClick={resolveRound} disabled={state.phase !== 'play'}>Resolve</button>
                  <button onClick={endShop} disabled={state.phase !== 'shop'}>End Shop</button>
                  <button onClick={drawManual}>Draw 1</button>
                  <button onClick={nextAction}>Next</button>
                </div>
                <div className="controls-row">
                  <button onClick={() => adjust('bonusLight', +1)}>+1 Light</button>
                  <button onClick={() => adjust('bonusLight', -1)}>-1 Light</button>
                  <button onClick={() => adjust('bonusFervor', +1)}>+1 Fervor</button>
                  <button onClick={() => adjust('bonusFervor', -1)}>-1 Fervor</button>
                  <button onClick={() => adjust('darknessModifier', +1)}>+1 Darkness</button>
                  <button onClick={() => adjust('darknessModifier', -1)}>-1 Darkness</button>
                  <button onClick={undoLastPlayed}>Undo Played</button>
                </div>
              </section>

              <section className="panel">
                <h2>Hand · {player.name}</h2>
                <p className="hint">Deck {player.deck.length} · Discard {player.discard.length} · Played {player.played.length}/{MAX_PLAYED_CARDS}</p>
                <div className="card-grid">
                  {player.hand.length === 0 && <p className="empty">No cards in hand.</p>}
                  {player.hand.map((card) => (
                    <CardView
                      key={card.uid}
                      card={card}
                      compact
                      actionLabel="Play"
                      disabled={state.phase !== 'play'}
                      onAction={() => playCard(card.uid)}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>Played Cards</h2>
                <div className="card-grid">
                  {player.played.length === 0 && <p className="empty">No cards played yet.</p>}
                  {player.played.map((card) => <CardView key={card.uid} card={card} compact />)}
                </div>
              </section>

              <section className="panel">
                <h2>Church Row</h2>
                <p className="hint">Buy during the shop phase. Current Fruits: {state.fruits}</p>
                <div className="card-grid">
                  {state.churchRow.map((card) => (
                    <CardView
                      key={card.uid}
                      card={card}
                      compact
                      actionLabel="Buy"
                      disabled={state.phase !== 'shop' || state.fruits < getCardCost(card)}
                      onAction={() => buyCard(card.uid)}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>Playtest Log</h2>
                <div className="log-list">
                  {[...state.playtestLog].reverse().map((event, index) => (
                    <p key={`${event.timestamp}-${index}`}>
                      <time>{event.timestamp.slice(11, 19)}</time> <strong>{event.type}</strong>: {event.message}
                    </p>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {tab === 'cards' && (
        <main className="panel">
          <h2>Card Library</h2>
          <p className="hint">All 90 prototype cards are stored as typed data in <code>src/data/cards.ts</code>.</p>
          <div className="card-grid library">
            {cards.map((card) => <CardView key={card.id} card={card} compact />)}
          </div>
        </main>
      )}

      {tab === 'print' && (
        <main className="print-page">
          <h2 className="screen-only">Print & Play Cards</h2>
          <p className="screen-only">Use the browser print command. The print CSS lays the cards out as 63×88mm cards on A4 sheets.</p>
          <div className="print-grid">
            {cards.map((card) => <CardView key={card.id} card={card} compact />)}
          </div>
        </main>
      )}

      {tab === 'rules' && (
        <main>
          <RulesReference />
        </main>
      )}
    </div>
  );
}

function calculateScore(state: GameState): Score {
  const player = state.players.length > 0 ? activePlayer(state) : null;
  const baseLight = player?.played.reduce((sum, card) => sum + (card.light ?? 0), 0) ?? 0;
  const baseFervor = 1 + (player?.played.reduce((sum, card) => sum + (card.fervor ?? 0), 0) ?? 0);
  const finalExtra = state.currentTrial?.name.startsWith('Final Choice')
    ? Math.max(0, state.attachment - 5) * 2
    : 0;

  const light = Math.max(0, baseLight + state.bonusLight);
  const fervor = Math.max(1, baseFervor + state.bonusFervor);
  const darkness = Math.max(0, getDarkness(state.currentTrial) + state.darknessModifier + finalExtra);
  const result = light * fervor;

  return {
    light,
    fervor,
    darkness,
    result,
    success: result >= darkness,
  };
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

function endGameInDraft(
  draft: GameState,
  addLog: (type: string, message: string, payload?: unknown) => void,
) {
  draft.endedAt = new Date().toISOString();
  draft.phase = 'ended';

  let title = 'Unfinished Journey';
  if (draft.communion >= 7 && draft.attachment < 7) title = 'One in God';
  else if (draft.communion >= 5 && draft.attachment < 7) title = 'Sober Victory';
  else if (draft.attachment >= 7) title = 'Dispersion';

  addLog('end', `${title}. Communion ${draft.communion}, Attachment ${draft.attachment}, Desolation ${draft.desolation}.`);
}
