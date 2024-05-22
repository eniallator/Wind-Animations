import Vector from "../core/Vector";
import { checkExhausted } from "../core/utils";
import { VelocityFunc } from "./types";

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

const vortex: VelocityFunc = ({ canvas, time, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);

  const timeSoFar = time.now - time.animationStart;
  const steppedTime = 2 * timeSoFar - Math.floor(timeSoFar / 8);

  const multiplier =
    ((0.1 + paramConfig.getVal("speed") / (1 / 0.9)) *
      Math.min(canvas.width, canvas.height)) /
    1000;
  return vec => {
    const diff = vec.copy().sub(center).divide(center);
    const c = diff.getAngle() - steppedTime;

    return Vector.create(
      2 * multiplier * Math.cos(diff.getMagnitude() / (2 * time.delta) + c),
      multiplier *
        Math.sin(diff.getMagnitude() / (2 * GOLDEN_RATIO * time.delta) + c)
    );
  };
};

const sweepingRight: VelocityFunc = ({ time, paramConfig, canvas }) => {
  const sizeVec = Vector.create(
    500 * (paramConfig.getVal("speed") + 0.1) * time.delta,
    0
  );
  const divisor = (Math.min(canvas.width, canvas.height) * 1.2) ** 2 / 2;
  return vec =>
    sizeVec.copy().setAngle(Math.cos(vec.getSquaredMagnitude() / divisor));
};

const zigZag: VelocityFunc = ({ time, canvas, paramConfig }) => {
  return vec =>
    Vector.create(
      1,
      2 * (Math.round(((10 * vec.x()) / canvas.width) % 1) - 0.5)
    ).multiply(paramConfig.getVal("speed") * time.delta * 300);
};

export const getVelocity: VelocityFunc = context => {
  const curve = context.paramConfig.getVal("curve");

  switch (curve) {
    case "Vortex":
      return vortex(context);

    case "Sweeping Right":
      return sweepingRight(context);

    case "Zig Zag":
      return zigZag(context);

    default:
      return checkExhausted(curve);
  }
};
