# CARDS — full catalog

Auto-generated from the deck definitions in `src/engine/villains/*/deck.ts`
and `*/fateDeck.ts`. Re-run `node scripts/gen-cards-catalog.mjs` after
edits.

Each row shows the printed name (with copy count), card type, Power cost,
Strength (where printed), the reconstructed printed text, and the
mechanical effect the engine actually executes. Where "Mechanical
effect" reads `villainSpecific(<key>)`, the behavior lives in
`src/engine/villains/<v>/specific.ts` (or
`src/engine/villains/common/specific.ts` for `fate.common.*` keys).

**If a row looks wrong**, the fix is usually a one-line edit in
`deck.ts` / `fateDeck.ts` (for cost, strength, text) or in
`specific.ts` (for the mechanical behavior).

## Villain decks

### Thanos (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| The Legions of Thanos ×5 | ally | 1 | 2 | Thanos's rank-and-file army. | — |
| Black Dwarf | ally | 3 | 6 | BLACK DWARF cannot be played or relocated to Events. | villainSpecific(thanos.blackDwarf.restrictEvent) |
| Black Swan | ally | 2 | 1 | BLACK SWAN gains +1 Strength for each other Black Order Ally Thanos has in play. | villainSpecific(thanos.blackSwan.boost) |
| Corvus Glaive | ally | 3 | 4 | When CORVUS GLAIVE is defeated, return him to your hand instead of the discard pile (once per game). | villainSpecific(thanos.corvusGlaive.returnOnDefeat) |
| Ebony Maw | ally | 3 | 4 | When EBONY MAW is played, draw 1 card. | draw 1 card |
| Proxima Midnight | ally | 2 | 3 | PROXIMA MIDNIGHT cannot be assigned to a location with a Hero. | villainSpecific(thanos.proxima.noHeroLocation) |
| Consult the Well ×4 | effect | 2 | — | Take an Infinity Stone from the Infinity Well and place it on a matching location in your Domain. | villainSpecific(thanos.consultWell) |
| A Small Price To Pay... ×3 | effect | — | — | Discard one of your Allies to gain 3 Power. | villainSpecific(thanos.smallPrice) |
| Taste of Cosmic Power ×3 | effect | 2 | — | Gain 1 Power for each Infinity Stone you have collected. | villainSpecific(thanos.tasteCosmic) |
| Deliver Judgment ×2 | effect | 3 | — | Defeat a Hero of Strength 4 or less. | defeat a Hero |
| The Mad Titan ×2 | effect | — | — | PLAY COST equals the Strength of the target character. Defeat any one character (Ally or Hero) at any location. | villainSpecific(thanos.madTitan) |
| Warp Reality ×2 | effect | 1 | — | Move any Ally or Item in your Domain to any location. | move an Ally (any → anyLocation) |
| Death's Favor ×3 | item | 2 | — | While DEATH'S FAVOR is in play at a location, that location gains an additional Vanquish action icon. | villainSpecific(thanos.deathsFavor.grantVanquish) |
| Space Throne | item | 2 | — | While SPACE THRONE is in play, the Thanos token gains the "Move an Item or Ally" ability at its location. | villainSpecific(thanos.spaceThrone.grantMove) |

