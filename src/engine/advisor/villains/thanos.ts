// Thanos advisor weights + objective bonus (plan §8.2).

import type { PlayerState } from '../../types';
import type { Weights } from '../score';

export const THANOS_WEIGHTS: Weights = {
  progressTowardObjective: 10,
  powerInBank: 1,
  handQuality: 1,
  boardControl: 1.5,
  iconAccess: 1,
  opponentThreat: -3,
  fateLeverage: 2,
};

/** Big bonus for each collected Infinity Stone. */
export function THANOS_OBJECTIVE_BONUS(p: PlayerState): number {
  const stones = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
  return stones * 3;
}
