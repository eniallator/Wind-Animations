import Vector from "../core/Vector";
import { AppContextWithState } from "../core/types";
import config from "./config";

export type State = { particles: Vector<2>[] };

export type CurveFunc = (vec: Vector<2>) => Vector<2>;
export type ColorFunc = (vel: Vector<2>, particle: Vector<2>) => string;

export type WindFunc = (context: AppContextWithState<typeof config, State>) => {
  curve: CurveFunc;
  color?: ColorFunc;
};
