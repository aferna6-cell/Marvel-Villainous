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
  /**
   * Targeted Events (rulebook §I): when an Event card is "Targeted" at a
   * specific villain, it MUST be played on the indicated villain when
   * drawn from Fate. Untargeted (Global) Events have no constraint.
   */
  targetedVillain?: VillainKey;
}

/** A card instance physically present in a realm. */
export interface InPlayCard {
  instanceId: InstanceId;
  cardId: CardId;
  /**
   * Effective strength modifier — sum of all +/-1 Strength tokens plus any
   * "while X" passive bonuses the engine recomputes on demand. Tokens
   * placed by cards (Taste of Cosmic Power, Overpower, Captain America,
   * Encephalo-Ray, etc.) increment `tokens.strength` AND `strengthModifier`
   * in lock-step so removing a token decrements both.
   */
  strengthModifier: number;
  /** Tokens placed on this card, keyed by token kind (`strength`, `mark`, etc.). */
  tokens: Record<string, number>;
  /** True for Heroes that currently carry a Soul Mark (Hela mechanic). */
  soulMark?: boolean;
  /**
   * Instance id of the Ally/Hero this card is attached to (for Items like
   * Impervious Alloy, Wound, Odin-Force, Deactivation Switch, Photographic
   * Reflexes). When the target is removed, the attached Item is too.
   */
  attachedTo?: InstanceId;
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
export type PromptContinuation =
  | {
      kind: 'fatePlay';
      /** The eligible opponents the active player may target (any non-self seated player). */
      eligibleTargets: PlayerId[];
      /** The card(s) revealed from the shared Fate deck (rulebook: reveal-1, so length 1). */
      revealed: CardId[];
    }
  | {
      kind: 'fatePlaceLocation';
      /** Targeted opponent picked in the previous prompt step. */
      opponent: PlayerId;
      /** The revealed card being placed. */
      cardId: CardId;
    }
  | {
      /**
       * Generic deferred command — the parked-prompt cards (Proxima snipe,
       * Black Ant free-play, Diamondback debuff, etc.) tag the action that
       * should fire when the player picks one of the offered choices. The
       * resolver looks at `tag` and executes the matching code.
       */
      kind: 'deferred';
      tag: DeferredTag;
      /** Per-tag data the resolver needs (target villain, source card, etc.). */
      payload?: Record<string, unknown>;
    };

/** Tags supported by the deferred-action resolver in `cards/effects.ts`. */
export type DeferredTag =
  | 'defeatCharacter' // payload.locationsScope: number[] (location indices on active player's realm)
  | 'discardOwnAlly' // active player picks one of their own Allies to defeat
  | 'discardFromHand' // pick a card from active player's hand to discard; payload.n?: number for the cycle
  | 'boostAlly' // payload.n: number — place +n tokens on chosen ally instance
  | 'debuffHero' // payload.n: number — place -n tokens on chosen hero instance
  | 'soulMarkHero' // attach a soul mark to chosen hero
  | 'playFromHandFree' // pick a card from hand to play for free
  | 'playFromDiscard' // pick a card from discard (type-filtered via payload.type) to play
  | 'addToHandFromDiscard' // pick a card from discard (type-filtered) to return to hand
  | 'giveStoneToOpponent' // pick an opponent to receive an unclaimed Stone
  | 'tasteCosmic' // taste-of-cosmic-power follow-up (boost + free vanquish)
  | 'attachItem' // pick an Ally/Hero to attach an Item to; payload.itemInstanceId
  | 'pickEffectFromDiscard' // pick an Effect from discard to return to hand (Warp Reality, Lesson Plan)
  | 'pickAlly'; // pick one of your Allies (handler reads payload.purpose)

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
  /**
   * When `true`, icon-gated actions (playCard, attackHero/Vanquish, fate,
   * discardCards, relocateAlly) require an unused matching icon at the
   * active player's current location and consume it. When `false`
   * (default), the engine acts as a relaxed state tracker — useful while
   * per-card ability auto-wiring is still being built out. Toggleable
   * from the UI so a hotseat group can opt into the rulebook-strict
   * enforcement (Q2) when they're ready.
   */
  strictIconMode: boolean;
  /**
   * Bounded ring buffer of prior `GameState` snapshots, FIFO. The reducer
   * pushes a snapshot before applying any action other than `undo` itself.
   * The `undo` action pops the most recent snapshot back into place.
   * Cap small (≈12) so memory stays bounded — a hotseat group rarely needs
   * to rewind further than a turn or two.
   */
  history: GameState[];
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
  | { kind: 'claimVictory' }
  /**
   * Relocate one of your own Allies or Items between two locations in your
   * own Domain (rulebook §7 Relocate). The Move-an-Item-or-Ally action icon
   * permits this freely; cards can also grant it.
   */
  | { kind: 'relocateAlly'; fromLocation: LocationIndex; instanceId: InstanceId; toLocation: LocationIndex }
  /**
   * Free-form objective-progress edit. Card-ability auto-wiring hasn't
   * landed yet, so players use this to tally objective tokens by hand
   * (Infinity Stones, Soul Marks, Upgrade level, defeated bosses, contracts).
   * The engine then auto-detects the per-villain win condition.
   */
  | { kind: 'setObjectiveCount'; player: PlayerId; key: string; delta: number }
  /** Toggle the rulebook-strict icon enforcement (Q2). */
  | { kind: 'setStrictIconMode'; value: boolean }
  /**
   * Remove a single in-play card instance (ally / hero / item / condition,
   * or the global event) from wherever it is in `state`, sending it to the
   * appropriate discard pile. Player effects routinely defeat / discard /
   * destroy in-play cards; this is the engine's escape hatch for the
   * hotseat group to mechanize that outside Vanquish.
   */
  | { kind: 'removeFromPlay'; owner: PlayerId; instanceId: InstanceId }
  /**
   * Rewind the engine to the previous game state. The reducer keeps a
   * one-deep snapshot of the prior state (`history`) so the hotseat group
   * can recover from a misclick without restarting. Successive undos pop
   * further snapshots until none remain.
   */
  | { kind: 'undo' }
  /**
   * Free-form Power adjustment. Card text routinely says "lose 2 Power" /
   * "gain 1 Power", and the engine doesn't auto-resolve most card text
   * (§0). Player ticks ± with this action. Power clamps at zero on the
   * way down (no negative Power per rulebook §11).
   */
  | { kind: 'adjustPower'; player: PlayerId; delta: number }
  /**
   * Draw N cards (out of phase). The end-of-turn refill uses
   * `drawToHandSize`; this is the corresponding hand-mid-turn action for
   * cards that say "draw 1 card". Empty deck reshuffles the discard pile
   * per rulebook (Draw Cards).
   */
  | { kind: 'drawCards'; player: PlayerId; n: number };

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
