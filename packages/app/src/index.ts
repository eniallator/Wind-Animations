import { Vector } from "@web-art/linear-algebra";
import config from "./config";
import { AppContext, AppContextWithState, appMethods } from "./lib/types";
import { State } from "./types";
import { getWindFn } from "./velocity";
import { findAndMap, posMod, raise, tuple } from "@web-art/core";

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

function blendColors(a: string, b: string, percent: number): string {
  const aChannels =
    a.match(/[\da-f]{2}/gi) ??
    raise<RegExpMatchArray>(new Error(`Invalid colour ${a}`));
  const bChannels =
    b.match(/[\da-f]{2}/gi) ??
    raise<RegExpMatchArray>(new Error(`Invalid colour ${b}`));

  return aChannels
    .map((channel, i) =>
      Math.floor(
        percent * parseInt(channel, 16) +
          (1 - percent) *
            parseInt(
              bChannels[i] ?? raise<string>(Error(`Invalid b colour ${b}`)),
              16
            )
      )
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function calcColor(colorMap: (readonly [string, number])[]) {
  const totalWeight = colorMap.reduce((acc, row) => acc + row[1], 0);
  const percentWeights = colorMap.reduce(
    (acc, [color, weight], i) => [
      ...acc,
      tuple(color, weight / totalWeight + (acc[i - 1]?.[1] ?? 0)),
    ],
    [] as (readonly [string, number])[]
  );
  return (colorPercent: number): string =>
    findAndMap(percentWeights, ([color, weightPercent], i) => {
      const prevRow =
        percentWeights[posMod(i - 1, percentWeights.length)] ??
        raise<[string, number]>(Error("Should never happen ..."));
      const out =
        colorPercent > weightPercent
          ? null
          : blendColors(
              color,
              prevRow[0],
              i > 0
                ? (colorPercent - prevRow[1]) / (weightPercent - prevRow[1])
                : colorPercent / weightPercent
            );
      return out;
    }) ??
    colorMap[colorMap.length - 1]?.[0] ??
    raise<string>(Error("Should never happen ..."));
}

function hueCycle(percent: number): string {
  return `hsl(${percent * 360} 100% 50%)`;
}

function animationFrame(context: AppContextWithState<typeof config, State>) {
  const { canvas, ctx, paramConfig, time, state } = context;

  const drawOpacity = paramConfig
    .getVal("draw-opacity")
    .toString(16)
    .padStart(2, "0");
  ctx.fillStyle = `#${paramConfig.getVal("background")}${drawOpacity}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  manageNumParticles(state.particles, paramConfig.getVal("num-particles"), () =>
    Vector.create(canvas.width * Math.random(), canvas.height * Math.random())
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
      colorMap[0]?.[0] != null && colorMode !== "Black"
        ? `#${colorMap[0][0]}`
        : "black";
    ctx.beginPath();
  }
  for (const particle of state.particles) {
    const vel = curve(particle);

    if (
      vel.getSquaredMagnitude() < STILL_THRESHOLD * time.delta ||
      particle.x() < 0 ||
      particle.x() > canvas.width ||
      particle.y() < 0 ||
      particle.y() > canvas.height
    ) {
      particle.setHead(
        canvas.width * Math.random(),
        canvas.height * Math.random()
      );
    } else {
      if (isMultiColor) {
        const colorPercent = color(vel, particle);
        ctx.strokeStyle =
          colorMode === "Custom Gradient"
            ? `#${colorFn(colorPercent)}`
            : hueCycle(colorPercent);
        ctx.beginPath();
      }
      ctx.moveTo(...particle.toArray());
      particle.add(vel);
      ctx.lineTo(...particle.toArray());
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
