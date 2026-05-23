// @vitest-environment happy-dom
//
// End-to-end DOM smoke test: mount the real React app, navigate from the main
// menu through the villain picker into a Thanos game, then drive a couple of
// in-game interactions through the rendered UI. This is what makes the M2
// acceptance line "you can launch the app and start a Thanos game" verifiable
// without a real display.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../src/app/App';
import { clearRegistry } from '../../src/engine/cards/registry';

beforeEach(() => {
  // HashRouter shares window.location.hash across tests; reset so every test
  // starts on the main menu.
  window.location.hash = '#/';
});

afterEach(() => {
  cleanup();
  clearRegistry();
});

describe('App — Thanos M2 end-to-end through the UI', () => {
  it('renders the main menu with a New Game link', () => {
    render(<App />);
    expect(screen.getByText('Marvel Villainous')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'New Game' })).toBeTruthy();
  });

  it('navigates to the villain picker when New Game is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    expect(screen.getByText(/Choose your villain/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Solo · Thanos/ })).toBeTruthy();
  });

  it('starts a Thanos game and renders the board, hand, and turn controls', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · Thanos/ }));

    // The board shows Thanos's realm with 4 locations.
    expect(screen.getByRole('heading', { name: 'thanos' })).toBeTruthy();
    const locationLabels = screen.getAllByText(/^Location \d$/);
    expect(locationLabels.length).toBe(4);

    // Hand shows 4 cards (the starting hand).
    const handHeading = screen.getByText(/Hand · 4 cards/);
    expect(handHeading).toBeTruthy();

    // The villain is at his starting location (loc 0) and the game opens in
    // the Move phase (newGame auto-advances past Start).
    expect(screen.getByText('⛧ Villain here')).toBeTruthy();
    expect(screen.getByText('move', { selector: 'strong' })).toBeTruthy();
  });

  it('moves the villain when an empty location is clicked during the Move phase', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · Thanos/ }));

    // Click on Location 3 — the villain travels there and the phase advances.
    const loc3 = screen.getByText(/^Location 3$/).closest('.location');
    if (!loc3) throw new Error('Location 3 element not found');
    fireEvent.click(loc3);

    // The phase indicator now reads "actions".
    expect(screen.getByText('actions', { selector: 'strong' })).toBeTruthy();
  });

  it('spends a gainPower icon to add power', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · Thanos/ }));
    // Move to advance to the Actions phase.
    const loc3 = screen.getByText(/^Location 3$/).closest('.location');
    if (!loc3) throw new Error('Location 3 element not found');
    fireEvent.click(loc3);

    // The gainPower icon is the first top-row icon at the current location.
    const gainPowerButtons = screen.getAllByRole('button', { name: 'gainPower' });
    // Power starts at 0; clicking the first enabled one bumps it to 1.
    const enabled = gainPowerButtons.find((b) => !(b as HTMLButtonElement).disabled);
    if (!enabled) throw new Error('no enabled gainPower icon');
    fireEvent.click(enabled);

    // Locate the Power readout and assert it became 1.
    const powerLabel = screen.getByText(/^Power:/);
    expect(powerLabel.textContent).toContain('1');
  });

  it('ends the turn through the End turn button and advances the turn counter', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'New Game' }));
    fireEvent.click(screen.getByRole('button', { name: /Solo · Thanos/ }));
    const loc3 = screen.getByText(/^Location 3$/).closest('.location');
    if (!loc3) throw new Error('Location 3 element not found');
    fireEvent.click(loc3);

    fireEvent.click(screen.getByRole('button', { name: 'End turn' }));
    // Solo Thanos game: the active player stays p1, turn rolls to 2, and the
    // engine auto-advances to the Move phase ready for the next turn.
    expect(screen.getByText('move', { selector: 'strong' })).toBeTruthy();
    const turnLabel = screen.getByText(/^Turn:/);
    expect(turnLabel.textContent).toContain('2');
  });
});
