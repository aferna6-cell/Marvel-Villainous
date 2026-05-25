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
| The Legions of Thanos ×5 | ally | 1 | 2 | No additional ability. | — |
| Black Dwarf | ally | 3 | 6 | BLACK DWARF cannot be played or relocated to Events. | villainSpecific(thanos.blackDwarf.restrictEvent) |
| Black Swan | ally | 2 | 1 | If BLACK SWAN is at the same location as an Infinity Stone, she gains strength equal to the strongest Ally not under your control at her location. | villainSpecific(thanos.blackSwan.boost) |
| Corvus Glaive | ally | 3 | 4 | When CORVUS GLAIVE is relocated to another player's Domain, you may also relocate one THE LEGIONS OF THANOS Ally to his location. | villainSpecific(thanos.corvusGlaive.legionsRide) |
| Ebony Maw | ally | 3 | 4 | If EBONY MAW is part of a vanquish action by Thanos to defeat an opponent's Ally with an attached Infinity Stone, he is not discarded. | villainSpecific(thanos.ebonyMaw.persistOnStoneKill) |
| Proxima Midnight | ally | 2 | 3 | When played, defeat a character with strength 3 or less at PROXIMA MIDNIGHT's location. | villainSpecific(thanos.proxima.snipe) |
| Consult the Well ×4 | effect | 2 | — | Choose another player. That player receives a random unclaimed Infinity Stone. Once played you may relocate an Ally to that location. | villainSpecific(thanos.consultWell) |
| A Small Price to Pay... ×3 | effect | — | — | Gain 1 Power plus 1 additional Power for each other Villain who controls an Infinity Stone. | villainSpecific(thanos.smallPrice) |
| Taste of Cosmic Power ×3 | effect | 2 | — | Place a +1 strength token on an Ally you control. That Ally may immediately vanquish a character at this location with equal or lesser strength, and is not discarded after this vanquish action. | villainSpecific(thanos.tasteCosmic) |
| Deliver Judgment ×2 | effect | 3 | — | Choose a location with an Infinity Stone. Relocate up to two Allies you control to that location. Place a +1 Strength token on each of your Allies at that location. | villainSpecific(thanos.deliverJudgment) |
| The Mad Titan ×2 | effect | — | — | Choose a character you do not control in the same location as one of your Allies. Defeat that character. The cost to play THE MAD TITAN is equal to the Strength of the defeated character. | villainSpecific(thanos.madTitan) |
| Warp Reality ×2 | effect | 1 | — | Search your discard pile for an Effect card. Put it in your hand. | villainSpecific(thanos.warpReality) |
| Death's Favor ×3 | item | 2 | — | You may choose to perform an activate or vanquish action when you move to this location. A location may not hold more than one copy of DEATH'S FAVOR. | villainSpecific(thanos.deathsFavor) |
| Space Throne | item | 2 | — | This location gains RELOCATE. | villainSpecific(thanos.spaceThrone) |

### Hela (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dísir ×4 | ally | 2 | 3 | DÍSIR may be played from your discard pile. | villainSpecific(hela.disir.playFromDiscard) |
| Draugr Swordsman ×4 | ally | 1 | 2 | DRAUGR SWORDSMAN gains 1 Strength for each DRAUGR SWORDSMAN in your discard pile. | villainSpecific(hela.draugr.scaleWithDiscard) |
| Fenris Wolf | ally | 2 | 3 | If a Hero is played to a location in your Domain, you may play or relocate FENRIS WOLF to that location for free. | villainSpecific(hela.fenris.heroSummon) |
| Leah | ally | 2 | 2 | When LEAH is played, you may attach a Soul Mark to one Hero at her location. | villainSpecific(hela.leah.mark) |
| Midgard Serpent | ally | 3 | 5 | When performing a vanquish action, MIDGARD SERPENT may be used to defeat each character with a Strength of 5 or less at its location. | villainSpecific(hela.midgardSerpent.sweep) |
| Marked by Death ×5 | effect | 1 | — | Choose a Hero in any Domain without a Soul Mark. Attach a Soul Mark to that Hero. | villainSpecific(placeSoulMark) |
| Death's Embrace ×3 | effect | — | — | Relocate a Hero with an attached Soul Mark to Niflheim. | villainSpecific(hela.deathsEmbrace) |
| Hel to Pay ×2 | effect | 2 | — | Choose a Hero with an attached Soul Mark in your Domain. Perform a vanquish action to defeat that Hero. | villainSpecific(hela.helToPay) |
| Price of Life ×2 | effect | — | — | Choose a Hero with an attached Soul Mark in another player's Domain. Remove the Soul Mark from that Hero, then gain Power equal to that Hero's Strength. | villainSpecific(hela.priceOfLife) |
| Soul for a Soul ×2 | effect | 1 | — | Choose a Hero with an attached Soul Mark in any Domain and remove that Hero. If you do, you may defeat a Hero in Hela's Domain. | villainSpecific(hela.soulForASoul) |
| Nightsword ×2 | item | 2 | — | ACTIVATE: Attach a Soul Mark to any Hero without one at this location. | villainSpecific(hela.nightsword.activate) |
| Hand of Glory | specialty | 2 | — | ACTIVATE: Choose a Hero from the Fate discard pile. Pay Power equal to their Strength, then play them to any Domain and attach a Soul Mark to them. | villainSpecific(hela.handOfGlory) |
| Hela's Bidding | specialty | 3 | — | Each time another player defeats a Hero with an attached Soul Mark, gain 3 Power. | villainSpecific(hela.bidding) |
| Raise the Dead | specialty | 2 | — | DRAUGR SWORDSMAN may be played from your discard pile to your Domain. | villainSpecific(hela.raiseTheDead) |