### Hela (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dísir ×4 | ally | 2 | 3 | Undead Asgardian shieldmaiden. | — |
| Draugr Swordsman ×4 | ally | 1 | 2 | Risen warrior of Hel. | — |
| Fenris Wolf | ally | 2 | 3 | Fenris ignores the first Strength of any Hero he attacks. | villainSpecific(hela.fenris.ignoreFirst) |
| Leah | ally | 2 | 2 | When LEAH is played, you may draw 1 card. | draw 1 card |
| Midgard Serpent | ally | 3 | 5 | Massive sea-beast — covers any single icon at its location while present. | villainSpecific(hela.midgardSerpent.coverIcon) |
| Marked by Death ×5 | effect | 1 | — | Place a Soul Mark on this location. | villainSpecific(placeSoulMark) |
| Death's Embrace ×3 | effect | — | — | Defeat one of your own Allies at any location and place a Soul Mark there. | villainSpecific(hela.deathsEmbrace) |
| Hel to Pay ×2 | effect | 2 | — | Defeat any Hero of Strength 3 or less. | defeat a Hero |
| Prices of Life ×2 | effect | — | — | Gain 1 Power for each Soul Mark on the board. | villainSpecific(hela.pricesOfLife) |
| Soul for a Soul ×2 | effect | 1 | — | Move a defeated Ally from your discard back to any location in your Domain. | villainSpecific(hela.soulForASoul) |
| Nightsword ×2 | item | 2 | — | The Ally holding NIGHTSWORD gains +2 Strength. | +2 Strength to an ally |
| Hand of Glory | specialty | 2 | — | Hela may discard any number of cards then draw the same number. | villainSpecific(hela.handOfGlory) |
| Hela's Bidding | specialty | 3 | — | Take an extra action this turn. | villainSpecific(hela.bidding) |
| Raise the Dead | specialty | 2 | — | Return one Ally from Hela's discard to her hand. | villainSpecific(hela.raiseTheDead) |

### Killmonger (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dog of War ×3 | ally | 1 | 2 | Killmonger's loyal mercenary. | — |
| Knight | ally | 3 | 5 | Heavily armed enforcer. | — |
| King of Wakanda | ally | 2 | 4 | When KING OF WAKANDA is played, advance the boss sequence by 1. | villainSpecific(defeatBoss) |
| Rook | ally | 2 | 2 | When ROOK is at a location, allies there gain +1 Strength. | villainSpecific(killmonger.rook.buffLocation) |
| W'Kabi | ally | 2 | 3 | W'KABI ignores the Rhino tag restriction (relocate freely). | — |
| Killmonger's Fury ×4 | effect | 2 | — | An Ally gains +3 Strength this turn. | +3 Strength to an ally (this turn) |
| Execute the Plan ×2 | effect | 1 | — | Vanquish a Hero of Strength 3 or less without paying Power. | defeat a Hero |
| Taunt ×2 | effect | — | — | Move a Hero from any location to the location of your villain. | move a Hero (thisLocation → anyLocation) |
| Overpower | effect | 2 | — | Defeat any Hero — your Allies are not discarded for this Vanquish. | villainSpecific(killmonger.overpower) |
| Weapons Cache ×4 | item | 1 | — | Allies at this location gain +1 Strength. | villainSpecific(killmonger.weaponsCache) |
| Explosives ×3 | item | 2 | — | Discard EXPLOSIVES to defeat a Hero of Strength 4 or less. | villainSpecific(killmonger.explosives) |
| Wound ×2 | item | 1 | -2 | Attach to a Hero — that Hero's Strength is reduced by 2. | villainSpecific(killmonger.wound) |
| Hacking Rig | item | 2 | — | Once per turn, peek at the top card of any Fate deck. | look at 1 Fate, keep 0 |
| Armored Rhino | specialty | — | — | A Rhino Ally is placed at the first available location with this token. | villainSpecific(killmonger.armoredRhino) |
| Heart-Shaped Herb | specialty | 3 | — | Killmonger gains 1 strength permanently — boost an Ally by 1. | +1 Strength to an ally |
| Rage of K'liluna | specialty | 1 | — | Killmonger's player draws 2 cards. | draw 2 cards |
| Stolen Wisdom | specialty | 3 | — | Advance the Wakanda boss sequence by 1. | villainSpecific(defeatBoss) |

