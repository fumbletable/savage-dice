import OBR from '@owlbear-rodeo/sdk';
import DiceBox from '@3d-dice/dice-box';

const POPOVER_ID = 'com.fumbletable.savage-dice/overlay';
const ROLL_CHANNEL = 'com.fumbletable.savage-dice/roll';

// Init at module level — avoids React StrictMode double-init
const Dice = new DiceBox({
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

let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  await Dice.init();
}

OBR.onReady(async () => {
  await init();

  // Listen for roll requests broadcast from the action popover
  OBR.broadcast.onMessage(ROLL_CHANNEL, async (event) => {
    const { dice } = event.data as { dice: { qty: number; sides: number }[] };

    // Expand overlay to full screen
    await OBR.popover.setWidth(POPOVER_ID, window.screen.width);
    await OBR.popover.setHeight(POPOVER_ID, window.screen.height);

    Dice.clear();
    const results = await Dice.roll(dice);

    // Broadcast results back to the action popover for SWADE logic
    OBR.broadcast.sendMessage(
      `${ROLL_CHANNEL}/result`,
      results as unknown as Record<string, unknown>,
      { destination: 'LOCAL' }
    );

    // Collapse overlay after dice settle
    setTimeout(async () => {
      await OBR.popover.setWidth(POPOVER_ID, 0);
      await OBR.popover.setHeight(POPOVER_ID, 0);
    }, 5000);
  });
});
