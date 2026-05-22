import { describe, expect, it } from 'vitest';
import { drainTriggers, reduce } from '../../src/engine/state';
import { makeGame } from './fixtures';
import type { TriggerSpec } from '../../src/engine/types';

describe('triggered-ability event bus', () => {
  it('drains queued triggers in FIFO order', () => {
    const triggers: TriggerSpec[] = [
      { event: 'turnStart', player: 'p1', payload: {} },
      { event: 'villainMoved', player: 'p1', payload: {} },
      { event: 'powerGained', player: 'p1', payload: {} },
    ];
    const next = drainTriggers(makeGame({ pendingTriggers: triggers }));
    expect(next.pendingTriggers).toHaveLength(0);
    const order = next.log
      .filter((e) => e.message.startsWith('trigger:'))
      .map((e) => e.message);
    expect(order).toEqual([
      'trigger: turnStart',
      'trigger: villainMoved',
      'trigger: powerGained',
    ]);
  });

  it('returns the same state object when there is nothing to drain', () => {
    const game = makeGame();
    expect(drainTriggers(game)).toBe(game);
  });

  it('the reducer drains triggers an action enqueues', () => {
    const next = reduce(makeGame({ phase: 'start' }), { kind: 'startTurn' });
    expect(next.pendingTriggers).toHaveLength(0);
    expect(next.log.some((e) => e.message === 'trigger: turnStart')).toBe(true);
  });

  it('does not mutate the input state while draining', () => {
    const game = makeGame({ pendingTriggers: [{ event: 'turnEnd', player: 'p1', payload: {} }] });
    const before = JSON.stringify(game);
    drainTriggers(game);
    expect(JSON.stringify(game)).toBe(before);
  });
});
