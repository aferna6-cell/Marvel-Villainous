// `activate` / villain-specific action icon.
//
// Spending an ACTIVATE icon at your villain's current location lets you
// trigger one in-play Item or Specialty AT THAT LOCATION whose card def
// carries `activateEffects[]`. The active player picks via a parked
// prompt; the deferred resolver runs the chosen card's activateEffects.

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import type {
  ActionIcon,
  GameState,
  PlayerId,
  PromptChoice,
} from '../types';

export function applyActivate(state: GameState, player: PlayerId, icon: ActionIcon): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) return s;
  const loc = p.realm.locations[p.realm.villainTokenAt];
  if (!loc) return s;

  // Collect every Item / Specialty / Condition at this location whose def
  // declares activateEffects. We allow Specialty cards even if they're not
  // physically in play at the location (engine convention: specialty
  // permanents live in-play; we treat them as activatable anywhere in your
  // Domain). For simplicity here only at-this-location items/specialties.
  const choices: PromptChoice[] = [];
  for (const it of loc.itemsPresent) {
    const def = getCard(it.cardId);
    if (def?.activateEffects?.length) {
      choices.push({ kind: 'card', cardId: it.instanceId });
    }
  }
  // Specialties may also live at the location (we currently place them
  // there); include them.
  for (const c of loc.alliesPresent) {
    const def = getCard(c.cardId);
    if (def?.type === 'specialty' && def.activateEffects?.length) {
      choices.push({ kind: 'card', cardId: c.instanceId });
    }
  }
  for (const cond of loc.conditions) {
    const def = getCard(cond.cardId);
    if (def?.activateEffects?.length) {
      choices.push({ kind: 'card', cardId: cond.instanceId });
    }
  }

  if (choices.length === 0) {
    s.log.push({
      turn: s.turn,
      player,
      message: `"${icon}" icon used — no activatable Item/Specialty at this location.`,
    });
    return s;
  }

  s.pendingPrompt = {
    id: `prompt-${s.turn}-${s.log.length}`,
    player,
    kind: 'chooseCard',
    message: `Choose an Item or Specialty to ACTIVATE at your location`,
    choices: [...choices, { kind: 'skip' }],
    continuation: { kind: 'deferred', tag: 'activateItem' },
  };
  s.log.push({
    turn: s.turn,
    player,
    message: `"${icon}" icon used — choose what to ACTIVATE`,
  });
  return s;
}
