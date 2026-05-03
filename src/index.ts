import { createWeightedGradient } from "niall-utils";
import { Vector } from "vectyped";

import { appMethods } from "./lib/index.ts";
import { windFuncs } from "./velocity.ts";

import type { Config } from "./config.ts";
import type { AppContext, StatefulAppContext } from "./lib/index.ts";
import type { State } from "./types.ts";

const STILL_THRESHOLD = 1e-2;

function init({ canvas, ctx, seriform }: AppContext<Config>): State {
  ctx.fillStyle = `#${seriform.getValue("background")}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return {
    particles: new Array(seriform.getValue("num-particles"))
      .fill(undefined)
      .map(() =>
        Vector.create(
          canvas.width * Math.random(),
          canvas.height * Math.random()
        )
      ),
  };
}

function manageNumParticles(
  particles: Vector<2>[],
  desiredLength: number,
  createParticle: () => Vector<2>
): void {
  if (particles.length !== desiredLength) {
    particles.splice(
      0,
      Math.max(0, particles.length - desiredLength),
      ...new Array(Math.max(0, desiredLength - particles.length))
        .fill(undefined)
        .map(createParticle)
    );
  }
}

function animationFrame(context: StatefulAppContext<Config, State>) {
  const { canvas, ctx, seriform, time, getState } = context;

  const state = getState();

  const dimensions = Vector.create(canvas.width, canvas.height);

  const drawOpacity = seriform
    .getValue("draw-opacity")
    .toString(16)
    .padStart(2, "0");
  ctx.fillStyle = `#${seriform.getValue("background")}${drawOpacity}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  manageNumParticles(state.particles, seriform.getValue("num-particles"), () =>
    dimensions.map(n => n * Math.random())
  );

  const { curve, color } = windFuncs[seriform.getValue("curve")](context);
  const colorMap = seriform.getValue("color-map");
  const colorMode = seriform.getValue("color-mode");
  const isMultiColor =
    color != null &&
    (colorMode === "Hue Cycle" ||
      (colorMode === "Custom Gradient" && colorMap.length > 1));

  const colorFn = createWeightedGradient(colorMap as [string, number][]);

  if (!isMultiColor) {
    ctx.strokeStyle =
      colorMode !== "Black" && colorMap[0]?.[0] != null
        ? `#${colorMap[0][0]}`
        : "black";
    ctx.beginPath();
  }

  for (const particle of state.particles) {
    const vel = curve(particle);

    if (
      vel.getSquaredMagnitude() < STILL_THRESHOLD * time.delta ||
      !particle.inBounds(dimensions)
    ) {
      particle.setHead(dimensions.map(n => n * Math.random()));
    } else {
      if (isMultiColor) {
        const colorPercent = color(vel, particle);
        ctx.strokeStyle =
          colorMode === "Custom Gradient"
            ? `#${colorFn(colorPercent)}`
            : `hsl(${colorPercent * 360} 100% 50%)`;
        ctx.beginPath();
      }

      ctx.moveTo(particle.x(), particle.y());
      particle.add(vel);
      ctx.lineTo(particle.x(), particle.y());

      if (isMultiColor) ctx.stroke();
    }
  }
  if (!isMultiColor) ctx.stroke();
}

export const app = appMethods<Config, State>({
  init: context => {
    const { canvas, ctx, seriform } = context;

    seriform.addListener(
      state => {
        ctx.fillStyle = `#${state.background}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
      ["background", "draw-opacity"]
    );

    return init(context);
  },
  onResize: (_evt, appContext) => {
    appContext.setState(init(appContext));
  },
  animationFrame,
});
