// Core type system for the Marvel Villainous engine.
// Encodes marvel-villainous-plan.md §2.1 (model), §2.2 (actions), §2.3 (effects).
// This file is types-only — no runtime values, no React imports.

// --- Identifiers -----------------------------------------------------------

export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';

export type VillainKey = 'thanos' | 'hela' | 'killmonger' | 'taskmaster' | 'ultron';

/** Stable card-definition id, e.g. "thanos-ally-007". */
export type CardId = string;

/** Unique id for a single physical card currently in play. */
export type InstanceId = string;

/** A villain index position within a realm's four locations. */
export type LocationIndex = 0 | 1 | 2 | 3;

// --- Cards -----------------------------------------------------------------

export type CardType =
  | 'ally' // creatures you control
  | 'item' // equipment / objects
  | 'effect' // one-shot
  | 'condition' // ongoing on a location
  | 'hero' // fate deck: heroes
  | 'fateEffect' // fate deck: one-shot
  | 'event' // fate deck: global or villain-targeted event placed in the center play area
  | 'specialty'; // villain-unique card played to the right side of the Domain (rulebook §J)

export type ActionIcon =
  | 'gainPower' // gain 1 Power
  | 'gainPower2' // gain 2 Power (Thanos: Sanctuary II)
  | 'gainPower3' // gain 3 Power (Thanos: The Infinity Well)
  | 'move'
  | 'play'
  | 'fate'
  | 'discard'
  | 'vanquish'
  | 'activate' // some villains have unique icons
  | 'villainSpecific1'
  | 'villainSpecific2';

/**
 * A card definition. The plan (§2.1) writes the `villain` field as
 * `VillainKey | 'fate-' + VillainKey`; the type-correct encoding of that
 * intent is a template-literal union.
 */
export interface CardDef {
  id: CardId;
  /**
   * Which deck this card belongs to: a villain's own deck, a villain-specific
   * Fate deck, or the shared Common Fate deck (rulebook Setup §3).
   */
  villain: VillainKey | `fate-${VillainKey}` | 'fate-common';
  name: string; // USER FILLS — left blank in repo
  type: CardType;
  cost: number; // power cost
  strength?: number; // for allies/heroes
  text?: string; // USER FILLS
  effects: EffectSpec[]; // mechanical encoding (see §2.3)
  icons: ActionIcon[]; // if hero, which icons it COVERS at a location
  tags?: string[]; // 'avenger', 'asgard', etc. for conditional effects
}

/** A card instance physically present in a realm. */
export interface InPlayCard {
  instanceId: InstanceId;
  cardId: CardId;
  /** Accumulated strength boosts (turn-scoped and permanent collapsed here). */
  strengthModifier: number;
  /** Tokens placed on this card, keyed by token kind. */
  tokens: Record<string, number>;
}

// --- Filters (used by effect primitives) -----------------------------------

export interface AllyFilter {
  tags?: string[];
  minStrength?: number;
  villain?: VillainKey;
}

export interface LocationFilter {
  hasHero?: boolean;
  villainPresent?: boolean;
  index?: LocationIndex;
}

export interface CardFilter {
  type?: CardType;
  tags?: string[];
  maxCost?: number;
}

// --- Board -----------------------------------------------------------------

export interface Location {
  id: string;
  name: string;
  topIcons: ActionIcon[]; // 2 icons usually
  bottomIcons: ActionIcon[]; // covered by hero cards
  heroesPresent: InPlayCard[];
  alliesPresent: InPlayCard[];
  itemsPresent: InPlayCard[];
  conditions: InPlayCard[];
}

export interface Realm {
  villain: VillainKey;
  locations: [Location, Location, Location, Location]; // always 4
  villainTokenAt: LocationIndex;
}

// --- Objectives ------------------------------------------------------------

/**
 * Villain-agnostic objective progress. `checkWin` (per villain) reads this and
 * the player's `flags` to decide whether the win condition is met.
 */
export interface ObjectiveProgress {
  completed: boolean;
  /** Named sub-goals; value is a boolean flag or an integer counter. */
  steps: Record<string, boolean | number>;
}

// --- Targeting & prompts ---------------------------------------------------

export type TargetSpec =
  | { kind: 'location'; player: PlayerId; location: LocationIndex }
  | { kind: 'card'; player: PlayerId; instanceId: InstanceId }
  | { kind: 'player'; player: PlayerId };

export type PromptChoice =
  | { kind: 'target'; target: TargetSpec }
  | { kind: 'card'; cardId: CardId }
  | { kind: 'location'; location: LocationIndex }
  | { kind: 'skip' }
  | { kind: 'confirm' };

/**
 * A pending decision the engine cannot make on its own. The reducer pauses
 * with this set; the UI (or advisor) resolves it via a `resolvePrompt` action.
 *
 * `continuation` lets the prompt carry the data needed to resume a multi-step
 * effect (e.g. a Fate decision needs to know which two cards were revealed).
 */
export interface Prompt {
  id: string;
  player: PlayerId;
  kind: 'chooseTarget' | 'optional' | 'chooseCard' | 'chooseLocation';
  message: string;
  choices: PromptChoice[];
  continuation?: PromptContinuation;
}

/** Discriminated continuation for resolving a prompt. */
export type PromptContinuation = {
  kind: 'fatePlay';
  /** The eligible opponents the active player may target (any non-self seated player). */
  eligibleTargets: PlayerId[];
  /** The card(s) revealed from the shared Fate deck (rulebook: reveal-1, so length 1). */
  revealed: CardId[];
};

// --- Players & game state --------------------------------------------------

