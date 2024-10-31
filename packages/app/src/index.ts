import { Vector } from "@web-art/linear-algebra";
import { calcColor } from "./color";
import config from "./config";
import { AppContext, AppContextWithState, appMethods } from "./lib/types";
import { State } from "./types";
import { getWindFn } from "./velocity";

const STILL_THRESHOLD = 1e-2;

function init({ canvas, ctx, paramConfig }: AppContext<typeof config>): State {
  ctx.fillStyle = `#${paramConfig.getVal("background")}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return {
    particles: new Array(paramConfig.getVal("num-particles"))
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

function animationFrame(context: AppContextWithState<typeof config, State>) {
  const { canvas, ctx, paramConfig, time, state } = context;

  const dimensions = Vector.create(canvas.width, canvas.height);

  const drawOpacity = paramConfig
    .getVal("draw-opacity")
    .toString(16)
    .padStart(2, "0");
  ctx.fillStyle = `#${paramConfig.getVal("background")}${drawOpacity}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  manageNumParticles(state.particles, paramConfig.getVal("num-particles"), () =>
    dimensions.map(n => n * Math.random())
  );

  const { curve, color } = getWindFn(context);
  const colorMap = paramConfig.getVal("color-map");
  const colorMode = paramConfig.getVal("color-mode");
  const isMultiColor =
    color != null &&
    (colorMode === "Hue Cycle" ||
      (colorMode === "Custom Gradient" && colorMap.length > 1));

  const colorFn = calcColor(colorMap);

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

export default appMethods.stateful({
  init: context => {
    const { canvas, ctx, paramConfig } = context;

    paramConfig.addListener(
      state => {
        ctx.fillStyle = `#${state.background}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
      ["background", "draw-opacity"]
    );

    return init(context);
  },
  onResize: (_evt, appContext) => init(appContext),
  animationFrame,
});
