import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { cards } from './data/cards';
import type { Card, RuntimeCard } from './types/cards';
import type { BannerChoice, Difficulty, GameMode, GameState, PlayerState, RuleConfig, Score } from './game/state';
import { createEmptyGameState, DEFAULT_RULES } from './game/state';
import {
  createRuntimeCard,
  getCardCost,
  getDarkness,
  getOpposedSinHint,
  isExamenCard,
  shuffle,
  STARTER_CARD_NAMES,
} from './game/rules';
import { downloadJson, timestampForFilename } from './utils/download';
import { CardView } from './components/CardView';
import { RulesReference } from './components/RulesReference';
import { localizeCard } from './i18n/cards';
import './styles.css';

type Tab = 'simulator' | 'cards' | 'print' | 'rules';
type Language = 'en' | 'es';

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

function buildInitialState(mode: GameMode, difficulty: Difficulty, rules: RuleConfig = DEFAULT_RULES): GameState {
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

  while (state.churchRow.length < state.rules.churchRowSize && state.lightDeck.length > 0) {
    const next = state.lightDeck.shift();
    if (next) state.churchRow.push(next);
  }

  state.players[0] = drawTo(state.players[0], state.rules.starterHandSolo);
  if (mode === 'coop') state.players[1] = drawTo(state.players[1], state.rules.starterHandCoopSupport);
  return state;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('simulator');
  const [mode, setMode] = useState<GameMode>('solo');
  const [lang, setLang] = useState<Language>('es');
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
    const nextState = buildInitialState(mode, difficulty, state.rules);
    nextState.playtestLog.push({
      timestamp: new Date().toISOString(),
      type: 'start',
      message: `Game started in ${mode} mode with ${difficulty} difficulty.`,
      payload: { mode, difficulty },
      snapshot: snapshot(nextState),
    });
    setState(nextState);
    setTab('simulator');

    // On mobile the setup panel remains at the top, so the user may think
    // "Start Game" did nothing. Scroll to the live game area after state updates.
    window.requestAnimationFrame(() =>
      document.querySelector('.meters-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

      const activeHandTarget = draft.mode === 'coop' ? draft.rules.starterHandCoopActive : draft.rules.starterHandSolo;
      draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], activeHandTarget, addLog);
      if (draft.mode === 'coop') {
        const otherIndex = (draft.activePlayer + 1) % draft.players.length;
        draft.players[otherIndex] = drawTo(draft.players[otherIndex], draft.rules.starterHandCoopSupport, addLog);
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
      if (currentPlayer.played.length >= draft.rules.maxPlayedCards) {
        addLog('warning', `Cannot play more than ${draft.rules.maxPlayedCards} cards.`);
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
        draft.communion += draft.rules.rewards.cleanVictory.communion;
        draft.fruits += draft.rules.rewards.cleanVictory.fruits;
        draft.attachment += draft.rules.rewards.cleanVictory.attachment;
        addLog('resolve', 'Clean Victory: +1 Communion, +3 Fruits.', { score: currentScore });
      } else if (currentScore.success && draft.acceptedShortcut) {
        draft.communion += draft.rules.rewards.mixedVictory.communion;
        draft.fruits += draft.rules.rewards.mixedVictory.fruits;
        draft.attachment += draft.rules.rewards.mixedVictory.attachment;
        addLog('resolve', 'Mixed Victory: +2 Fruits, +1 Attachment.', { score: currentScore });
      } else if (!currentScore.success && hasExamen) {
        draft.desolation += draft.rules.rewards.failedWithExamen.desolation;
        draft.consolation += draft.rules.rewards.failedWithExamen.consolation;
        draft.fruits += draft.rules.rewards.failedWithExamen.fruits;
        addLog('resolve', 'Failure with Examen: +1 Desolation, +1 Consolation, +1 Fruit.', { score: currentScore });
      } else {
        draft.desolation += draft.rules.rewards.failedClosed.desolation;
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

      while (draft.churchRow.length < draft.rules.churchRowSize && draft.lightDeck.length > 0) {
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

      const activeHandTarget = draft.mode === 'coop' ? draft.rules.starterHandCoopActive : draft.rules.starterHandSolo;
      draft.players[draft.activePlayer] = drawTo(draft.players[draft.activePlayer], activeHandTarget, addLog);
      if (draft.mode === 'coop') {
        const otherIndex = (draft.activePlayer + 1) % draft.players.length;
        draft.players[otherIndex] = drawTo(draft.players[otherIndex], draft.rules.starterHandCoopSupport, addLog);
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
    else if (state.phase === 'choose-banner') commit((draft, addLog) => addLog('warning', "Choose Christ's Banner or Accept Shortcut before continuing."));
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

  function exportRules() {
    downloadJson(`dos-banderas-rules-${timestampForFilename()}.json`, state.rules);
  }

  function importRules(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        commit((draft, addLog) => {
          draft.rules = { ...draft.rules, ...parsed };
          addLog('rules', 'Rules imported from JSON file.', { rules: draft.rules });
        });
      } catch {
        commit((draft, addLog) => addLog('warning', 'Could not import rules: invalid JSON file.'));
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Dos Banderas</h1>
          <p>{lang === 'es' ? 'Prototipo de juego de cartas de combate espiritual · React + TypeScript + Vite' : 'Spiritual combat card game prototype · React + TypeScript + Vite'}</p>
        </div>
        <nav>
          <button className={tab === 'simulator' ? 'active' : ''} onClick={() => setTab('simulator')}>{lang === 'es' ? 'Simulador' : 'Simulator'}</button>
          <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')}>{lang === 'es' ? 'Cartas' : 'Cards'}</button>
          <button className={tab === 'print' ? 'active' : ''} onClick={() => setTab('print')}>{lang === 'es' ? 'Imprimir' : 'Print'}</button>
          <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>{lang === 'es' ? 'Reglas' : 'Rules'}</button>
        
          <select value={lang} onChange={(event: ChangeEvent<HTMLSelectElement>) => setLang(event.target.value as Language)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </nav>
      </header>

      {tab === 'simulator' && (
        <main className="simulator-layout">
          <section className="panel setup-panel">
            <h2>{lang === 'es' ? 'Configuración' : 'Game Setup'}</h2>
            <div className="controls-row">
              <label>
                {lang === 'es' ? 'Modo' : 'Mode'}
                <select value={mode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMode(event.target.value as GameMode)}>
                  <option value="solo">Solo</option>
                  <option value="coop">{lang === 'es' ? 'Cooperativo local' : 'Local cooperative'}</option>
                </select>
              </label>
              <label>
                {lang === 'es' ? 'Dificultad' : 'Difficulty'}
                <select value={difficulty} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDifficulty(event.target.value as Difficulty)}>
                  <option value="easy">{lang === 'es' ? 'Contemplativo' : 'Contemplative'}</option>
                  <option value="normal">Normal</option>
                  <option value="hard">{lang === 'es' ? 'Combate intenso' : 'Intense combat'}</option>
                </select>
              </label>
              <button className="primary" onClick={startGame}>{lang === 'es' ? 'Iniciar partida' : 'Start Game'}</button>
              <button onClick={resetToSetup}>{lang === 'es' ? 'Reiniciar' : 'Reset'}</button>
              <button onClick={exportLog}>{lang === 'es' ? 'Descargar registro' : 'Download Playtest Log'}</button>
              <button onClick={exportState}>{lang === 'es' ? 'Descargar estado' : 'Download State'}</button>
              <button onClick={exportRules}>{lang === 'es' ? 'Descargar reglas' : 'Download Rules'}</button>
              <label>
                {lang === 'es' ? 'Importar reglas' : 'Import Rules'}
                <input type="file" accept="application/json" onChange={importRules} />
              </label>
            </div>
          </section>

          {state.phase !== 'setup' && player && (
            <>
              <section className="panel meters-panel">
                <h2>{lang === 'es' ? 'Medidores' : 'Meters'}</h2>
                <div className="meters-grid">
                  {([
                    ['communion', lang === 'es' ? 'Comunión' : 'Communion', state.communion],
                    ['attachment', lang === 'es' ? 'Apego' : 'Attachment', state.attachment],
                    ['desolation', lang === 'es' ? 'Desolación' : 'Desolation', state.desolation],
                    ['consolation', lang === 'es' ? 'Consolación' : 'Consolation', state.consolation],
                    ['fruits', lang === 'es' ? 'Frutos' : 'Fruits', state.fruits],
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
                <p className="phase-line">{lang === 'es' ? 'Fase' : 'Phase'}: <strong>{state.phase}</strong> · {lang === 'es' ? 'Ronda' : 'Round'}: <strong>{state.round}/6</strong> · {lang === 'es' ? 'Activo' : 'Active'}: <strong>{player.name}</strong></p>
              </section>

              <section className="battle-grid">
                <div className="panel">
                  <h2>{lang === 'es' ? 'Prueba actual' : 'Current Trial'}</h2>
                  {state.currentTrial ? <CardView card={localizeCard(state.currentTrial, lang)} lang={lang} labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }} /> : <p className="empty">{lang === 'es' ? 'Revela una Prueba para comenzar la ronda.' : 'Reveal a Trial to begin the round.'}</p>}
                </div>
                <div className="panel">
                  <h2>{lang === 'es' ? 'Bandera oscura' : 'Dark Banner'}</h2>
                  {state.currentDarkCard ? <CardView card={localizeCard(state.currentDarkCard, lang)} lang={lang} labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }} /> : <p className="empty">{lang === 'es' ? 'No se reveló carta de Bandera Oscura.' : 'No Dark Banner card revealed.'}</p>}
                </div>
              </section>

              <section className="panel score-panel">
                <h2>{lang === 'es' ? 'Resolución' : 'Resolution'}</h2>
                <div className="score-grid">
                  <div><strong>{score.light}</strong><span>{lang === 'es' ? 'Luz' : 'Light'}</span></div>
                  <div><strong>×{score.fervor}</strong><span>Fervor</span></div>
                  <div><strong>{score.result}</strong><span>{lang === 'es' ? 'Resultado' : 'Result'}</span></div>
                  <div><strong>{score.darkness}</strong><span>{lang === 'es' ? 'Oscuridad' : 'Darkness'}</span></div>
                </div>
                <div className="controls-row">
                  <button className="primary" onClick={revealRound} disabled={state.phase !== 'ready'}>{lang === 'es' ? 'Revelar prueba' : 'Reveal Trial'}</button>
                  <button className="good" onClick={() => chooseBanner('christ')} disabled={!state.currentTrial}>{lang === 'es' ? 'Bandera de Cristo' : "Christ's Banner"}</button>
                  <button className="danger" onClick={() => chooseBanner('shortcut')} disabled={!state.currentTrial}>{lang === 'es' ? 'Aceptar atajo' : 'Accept Shortcut'}</button>
                  <button className="primary" onClick={resolveRound} disabled={state.phase !== 'play'}>{lang === 'es' ? 'Resolver' : 'Resolve'}</button>
                  <button onClick={endShop} disabled={state.phase !== 'shop'}>{lang === 'es' ? 'Terminar compra' : 'End Shop'}</button>
                  <button onClick={drawManual}>{lang === 'es' ? 'Robar 1' : 'Draw 1'}</button>
                  <button onClick={nextAction}>{lang === 'es' ? 'Siguiente' : 'Next'}</button>
                </div>
                <div className="controls-row">
                  <button onClick={() => adjust('bonusLight', +1)}>+1 {lang === 'es' ? 'Luz' : 'Light'}</button>
                  <button onClick={() => adjust('bonusLight', -1)}>-1 {lang === 'es' ? 'Luz' : 'Light'}</button>
                  <button onClick={() => adjust('bonusFervor', +1)}>+1 Fervor</button>
                  <button onClick={() => adjust('bonusFervor', -1)}>-1 Fervor</button>
                  <button onClick={() => adjust('darknessModifier', +1)}>+1 {lang === 'es' ? 'Oscuridad' : 'Darkness'}</button>
                  <button onClick={() => adjust('darknessModifier', -1)}>-1 {lang === 'es' ? 'Oscuridad' : 'Darkness'}</button>
                  <button onClick={undoLastPlayed}>{lang === 'es' ? 'Deshacer jugada' : 'Undo Played'}</button>
                </div>
              </section>

              <section className="panel">
                <h2>{lang === 'es' ? 'Mano' : 'Hand'} · {player.name}</h2>
                <p className="hint">{lang === 'es' ? 'Mazo' : 'Deck'} {player.deck.length} · {lang === 'es' ? 'Descartes' : 'Discard'} {player.discard.length} · {lang === 'es' ? 'Jugadas' : 'Played'} {player.played.length}/{state.rules.maxPlayedCards}</p>
                <div className="card-grid">
                  {player.hand.length === 0 && <p className="empty">{lang === 'es' ? 'No hay cartas en mano.' : 'No cards in hand.'}</p>}
                  {player.hand.map((card) => (
                    <CardView
                      key={card.uid}
                      card={localizeCard(card, lang)}
                      lang={lang}
                      compact
                      actionLabel={lang === 'es' ? 'Jugar' : 'Play'}
                      disabled={state.phase !== 'play'}
                      onAction={() => playCard(card.uid)}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>{lang === 'es' ? 'Cartas jugadas' : 'Played Cards'}</h2>
                <div className="card-grid">
                  {player.played.length === 0 && <p className="empty">{lang === 'es' ? 'Aún no hay cartas jugadas.' : 'No cards played yet.'}</p>}
                  {player.played.map((card) => <CardView key={card.uid} card={localizeCard(card, lang)} lang={lang} compact labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }} />)}
                </div>
              </section>

              <section className="panel">
                <h2>{lang === 'es' ? 'Fila de Iglesia' : 'Church Row'}</h2>
                <p className="hint">{lang === 'es' ? 'Compra durante la fase de tienda. Frutos actuales' : 'Buy during the shop phase. Current Fruits'}: {state.fruits}</p>
                <div className="card-grid">
                  {state.churchRow.map((card) => (
                    <CardView
                      key={card.uid}
                      card={localizeCard(card, lang)}
                      lang={lang}
                      compact
                      actionLabel={lang === 'es' ? 'Comprar' : 'Buy'}
                      buyLabel={lang === 'es' ? 'Comprar' : 'Buy'}
                      labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }}
                      disabled={state.phase !== 'shop' || state.fruits < getCardCost(card)}
                      onAction={() => buyCard(card.uid)}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>{lang === 'es' ? 'Registro de pruebas' : 'Playtest Log'}</h2>
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
          <h2>{lang === 'es' ? 'Biblioteca de cartas' : 'Card Library'}</h2>
          <p className="hint">{lang === 'es' ? 'Las 90 cartas prototipo están en datos tipados en' : 'All 90 prototype cards are stored as typed data in'} <code>src/data/cards.ts</code>.</p>
          <div className="card-grid library">
            {cards.map((card) => <CardView key={card.id} card={localizeCard(card, lang)} lang={lang} compact labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }} />)}
          </div>
        </main>
      )}

      {tab === 'print' && (
        <main className="print-page">
          <h2 className="screen-only">{lang === 'es' ? 'Cartas para imprimir y jugar' : 'Print & Play Cards'}</h2>
          <p className="screen-only">{lang === 'es' ? 'Usa el comando de impresión del navegador. El CSS de impresión organiza cartas de 63×88mm en hojas A4.' : 'Use the browser print command. The print CSS lays the cards out as 63×88mm cards on A4 sheets.'}</p>
          <div className="print-grid">
            {cards.map((card) => <CardView key={card.id} card={localizeCard(card, lang)} lang={lang} compact labels={{ cost: lang === 'es' ? 'Coste' : 'Cost', light: lang === 'es' ? 'Luz' : 'Light', fervor: lang === 'es' ? 'Fervor' : 'Fervor' }} />)}
          </div>
        </main>
      )}

      {tab === 'rules' && (
        <main>
          <RulesReference lang={lang} />
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
    ? Math.max(0, state.attachment - state.rules.finalChoiceAttachmentThreshold) *
      state.rules.finalChoiceDarknessPerAttachmentOverThreshold
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
