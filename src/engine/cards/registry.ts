// Card-definition registry (marvel-villainous-plan.md §2.1).
//
// CardDefs are static reference data, not game state — like a database the
// engine reads. Per-villain decks register their cards here at load time; the
// reducer and validator look them up by id. This module holds a module-level
// map deliberately: it is constant data, never mutated mid-game.

import type { CardDef, CardId } from '../types';

const registry = new Map<CardId, CardDef>();

/** Register a batch of card definitions (called by per-villain deck modules). */
export function registerCards(cards: readonly CardDef[]): void {
  for (const card of cards) {
    if (registry.has(card.id)) {
      throw new Error(`registerCards: duplicate card id "${card.id}"`);
    }
    registry.set(card.id, card);
  }
}

/** Look up a card definition by id. */
export function getCard(id: CardId): CardDef | undefined {
  return registry.get(id);
}

/** Number of registered card definitions. */
export function registrySize(): number {
  return registry.size;
}

/** Clear the registry. Intended for test isolation only. */
export function clearRegistry(): void {
  registry.clear();
}
