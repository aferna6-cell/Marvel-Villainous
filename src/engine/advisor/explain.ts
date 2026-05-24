// Turn a Candidate into 1–4 plain-English bullets (plan §8.3).
//
// The advisor stays deterministic and offline: bullets come from action
// types + feature deltas, never from an LLM. (An LLM commentary layer
// is plan §8.6 — explicitly post-hoc, not on the decision path.)

import { getCard } from '../cards/registry';
import type { Action } from '../types';
import type { Candidate } from './search';

export function describeAction(a: Action): string {
  switch (a.kind) {
    case 'startTurn': return 'Start your turn.';
    case 'moveVillain': return `Move your villain to location ${a.to + 1}.`;
    case 'useIcon': return `Spend the icon at slot ${a.iconIndex + 1} of your current location.`;
    case 'playCard': {
      const def = getCard(a.cardId);
      const cost = def?.cost ?? 0;
      const strength = def?.strength;
      const what = def?.type === 'ally' ? 'Ally' : def?.type === 'item' ? 'Item' : def?.type === 'condition' ? 'Condition' : 'card';
      return `Play ${a.cardId} (${what}, cost ${cost}${strength !== undefined ? `, strength ${strength}` : ''}).`;
    }
    case 'attackHero':
      return `Vanquish ${a.heroId} with ${a.allyIds.length} ally/allies.`;
    case 'discardCards':
      return `Discard ${a.cardIds.length} card(s) from hand.`;
    case 'drawToHandSize':
      return 'Draw back up to your hand-size limit.';
    case 'fate':
      return 'Fate an opponent (reveal one Fate card).';
    case 'resolvePrompt': {
      const c = a.choice;
      switch (c.kind) {
        case 'target': return `Target ${c.target.kind === 'player' ? c.target.player : c.target.kind}.`;
        case 'card': return `Select card ${c.cardId}.`;
        case 'location': return `Place at location ${c.location + 1}.`;
        case 'skip': return 'Skip — discard with no effect.';
        case 'confirm': return 'Confirm.';
      }
      return 'Resolve the pending prompt.';
    }
    case 'endTurn': return 'End your turn — opponents go next.';
    case 'claimVictory': return 'Claim victory — your objective is met.';
    case 'relocateAlly': return `Relocate ${a.instanceId} from location ${a.fromLocation + 1} to ${a.toLocation + 1}.`;
    case 'setObjectiveCount':
      return `Adjust ${a.player}'s ${a.key} by ${a.delta >= 0 ? '+' : ''}${a.delta}.`;
    case 'setStrictIconMode':
      return `Strict icons ${a.value ? 'ON' : 'OFF'}.`;
    case 'removeFromPlay':
      return `Remove ${a.instanceId} from play.`;
    case 'undo':
      return 'Undo the last action.';
    case 'adjustPower':
      return `Adjust ${a.player}'s power by ${a.delta >= 0 ? '+' : ''}${a.delta}.`;
    case 'drawCards':
      return `Draw ${a.n} card(s).`;
  }
}

/** Convert a Candidate into 1–4 short bullets ordered by descending impact. */
export function explain(c: Candidate): string[] {
  const bullets: string[] = [describeAction(c.action)];

  const d = c.featuresDelta;
  // Order by absolute impact and pick the top 3 deltas.
  const ranked: { label: string; value: number }[] = [
    { label: `objective progress +${(d.progressTowardObjective * 100).toFixed(0)}%`, value: d.progressTowardObjective },
    { label: `${d.powerInBank >= 0 ? 'gain' : 'spend'} ${Math.abs(d.powerInBank).toFixed(0)} Power`, value: d.powerInBank },
    { label: `board control ${d.boardControl >= 0 ? '+' : ''}${d.boardControl.toFixed(0)}`, value: d.boardControl },
    { label: `hand quality ${d.handQuality >= 0 ? '+' : ''}${d.handQuality.toFixed(0)}`, value: d.handQuality },
    { label: `icon access ${d.iconAccess >= 0 ? '+' : ''}${d.iconAccess}`, value: d.iconAccess },
    { label: `opponent threat ${d.opponentThreat >= 0 ? '+' : ''}${(d.opponentThreat * 100).toFixed(0)}%`, value: -d.opponentThreat },
  ];
  ranked.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  for (const r of ranked) {
    if (Math.abs(r.value) < 0.0001) continue;
    bullets.push(`Δ ${r.label}.`);
    if (bullets.length >= 4) break;
  }
  return bullets;
}
