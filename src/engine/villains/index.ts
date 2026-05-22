// Aggregator: per-villain mechanical card data, indexed by villain key.
// Each entry's `deck` is the villain's main deck and `fateDeck` is the deck
// opponents Fate against them. Real card data lives in the per-villain
// `deck.ts` / `fateDeck.ts` files; this file just composes them so `setup.ts`
// (and future setup-time consumers) can register everything in one step.

import { thanosDeck } from './thanos/deck';
import { thanosFateDeck } from './thanos/fateDeck';
import { helaDeck } from './hela/deck';
import { helaFateDeck } from './hela/fateDeck';
import { killmongerDeck } from './killmonger/deck';
import { killmongerFateDeck } from './killmonger/fateDeck';
import { taskmasterDeck } from './taskmaster/deck';
import { taskmasterFateDeck } from './taskmaster/fateDeck';
import { ultronDeck } from './ultron/deck';
import { ultronFateDeck } from './ultron/fateDeck';
import type { CardDef, VillainKey } from '../types';

export interface VillainData {
  deck: CardDef[];
  fateDeck: CardDef[];
}

export const villains: Record<VillainKey, VillainData> = {
  thanos: { deck: thanosDeck, fateDeck: thanosFateDeck },
  hela: { deck: helaDeck, fateDeck: helaFateDeck },
  killmonger: { deck: killmongerDeck, fateDeck: killmongerFateDeck },
  taskmaster: { deck: taskmasterDeck, fateDeck: taskmasterFateDeck },
  ultron: { deck: ultronDeck, fateDeck: ultronFateDeck },
};
