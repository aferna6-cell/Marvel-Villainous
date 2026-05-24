#!/usr/bin/env node
// Marvel Villainous Wiki card scraper.
//
// Outputs scripts/card-data.json — one entry per CardDef prefix with the
// printed name, type, cost, strength, ability text. Idempotent.
// Needs xvfb-run + Playwright full Chromium (headless trips Cloudflare).

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const OUT = 'scripts/card-data.json';
const BASE = 'https://villainous.fandom.com/wiki/';

// (prefix, wiki path). The id prefix matches what's used in src/engine/
// villains/*/deck.ts and *fateDeck.ts.
const CARDS = [
  // ============================= Thanos ===================================
  ['thanos-legions', 'The_Legions_of_Thanos'],
  ['thanos-black-dwarf', 'Black_Dwarf'],
  ['thanos-black-swan', 'Black_Swan'],
  ['thanos-corvus-glaive', 'Corvus_Glaive'],
  ['thanos-ebony-maw', 'Ebony_Maw'],
  ['thanos-proxima-midnight', 'Proxima_Midnight'],
  ['thanos-consult', 'Consult_the_Well'],
  ['thanos-small-price', 'A_Small_Price_to_Pay...'],
  ['thanos-taste-cosmic', 'Taste_of_Cosmic_Power'],
  ['thanos-deliver-judgment', 'Deliver_Judgment'],
  ['thanos-mad-titan', 'The_Mad_Titan'],
  ['thanos-warp-reality', 'Warp_Reality'],
  ['thanos-deaths-favor', "Death%27s_Favor"],
  ['thanos-space-throne', 'Space_Throne'],
  // Thanos Fate
  ['fate-thanos-adam-warlock', 'Adam_Warlock'],
  ['fate-thanos-drax', 'Drax_the_Destroyer'],
  ['fate-thanos-gamora', 'Gamora'],
  ['fate-thanos-nebula', 'Nebula'],
  ['fate-thanos-stone-is-found', 'A_Stone_Is_Found'],
  ['fate-thanos-what-did-it-cost', 'What_Did_It_Cost%3F'],
  ['fate-thanos-sacrifices-must-be-made', 'Sacrifices_Must_Be_Made'],

  // ============================= Hela =====================================
  ['hela-disir', 'Dísir'],
  ['hela-draugr-swordsman', 'Draugr_Swordsman'],
  ['hela-fenris-wolf', 'Fenris_Wolf'],
  ['hela-leah', 'Leah'],
  ['hela-midgard-serpent', 'Midgard_Serpent'],
  ['hela-marked-by-death', 'Marked_By_Death'],
  ['hela-deaths-embrace', "Death%27s_Embrace"],
  ['hela-hel-to-pay', 'Hel_to_Pay'],
  ['hela-prices-of-life', 'Prices_of_Life'],
  ['hela-soul-for-a-soul', 'Soul_for_a_Soul'],
  ['hela-nightsword', 'Nightsword'],
  ['hela-hand-of-glory', 'Hand_of_Glory'],
  ['hela-helas-bidding', "Hela%27s_Bidding"],
  ['hela-raise-the-dead', 'Raise_the_Dead'],
  // Hela Fate
  ['fate-hela-angela', 'Angela'],
  ['fate-hela-balder', 'Balder_the_Brave'],
  ['fate-hela-valkyrior', 'Valkyrior'],
  ['fate-hela-odin-force', 'The_Odin_Force'],
  ['fate-hela-conquer-valhalla', 'Conquer_Valhalla'],
  ['fate-hela-fate-intervenes', 'Fate_Intervenes'],
  ['fate-hela-revive-souls', 'Revive_Souls'],

  // ============================ Killmonger ================================
  ['killmonger-king', 'King_of_Wakanda'],
  ['killmonger-knight', 'Knight'],
  ['killmonger-rook', 'Rook'],
  ['killmonger-wkabi', "W%27Kabi"],
  ['killmonger-dog-of-war', 'Dog_of_War'],
  ['killmonger-armored-rhino', 'Armored_Rhino'],
  ['killmonger-overpower', 'Overpower'],
  ['killmonger-rage-of-kliluna', 'Rage_of_Kliluna'],
  ['killmonger-stolen-wisdom', 'Stolen_Wisdom'],
  ['killmonger-execute-plan', 'Execute_the_Plan'],
  ['killmonger-fury', 'Fury'],
  ['killmonger-taunt', 'Taunt'],
  ['killmonger-wound', 'Wound'],
  ['killmonger-weapons-cache', 'Weapons_Cache'],
  ['killmonger-explosives', 'Explosives'],
  ['killmonger-heart-shaped-herb', 'Heart-Shaped_Herb'],
  ['killmonger-hacking-rig', 'Hacking_Rig'],
  // Killmonger Fate
  ['fate-killmonger-black-panther', 'Black_Panther'],
  ['fate-killmonger-okoye', 'Okoye'],
  ['fate-killmonger-shuri', 'Shuri'],
  ['fate-killmonger-everett-k-ross', 'Everett_K._Ross'],
  ['fate-killmonger-dora-milaje', 'Dora_Milaje'],
  ['fate-killmonger-hatut-zeraze', 'Hatut_Zeraze'],
  ['fate-killmonger-stolen-antiquities', 'Stolen_Antiquities'],
  ['fate-killmonger-wakanda-forever', 'Wakanda_Forever'],

  // ============================ Ultron ====================================
  ['ultron-alkhema', 'Alkhema'],
  ['ultron-giant-sentry', 'Giant_Sentry'],
  ['ultron-jocasta', 'Jocasta'],
  ['ultron-flying-sentry', 'Flying_Sentry'],
  ['ultron-heavy-attack-sentry', 'Heavy_Attack_Sentry'],
  ['ultron-duplicate-sentry', 'Duplicate_Sentry'],
  ['ultron-encephalo-ray', 'Encephalo-Ray'],
  ['ultron-assimilate-knowledge', 'Assimilate_Knowledge'],
  ['ultron-reconfigure', 'Reconfigure'],
  ['ultron-technoforming', 'Technoforming'],
  ['ultron-every-contingency-covered', 'Every_Contingency_Covered'],
  ['ultron-impervious-alloy', 'Impervious_Alloy'],
  ['ultron-assembly-line', 'Assembly_Line'],
  // Ultron Fate
  ['fate-ultron-hank-pym', 'Hank_Pym'],
  ['fate-ultron-mockingbird', 'Mockingbird'],
  ['fate-ultron-scarlet-witch', 'Scarlet_Witch'],
  ['fate-ultron-wasp', 'Wasp'],
  ['fate-ultron-wonder-man', 'Wonder_Man'],
  ['fate-ultron-invasion-stark', 'Invasion_of_Stark_Industries'],
  ['fate-ultron-deactivation-switch', 'Deactivation_Switch'],
  ['fate-ultron-molecular-rearranger', 'Molecular_Rearranger'],

  // =========================== Taskmaster =================================
  ['taskmaster-anaconda', 'Anaconda'],
  ['taskmaster-black-ant', 'Black_Ant'],
  ['taskmaster-blood-spider', 'Blood_Spider'],
  ['taskmaster-crossbones', 'Crossbones'],
  ['taskmaster-diamondback', 'Diamondback'],
  ['taskmaster-trainees', 'Trainees'],
  ['taskmaster-trainer-for-hire', 'Trainer_for_Hire'],
  ['taskmaster-shadow-initiative', 'Shadow_Initiative'],
  ['taskmaster-conduct-exercise', 'Conduct_an_Exercise'],
  ['taskmaster-redeploy', 'Redeploy'],
  ['taskmaster-photographic-reflexes', 'Photographic_Reflexes'],
  ['taskmaster-lesson-plan', 'Lesson_Plan'],
  ['taskmaster-training-academy', 'Training_Academy'],
  ['taskmaster-training-dummy', 'Training_Dummy'],
  ['taskmaster-bow', 'Bow'],
  ['taskmaster-jagged-bow', 'Jagged_Bow'],
  ['taskmaster-sword', 'Sword'],
  ['taskmaster-shield', 'Shield'],
  ['taskmaster-death-shield', "Death-Shield"],
  // Taskmaster Fate
  ['fate-taskmaster-butterball', 'Butterball'],
  ['fate-taskmaster-scott-lang', 'Scott_Lang'],
  ['fate-taskmaster-scarlet-spider-clone', 'Scarlet_Spider'],
  ['fate-taskmaster-found-by-avengers', 'Found_by_the_Avengers'],
  ['fate-taskmaster-government-work', 'Government_Work'],
  ['fate-taskmaster-solo', 'Solo'],

  // ========================= Common Fate ==================================
  ['fate-common-iron-man', 'Iron_Man'],
  ['fate-common-black-widow', 'Black_Widow'],
  ['fate-common-nick-fury', 'Nick_Fury'],
  ['fate-common-hulk', 'Hulk'],
  ['fate-common-falcon', 'Falcon'],
  ['fate-common-hawkeye', 'Hawkeye'],
  ['fate-common-she-hulk', 'She-Hulk'],
  ['fate-common-vision', 'Vision'],
  ['fate-common-thor', 'Thor'],
  ['fate-common-captain-marvel', 'Captain_Marvel'],
  ['fate-common-captain-america', 'Captain_America'],
  ['fate-common-avengers-assemble', 'Avengers_Assemble'],
  ['fate-common-lockdown-at-raft', 'Lockdown_at_the_Raft'],
  ['fate-common-helicarrier-alert', 'Helicarrier_Alert'],
  ['fate-common-protected-vibranium', 'Protected_Vibranium'],
];