### Killmonger (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dog of War ×3 | ally | 1 | 2 | You may play DOG OF WAR to another player's Domain. | villainSpecific(killmonger.dogOfWar.foreignDomain) |
| Knight | ally | 3 | 5 | No additional ability. | — |
| King | ally | 2 | 4 | When KING is played, you may relocate an unattached Item you control in your Domain to his location. | villainSpecific(killmonger.king.dragItem) |
| Rook | ally | 2 | 2 | When one other Ally would be defeated at ROOK's location, you may remove ROOK instead. | villainSpecific(killmonger.rook.bodyguard) |
| W'Kabi | ally | 2 | 3 | Your Power cost to use an Activated Ability is reduced by 1. W'KABI cannot be played if KLAW is in your Domain. | villainSpecific(killmonger.wkabi.activateDiscount) |
| Killmonger's Fury ×4 | effect | 2 | — | Defeat a character with a Strength of 4 or less in your Domain. | villainSpecific(killmonger.fury) |
| Execute Plan ×2 | effect | 1 | — | Perform an activate action. | villainSpecific(killmonger.executePlan) |
| Taunt ×2 | effect | — | — | Relocate any character in your Domain to a different location in your Domain. | villainSpecific(killmonger.taunt) |
| Overpower | effect | 2 | — | Place a +1 Strength token on all Allies in your Domain. | villainSpecific(killmonger.overpower) |
| Weapons Cache ×4 | item | 1 | — | On your turn, you may pay up to 3 Power. For each Power you pay, reduce the Strength of any character at the same location as WEAPONS CACHE by 1 until the end of the turn. | villainSpecific(killmonger.weaponsCache) |
| Explosives ×3 | item | 2 | — | Remove this Item to defeat up to two characters at this location. EXPLOSIVES cannot defeat characters with a Strength of 5 or more. | villainSpecific(killmonger.explosives) |
| Wound ×2 | item | 1 | -2 | When WOUND is played, attach it to a character you do not control in your Domain. That character loses 2 Strength. | villainSpecific(killmonger.wound) |
| Hacking Rig | item | 2 | — | ACTIVATE: You cannot activate HACKING RIG if you have the most Power. Gain Power equal to half the amount held by the player with the most Power rounded up. | villainSpecific(killmonger.hackingRig) |
| Armored Rhino | specialty | — | — | Heroes at Killmonger's location lose 1 Strength. | villainSpecific(killmonger.armoredRhino) |
| Heart-Shaped Herb | specialty | 3 | — | Gain PLAY A CARD. HEART-SHAPED HERB cannot be played if KLAW is in your Domain. | villainSpecific(killmonger.heartShapedHerb) |
| Rage of K'liluna | specialty | 1 | — | Before moving your Villain, you may discard a card from your hand to find KILLMONGER'S FURY, then add it to your hand. | villainSpecific(killmonger.rage) |
| Stolen Wisdom | specialty | 3 | — | If you have three or fewer cards in your hand at the end of your turn, instead of drawing cards, you may reveal cards from your deck until you reveal two Items. Add those Items to your hand. | villainSpecific(killmonger.stolenWisdom) |

