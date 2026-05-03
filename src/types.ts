import type { Vector } from "vectyped";
import type { Config } from "./config.ts";
import type { StatefulAppContext } from "./lib/types.ts";

export type State = { particles: Vector<2>[] };

export type CurveFunc = (vec: Vector<2>) => Vector<2>;
export type ColorFunc = (vel: Vector<2>, particle: Vector<2>) => number;

export type WindFunc = (context: StatefulAppContext<Config, State>) => {
  curve: CurveFunc;
  color?: ColorFunc;
};
