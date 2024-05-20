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

type CurveFunc = (vec: Vector<2>) => Vector<2>;
type VelocityFunc = (
  context: AppContextWithState<typeof config, State>
) => CurveFunc;

const vortexCurve: VelocityFunc = ({ canvas, time, paramConfig }) => {
  const center = Vector.create(canvas.width / 2, canvas.height / 2);
  const speed = 0.1 + paramConfig.getVal("speed") / (1 / 0.9);

  const timeSoFar = time.now - time.animationStart;
  const steppedTime = 2 * timeSoFar - Math.floor(timeSoFar / 8);

  return vec => {
    const diff = vec.copy().sub(center).divide(center);
    const c = diff.getAngle() - steppedTime;

    return Vector.create(
      2 * speed * Math.cos(diff.getMagnitude() / (2 * time.delta) + c),
      speed *
        Math.sin(diff.getMagnitude() / (2 * GOLDEN_RATIO * time.delta) + c)
    );
  };
};

const sweepingRightCurve: VelocityFunc = ({ time, paramConfig }) => {
  const sizeVec = Vector.create(
    500 * (paramConfig.getVal("speed") + 0.1) * time.delta,
    0
  );
  return vec =>
    sizeVec.copy().setAngle(Math.cos(vec.getSquaredMagnitude() / 1e6));
};

const zigZagCurve: VelocityFunc = ({ time, canvas, paramConfig }) => {
  return vec =>
    Vector.create(
      1,
      2 * (Math.round(((10 * vec.x()) / canvas.width) % 1) - 0.5)
    ).multiply(paramConfig.getVal("speed") * time.delta * 300);
};

const getVelocity: VelocityFunc = context => {
  const curve = context.paramConfig.getVal("curve");

  switch (curve) {
    case "Vortex":
      return vortexCurve(context);

    case "Sweeping Right":
      return sweepingRightCurve(context);

    case "Zig Zag":
      return zigZagCurve(context);

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
  const curve = getVelocity(context);

  ctx.beginPath();
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
