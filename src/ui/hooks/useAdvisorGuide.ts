// useAdvisorGuide — light-weight React context for "Use as guide" mode.
//
// When the advisor's "Use as guide" button is pressed it stores the
// recommended Action here. The Board's Location component reads it and
// adds a subtle highlight class to the matching icon / card / location
// so the player can find the suggested move while still acting manually.

import { createContext, useContext, useMemo, useState } from 'react';
import type { Action } from '../../engine/types';

export interface AdvisorGuideValue {
  highlighted: Action | null;
  highlight: (a: Action) => void;
  clear: () => void;
}

export const AdvisorGuideContext = createContext<AdvisorGuideValue | null>(null);

export function useAdvisorGuide(): AdvisorGuideValue {
  const ctx = useContext(AdvisorGuideContext);
  if (!ctx) throw new Error('useAdvisorGuide: missing <AdvisorGuideContext.Provider>');
  return ctx;
}

/** Memoized factory for the context value — use this in the app root. */
export function useAdvisorGuideState(): AdvisorGuideValue {
  const [highlighted, setHighlighted] = useState<Action | null>(null);
  return useMemo(
    () => ({
      highlighted,
      highlight: (a: Action) => setHighlighted(a),
      clear: () => setHighlighted(null),
    }),
    [highlighted],
  );
}