### Ultron (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Duplicate Sentry ×4 | ally | 1 | 2 | No additional ability. | — |
| Flying Sentry ×3 | ally | 2 | 3 | If FLYING SENTRY is at an Event when it resolves, you may relocate this Ally to any location in your Domain. | villainSpecific(ultron.flyingSentry.escape) |
| Heavy Attack Sentry ×3 | ally | 2 | 3 | This location gains VANQUISH. | villainSpecific(ultron.heavyAttack.grantVanquish) |
| Alkhema | ally | 3 | 3 | When ALKHEMA is played, defeat a character at her location. | villainSpecific(ultron.alkhema.snipe) |
| Giant Sentry | ally | 6 | 6 | You may discard two other Sentries from your hand instead of paying this card's cost. | villainSpecific(ultron.giantSentry.discardCost) |
| Jocasta | ally | 4 | 3 | When JOCASTA is played, you may relocate any Hero to any location in any Domain. | villainSpecific(ultron.jocasta.heroSwap) |
| Reconfigure ×3 | effect | — | — | Gain 1 Power for each location in your Domain with at least one Sentry. | villainSpecific(ultron.reconfigure) |
| Assimilate Knowledge ×2 | effect | 1 | — | Look at the top six cards of the Fate deck, then put them back face down in any order you wish. | villainSpecific(ultron.assimilateKnowledge) |
| Encephalo-Ray ×2 | effect | 2 | — | Place a -1 Strength token on each Hero in your Domain. | villainSpecific(ultron.encephaloRay) |
| Every Contingency Covered ×2 | effect | 1 | — | Choose either Item or Effect. Reveal cards from your deck until you reveal a card of that type. Add that card to your hand. | villainSpecific(ultron.everyContingency) |
| Technoforming ×2 | effect | 1 | — | Place a +1 Strength token on an Ally you control. You may relocate that Ally to an Event. | villainSpecific(ultron.technoforming) |
| Impervious Alloy ×4 | item | 2 | 2 | When played, attach IMPERVIOUS ALLOY to an Ally you control. IMPERVIOUS ALLOY can only be removed if the attached Ally is defeated or removed. | villainSpecific(ultron.imperviousAlloy) |
| Assembly Line ×2 | item | 1 | — | ACTIVATE: Reveal cards from your deck until you reveal an Ally. Add that card to your hand. Gain 1 Power. | villainSpecific(ultron.assemblyLine) |

