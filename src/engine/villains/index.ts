// Aggregator: per-villain mechanical data (deck, fate deck, realm factory),
// indexed by villain key. `setup.ts` reads from this so it can build a game
// without knowing about each villain individually.

import { thanosDeck } from './thanos/deck';
import { thanosFateDeck } from './thanos/fateDeck';
import { thanosRealm } from './thanos/realm';
import { helaDeck } from './hela/deck';
import { helaFateDeck } from './hela/fateDeck';
import { helaRealm } from './hela/realm';
import { killmongerDeck } from './killmonger/deck';
import { killmongerFateDeck } from './killmonger/fateDeck';
import { killmongerRealm } from './killmonger/realm';
import { taskmasterDeck } from './taskmaster/deck';
import { taskmasterFateDeck } from './taskmaster/fateDeck';
import { taskmasterRealm } from './taskmaster/realm';
import { ultronDeck } from './ultron/deck';
import { ultronFateDeck } from './ultron/fateDeck';
import { ultronRealm } from './ultron/realm';
import type { CardDef, Realm, VillainKey } from '../types';

export interface VillainData {
  deck: CardDef[];
  fateDeck: CardDef[];
  /** Build a fresh realm with this villain's board layout. */
  makeRealm: () => Realm;
}

export const villains: Record<VillainKey, VillainData> = {
  thanos: { deck: thanosDeck, fateDeck: thanosFateDeck, makeRealm: thanosRealm },
  hela: { deck: helaDeck, fateDeck: helaFateDeck, makeRealm: helaRealm },
  killmonger: {
    deck: killmongerDeck,
    fateDeck: killmongerFateDeck,
    makeRealm: killmongerRealm,
  },
  taskmaster: {
    deck: taskmasterDeck,
    fateDeck: taskmasterFateDeck,
    makeRealm: taskmasterRealm,
  },
  ultron: { deck: ultronDeck, fateDeck: ultronFateDeck, makeRealm: ultronRealm },
};
