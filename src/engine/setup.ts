// Game setup (marvel-villainous-plan.md §10 M1+ / §13).
//
// `newGame({ villains, seed })` builds an initial `GameState` for 1-4 players.
// It clears the card registry, registers every involved villain's deck and
// Fate deck, deals each seated player a starting hand, builds the single
// shared Fate deck by shuffling together every participating villain's Fate
// deck (rulebook Setup §3 — the Common Fate deck of 15 cards is pending real
// card data; see RULES_QUESTIONS Q15), and auto-advances the engine past the
// `'start'` phase so the first player begins ready to move.

import { shuffle } from './rng';
import { clearRegistry, registerCards } from './cards/registry';
import { autoAdvance } from './state';
import { villains as villainData } from './villains/index';
import { commonFateDeck } from './villains/common/fateDeck';
import type {
  CardDef,
  GameState,
  PlayerId,
  PlayerState,
  VillainKey,
} from './types';

const SEATS: readonly PlayerId[] = ['p1', 'p2', 'p3', 'p4'];

/** Default starting hand size before any per-villain override. */
const STARTING_HAND_SIZE = 4;

export interface NewGameOpts {
  /** Villain keys for each seated player, in seat order (p1, p2, p3, p4). 1-4 entries. */
  villains: VillainKey[];
  /** Seed for the shuffled decks and all in-game randomness. */
  seed: number;
}

function makeEmptySeat(id: PlayerId): PlayerState {
  // An unused seat: present so the `Record<PlayerId, _>` type is satisfied,
  // but never referenced because the seat is omitted from `playerOrder`.
  return {
    id,
    villain: 'thanos',
    power: 0,
    hand: [],
    deck: [],
    discard: [],
    realm: villainData.thanos.makeRealm(),
    flags: {},
    objectiveProgress: { completed: false, steps: {} },
    mustMoveDifferent: true,
  };
}

/**
 * Starting Power by seat order, per the printed rulebook setup:
 * 1st player begins with 0; 2nd with 1; 3rd and 4th with 2 each.
 */
function startingPower(seatIndex: number): number {
  if (seatIndex === 0) return 0;
  if (seatIndex === 1) return 1;
  return 2;
}

function makeSeatedPlayer(
  id: PlayerId,
  villain: VillainKey,
  seatIndex: number,
  seed: number,
  cursor: number,
): { player: PlayerState; nextCursor: number } {
  const data = villainData[villain];
  const deckResult = shuffle(
    data.deck.map((c) => c.id),
    seed,
    cursor,
  );
  const deck = deckResult.items;
  const hand = deck.splice(0, STARTING_HAND_SIZE);
  return {
    player: {
      id,
      villain,
      power: startingPower(seatIndex),
      hand,
      deck,
      discard: [],
      realm: data.makeRealm(),
      flags: {},
      objectiveProgress: { completed: false, steps: {} },
      mustMoveDifferent: true,
    },
    nextCursor: deckResult.nextCursor,
  };
}

export function newGame(opts: NewGameOpts): GameState {
  if (opts.villains.length < 1 || opts.villains.length > 4) {
    throw new Error(`newGame: expected 1-4 villains, got ${opts.villains.length}`);
  }

  // Register every card def for every villain in the game, plus the
  // shared Common Fate deck (rulebook Setup §3).
  clearRegistry();
  const allCards: CardDef[] = [...commonFateDeck];
  for (const v of opts.villains) {
    allCards.push(...villainData[v].deck, ...villainData[v].fateDeck);
  }
  registerCards(allCards);

  // Build seats: assign listed villains to p1, p2, ...; fill the rest with
  // unused placeholders that are never included in `playerOrder`.
  const built: Partial<Record<PlayerId, PlayerState>> = {};
  const playerOrder: PlayerId[] = [];
  let cursor = 0;
  for (let i = 0; i < SEATS.length; i++) {
    const seat = SEATS[i];
    if (!seat) continue;
    const villain = opts.villains[i];
    if (villain !== undefined) {
      const r = makeSeatedPlayer(seat, villain, i, opts.seed, cursor);
      built[seat] = r.player;
      cursor = r.nextCursor;
      playerOrder.push(seat);
    } else {
      built[seat] = makeEmptySeat(seat);
    }
  }

  if (!built.p1 || !built.p2 || !built.p3 || !built.p4) {
    throw new Error('newGame: failed to build all four seats');
  }
  const players: Record<PlayerId, PlayerState> = {
    p1: built.p1,
    p2: built.p2,
    p3: built.p3,
    p4: built.p4,
  };

  const first = playerOrder[0];
  if (!first) throw new Error('newGame: no seated players');

  // Build the single shared Fate deck — rulebook Setup §3: shuffle the
  // Common Fate deck (15 cards) and every participating villain's Fate deck
  // (11 cards each) together to create a single deck.
  const sharedFateCards: string[] = commonFateDeck.map((c) => c.id);
  for (const v of opts.villains) {
    sharedFateCards.push(...villainData[v].fateDeck.map((c) => c.id));
  }
  const fateShuffle = shuffle(sharedFateCards, opts.seed, cursor);
  cursor = fateShuffle.nextCursor;

  const initial: GameState = {
    seed: opts.seed,
    rngCursor: cursor,
    turn: 1,
    activePlayer: first,
    phase: 'start',
    players,
    playerOrder,
    log: [
      { turn: 1, player: first, message: `new game (${opts.villains.join(', ')})` },
    ],
    winner: null,
    pendingPrompt: null,
    pendingTriggers: [],
    usedIcons: [],
    instanceCounter: 0,
    strictIconMode: false,
    fateDeck: fateShuffle.items,
    fateDiscard: [],
    globalEvent: null,
  };

  // Skip the Start phase so the first player is immediately ready to move.
  return autoAdvance(initial);
}