### Taskmaster (30 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Trainees ×3 | ally | 1 | 1 | Instead of discarding an Ally used in a vanquish action at this location, remove TRAINEES instead. You may not use TRAINEES' ability if TRAINEES are involved in a vanquish action. | villainSpecific(taskmaster.trainees.absorb) |
| Anaconda | ally | 2 | 3 | When ANACONDA is used in a vanquish action, place a +1 Strength token on each remaining Ally you control at her previous location. | villainSpecific(taskmaster.anaconda.spreadBoost) |
| Black Ant | ally | 2 | 2 | When BLACK ANT is played, you may play another Ally from your hand for free. | villainSpecific(taskmaster.blackAnt.freePlay) |
| Blood Spider | ally | 2 | 3 | When BLOOD SPIDER is played, you may relocate a Hero from any location to BLOOD SPIDER's location. | villainSpecific(taskmaster.bloodSpider.heroDrag) |
| Crossbones | ally | 2 | 3 | CROSSBONES may be played from your discard pile. | villainSpecific(taskmaster.crossbones.playFromDiscard) |
| Death Shield | ally | 2 | 3 | DEATH SHIELD gains 1 Strength for each Hero at his location. | villainSpecific(taskmaster.deathShield.scaleWithHeroes) |
| Diamondback | ally | 1 | 2 | When DIAMONDBACK is played, place a -1 Strength token on any Hero at DIAMONDBACK's location. | villainSpecific(taskmaster.diamondback.heroDebuff) |
| Jagged Bow | ally | 2 | 3 | After relocating or playing JAGGED BOW to an Event, you may relocate or play a second Ally to the same Event for free. | villainSpecific(taskmaster.jaggedBow.eventBonus) |
| Conduct Exercise ×4 | effect | — | — | Perform an activate action. | villainSpecific(taskmaster.conductExercise) |
| Redeploy ×2 | effect | 2 | — | Relocate up to three Allies you control. | villainSpecific(taskmaster.redeploy) |
| Shadow Initiative ×2 | effect | 1 | — | Relocate an Ally you control from your Domain to another player's Domain. Place a +1 Strength token on that Ally. | villainSpecific(taskmaster.shadowInitiative) |
| Trainer for Hire ×2 | effect | — | — | Choose another player. Reveal cards from that player's Villain deck until you reveal an Ally. Play that Ally to that player's Domain for free, then gain Power equal to that Ally's cost plus 1. | villainSpecific(taskmaster.trainerForHire) |
| Training Academy ×3 | item | 1 | — | When a Character is vanquished at this location, place a +1 Strength token on each Ally at this location, then discard this card instead of discarding any Ally cards. | villainSpecific(taskmaster.trainingAcademy) |
| Training Dummy ×2 | item | 1 | — | ACTIVATE: Place a +1 Strength token on an Ally you control at this location. | villainSpecific(taskmaster.trainingDummy) |
| Taskmaster's Bow | item | 2 | — | This location gains VANQUISH. | villainSpecific(taskmaster.bow.grantVanquish) |
| Taskmaster's Shield | item | — | — | When an Ally at this location would be defeated or removed, you may remove TASKMASTER'S SHIELD instead. | villainSpecific(taskmaster.shield.bodyguard) |
| Taskmaster's Sword | item | 2 | — | All of Taskmaster's Allies gain 1 Strength while at the same location as TASKMASTER'S SWORD. | villainSpecific(taskmaster.sword.locationBuff) |
| Lesson Plan | specialty | 1 | — | ACTIVATE: Pay 1 Power. Find an Item or Effect in your discard pile or deck and put that card into your hand. | villainSpecific(taskmaster.lessonPlan) |
| Photographic Reflexes | specialty | 2 | — | After another player plays an Effect card from their hand, you may immediately pay 1 Power to attach that Effect to PHOTOGRAPHIC REFLEXES. ACTIVATE: Use an activate action to play the Effect attached to PHOTOGRAPHIC REFLEXES, then discard the Effect to its original Villain's discard pile. | villainSpecific(taskmaster.photographicReflexes) |

## Fate decks

### Common Fate (shared) (15 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Iron Man | hero | — | 3 | If IRON MAN is in your Domain, whenever you perform an activate action, you must pay 1 Power in addition to the Activated Ability's cost. | villainSpecific(fate.common.ironMan) |
| Black Widow | hero | — | 2 | When BLACK WIDOW is played, you may defeat an Ally at her location. | villainSpecific(fate.common.blackWidow) |
| Nick Fury | hero | — | 2 | When NICK FURY is played, the targeted player loses half of their Power rounded up. | villainSpecific(fate.common.nickFury) |
| Hulk | hero | — | 5 | When HULK is defeated, instead of discarding him, place a +1 Strength token on him and relocate him to another player's Domain. Nothing can be attached to the HULK. | villainSpecific(fate.common.hulk) |
| Falcon | hero | — | 2 | When FALCON is played, you may relocate a Hero with a Strength of 3 or less from any Domain to his location. | villainSpecific(fate.common.falcon) |
| Hawkeye | hero | — | 2 | When HAWKEYE is played, you may defeat one of the targeted player's Allies at an Event. | villainSpecific(fate.common.hawkeye) |
| She-Hulk | hero | — | 4 | If SHE-HULK is in your Domain, you cannot relocate or play to Events. | villainSpecific(fate.common.sheHulk) |
| Vision | hero | — | 4 | If VISION is in your Domain, whenever you gain Power, you gain 1 less Power. | villainSpecific(fate.common.vision) |
| Thor | hero | — | 5 | PROTECTOR. | villainSpecific(fate.common.thor.protector) |
| Captain Marvel | hero | — | 6 | When CAPTAIN MARVEL is played, relocate all Allies in the targeted player's Domain to her location. | villainSpecific(fate.common.captainMarvel) |
| Captain America | hero | — | 3 | When CAPTAIN AMERICA is played, place a +1 Strength token on CAPTAIN AMERICA and each other Hero in the targeted player's Domain. | villainSpecific(fate.common.captainAmerica) |
| Protected Vibranium | event | — | 8 | When you play an Item, pay 1 additional Power. Reward: You may find any Item from your deck or discard pile and put it into your hand. | villainSpecific(fate.common.protectedVibranium) |
| Lockdown at the Raft | event | — | 8 | When you play an Ally, pay 1 additional Power. Reward: You may find any Ally from your deck or discard pile and put it into your hand. | villainSpecific(fate.common.lockdown) |
| Helicarrier Alert | event | — | 6 | Only draw up to 3 cards at the end of your turn. Reward: Draw 3 cards. | villainSpecific(fate.common.helicarrier) |
| Avengers Assemble | event | — | 10 | When this Event is revealed, the current Villain must draw a card from the Fate deck and play it on themselves. At the start of each Villain's turn, they draw a Fate card and play it on themselves. Reward: Defeat all Heroes in your Domain. | villainSpecific(fate.common.avengersAssemble) |

