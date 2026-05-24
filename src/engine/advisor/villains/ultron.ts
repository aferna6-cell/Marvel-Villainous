// Ultron advisor weights + objective bonus (plan §8.2).

import type { PlayerState } from '../../types';
import type { Weights } from '../score';

export const ULTRON_WEIGHTS: Weights = {
  progressTowardObjective: 10,
  powerInBank: 2, // upgrades are expensive
  handQuality: 1,
  boardControl: 2,
  iconAccess: 1.5,
  opponentThreat: -3,
  fateLeverage: 2,
};

/** Bonus per installed Upgrade, with a big extra for reaching final form. */
export function ULTRON_OBJECTIVE_BONUS(p: PlayerState): number {
  const upgrades = (p.objectiveProgress.steps['upgrades'] as number | undefined) ?? 0;
  const finalForm = (p.objectiveProgress.steps['finalForm'] as number | undefined) ?? 0;
  return upgrades * 3 + finalForm * 10;
}
