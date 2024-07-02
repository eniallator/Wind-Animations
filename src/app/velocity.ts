import Vector from "../core/Vector";
import Monad from "../core/monad";
import { checkExhausted } from "../core/utils";
import { WindFunc } from "./types";

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

const vortex: WindFunc = ({ canvas, time, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);

  const timeSoFar = time.now - time.animationStart;
  const steppedTime = 2 * timeSoFar - Math.floor(timeSoFar / 8);

  const multiplier =
    ((paramConfig.getVal("speed") + 0.05) *
      Math.min(canvas.width, canvas.height)) /
    800;

  return {
    color: vel =>
      `hsl(${Math.floor((vel.getAngle() / (2 * Math.PI)) * 360)} 100% 50%)`,
    curve: vec => {
      const diff = vec.copy().sub(center).divide(center);
      const c = diff.getAngle() - steppedTime;

      return Vector.create(
        GOLDEN_RATIO *
          multiplier *
          Math.cos(diff.getMagnitude() / (2 * time.delta) + c),
        multiplier *
          Math.sin(diff.getMagnitude() / (2 * GOLDEN_RATIO * time.delta) + c)
      );
    },
  };
};

const sweepingRight: WindFunc = ({ time, paramConfig, canvas }) => {
  const sizeVec = Vector.create(
    500 * (paramConfig.getVal("speed") + 0.1) * time.delta,
    0
  );
  const divisor = (Math.min(canvas.width, canvas.height) * 1.2) ** 2 / 2;
  return {
    color: (vel, particle) =>
      `hsl(${((particle.x() / canvas.width) * 360 + Math.floor((vel.getAngle() / (2 * Math.PI)) * 360)) % 360} 100% 50%)`,
    curve: vec =>
      sizeVec.copy().setAngle(Math.cos(vec.getSquaredMagnitude() / divisor)),
  };
};

const zigZag: WindFunc = ({ time, canvas, paramConfig }) => {
  return {
    color: (vel, particle) =>
      `hsl(${((particle.x() / canvas.width) * 360 + Math.floor((vel.getAngle() / (2 * Math.PI)) * 360)) % 360} 100% 50%)`,
    curve: vec =>
      Vector.create(
        1,
        2 * (Math.round(((10 * vec.x()) / canvas.width) % 1) - 0.5)
      ).multiply(paramConfig.getVal("speed") * time.delta * 300),
  };
};

const magnet: WindFunc = ({ time, canvas, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);

  return {
    color: (vel, particle) =>
      `hsl(${((particle.y() / canvas.height) * 1080 + Math.floor((vel.getAngle() / (2 * Math.PI)) * 360)) % 360} 100% 50%)`,
    curve: vec =>
      Monad.from((vec.copy().sub(center).getAngle() + Math.PI / 2) % Math.PI)
        .map(angle =>
          Vector.create(
            (paramConfig.getVal("speed") + 0.05) * time.delta * 200,
            0
          ).setAngle(angle + (angle % Math.PI))
        )
        .value(),
  };
};

const swirls: WindFunc = ({ time, canvas, paramConfig }) => {
  const dimensions = Vector.create(canvas.width / 2, canvas.height / 2);
  const swirlSize = dimensions.getMin() / 2;
  const swirlsPerDim = dimensions.map(n => Math.floor(n / swirlSize));
  const maxIndex = swirlsPerDim.x() * swirlsPerDim.y();
  return {
    color: (_vel, particle) => {
      const swirlIndices = particle.map(n => Math.floor(n / swirlSize));
      return `hsl(${((swirlIndices.x() + swirlIndices.y() * swirlsPerDim.x()) / maxIndex) * 180} 100% 50%)`;
    },
    curve: vec =>
      Vector.create(
        0,
        (paramConfig.getVal("speed") + 0.05) * time.delta * 200
      ).setAngle(
        vec.map(n => (n % swirlSize) - swirlSize / 2).getAngle() +
          (vec.map(n => Math.floor(n / swirlSize)).sum() % 2 === 1 ? 1 : -1) *
            (Math.PI / 2)
      ),
  };
};

export const getWindFn: WindFunc = context => {
  const curve = context.paramConfig.getVal("curve");

  switch (curve) {
    case "Vortex":
      return vortex(context);

    case "Sweeping Right":
      return sweepingRight(context);

    case "Zig Zag":
      return zigZag(context);

    case "Magnet":
      return magnet(context);

    case "Swirls":
      return swirls(context);

    default:
      return checkExhausted(curve);
  }
};
