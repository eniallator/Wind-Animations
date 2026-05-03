import { Monad, positiveMod, tuple } from "niall-utils";
import { Vector } from "vectyped";

import type { Config } from "./config.ts";
import type { WindFunc } from "./types";

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
const TAU = 2 * Math.PI;

const vortex: WindFunc = ({ canvas, time, seriform }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);

  const timeSoFar = time.now - time.start;
  const steppedTime = 2 * timeSoFar - Math.floor(timeSoFar / 8);

  const multiplier =
    ((seriform.getValue("speed") + 0.05) *
      Math.min(canvas.width, canvas.height)) /
    800;

  return {
    color: vel => positiveMod(vel.getAngle() / TAU, 1),
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

const sweepingRight: WindFunc = ({ time, seriform, canvas }) => {
  const sizeVec = Vector.create(
    500 * (seriform.getValue("speed") + 0.1) * time.delta,
    0
  );
  const divisor = (Math.min(canvas.width, canvas.height) * 1.2) ** 2 / 2;
  const offset = ((time.now - time.start) / 60) * TAU;
  return {
    color: (vel, particle) =>
      positiveMod(particle.x() / canvas.width + vel.getAngle() / TAU, 1),
    curve: vec =>
      sizeVec
        .copy()
        .setAngle(Math.cos(vec.getSquaredMagnitude() / divisor + offset)),
  };
};

const zigZag: WindFunc = ({ time, canvas, seriform }) => {
  const speed = seriform.getValue("speed") * time.delta * 300;

  return {
    color: (vel, particle) =>
      positiveMod(particle.x() / canvas.width + vel.getAngle() / TAU, 1),
    curve: vec =>
      Vector.create(
        1,
        2 * (Math.round(((10 * vec.x()) / canvas.width) % 1) - 0.5)
      ).multiply(speed),
  };
};

const magnet: WindFunc = ({ time, canvas, seriform }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const sizeVec = Vector.create(
    (seriform.getValue("speed") + 0.05) * time.delta * 200,
    0
  );

  return {
    color: (vel, particle) =>
      positiveMod(particle.y() / canvas.height + vel.getAngle() / TAU, 1),
    curve: vec =>
      Monad.from(vec.copy().sub(center).getAngle() + Math.PI / 2)
        .map(angle => sizeVec.copy().setAngle(2 * angle))
        .get(),
  };
};

const swirls: WindFunc = ({ time, canvas, seriform }) => {
  const dimensions = Vector.create(canvas.width, canvas.height);
  const swirlSize = dimensions.getMin() / 4;
  const swirlsPerDim = dimensions.divide(swirlSize).ceil();
  const maxIndex = swirlsPerDim.x() * swirlsPerDim.y();
  const sizeVec = Vector.create(
    (seriform.getValue("speed") + 0.05) * time.delta * 200,
    0
  );

  return {
    color: (_vel, particle) =>
      Monad.from(particle.map(n => Math.floor(n / swirlSize)))
        .map(grid => (grid.x() + grid.y() * swirlsPerDim.x()) / maxIndex)
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

const eyes: WindFunc = ({ time, canvas, seriform }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const blendSize = 3;
  const blendStart = (blendSize - 1) / 2;
  const vecSize = (seriform.getValue("speed") + 0.05) * time.delta * 200;

  return {
    color: (vel, particle) =>
      positiveMod(
        (particle.x() < center.x() ? vel.getAngle() : 0.5 - vel.getAngle()) /
          TAU,
        1
      ),
    curve: vec =>
      Vector.create(vec.x() < center.x() ? 1 : -1, -1)
        .lerp(
          Math.max(
            Math.min((blendSize * vec.y()) / (2 * center.y()) - blendStart, 1),
            0
          ),
          Vector.create(vec.x() < center.x() ? -1 : 1, -1)
        )
        .normalise()
        .lerp((1 - Math.abs(vec.x() / center.x() - 1)) ** 2, Vector.DOWN)
        .multiply(vecSize),
  };
};

const curvedStripes: WindFunc = ({ time, seriform }) => {
  const vecSize = (seriform.getValue("speed") + 0.05) * time.delta * 200;

  return {
    color: (_, particle) =>
      Math.abs(Math.sin((particle.x() / 35 + Math.sin(particle.y() / 35)) / 6)),
    curve: vec =>
      Vector.create(Math.cos(vec.y() / 35), -1)
        .multiply(Math.cos(vec.x() / 35 + Math.sin(vec.y() / 35)))
        .setMagnitude(vecSize),
  };
};

const points = new Array(4).fill(undefined).map(() => ({
  pos: Vector.create(Math.random(), Math.random()),
  dir: Math.sign(Math.random() - 0.25),
}));

const attractorRepulsers: WindFunc = ({ time, canvas, seriform }) => {
  const dimensions = Vector.create(canvas.width, canvas.height);
  const dimensionsNorm = dimensions.getNorm();
  const vecSize = (seriform.getValue("speed") + 0.05) * time.delta * 200;

  return {
    color: vec => positiveMod(vec.getAngle() / TAU, 1),
    curve: vec => {
      return points
        .reduce((acc, { pos, dir }) => {
          const strength = vec.copy().divide(dimensions).sub(pos).multiply(dir);
          return acc.add(
            strength.setMagnitude(1 - strength.getSquaredMagnitude())
          );
        }, Vector.zero(2))
        .multiply(dimensionsNorm, vecSize);
    },
  };
};

const circleStripes: WindFunc = ({ time, canvas, seriform }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const sizeVec = Vector.create(
    (seriform.getValue("speed") + 0.05) * time.delta * 200,
    0
  );
  const laneSize = center.getMin() / 5;

  return {
    color: vec => positiveMod(vec.getAngle() / TAU, 1),
    curve: vec =>
      Monad.from(vec.copy().sub(center))
        .map(diff =>
          sizeVec
            .copy()
            .setAngle(diff.getAngle() + Math.PI / 2)
            .multiply(diff.getMagnitude() % (2 * laneSize) > laneSize ? 1 : -1)
        )
        .get(),
  };
};

export const windFuncs: Record<Config["curve"], WindFunc> = {
  "Sweeping Right": vortex,
  Vortex: sweepingRight,
  "Zig Zag": zigZag,
  Magnet: magnet,
  Swirls: swirls,
  Eyes: eyes,
  "Curved Stripes": curvedStripes,
  "Attractor Repulsers": attractorRepulsers,
  "Circle Stripes": circleStripes,
};