### Thanos Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Adam Warlock | hero | — | 6 | Thanos cannot win the game if ADAM WARLOCK is in Thanos' Domain. | villainSpecific(thanos.fate.adamWarlock.blockSnap) |
| Drax the Destroyer | hero | — | 5 | At least two Allies must be used to defeat DRAX THE DESTROYER with a vanquish action. | villainSpecific(thanos.fate.drax.minAllies) {"min":2} |
| Gamora | hero | — | 3 | When GAMORA is played, defeat a character at her location. If that character is an Ally of Thanos, place 2 +1 strength tokens on GAMORA. | villainSpecific(thanos.fate.gamora) |
| Nebula | hero | — | 3 | When NEBULA is played, the targeted player loses Power equal to the number of Infinity Stones they control. Place a number of +1 Strength tokens on NEBULA equal to that Power. | villainSpecific(thanos.fate.nebula) |
| A Stone is Found ×3 | fateEffect | — | — | Choose a Villain other than Thanos. That Villain receives an unclaimed Infinity Stone. Once played, they may immediately activate it for free. | villainSpecific(thanos.fate.stoneIsFound) |
| What Did It Cost? ×3 | fateEffect | — | — | The targeted Villain must discard one card from their hand for each Infinity Stone they control up to the total number of cards in their hand. | villainSpecific(thanos.fate.whatDidItCost) |
| Sacrifices Must Be Made | event | — | 7 | Before moving, for each of Thanos' Allies in play, he must either pay 1 Power, discard one card from his hand, or remove the Ally. Reward: Thanos removes one Ally controlled by each other Villain. | villainSpecific(thanos.fate.sacrifices) |

### Hela Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Valkyrior ×3 | hero | — | 3 | Soul Marks may not be attached to VALKYRIOR. | villainSpecific(hela.fate.valkyrior.noMark) |
| Angela | hero | — | 6 | Soul Marks may not be attached to ANGELA. When played, remove a Soul Mark from Odin's Vault. | villainSpecific(hela.fate.angela) |
| Balder | hero | — | 3 | Soul Marks may not be attached to BALDER. When played, remove a Soul Mark from any one Hero. | villainSpecific(hela.fate.balder) |
| Fate Intervenes ×2 | fateEffect | — | — | Shuffle the targeted player's discard pile into their Villain deck. | villainSpecific(hela.fate.intervenes) |
| Revive Souls ×2 | fateEffect | — | — | Choose a Hero in the Fate discard pile. Play that Hero to the targeted player's Domain. | villainSpecific(hela.fate.reviveSouls) |
| Conquer Valhalla | event | — | 7 | Hela may not play, find or access any cards in her discard pile. Reward: Hela may immediately attach Soul Marks on all Heroes in all Domains that don't already have one. | villainSpecific(hela.fate.conquerValhalla) |
| Odin-Force | item | — | — | When ODIN-FORCE is played, attach it to a Hero. If this Hero has an attached Soul Mark, remove it. This Hero cannot have a Soul Mark attached and gains PROTECTOR. | villainSpecific(hela.fate.odinForce) |

