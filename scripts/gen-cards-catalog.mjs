#!/usr/bin/env node
// Generate CARDS.md — a single-page reference of every CardDef in the repo
// (name, type, cost, strength, text, mechanical effects). Re-run whenever
// deck data changes.
//
//   node scripts/gen-cards-catalog.mjs

// Invoke with:  node --import tsx/esm scripts/gen-cards-catalog.mjs
// or (one-shot): pnpm cards   (alias added in package.json)

import { writeFileSync } from 'fs';

const { thanosDeck } = await import('../src/engine/villains/thanos/deck.ts');
const { thanosFateDeck } = await import('../src/engine/villains/thanos/fateDeck.ts');
const { helaDeck } = await import('../src/engine/villains/hela/deck.ts');
const { helaFateDeck } = await import('../src/engine/villains/hela/fateDeck.ts');
const { killmongerDeck } = await import('../src/engine/villains/killmonger/deck.ts');
const { killmongerFateDeck } = await import('../src/engine/villains/killmonger/fateDeck.ts');
const { ultronDeck } = await import('../src/engine/villains/ultron/deck.ts');
const { ultronFateDeck } = await import('../src/engine/villains/ultron/fateDeck.ts');
const { taskmasterDeck } = await import('../src/engine/villains/taskmaster/deck.ts');
const { taskmasterFateDeck } = await import('../src/engine/villains/taskmaster/fateDeck.ts');
const { commonFateDeck } = await import('../src/engine/villains/common/fateDeck.ts');

function describeEffect(e) {
  if (!e || typeof e !== 'object') return String(e);
  switch (e.op) {
    case 'gainPower': return `+${e.n} Power`;
    case 'drawCards': return `draw ${e.n} card${e.n === 1 ? '' : 's'}`;
    case 'boostStrength': {
      const dur = e.duration === 'turn' ? ' (this turn)' : '';
      const tags = e.allyFilter?.tags?.length ? ` to ${e.allyFilter.tags.join('/')} ally` : ' to an ally';
      return `+${e.n} Strength${tags}${dur}`;
    }
    case 'defeatHero': return 'defeat a Hero';
    case 'moveAlly': return `move an Ally (${e.from} → ${e.to})`;
    case 'moveHero': return `move a Hero (${e.from} → ${e.to})`;
    case 'forceDiscard': return `force ${e.player} to discard ${e.n}`;
    case 'lookAtFate': return `look at ${e.n} Fate, keep ${e.choose}`;
    case 'villainSpecific': {
      const payload = e.payload && Object.keys(e.payload).length
        ? ` ${JSON.stringify(e.payload)}` : '';
      return `villainSpecific(${e.key})${payload}`;
    }
    default: return e.op || '?';
  }
}

function rowsFor(deck) {
  // Group identical cards (same id-prefix without the -N suffix) so a 4×
  // card shows once with " ×4".
  const seen = new Map();
  for (const c of deck) {
    const prefix = c.id.replace(/-\d+$/, '');
    if (!seen.has(prefix)) seen.set(prefix, { card: c, count: 0 });
    seen.get(prefix).count++;
  }
  const rows = [];
  for (const { card, count } of seen.values()) {
    const copies = count > 1 ? ` ×${count}` : '';
    const cost = card.cost === 0 ? '—' : String(card.cost);
    const str = card.strength !== undefined ? String(card.strength) : '—';
    const effects = card.effects?.length
      ? card.effects.map(describeEffect).join('; ')
      : '—';
    rows.push({
      name: card.name + copies,
      type: card.type,
      cost,
      str,
      text: card.text || '—',
      effects,
    });
  }
  return rows;
}

function tableFor(name, deck) {
  const rows = rowsFor(deck);
  const total = deck.length;
  let md = `### ${name} (${total} cards)\n\n`;
  md += '| Name | Type | Cost | Str | Printed text | Mechanical effect |\n';
  md += '| ---- | ---- | ---- | --- | ------------ | ----------------- |\n';
  for (const r of rows) {
    // Escape pipes inside cells.
    const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md += `| ${esc(r.name)} | ${r.type} | ${r.cost} | ${r.str} | ${esc(r.text)} | ${esc(r.effects)} |\n`;
  }
  md += '\n';
  return md;
}

let out = `# CARDS — full catalog

Auto-generated from the deck definitions in \`src/engine/villains/*/deck.ts\`
and \`*/fateDeck.ts\`. Re-run \`node scripts/gen-cards-catalog.mjs\` after
edits.

Each row shows the printed name (with copy count), card type, Power cost,
Strength (where printed), the reconstructed printed text, and the
mechanical effect the engine actually executes. Where "Mechanical
effect" reads \`villainSpecific(<key>)\`, the behavior lives in
\`src/engine/villains/<v>/specific.ts\` (or
\`src/engine/villains/common/specific.ts\` for \`fate.common.*\` keys).

**If a row looks wrong**, the fix is usually a one-line edit in
\`deck.ts\` / \`fateDeck.ts\` (for cost, strength, text) or in
\`specific.ts\` (for the mechanical behavior).

`;

out += '## Villain decks\n\n';
out += tableFor('Thanos', thanosDeck);
out += tableFor('Hela', helaDeck);
out += tableFor('Killmonger', killmongerDeck);
out += tableFor('Ultron', ultronDeck);
out += tableFor('Taskmaster', taskmasterDeck);

out += '## Fate decks\n\n';
out += tableFor('Common Fate (shared)', commonFateDeck);
out += tableFor("Thanos Fate", thanosFateDeck);
out += tableFor('Hela Fate', helaFateDeck);
out += tableFor('Killmonger Fate', killmongerFateDeck);
out += tableFor('Ultron Fate', ultronFateDeck);
out += tableFor('Taskmaster Fate', taskmasterFateDeck);

writeFileSync('CARDS.md', out);
process.stdout.write(`wrote CARDS.md — ${out.length} bytes\n`);
