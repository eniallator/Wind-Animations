import Vector from "../core/Vector";
import { AppContext, AppContextWithState, appMethods } from "../core/types";
import config from "./config";

function getVelocity(vec: Vector<2>, dt: number = 1): Vector<2> {
  return Vector.create(100 * dt, 0).setAngle(
    Math.cos(vec.getSquaredMagnitude() / 1e6)
  );
}

type State = { particles: Vector<2>[] };

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

function animationFrame({
  canvas,
  ctx,
  // paramConfig,
  time,
  state,
}: AppContextWithState<typeof config, State>) {
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  for (const particle of state.particles) {
    const vel = getVelocity(particle, time.delta);
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