export interface LogEntry {
  turn: number;
  player: PlayerId;
  message: string;
}

export interface PlayerState {
  id: PlayerId;
  villain: VillainKey;
  power: number;
  hand: CardId[];
  deck: CardId[]; // draw pile (order matters)
  discard: CardId[];
  realm: Realm;
  /**
   * Villain-specific state. Kept JSON-serializable so the engine stays
   * replay-testable (e.g. Thanos's collected stones as a string[]).
   */
  flags: Record<string, unknown>;
  objectiveProgress: ObjectiveProgress;
  /**
   * Per-villain hand-size override. When `undefined`, the engine falls back
   * to the global default (`util.DEFAULT_HAND_SIZE`). Villains whose printed
   * rules diverge from the default override this.
   */
  handSize?: number;
  /**
   * Default `true`: at the start of a turn the villain MUST move to a
   * *different* location (marvel-villainous-plan.md §3). Card effects may
   * flip this for the current turn. Reset to `true` at start of turn.
   */
  mustMoveDifferent: boolean;
}

export type Phase = 'start' | 'move' | 'actions' | 'fate' | 'end';

/** An action icon already spent by the active player this turn. */
export interface UsedIcon {
  location: LocationIndex;
  iconIndex: number;
}

export interface GameState {
  seed: number;
  rngCursor: number;
  turn: number;
  activePlayer: PlayerId;
  phase: Phase;
  players: Record<PlayerId, PlayerState>;
  playerOrder: PlayerId[];
  log: LogEntry[];
  winner: PlayerId | null;
  pendingPrompt: Prompt | null; // for cards that need a choice
  /**
   * The single shared Fate deck. Per the printed rulebook (Setup §3): "Shuffle
   * together the Common Fate deck and the Fate decks from all Villains playing
   * this game to create a single Fate deck." Earlier chunks modeled this as a
   * per-player fateDeck which was incorrect — corrected in CHUNK 6.
   */
  fateDeck: CardId[];
  fateDiscard: CardId[];
  /**
   * The single Event slot in the center play area (rulebook §I, §J). Only one
   * Global Event can be in play at a time: "If a Global Event is in play and
   * you draw a new one from the Fate deck, place the newly drawn Global Event
   * on the discard pile." Targeted Events also live here; the active Event's
   * `targetedVillain` (if any) is read from the card definition.
   */
  globalEvent: InPlayCard | null;
  /**
   * Event-bus queue for triggered abilities. Filled by actions/effects and
   * drained (FIFO) at the end of every action before the reducer returns.
   */
  pendingTriggers: TriggerSpec[];
  /** Action icons the active player has already spent this turn. */
  usedIcons: UsedIcon[];
  /** Monotonic counter for minting deterministic InstanceIds. */
  instanceCounter: number;
}

// --- Triggered-ability event bus -------------------------------------------

export type TriggerEvent =
  | 'turnStart'
  | 'turnEnd'
  | 'villainMoved'
  | 'cardPlayed'
  | 'powerGained'
  | 'heroDefeated'
  | 'allyDefeated'
  | 'conditionTick';

/**
 * A queued triggered-ability event. `player` identifies whose realm the event
 * concerns; `payload` carries event-specific data for handlers (CHUNK 4+).
 */
export interface TriggerSpec {
  event: TriggerEvent;
  player: PlayerId;
  payload: Record<string, unknown>;
}

// --- Effect resolution context ---------------------------------------------

/** Context threaded into `applyEffect` so an effect knows who/what it serves. */
export interface EffectContext {
  /** The player resolving the effect. */
  player: PlayerId;
  /** The card-definition id the effect originated from, if any. */
  sourceCardId?: CardId;
  /** The in-play instance the effect originated from, if any. */
  sourceInstanceId?: InstanceId;
  /** The location the effect is anchored to, if any. */
  location?: LocationIndex;
}

// --- Actions (§2.2) --------------------------------------------------------

export type Action =
  | { kind: 'startTurn' }
  | { kind: 'moveVillain'; to: LocationIndex }
  | { kind: 'useIcon'; location: LocationIndex; iconIndex: number }
  | { kind: 'playCard'; cardId: CardId; target?: TargetSpec }
  | { kind: 'attackHero'; allyIds: CardId[]; heroId: CardId }
  | { kind: 'discardCards'; cardIds: CardId[] }
  | { kind: 'drawToHandSize' }
  | { kind: 'fate' }
  | { kind: 'resolvePrompt'; choice: PromptChoice }
  | { kind: 'endTurn' }
  | { kind: 'claimVictory' };

export type ActionKind = Action['kind'];

// --- Effect primitives (§2.3) ----------------------------------------------

export type EffectSpec =
  | { op: 'gainPower'; n: number }
  | { op: 'drawCards'; n: number }
  | { op: 'discardSelf' }
  | { op: 'moveAlly'; from: 'any' | 'thisLocation'; to: 'anyLocation' }
  | {
      op: 'boostStrength';
      allyFilter: AllyFilter;
      n: number;
      duration: 'turn' | 'permanent';
    }
  | { op: 'defeatHero'; whereFilter: LocationFilter }
  | { op: 'moveHero'; from: 'thisLocation'; to: 'anyLocation' }
  | { op: 'lookAtFate'; n: number; choose: number }
  | { op: 'searchDeck'; filter: CardFilter; into: 'hand' | 'play' }
  | { op: 'forceDiscard'; player: 'opponent'; n: number }
  | { op: 'placeToken'; tokenKind: string; on: 'self' | 'card' }
  | { op: 'villainSpecific'; key: string; payload: unknown }; // escape hatch

export type EffectOp = EffectSpec['op'];
