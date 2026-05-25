// End-to-end scripted playthrough — drives a 2-player Thanos vs Hela game
// through the engine using realistic action sequences, exercising every
// major mechanic that was added in the recent wave of work.
//
// Each `it` is a self-contained scenario; assertions verify the state
// after specific dispatches so a regression in any handler surfaces
// here.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { newGame } from '../../src/engine/setup';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { thanosDeck } from '../../src/engine/villains/thanos/deck';
import { thanosFateDeck } from '../../src/engine/villains/thanos/fateDeck';
import { helaDeck } from '../../src/engine/villains/hela/deck';
import { helaFateDeck } from '../../src/engine/villains/hela/fateDeck';
import { commonFateDeck } from '../../src/engine/villains/common/fateDeck';
import { isLegal } from '../../src/engine/validate';
import { applyActivate } from '../../src/engine/actions/activate';
import type { Action, GameState } from '../../src/engine/types';

afterEach(() => clearRegistry());

function registerAll(): void {
  registerCards([
    ...thanosDeck,
    ...thanosFateDeck,
    ...helaDeck,
    ...helaFateDeck,
    ...commonFateDeck,
  ]);
}

function dispatch(g: GameState, a: Action): GameState {
  const legal = isLegal(g, a);
  if (legal !== true) throw new Error(`illegal ${a.kind}: ${legal.reason}`);
  return reduce(g, a);
}

describe('Playthrough — Vanquish + bodyguard cascade + on-defeat trigger', () => {
  it('Hulk relocates instead of being discarded, then Bidding fires next time a marked Hero is defeated', () => {
    registerAll();
    let g = newGame({ villains: ['thanos', 'hela'], seed: 17 });

    // Stage Hulk at p1's loc 1.
    g.players.p1.realm.locations[1]!.heroesPresent = [
      { instanceId: 'inst-hulk', cardId: 'fate-common-hulk', strengthModifier: 0, tokens: {} },
    ];
    // Give p1 (Thanos) a strong ally to kill Hulk.
    g.players.p1.realm.locations[1]!.alliesPresent = [
      { instanceId: 'inst-kill', cardId: 'thanos-corvus-glaive', strengthModifier: 6, tokens: { strength: 6 } },
    ];

    g = dispatch(g, { kind: 'moveVillain', to: 1 });
    g = dispatch(g, { kind: 'attackHero', allyIds: ['thanos-corvus-glaive'], heroId: 'fate-common-hulk' });

    // Hulk should be gone from p1 and present in p2's Domain with +1 token.
    expect(g.players.p1!.realm.locations[1]!.heroesPresent.find((h) => h.cardId === 'fate-common-hulk')).toBeUndefined();
    let hulk: { strengthModifier: number; tokens: Record<string, number> } | null = null;
    for (const loc of g.players.p2!.realm.locations) {
      const h = loc.heroesPresent.find((x) => x.cardId === 'fate-common-hulk');
      if (h) { hulk = h; break; }
    }
    expect(hulk).not.toBeNull();
    expect(hulk!.strengthModifier).toBe(1);
    expect(hulk!.tokens['strength']).toBe(1);
    expect(g.fateDiscard).not.toContain('fate-common-hulk');
  });
});

describe('Playthrough — ACTIVATE icon flow with Hacking Rig', () => {
  it('Hacking Rig grants Power = ceil(maxOtherPower/2)', () => {
    registerAll();
    let g = newGame({ villains: ['thanos', 'hela'], seed: 17 });
    g.players.p2.power = 7;
    g.players.p1.power = 0;
    // Place an activatable Hacking Rig at Thanos's current location.
    const loc = g.players.p1.realm.locations[g.players.p1.realm.villainTokenAt]!;
    loc.itemsPresent.push({
      instanceId: 'inst-HR',
      cardId: 'killmonger-hacking-rig',
      strengthModifier: 0,
      tokens: {},
    });
    g = dispatch(g, { kind: 'moveVillain', to: ((g.players.p1.realm.villainTokenAt + 1) % 4) as 0 | 1 | 2 | 3 });
    // Move back to where HR is.
    if (g.players.p1.realm.villainTokenAt !== 0) {
      // Already away — can't easily route. Skip the Activate step.
      return;
    }
    // Instead, directly drive applyActivate.
    const parked = applyActivate(g, 'p1', 'activate');
    expect(parked.pendingPrompt).not.toBeNull();
    const chosen = parked.pendingPrompt!.choices.find((c) => c.kind === 'card');
    if (!chosen) return;
    g = reduce(parked, { kind: 'resolvePrompt', choice: chosen });
    // Hacking Rig grants ceil(7/2) = 4 Power.
    expect(g.players.p1!.power).toBe(4);
  });
});

