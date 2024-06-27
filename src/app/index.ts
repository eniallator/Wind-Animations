import Vector from "../core/Vector";
import { AppContext, AppContextWithState, appMethods } from "../core/types";
import config from "./config";
import { State } from "./types";
import { getWindFn } from "./velocity";

const STILL_THRESHOLD = 1e-2;

function init({ canvas, paramConfig }: AppContext<typeof config>): State {
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
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  manageNumParticles(state.particles, paramConfig.getVal("num-particles"), () =>
    Vector.create(canvas.width * Math.random(), canvas.height * Math.random())
  );
  const { curve, color } = getWindFn(context);
  const useColour = paramConfig.getVal("use-color") && color != null;

  if (!useColour) {
    ctx.strokeStyle = "black";
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
      if (useColour) {
        ctx.strokeStyle = color(vel, particle);
        ctx.beginPath();
      }
      ctx.moveTo(...particle.toArray());
      particle.add(vel);
      ctx.lineTo(...particle.toArray());
      if (useColour) ctx.stroke();
    }
  }
  if (!useColour) ctx.stroke();
}

export default appMethods.stateful({
  init,
  onResize: (_evt, appContext) => init(appContext),
  animationFrame,
});