async function scrapeOne(page, prefix, path) {
  const url = BASE + path;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (e) {
    return { prefix, url, error: `nav: ${e.message}` };
  }
  try {
    await page.waitForFunction(
      () => !!document.querySelector('aside.portable-infobox, .mw-parser-output > p'),
      undefined,
      { timeout: 30_000, polling: 500 },
    );
  } catch {
    return { prefix, url, error: 'no infobox after wait' };
  }
  const data = await page.evaluate(() => {
    const trim = (s) => (s ? s.replace(/\s+/g, ' ').trim() : '');
    const title = trim(document.querySelector('h1#firstHeading')?.textContent);
    const infobox = document.querySelector('aside.portable-infobox');
    const fields = {};
    if (infobox) {
      infobox.querySelectorAll('.pi-item.pi-data').forEach((row) => {
        const k = trim(row.querySelector('.pi-data-label')?.textContent).toLowerCase();
        const v = trim(row.querySelector('.pi-data-value')?.textContent);
        if (k) fields[k] = v;
      });
    }
    const paras = Array.from(document.querySelectorAll('.mw-parser-output > p'))
      .map((p) => trim(p.textContent))
      .filter(Boolean)
      .slice(0, 4);
    return { title, fields, paras };
  });
  return { prefix, url, ...data };
}

async function main() {
  const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
    executablePath: '/opt/pw-browsers/chromium-1223/chrome-linux64/chrome',
  });
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  const out = { ...existing };
  for (const [prefix, path] of CARDS) {
    if (out[prefix] && !out[prefix].error && out[prefix].paras?.length) {
      process.stdout.write(`. ${prefix} cached\n`);
      continue;
    }
    const page = await ctx.newPage();
    let data;
    try {
      data = await scrapeOne(page, prefix, path);
    } catch (e) {
      data = { prefix, error: `throw: ${e.message}` };
    }
    out[prefix] = data;
    if (data.error) process.stdout.write(`! ${prefix} ${data.error}\n`);
    else process.stdout.write(`+ ${prefix} ${data.title}\n`);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    await page.close();
  }
  await browser.close();
  process.stdout.write(`done — ${OUT} (${Object.keys(out).length} entries)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
