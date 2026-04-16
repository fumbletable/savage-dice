import OBR from '@owlbear-rodeo/sdk';
import DiceBox from '@3d-dice/dice-box';

import { ROLL_REQUEST_CHANNEL, ROLL_RESULT_CHANNEL } from './lib/channels';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Dice: any = null;
let diceBoxAvailable = false;

async function init() {
  try {
    Dice = new DiceBox({
      assetPath: 'https://fumbletable.github.io/savage-dice/assets/',
      container: '#dice-canvas',
      theme: 'default',
      scale: 7,
      gravity: 1,
      mass: 1,
      friction: 0.8,
      restitution: 0.5,
      angularDamping: 0.4,
      linearDamping: 0.4,
      settleTimeout: 5000,
      offscreen: false,
    });
    await Dice.init();
    diceBoxAvailable = true;
  } catch (err) {
    console.warn('[savage-dice] DiceBox init failed, using fallback RNG:', err);
    diceBoxAvailable = false;
  }
}

// Fallback: roll a single die using Math.random()
function rollFallback(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Follow ace chains using fallback RNG
function rollWithAcesFallback(sides: number, first: number): number[] {
  const chain: number[] = [first];
  let current = first;
  while (current === sides && chain.length < 20) {
    current = rollFallback(sides);
    chain.push(current);
  }
  return chain;
}

// Roll a single die and follow the ace chain until it stops
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rollWithAces(sides: number, firstResult: any): Promise<number[]> {
  const chain: number[] = [firstResult.value];
  let current = firstResult;
  while (current.value === current.sides && chain.length < 20) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extra = await (Dice as any).add([{ qty: 1, sides }]);
    const die = extra[0].rolls ? extra[0].rolls[0] : extra[0];
    chain.push(die.value);
    current = die;
  }
  return chain;
}

OBR.onReady(async () => {
  await init();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OBR.broadcast.onMessage(ROLL_REQUEST_CHANNEL, async (event: any) => {
    const req = event.data as {
      type: 'trait' | 'damage';
      traitDie?: number;
      wild?: boolean;
      damageDice?: number[];
      modifier?: number;
    };

    // Show canvas (only if dice-box is working)
    if (diceBoxAvailable) {
      const canvas = document.getElementById('dice-canvas');
      if (canvas) canvas.classList.add('active');
      Dice.clear();
    }

    if (req.type === 'trait') {
      let traitChain: number[];
      let wildChain: number[] | null = null;

      if (diceBoxAvailable) {
        const dicesToRoll = [{ qty: 1, sides: req.traitDie! }];
        if (req.wild) dicesToRoll.push({ qty: 1, sides: 6 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = await (Dice as any).roll(dicesToRoll);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getDie = (group: any) => group.rolls ? group.rolls[0] : group;

        const traitDie = getDie(results[0]);
        const wildDie = req.wild ? getDie(results[1]) : null;

        traitChain = await rollWithAces(req.traitDie!, traitDie);
        wildChain = wildDie ? await rollWithAces(6, wildDie) : null;
      } else {
        // Fallback: use Math.random()
        const first = rollFallback(req.traitDie!);
        traitChain = rollWithAcesFallback(req.traitDie!, first);
        if (req.wild) {
          const wildFirst = rollFallback(6);
          wildChain = rollWithAcesFallback(6, wildFirst);
        }
      }

      OBR.broadcast.sendMessage(
        ROLL_RESULT_CHANNEL,
        {
          type: 'trait',
          traitDie: req.traitDie,
          traitChain,
          wildChain,
        } as unknown as Record<string, unknown>,
        { destination: 'LOCAL' }
      );
    }

    if (req.type === 'damage') {
      const chains: { die: number; chain: number[] }[] = [];

      if (diceBoxAvailable) {
        const dicesToRoll = (req.damageDice ?? []).map((s: number) => ({ qty: 1, sides: s }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = await (Dice as any).roll(dicesToRoll);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getDie = (group: any) => group.rolls ? group.rolls[0] : group;

        for (let i = 0; i < results.length; i++) {
          const sides = req.damageDice![i];
          const chain = await rollWithAces(sides, getDie(results[i]));
          chains.push({ die: sides, chain });
        }
      } else {
        // Fallback: use Math.random()
        for (const sides of (req.damageDice ?? [])) {
          const first = rollFallback(sides);
          chains.push({ die: sides, chain: rollWithAcesFallback(sides, first) });
        }
      }

      OBR.broadcast.sendMessage(
        ROLL_RESULT_CHANNEL,
        {
          type: 'damage',
          chains,
        } as unknown as Record<string, unknown>,
        { destination: 'LOCAL' }
      );
    }

    // Hide canvas after dice settle (only if dice-box was used)
    if (diceBoxAvailable) {
      setTimeout(() => {
        Dice.clear();
        const canvas = document.getElementById('dice-canvas');
        if (canvas) canvas.classList.remove('active');
      }, 6000);
    }
  });
});
