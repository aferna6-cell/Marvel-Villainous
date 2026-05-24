// Hotseat pass-device curtain (marvel-villainous-plan.md §7).
//
// When the engine's activePlayer changes, render a full-screen overlay
// hiding everything until the new active player taps through. This keeps
// the previous player's hand secret in face-to-face play.

import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../hooks/useGameEngine';
import type { PlayerId } from '../../engine/types';

export function PassDeviceCurtain(): JSX.Element | null {
  const state = useGameState();
  const previousPlayer = useRef<PlayerId | null>(null);
  const [acknowledged, setAcknowledged] = useState<PlayerId | null>(state.activePlayer);

  useEffect(() => {
    if (previousPlayer.current !== state.activePlayer) {
      // Active player changed — show curtain until they tap through.
      if (previousPlayer.current !== null) {
        setAcknowledged(null);
      }
      previousPlayer.current = state.activePlayer;
    }
  }, [state.activePlayer]);

  // Don't curtain in single-player games or when winner already set.
  if (state.playerOrder.length < 2 || state.winner !== null) return null;
  if (acknowledged === state.activePlayer) return null;

  const active = state.players[state.activePlayer];
  return (
    <section className="curtain" role="dialog" aria-label="Pass the device">
      <h2 className="curtain__title">Pass the device</h2>
      <p className="curtain__body">
        It is now <strong>{state.activePlayer}</strong>&apos;s turn
        {active ? <> ({active.villain})</> : null}.
      </p>
      <button
        className="button button--primary"
        onClick={() => setAcknowledged(state.activePlayer)}
      >
        Ready
      </button>
    </section>
  );
}
