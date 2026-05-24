// State-value scoring (plan §8.2).
//
// Computes a small set of villain-agnostic features that the per-villain
// weight tables (`villains/<v>.ts`) combine into a single score. Higher
// score = more favourable end-of-action state for `asPlayer`.

import { getCard } from '../cards/registry';
import type { GameState, PlayerId, PlayerState, VillainKey } from '../types';
import { THANOS_WEIGHTS, THANOS_OBJECTIVE_BONUS } from './villains/thanos';
import { HELA_WEIGHTS, HELA_OBJECTIVE_BONUS } from './villains/hela';
import { KILLMONGER_WEIGHTS, KILLMONGER_OBJECTIVE_BONUS } from './villains/killmonger';
import { TASKMASTER_WEIGHTS, TASKMASTER_OBJECTIVE_BONUS } from './villains/taskmaster';
import { ULTRON_WEIGHTS, ULTRON_OBJECTIVE_BONUS } from './villains/ultron';

export interface FeatureSet {
  progressTowardObjective: number; // 0..1
  powerInBank: number;
  handQuality: number;
  boardControl: number;
  iconAccess: number;
  opponentThreat: number; // max opponent's progressTowardObjective (0..1)
  fateLeverage: number;
}

export type Weights = Record<keyof FeatureSet, number>;

const WEIGHTS_BY_VILLAIN: Record<VillainKey, Weights> = {
  thanos: THANOS_WEIGHTS,
  hela: HELA_WEIGHTS,
  killmonger: KILLMONGER_WEIGHTS,
  taskmaster: TASKMASTER_WEIGHTS,
  ultron: ULTRON_WEIGHTS,
};

const OBJECTIVE_BONUS_BY_VILLAIN: Record<VillainKey, (p: PlayerState) => number> = {
  thanos: THANOS_OBJECTIVE_BONUS,
  hela: HELA_OBJECTIVE_BONUS,
  killmonger: KILLMONGER_OBJECTIVE_BONUS,
  taskmaster: TASKMASTER_OBJECTIVE_BONUS,
  ultron: ULTRON_OBJECTIVE_BONUS,
};

const OBJECTIVE_TARGET: Record<VillainKey, number> = {
  thanos: 6,
  hela: 8,
  killmonger: 4,
  taskmaster: 4,
  ultron: 4, // upgrades — finalForm flag adds bonus separately
};

function objectiveProgress01(p: PlayerState): number {
  const v = p.villain;
  const target = OBJECTIVE_TARGET[v];
  const steps = p.objectiveProgress.steps;
  const main =
    v === 'thanos' ? (steps['stones'] as number | undefined) ?? 0 :
    v === 'hela' ? (steps['asgard'] as number | undefined) ?? 0 :
    v === 'killmonger' ? (steps['bosses'] as number | undefined) ?? 0 :
    v === 'taskmaster' ? (steps['contracts'] as number | undefined) ?? 0 :
    /* ultron */ (steps['upgrades'] as number | undefined) ?? 0;
  return Math.min(1, main / target);
}

function handQuality(p: PlayerState): number {
  let q = 0;
  for (const id of p.hand) {
    const def = getCard(id);
    if (!def) continue;
    const value = (def.strength ?? 0) + 1;
    q += Math.max(0, value - def.cost);
  }
  return q;
}

function boardControl(p: PlayerState): number {
  let ally = 0;
  let hero = 0;
  for (const loc of p.realm.locations) {
    for (const a of loc.alliesPresent) {
      const def = getCard(a.cardId);
      ally += (def?.strength ?? 0) + a.strengthModifier;
    }
    for (const h of loc.heroesPresent) {
      const def = getCard(h.cardId);
      hero += (def?.strength ?? 0) + h.strengthModifier;
    }
  }
  return ally - hero;
}

function iconAccess(state: GameState, p: PlayerState): number {
  const loc = p.realm.locations[p.realm.villainTokenAt];
  if (!loc) return 0;
  const heroes = loc.heroesPresent.length > 0;
  const all = [...loc.topIcons, ...loc.bottomIcons];
  let n = 0;
  for (let i = 0; i < all.length; i++) {
    if (i >= loc.topIcons.length && heroes) continue;
    const used = state.usedIcons.some(
      (u) => u.location === p.realm.villainTokenAt && u.iconIndex === i,
    );
    if (!used) n++;
  }
  return n;
}

function fateLeverage(state: GameState, asPlayer: PlayerId): number {
  let heroesInDiscard = 0;
  for (const id of state.fateDiscard) {
    const def = getCard(id);
    if (def?.type === 'hero') heroesInDiscard++;
  }
  let maxOpp = 0;
  for (const id of state.playerOrder) {
    if (id === asPlayer) continue;
    const p = state.players[id];
    if (!p) continue;
    maxOpp = Math.max(maxOpp, objectiveProgress01(p));
  }
  return heroesInDiscard * maxOpp;
}

export function features(state: GameState, asPlayer: PlayerId): FeatureSet {
  const me = state.players[asPlayer];
  if (!me) throw new Error(`features: unknown player "${asPlayer}"`);
  let opp = 0;
  for (const id of state.playerOrder) {
    if (id === asPlayer) continue;
    const p = state.players[id];
    if (!p) continue;
    opp = Math.max(opp, objectiveProgress01(p));
  }
  return {
    progressTowardObjective: objectiveProgress01(me),
    powerInBank: me.power,
    handQuality: handQuality(me),
    boardControl: boardControl(me),
    iconAccess: iconAccess(state, me),
    opponentThreat: opp,
    fateLeverage: fateLeverage(state, asPlayer),
  };
}

/** Weighted-sum state value for `asPlayer`. Higher is better. */
export function score(state: GameState, asPlayer: PlayerId): number {
  const me = state.players[asPlayer];
  if (!me) return -Infinity;
  if (state.winner === asPlayer) return 1_000_000;
  if (state.winner !== null) return -1_000_000;
  const f = features(state, asPlayer);
  const w = WEIGHTS_BY_VILLAIN[me.villain];
  let s = 0;
  for (const k of Object.keys(f) as (keyof FeatureSet)[]) {
    s += (w[k] ?? 0) * f[k];
  }
  s += OBJECTIVE_BONUS_BY_VILLAIN[me.villain](me);
  return s;
}
