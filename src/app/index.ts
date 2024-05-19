import Vector from "../core/Vector";
import { AppContext, AppContextWithState, appMethods } from "../core/types";
import { checkExhausted } from "../core/utils";
import config from "./config";

type State = { particles: Vector<2>[] };

const STILL_THRESHOLD = 1e-2;
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

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

type VelocityFunc = (
  vec: Vector<2>,
  context: AppContextWithState<typeof config, State>
) => Vector<2>;

const vortexCurve: VelocityFunc = (vec, { canvas, time, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const diff = vec
    .copy()
    .sub(center)
    .divide(center)
    .divide(center.x() / center.y());
  const angle = diff.getAngle();
  const timeSoFar = time.now - time.animationStart;
  return Vector.create(
    2 *
      paramConfig.getVal("speed") *
      Math.cos(
        diff.getMagnitude() / (2 * time.delta) +
          (angle - Math.PI) -
          timeSoFar / 0.5
      ),
    paramConfig.getVal("speed") *
      Math.sin(
        diff.getMagnitude() / (2 * GOLDEN_RATIO * time.delta) +
          (angle - Math.PI) -
          timeSoFar / 0.5
      )
  );
};

const sweepingRightCurve: VelocityFunc = (vec, { time, paramConfig }) =>
  Vector.create(500 * paramConfig.getVal("speed") * time.delta, 0).setAngle(
    Math.cos(vec.getSquaredMagnitude() / 1e6)
  );

const getVelocity: VelocityFunc = (vec, context) => {
  const curve = context.paramConfig.getVal("curve");
  switch (curve) {
    case "Vortex":
      return vortexCurve(vec, context);
    case "Sweeping Right":
      return sweepingRightCurve(vec, context);
    default:
      return checkExhausted(curve);
  }
};

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

  ctx.beginPath();
  for (const particle of state.particles) {
    const vel = getVelocity(particle, context);
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
      ctx.moveTo(...particle.toArray());
      particle.add(vel);
      ctx.lineTo(...particle.toArray());
    }
  }
  ctx.stroke();
  return null;
}

export default appMethods.stateful({
  init,
  onResize: (_evt, appContext) => init(appContext),
  animationFrame,
});
