declare module '@3d-dice/dice-box' {
  export interface DieInput {
    qty: number;
    sides: number;
    theme?: string;
  }

  export interface DieResult {
    sides: number;
    value: number;
    rolls: { value: number }[];
  }

  export interface RollResult {
    dice: DieResult[];
    value: number;
  }

  export interface DiceBoxOptions {
    assetPath: string;
    theme?: string;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    delay?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    container?: string;
  }

  export default class DiceBox {
    constructor(options: DiceBoxOptions);
    init(): Promise<void>;
    roll(dice: DieInput[]): Promise<RollResult[]>;
    add(dice: DieInput[]): Promise<RollResult[]>;
    clear(): void;
    hide(): void;
    show(): void;
    onRollComplete: (results: RollResult[]) => void;
  }
}