### Ultron (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Duplicate Sentry ×4 | ally | 1 | 2 | Basic Sentry copy. | — |
| Flying Sentry ×3 | ally | 2 | 3 | FLYING SENTRY may be relocated to any location for free. | villainSpecific(ultron.flyingSentry.freeRelocate) |
| Heavy Attack Sentry ×3 | ally | 2 | 3 | When attacking a Hero, gain +2 Strength. | villainSpecific(ultron.heavyAttack.vanquishBoost) |
| Alkhema | ally | 3 | 3 | When ALKHEMA is played, you may draw 1 card. | draw 1 card |
| Giant Sentry | ally | 6 | 6 | GIANT SENTRY counts as one Upgrade. | villainSpecific(installUpgrade) {"slot":"giant"} |
| Jocasta | ally | 4 | 3 | When JOCASTA is played, Ultron reaches final form. | villainSpecific(markFinalForm) |
| Reconfigure ×3 | effect | — | — | Move one of your Sentries to any location. | move an Ally (any → anyLocation) |
| Assimilate Knowledge ×2 | effect | 1 | — | Look at the top 2 cards of your deck — keep one, discard the other. | look at 2 Fate, keep 1 |
| Encephalo-Ray ×2 | effect | 2 | — | An opponent discards 1 card from their hand. | force opponent to discard 1 |
| Every Contingency Covered ×2 | effect | 1 | — | Draw 2 cards. | draw 2 cards |
| Technoforming ×2 | effect | 1 | — | Install an Upgrade at any location. | villainSpecific(installUpgrade) {"slot":"forming"} |
| Impervious Alloy ×4 | item | 2 | 2 | Attach to a Sentry — that Sentry gains +2 Strength. | +2 Strength to sentry ally |
| Assembly Line ×2 | item | 1 | — | Allies at this location cost 1 less Power to play. | villainSpecific(ultron.assemblyLine.costReduction) |

### Taskmaster (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Trainees ×3 | ally | 1 | 1 | Cheap muscle in training. | — |
| Anaconda | ally | 2 | 3 | Serpent Society member — squeezes the life out. | — |
| Black Ant | ally | 2 | 2 | When BLACK ANT is played, you may peek at an opponent's hand. | villainSpecific(taskmaster.blackAnt.peek) |
| Blood Spider | ally | 2 | 3 | A Spider-Man imitator. | — |
| Crossbones | ally | 2 | 3 | Ex-special forces mercenary. | — |
| Death-Shield | ally | 2 | 3 | Throwing-shield specialist. | — |
| Diamondback | ally | 1 | 2 | Serpent Society dagger expert. | — |
| Jagged-Bow | ally | 2 | 3 | Skilled archer assassin. | — |
| Conduct an Exercise ×4 | effect | — | — | Complete the active Contract — advances the contract counter by 1. | villainSpecific(completeContract) {"contractId":"exercise"} |
| Redeploy ×2 | effect | 2 | — | Move all your Allies into any one location. | villainSpecific(taskmaster.redeploy) |
| Shadow Initiative ×2 | effect | 1 | — | Draw 2 cards and then discard 1. | draw 2 cards |
| Trainer for Hire ×2 | effect | — | — | Gain 2 Power and reveal a new Contract. | +2 Power; villainSpecific(taskmaster.revealContract) |
| Training Academy ×3 | item | 1 | — | Allies at this location gain +1 Strength. | villainSpecific(taskmaster.trainingAcademy) |
| Training Dummy ×2 | item | 1 | — | Counts as a strength-2 target for Vanquish exercises (placeholder Ally). | villainSpecific(taskmaster.trainingDummy) |
| Taskmaster's Bow | item | 2 | — | Attach to an Ally — that Ally gains +2 Strength. | +2 Strength to an ally |
| Taskmaster's Shield | item | — | — | Attach to an Ally — that Ally cannot be defeated by Strength 2 or less. | villainSpecific(taskmaster.shield.protect) |
| Taskmaster's Sword | item | 2 | — | Attach to an Ally — that Ally gains +3 Strength. | +3 Strength to an ally |
| Lesson Plan | specialty | 1 | — | Look at the next Contract and choose to accept or pass. | villainSpecific(taskmaster.lessonPlan) |
| Photographic Reflexes | specialty | 2 | — | Copy the effect of an opposing Hero card just defeated. | villainSpecific(taskmaster.photographicReflexes) |

## Fate decks

