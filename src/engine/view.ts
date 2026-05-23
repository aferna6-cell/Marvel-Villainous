// Information-hiding projection (marvel-villainous-plan.md §8.5).
//
// `view(state, asPlayer)` returns a `PlayerView` containing only what that
// player could legally see at the physical table: their own hand, every
// face-up zone on every realm, the *contents* of all discard piles, and the
// shared Fate deck's discard pile — but never another player's hand, and
// never the *order* of any deck (only the counts).
//
// The AI move advisor (§8) consumes ONLY a `PlayerView`, never the raw
// `GameState`. Routing it through this projection is what guarantees it
// cannot peek at hidden information.

import type {
  CardId,
  GameState,
  LogEntry,
  ObjectiveProgress,
  Phase,
  PlayerId,
  PlayerState,
  Prompt,
  Realm,
  VillainKey,
} from './types';

/** Zones every player can see for any player. */
export interface PlayerPublicView {
  id: PlayerId;
  villain: VillainKey;
  power: number;
  /** Discard contents are public; order is irrelevant. */
  discard: CardId[];
  /** All cards in a realm are face-up. */
  realm: Realm;
  /** Villain-specific public state (tokens on the board, etc.). */
  flags: Record<string, unknown>;
  objectiveProgress: ObjectiveProgress;
  /** Draw-pile size only — the order is hidden. */
  deckCount: number;
}

/** The viewing player sees their own hand. */
export interface SelfView extends PlayerPublicView {
  perspective: 'self';
  hand: CardId[];
}

/** Opponents reveal only how many cards they hold. */
export interface OpponentView extends PlayerPublicView {
  perspective: 'opponent';
  handCount: number;
}

/**
 * The single shared Fate deck (rulebook Setup §3). Order is hidden — only the
 * count is exposed — but the discard pile contents are face-up and public.
 */
export interface SharedFateView {
  deckCount: number;
  discard: CardId[];
}

/** The whole game as one player legally sees it. */
export interface PlayerView {
  asPlayer: PlayerId;
  turn: number;
  activePlayer: PlayerId;
  phase: Phase;
  playerOrder: PlayerId[];
  winner: PlayerId | null;
  pendingPrompt: Prompt | null;
  log: LogEntry[];
  self: SelfView;
  opponents: OpponentView[];
  fate: SharedFateView;
}

function publicView(p: PlayerState): PlayerPublicView {
  return {
    id: p.id,
    villain: p.villain,
    power: p.power,
    discard: structuredClone(p.discard),
    realm: structuredClone(p.realm),
    flags: structuredClone(p.flags),
    objectiveProgress: structuredClone(p.objectiveProgress),
    deckCount: p.deck.length,
  };
}

/** Project `state` into what `asPlayer` may legally see. */
export function view(state: GameState, asPlayer: PlayerId): PlayerView {
  const selfState = state.players[asPlayer];
  if (!selfState) throw new Error(`view: unknown player "${asPlayer}"`);

  const self: SelfView = {
    ...publicView(selfState),
    perspective: 'self',
    hand: structuredClone(selfState.hand),
  };

  const opponents: OpponentView[] = [];
  for (const id of state.playerOrder) {
    if (id === asPlayer) continue;
    const p = state.players[id];
    if (!p) throw new Error(`view: unknown player "${id}" in playerOrder`);
    opponents.push({
      ...publicView(p),
      perspective: 'opponent',
      handCount: p.hand.length,
    });
  }

  return {
    asPlayer,
    turn: state.turn,
    activePlayer: state.activePlayer,
    phase: state.phase,
    playerOrder: [...state.playerOrder],
    winner: state.winner,
    pendingPrompt: structuredClone(state.pendingPrompt),
    log: structuredClone(state.log),
    self,
    opponents,
    fate: {
      deckCount: state.fateDeck.length,
      discard: structuredClone(state.fateDiscard),
    },
  };
}
