import { Monad, checkExhausted, posMod, tuple } from "@web-art/core";
import { Vector } from "@web-art/linear-algebra";
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
    color: vel => vel.getAngle() / (2 * Math.PI),
    curve: vec =>
      Monad.from(vec.copy().sub(center).divide(center))
        .map(diff => tuple(diff.getMagnitude(), diff.getAngle() - steppedTime))
        .map(([mag, c]) =>
          Vector.create(
            GOLDEN_RATIO * Math.cos(mag / (2 * time.delta) + c) * multiplier,
            Math.sin(mag / (2 * GOLDEN_RATIO * time.delta) + c) * multiplier
          )
        )
        .get(),
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
      (particle.x() / canvas.width + vel.getAngle() / (2 * Math.PI)) % 1,
    curve: vec =>
      sizeVec.copy().setAngle(Math.cos(vec.getSquaredMagnitude() / divisor)),
  };
};

const zigZag: WindFunc = ({ time, canvas, paramConfig }) => {
  return {
    color: (vel, particle) =>
      (particle.x() / canvas.width + vel.getAngle() / (2 * Math.PI)) % 1,
    curve: vec =>
      Vector.create(
        1,
        2 * (Math.round(((10 * vec.x()) / canvas.width) % 1) - 0.5)
      ).multiply(paramConfig.getVal("speed") * time.delta * 300),
  };
};

const magnet: WindFunc = ({ time, canvas, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const sizeVec = Vector.create(
    (paramConfig.getVal("speed") + 0.05) * time.delta * 200,
    0
  );

  return {
    color: (vel, particle) =>
      (particle.y() / canvas.height + vel.getAngle() / (2 * Math.PI)) % 1,
    curve: vec =>
      Monad.from((vec.copy().sub(center).getAngle() + Math.PI / 2) % Math.PI)
        .map(angle => sizeVec.copy().setAngle(angle + (angle % Math.PI)))
        .get(),
  };
};

const swirls: WindFunc = ({ time, canvas, paramConfig }) => {
  const dimensions = Vector.create(canvas.width / 2, canvas.height / 2);
  const swirlSize = (dimensions.getMin() * 2) / 4;
  const swirlsPerDim = dimensions.map(n => Math.floor(n / swirlSize));
  const maxIndex = swirlsPerDim.x() * swirlsPerDim.y();
  const sizeVec = Vector.create(
    (paramConfig.getVal("speed") + 0.05) * time.delta * 200,
    0
  );

  return {
    color: (_vel, particle) =>
      Monad.from(particle.map(n => Math.floor(n / swirlSize)))
        .map(grid => (2 * (grid.x() + grid.y() * swirlsPerDim.x())) / maxIndex)
        .get(),
    curve: vec =>
      sizeVec
        .copy()
        .setAngle(
          vec.map(n => (n % swirlSize) - swirlSize / 2).getAngle() +
            (vec.map(n => Math.floor(n / swirlSize)).sum() % 2 === 1
              ? Math.PI / 2
              : -Math.PI / 2)
        ),
  };
};

const eyes: WindFunc = ({ time, canvas, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const blendSize = 3;
  const blendStart = (blendSize - 1) / 2;
  const vecSize = (paramConfig.getVal("speed") + 0.05) * time.delta * 200;

  return {
    color: (vel, particle) =>
      posMod(
        particle.x() < center.x()
          ? vel.getAngle() / (2 * Math.PI)
          : 0.5 - vel.getAngle() / (2 * Math.PI),
        1
      ),
    curve: vec =>
      Vector.create(vec.x() < center.x() ? 1 : -1, -1)
        .lerp(
          Vector.create(vec.x() < center.x() ? -1 : 1, -1),
          Math.max(
            Math.min((blendSize * vec.y()) / (2 * center.y()) - blendStart, 1),
            0
          )
        )
        .normalise()
        .lerp(Vector.DOWN, (1 - Math.abs(vec.x() / center.x() - 1)) ** 2)
        .multiply(vecSize),
  };
};

const curvedStripes: WindFunc = ({ time, paramConfig }) => {
  const vecSize = (paramConfig.getVal("speed") + 0.05) * time.delta * 200;

  return {
    color: (_, particle) =>
      Math.abs(Math.sin((particle.x() / 35 + Math.sin(particle.y() / 35)) / 6)),
    curve: vec =>
      Vector.create(Math.cos(vec.y() / 35), -1)
        .multiply(Math.cos(vec.x() / 35 + Math.sin(vec.y() / 35)))
        .setMagnitude(vecSize),
  };
};

export const getWindFn: WindFunc = context => {
  const { paramConfig } = context;
  const curve = paramConfig.getVal("curve");

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

    case "Eyes":
      return eyes(context);

    case "Curved Stripes":
      return curvedStripes(context);

    default:
      return checkExhausted(curve);
  }
};