### Common Fate (shared) (15 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Iron Man | hero | — | 3 | Tony Stark in the Iron Man armor. | — |
| Black Widow | hero | — | 2 | When BLACK WIDOW is played, the villain discards 1 card. | villainSpecific(fate.common.blackWidow.discard) |
| Nick Fury | hero | — | 2 | When NICK FURY is played, the Fate-playing player draws 2 Fate cards and plays one. | look at 2 Fate, keep 1 |
| Hulk | hero | — | 5 | When HULK is defeated, the Hulk player rolls 1d6; on 4+ Hulk is moved instead of defeated. | villainSpecific(fate.common.hulk.tenacious) |
| Falcon | hero | — | 2 | FALCON may be relocated to any location by Fate effects. | — |
| Hawkeye | hero | — | 2 | HAWKEYE covers the Fate icon at his location. | — |
| She-Hulk | hero | — | 4 | SHE-HULK gains +1 Strength while another Avenger Hero is in the same Domain. | villainSpecific(fate.common.sheHulk.teamBoost) |
| Vision | hero | — | 4 | VISION cannot be moved by any Villain card effect. | — |
| Thor | hero | — | 5 | When THOR is played, the villain loses 2 Power. | villainSpecific(fate.common.thor.zap) |
| Captain Marvel | hero | — | 6 | CAPTAIN MARVEL requires at least 3 Allies to Vanquish. | villainSpecific(fate.common.captainMarvel.minAllies) {"min":3} |
| Captain America | hero | — | 3 | When CAPTAIN AMERICA is played, the villain discards 1 Item. | villainSpecific(fate.common.captainAmerica.discardItem) |
| Avengers Assemble | event | — | 10 | All Avenger Heroes in the target Domain gain +1 Strength. | villainSpecific(fate.common.avengersAssemble) |
| Helicarrier Alert | event | — | 6 | Reveal the top 2 cards of the Fate deck and play one without effect. | look at 2 Fate, keep 1 |
| Lockdown at the Raft | event | — | 8 | While in play, the villain may not play Allies tagged "merc". | villainSpecific(fate.common.lockdown) |
| Protected Vibranium | event | — | 8 | While in play, Items in the target Domain cannot be played for free. | villainSpecific(fate.common.protectedVibranium) |

### Thanos Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Adam Warlock | hero | — | 6 | While ADAM WARLOCK is in his Domain, Thanos cannot perform the Snap. | villainSpecific(thanos.fate.adamWarlock.blockSnap) |
| Drax the Destroyer | hero | — | 5 | DRAX requires at least 2 Allies to Vanquish. | villainSpecific(thanos.fate.drax.minAllies) {"min":2} |
| Gamora | hero | — | 3 | When GAMORA is played, defeat one of your Allies at her location (if any). | villainSpecific(thanos.fate.gamora.defeatAlly) |
| Nebula | hero | — | 3 | NEBULA gains +1 Strength for each Infinity Stone Thanos has collected. | villainSpecific(thanos.fate.nebula.boostPerStone) |
| A Stone Is Found ×3 | fateEffect | — | — | Take a random Infinity Stone from Thanos and return it to the Infinity Well. | villainSpecific(thanos.fate.stoneIsFound) |
| What Did It Cost? ×3 | fateEffect | — | — | Thanos discards 2 cards from his hand. | villainSpecific(thanos.fate.whatDidItCost) |
| Sacrifices Must Be Made | event | — | 7 | At the start of his turn, Thanos must discard 1 Ally from his Domain or lose 2 Power. | villainSpecific(thanos.fate.sacrifices.startOfTurn) |

### Hela Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Valkyrior ×3 | hero | — | 3 | Asgardian warrior — Vanquish requires at least 1 Ally with Strength 3+. | villainSpecific(hela.fate.valkyrior.minStrength) |
| Angela | hero | — | 6 | Removes a Soul Mark from her location when played. | villainSpecific(hela.fate.angela.removeMark) |
| Balder the Brave | hero | — | 3 | While BALDER is in play, Hela may not play Specialty cards. | villainSpecific(hela.fate.balder.blockSpecialty) |
| Fate Intervenes ×2 | fateEffect | — | — | Hela's player draws 2 Fate cards and chooses which to play. | look at 2 Fate, keep 1 |
| Revive Souls ×2 | fateEffect | — | — | Remove a Soul Mark from Hela's Domain. | villainSpecific(hela.fate.reviveSouls) |
| Conquer Valhalla | event | — | 7 | Asgardians gain +1 Strength while CONQUER VALHALLA is in play. | +1 Strength to asgard ally |
| The Odin Force | item | — | — | The Hero holding THE ODIN FORCE gains +2 Strength. | villainSpecific(hela.fate.odinForce.boostHero) |

