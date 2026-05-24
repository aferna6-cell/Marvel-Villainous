// Killmonger advisor weights + objective bonus (plan §8.2).

import type { PlayerState } from '../../types';
import type { Weights } from '../score';

export const KILLMONGER_WEIGHTS: Weights = {
  progressTowardObjective: 10,
  powerInBank: 1,
  handQuality: 1,
  boardControl: 2.5,
  iconAccess: 1,
  opponentThreat: -3,
  fateLeverage: 2,
};

/** Bonus per boss defeated in the Wakanda sequence. */
export function KILLMONGER_OBJECTIVE_BONUS(p: PlayerState): number {
  const bosses = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
  return bosses * 4;
}