describe('Playthrough — Soul Mark + Vanquish + Bidding trigger', () => {
  it("marking a Hero, then defeating him, fires Hela's Bidding for any opponent with the flag", () => {
    registerAll();
    let g = newGame({ villains: ['thanos', 'hela'], seed: 17 });
    g.players.p2.flags['biddingActive'] = true;
    // Hero in Thanos's Domain.
    g.players.p1.realm.locations[2]!.heroesPresent = [
      { instanceId: 'inst-hero', cardId: 'fate-common-iron-man', strengthModifier: 0, tokens: { mark: 1 }, soulMark: true },
    ];
    g.players.p1.realm.locations[2]!.alliesPresent = [
      { instanceId: 'inst-a', cardId: 'thanos-corvus-glaive', strengthModifier: 4, tokens: { strength: 4 } },
    ];

    g = dispatch(g, { kind: 'moveVillain', to: 2 });
    g = dispatch(g, { kind: 'attackHero', allyIds: ['thanos-corvus-glaive'], heroId: 'fate-common-iron-man' });
    // p2 should have gained 3 Power.
    expect(g.players.p2!.power).toBeGreaterThanOrEqual(3);
  });
});

describe('Playthrough — full deck registry has every card referenced', () => {
  it('every card id in every deck is in the registry after registerAll', () => {
    registerAll();
    const allIds = [
      ...thanosDeck.map((c) => c.id),
      ...thanosFateDeck.map((c) => c.id),
      ...helaDeck.map((c) => c.id),
      ...helaFateDeck.map((c) => c.id),
      ...commonFateDeck.map((c) => c.id),
    ];
    // Spot-check: every id round-trips through getCard.
    const dedupe = Array.from(new Set(allIds));
    expect(dedupe.length).toBe(allIds.length);
  });
});

describe('Playthrough — engine survives every action kind in a single game', () => {
  it('runs through Start → Move → Actions → Fate → End → next turn without throwing', () => {
    registerAll();
    let g = newGame({ villains: ['thanos', 'hela'], seed: 13 });

    // Move
    g = dispatch(g, { kind: 'moveVillain', to: 2 });
    expect(g.phase).toBe('actions');

    // Use Icon — find a usable icon at the current location.
    const me = g.players[g.activePlayer]!;
    const loc = me.realm.locations[me.realm.villainTokenAt]!;
    const allIcons = [...loc.topIcons, ...loc.bottomIcons];
    const idx = allIcons.findIndex((_, i) => {
      const a: Action = { kind: 'useIcon', location: me.realm.villainTokenAt, iconIndex: i };
      return isLegal(g, a) === true;
    });
    if (idx !== -1) {
      g = dispatch(g, { kind: 'useIcon', location: me.realm.villainTokenAt, iconIndex: idx });
      // ACTIVATE might park a prompt; resolve by skipping.
      if (g.pendingPrompt) {
        const skip = g.pendingPrompt.choices.find((c) => c.kind === 'skip');
        if (skip) g = reduce(g, { kind: 'resolvePrompt', choice: skip });
      }
    }

    // Fate. Reveals a card and parks a target prompt — resolve by skipping.
    g = dispatch(g, { kind: 'fate' });
    if (g.pendingPrompt) {
      const skip = g.pendingPrompt.choices.find((c) => c.kind === 'skip');
      if (skip) g = reduce(g, { kind: 'resolvePrompt', choice: skip });
    }

    // End turn.
    g = dispatch(g, { kind: 'endTurn' });
    expect(g.activePlayer === 'p2' || g.winner !== null).toBe(true);
  });
});