### Killmonger Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dora Milaje ×2 | hero | — | 2 | Wakandan royal guard. | — |
| Hatut Zeraze ×2 | hero | — | 2 | Wakandan secret police. | — |
| Black Panther | hero | — | 4 | While BLACK PANTHER is in his Domain, Killmonger cannot Claim Wakanda. | villainSpecific(killmonger.fate.blackPanther.blockClaim) |
| Everett K. Ross | hero | — | 2 | CIA contact — peek at the top card of any deck when played. | look at 1 Fate, keep 0 |
| Okoye | hero | — | 3 | OKOYE gains +1 Strength while a Dora Milaje is also in this Domain. | villainSpecific(killmonger.fate.okoye.boostWithDora) |
| Shuri | hero | — | 3 | When SHURI is played, Killmonger's player discards 1 Item. | villainSpecific(killmonger.fate.shuri.discardItem) |
| Wakanda Forever ×2 | fateEffect | — | — | All Wakandan Heroes in this Domain gain +1 Strength. | villainSpecific(killmonger.fate.wakandaForever) |
| Stolen Antiquities | event | — | 5 | Killmonger cannot use Specialty cards while STOLEN ANTIQUITIES is in play. | villainSpecific(killmonger.fate.stolenAntiquities) |

### Ultron Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Hank Pym | hero | — | 2 | When HANK PYM is played, the Ultron player loses 1 Upgrade. | villainSpecific(ultron.fate.hankPym.removeUpgrade) |
| Mockingbird | hero | — | 2 | MOCKINGBIRD covers the Activate icon at her location. | — |
| Scarlet Witch | hero | — | 4 | When SCARLET WITCH is played, Ultron discards 1 Item. | villainSpecific(ultron.fate.scarletWitch.discardItem) |
| Wasp | hero | — | 3 | WASP covers the Move icon at her location. | — |
| Wonder Man | hero | — | 4 | WONDER MAN gains +1 Strength for each other Avenger Hero in Ultron's Domain. | villainSpecific(ultron.fate.wonderMan.boostPerAvenger) |
| Molecular Rearranger ×3 | fateEffect | — | — | Move an Ultron Ally to a different location. | move an Ally (any → anyLocation) |
| Deactivation Switch ×2 | item | — | — | While in play, Ultron cannot use the Activate icon at this location. | villainSpecific(ultron.fate.deactivationSwitch) |
| Invasion of Stark Industries | event | — | 8 | Ultron loses 1 Power at the start of each of his turns while this is in play. | villainSpecific(ultron.fate.invasionStark.startOfTurn) |

### Taskmaster Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Scarlet Spider Clone ×3 | hero | — | 1 | A swarm of low-strength annoyances. | — |
| Butterball | hero | — | 0 | BUTTERBALL cannot be vanquished — it must be moved away by an effect. | villainSpecific(taskmaster.fate.butterball.invulnerable) |
| Scott Lang | hero | — | 2 | SCOTT LANG covers the Play icon at his location. | — |
| Solo | hero | — | 3 | When SOLO is played, Taskmaster's player discards 1 Item. | villainSpecific(taskmaster.fate.solo.discardItem) |
| Found by the Avengers ×4 | fateEffect | — | — | Discard Taskmaster's active Contract. | villainSpecific(taskmaster.fate.foundByAvengers) |
| Government Work | event | — | 7 | While GOVERNMENT WORK is in play, Taskmaster's Contracts cost 1 extra Power. | villainSpecific(taskmaster.fate.governmentWork) |

