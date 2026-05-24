// Hela advisor weights + objective bonus (plan §8.2).

import type { PlayerState } from '../../types';
import type { Weights } from '../score';

export const HELA_WEIGHTS: Weights = {
  progressTowardObjective: 10,
  powerInBank: 1.5,
  handQuality: 1,
  boardControl: 2,
  iconAccess: 1,
  opponentThreat: -3,
  fateLeverage: 2,
};

/** Bonus for accumulated Soul Marks + Allies at Odin's Vault. */
export function HELA_OBJECTIVE_BONUS(p: PlayerState): number {
  const asgard = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
  return asgard * 2;
}
