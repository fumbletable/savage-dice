import OBR from '@owlbear-rodeo/sdk';
import DiceBox from '@3d-dice/dice-box';

import { ROLL_REQUEST_CHANNEL, ROLL_RESULT_CHANNEL } from './lib/channels';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Dice: any = null;
let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  Dice = new DiceBox({
    assetPath: '/assets/',
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
    offscreen: true,
  });
  await Dice.init();
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

    // Show canvas
    const canvas = document.getElementById('dice-canvas');
    if (canvas) canvas.classList.add('active');

    Dice.clear();

    if (req.type === 'trait') {
      const dicesToRoll = [{ qty: 1, sides: req.traitDie! }];
      if (req.wild) dicesToRoll.push({ qty: 1, sides: 6 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = await (Dice as any).roll(dicesToRoll);

      // Extract first die values from each group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getDie = (group: any) => group.rolls ? group.rolls[0] : group;

      const traitDie = getDie(results[0]);
      const wildDie = req.wild ? getDie(results[1]) : null;

      // Follow ace chains
      const traitChain = await rollWithAces(req.traitDie!, traitDie);
      const wildChain = wildDie ? await rollWithAces(6, wildDie) : null;

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
      const dicesToRoll = (req.damageDice ?? []).map((s: number) => ({ qty: 1, sides: s }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = await (Dice as any).roll(dicesToRoll);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getDie = (group: any) => group.rolls ? group.rolls[0] : group;

      const chains: { die: number; chain: number[] }[] = [];
      for (let i = 0; i < results.length; i++) {
        const sides = req.damageDice![i];
        const chain = await rollWithAces(sides, getDie(results[i]));
        chains.push({ die: sides, chain });
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

    // Hide canvas after dice settle
    setTimeout(() => {
      Dice.clear();
      const canvas = document.getElementById('dice-canvas');
      if (canvas) canvas.classList.remove('active');
    }, 6000);
  });
});