### Killmonger Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Dora Milaje ×2 | hero | — | 2 | PROTECTOR. | villainSpecific(fate.protector) |
| Hatut Zeraze ×2 | hero | — | 2 | When HATUT ZERAZE is played, choose an Ally with a Strength of 2 or less or an Item in the targeted player's Domain, then return it to their hand. | villainSpecific(killmonger.fate.hatutZeraze) |
| Black Panther | hero | — | 4 | BLACK PANTHER gains 2 Strength while in Killmonger's Domain. | villainSpecific(killmonger.fate.blackPanther) |
| Everett K. Ross | hero | — | 2 | When EVERETT K. ROSS is played, you may remove an Item from the targeted player's Domain. | villainSpecific(killmonger.fate.everettRoss) |
| Okoye | hero | — | 3 | When OKOYE is played, find DORA MILAJE, then play that card to the same location as OKOYE. | villainSpecific(killmonger.fate.okoye) |
| Shuri | hero | — | 3 | When SHURI is played, remove an Item from the targeted player's Domain. Place +1 Strength tokens equal to the cost of that Item on SHURI. | villainSpecific(killmonger.fate.shuri) |
| Wakanda Forever ×2 | fateEffect | — | — | Find BLACK PANTHER and either play or relocate him to Killmonger's Domain. If BLACK PANTHER is already in play, place a +1 Strength token on him. | villainSpecific(killmonger.fate.wakandaForever) |
| Stolen Antiquities | event | — | 5 | Killmonger cannot play Items. Reward: Killmonger may find any Item in his deck or discard pile, then play it immediately for free to his Domain. | villainSpecific(killmonger.fate.stolenAntiquities) |

### Ultron Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Hank Pym | hero | — | 2 | While HANK PYM is in your Domain, you may not play or find cards from your discard pile. | villainSpecific(ultron.fate.hankPym) |
| Mockingbird | hero | — | 2 | When MOCKINGBIRD is played, the targeted player loses 2 Power. | villainSpecific(ultron.fate.mockingbird) |
| Scarlet Witch | hero | — | 4 | When SCARLET WITCH is played, choose a card type. The targeted player must reveal their hand and discard all cards of that chosen type. | villainSpecific(ultron.fate.scarletWitch) |
| Wasp | hero | — | 3 | When WASP is played, you may relocate any Hero from the targeted player's Domain to a new location in any player's Domain. | villainSpecific(ultron.fate.wasp) |
| Wonder Man | hero | — | 4 | When WONDER MAN is defeated, find VISION, then play or relocate him to WONDER MAN's previous location. | villainSpecific(ultron.fate.wonderMan) |
| Molecular Rearranger ×3 | fateEffect | — | — | When MOLECULAR REARRANGER is played, choose an Item or Ally card in the targeted player's Domain. That player must remove all copies of that card from their Domain. | villainSpecific(ultron.fate.molecularRearranger) |
| Deactivation Switch ×2 | item | — | — | Attach DEACTIVATION SWITCH to a Specialty. The Specialty may no longer be used until the targeted player pays 2 Power on their turn to remove DEACTIVATION SWITCH. | villainSpecific(ultron.fate.deactivationSwitch) |
| Invasion of Stark Enterprises | event | — | 8 | When gaining Power, Ultron gains 1 fewer Power. Reward: Ultron gains 6 Power. | villainSpecific(ultron.fate.invasionStark) |

### Taskmaster Fate (11 cards)

| Name | Type | Cost | Str | Printed text | Mechanical effect |
| ---- | ---- | ---- | --- | ------------ | ----------------- |
| Scarlet Spider Clone ×3 | hero | — | 1 | When played, find and play the other two SCARLET SPIDER CLONES to this location. | villainSpecific(taskmaster.fate.spiderClone.summonOthers) |
| Butterball | hero | — | 0 | BUTTERBALL cannot be defeated. Before moving your Villain, you may pay 3 Power and discard one card from your hand to remove BUTTERBALL. | villainSpecific(taskmaster.fate.butterball) |
| Scott Lang | hero | — | 2 | All Allies at SCOTT LANG's location lose 1 Strength. | villainSpecific(taskmaster.fate.scottLang) |
| Solo | hero | — | 3 | If SOLO is the only Hero in a Domain, he gains 2 Strength. | villainSpecific(taskmaster.fate.solo) |
| Found by the Avengers ×4 | fateEffect | — | — | Choose an Ally controlled by the targeted Villain, then choose any Hero in any Domain. Remove both characters. | villainSpecific(taskmaster.fate.foundByAvengers) |
| Government Work | event | — | 7 | Taskmaster cannot relocate Allies or Items except to this Event. Reward: Find an Ally from Taskmaster's deck or discard pile and play it immediately for free. | villainSpecific(taskmaster.fate.governmentWork) |

