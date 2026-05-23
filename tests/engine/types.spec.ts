import { describe, expectTypeOf, it } from 'vitest';
import type { Action, EffectSpec } from '../../src/engine/types';

describe('Action union', () => {
  it('is discriminated on `kind` over exactly the ten action kinds', () => {
    expectTypeOf<Action['kind']>().toEqualTypeOf<
      | 'startTurn'
      | 'moveVillain'
      | 'useIcon'
      | 'playCard'
      | 'attackHero'
      | 'discardCards'
      | 'drawToHandSize'
      | 'fateOpponent'
      | 'resolvePrompt'
      | 'endTurn'
    >();
  });

  it('narrows each `kind` to its exact payload', () => {
    expectTypeOf<Extract<Action, { kind: 'moveVillain' }>>().toEqualTypeOf<{
      kind: 'moveVillain';
      to: 0 | 1 | 2 | 3;
    }>();
    expectTypeOf<Extract<Action, { kind: 'useIcon' }>>().toEqualTypeOf<{
      kind: 'useIcon';
      location: 0 | 1 | 2 | 3;
      iconIndex: number;
    }>();
    expectTypeOf<Extract<Action, { kind: 'endTurn' }>>().toEqualTypeOf<{
      kind: 'endTurn';
    }>();
  });

  it('compiles an exhaustive switch (a missed kind would be a tsc error)', () => {
    const handle = (a: Action): string => {
      switch (a.kind) {
        case 'startTurn':
          return a.kind;
        case 'moveVillain':
          return `to:${a.to}`;
        case 'useIcon':
          return `${a.location}:${a.iconIndex}`;
        case 'playCard':
          return a.cardId;
        case 'attackHero':
          return `${a.allyIds.join('+')}->${a.heroId}`;
        case 'discardCards':
          return a.cardIds.join(',');
        case 'drawToHandSize':
          return a.kind;
        case 'fateOpponent':
          return a.opponent;
        case 'resolvePrompt':
          return a.choice.kind;
        case 'endTurn':
          return a.kind;
        default: {
          // If a new Action kind is added without a case above, `a` is no
          // longer `never` here and this assignment fails to compile.
          const exhaustive: never = a;
          return exhaustive;
        }
      }
    };
    expectTypeOf(handle).toBeFunction();
  });
});

describe('EffectSpec union', () => {
  it('is discriminated on `op` and includes the villainSpecific escape hatch', () => {
    expectTypeOf<Extract<EffectSpec, { op: 'villainSpecific' }>>().toEqualTypeOf<{
      op: 'villainSpecific';
      key: string;
      payload: unknown;
    }>();
    expectTypeOf<Extract<EffectSpec, { op: 'gainPower' }>>().toEqualTypeOf<{
      op: 'gainPower';
      n: number;
    }>();
  });
});
