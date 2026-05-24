// Taskmaster advisor weights + objective bonus (plan §8.2).

import type { PlayerState } from '../../types';
import type { Weights } from '../score';

export const TASKMASTER_WEIGHTS: Weights = {
  progressTowardObjective: 10,
  powerInBank: 1,
  handQuality: 1.5, // contracts reward planning over a sequence of cards
  boardControl: 1.5,
  iconAccess: 1,
  opponentThreat: -3,
  fateLeverage: 2,
};

/** Bonus per completed contract. */
export function TASKMASTER_OBJECTIVE_BONUS(p: PlayerState): number {
  const contracts = (p.objectiveProgress.steps['contracts'] as number | undefined) ?? 0;
  return contracts * 4;
}
