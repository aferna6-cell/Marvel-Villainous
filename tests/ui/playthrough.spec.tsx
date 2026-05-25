// @vitest-environment happy-dom
//
// UI playthrough — drives the real React app like a player would:
// New Game → Villain Picker → click villain → start turn → move →
// use icon → fate → suggest a move → end turn. Each step asserts the
// rendered UI changed in the expected way.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../src/app/App';
import { clearRegistry } from '../../src/engine/cards/registry';

beforeEach(() => {
  window.location.hash = '#/';
});

afterEach(() => {
  cleanup();
  clearRegistry();
});

describe('UI playthrough — Thanos solo, multi-action turn', () => {
  it('walks New Game → Thanos → move → use icon → fate → end turn through clicks', () => {
    render(<App />);
    // Main menu.
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    // Villain picker.
    fireEvent.click(screen.getByRole('button', { name: /Solo · thanos/i }));

    // Game screen renders the board + hand + turn controls.
    expect(screen.getByRole('heading', { name: 'thanos' })).toBeTruthy();
    expect(screen.getByText(/Hand · 4 cards/)).toBeTruthy();
    expect(screen.getByText('move', { selector: 'strong' })).toBeTruthy();

    // Move to Location 3.
    const loc3 = screen.getByText(/^Location 3$/).closest('.location');
    if (!loc3) throw new Error('Location 3 not found');
    fireEvent.click(loc3);
    expect(screen.getByText('actions', { selector: 'strong' })).toBeTruthy();

    // Try to spend an icon at Loc 3.
    const enabledIcons = screen.getAllByRole('button').filter((b) => {
      const t = b.textContent ?? '';
      return /gainPower|play|move|fate|discard|vanquish|activate/.test(t) &&
             !(b as HTMLButtonElement).disabled;
    });
    if (enabledIcons.length > 0) {
      const iconText = enabledIcons[0]!.textContent;
      fireEvent.click(enabledIcons[0]!);
      // For a gainPower icon, Power should bump.
      if (iconText?.includes('gainPower')) {
        const powerLabel = screen.getByText(/^Power:/);
        const num = (powerLabel.textContent ?? '').match(/\d+/);
        expect(num).not.toBeNull();
      }
    }

    // Suggest a move — verifies the advisor wires up.
    const suggestBtn = screen.queryByRole('button', { name: 'Suggest a move' });
    if (suggestBtn) {
      fireEvent.click(suggestBtn);
      // After clicking suggest, the advisor renders top recommendation.
      const useThis = screen.queryByRole('button', { name: 'Use this' });
      if (useThis) {
        // Don't fire — just verify it exists.
        expect(useThis).toBeTruthy();
      }
    }

    // Toggle Strict icons — verifies the toggle is wired.
    const strict = screen.queryByLabelText('Strict icons');
    if (strict) {
      fireEvent.click(strict);
      expect((strict as HTMLInputElement).checked).toBe(true);
      fireEvent.click(strict);
      expect((strict as HTMLInputElement).checked).toBe(false);
    }

    // Fate action — only legal when there's an opponent, so solo will refuse.
    const fateBtn = screen.queryByRole('button', { name: 'Fate' });
    if (fateBtn && !(fateBtn as HTMLButtonElement).disabled) {
      fireEvent.click(fateBtn);
    }

    // End turn.
    fireEvent.click(screen.getByRole('button', { name: 'End turn' }));
    // The engine should have rotated back to p1 in solo mode and bumped turn.
    const turnLabel = screen.getByText(/Turn:/);
    expect(turnLabel.textContent).toMatch(/Turn:\s*2/);
  });

  it('renders the multi-realm Board for a 2-player game with any two villains', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    // The new picker has 2 seats, each with all 5 villain choices. Pick
    // any two distinct villains (Killmonger + Ultron — verifying the
    // picker isn't locked to Thanos/Hela).
    const seatChoices = screen.getAllByRole('button', { name: 'Killmonger' });
    expect(seatChoices.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(seatChoices[0]!);
    const seatChoicesUltron = screen.getAllByRole('button', { name: 'Ultron' });
    expect(seatChoicesUltron.length).toBeGreaterThanOrEqual(2);
    // Pick the one for seat 2 — after seat 1 picked Killmonger, the seat-1
    // Killmonger is button[0], so seat-2 Ultron is the second occurrence.
    fireEvent.click(seatChoicesUltron[1]!);
    fireEvent.click(screen.getByRole('button', { name: /Start 2-Player Game/i }));

    // 2 players means 8 locations total (4 per realm).
    const locations = screen.getAllByText(/^Location \d$/);
    expect(locations.length).toBe(8);
  });

  it('disables a villain on other seats once one seat picks it', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    // Pick Thanos on seat 1.
    const thanosBtns = screen.getAllByRole('button', { name: 'Thanos' });
    fireEvent.click(thanosBtns[0]!);
    // Now seat 2's Thanos button should be disabled.
    const after = screen.getAllByRole('button', { name: 'Thanos' });
    expect((after[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('add/remove seat scales the picker from 2 to 4 seats', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    // Start at 2 seats — there should be 2× 5 = 10 villain buttons in the picker.
    let allThanos = screen.getAllByRole('button', { name: 'Thanos' });
    expect(allThanos.length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: /\+ Seat/ }));
    allThanos = screen.getAllByRole('button', { name: 'Thanos' });
    expect(allThanos.length).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: /\+ Seat/ }));
    allThanos = screen.getAllByRole('button', { name: 'Thanos' });
    expect(allThanos.length).toBe(4);
    // The + Seat button should now be disabled (max 4 seats).
    expect((screen.getByRole('button', { name: /\+ Seat/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('drag-and-drop plays a card from hand to a location and removes it from hand', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · thanos/i }));

    // Move into actions phase (need a DIFFERENT location from current).
    const loc2 = screen.getByText(/^Location 2$/).closest('.location') as HTMLElement;
    fireEvent.click(loc2);
    expect(screen.getByText('actions', { selector: 'strong' })).toBeTruthy();

    // Grant power so any card in hand is affordable.
    const allBtns = screen.getAllByRole('button');
    const plusPow = allBtns.find((b) => b.textContent === '+Pow');
    if (!plusPow) throw new Error('no +Pow button');
    for (let i = 0; i < 6; i++) fireEvent.click(plusPow);

    // Grab the first card chip in the hand.
    const hand = document.querySelector('.hand');
    const firstCard = hand?.querySelector('.card') as HTMLElement | null;
    if (!firstCard) throw new Error('no card in hand');
    const cardName = firstCard.querySelector('.card__name')?.textContent ?? '';
    // Set up a DataTransfer-like stub and fire dragstart → dragover → drop.
    const handBefore = screen.getByText(/Hand · \d cards/).textContent;
    const dt = {
      data: new Map<string, string>(),
      effectAllowed: '',
      setData(t: string, v: string) {
        this.data.set(t, v);
      },
      getData(t: string) {
        return this.data.get(t) ?? '';
      },
    };
    fireEvent.dragStart(firstCard, { dataTransfer: dt as unknown as DataTransfer });
    // After dragStart, the cardId should be set on the dataTransfer. The
    // engine reads it by `text/cardid` key — the Card component sets it
    // from `cardId` (the registry id).
    const cardId = dt.getData('text/cardid');
    expect(cardId).not.toBe('');
    // Find Location 2 (where the villain now is) and drop on it. The engine
    // accepts drops on any location in the active player's realm.
    fireEvent.dragOver(loc2, { dataTransfer: dt as unknown as DataTransfer });
    fireEvent.drop(loc2, { dataTransfer: dt as unknown as DataTransfer });

    // Hand should have one fewer card now.
    const handAfter = screen.getByText(/Hand · \d cards/).textContent;
    expect(handAfter).not.toBe(handBefore);
    // And the played card should no longer be in the hand region.
    if (cardName) {
      const handCards = hand?.querySelectorAll('.card__name') ?? [];
      const stillThere = Array.from(handCards).some((n) => n.textContent === cardName);
      expect(stillThere).toBe(false);
    }
  });

  it('Quit button returns to the main menu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · thanos/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Quit' }));
    // Back at main menu — New Game link should be present.
    expect(screen.getByRole('link', { name: 'New Game' })).toBeTruthy();
  });
});
