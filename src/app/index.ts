import Vector from "../core/Vector";
import { AppContext, AppContextWithState, appMethods } from "../core/types";
import config from "./config";

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
function getVelocity(
  vec: Vector<2>,
  center: Vector<2>,
  dt: number,
  timeSoFar: number
): Vector<2> {
  const diff = vec
    .copy()
    .sub(center)
    .divide(center)
    .divide(center.x() / center.y());
  const angle = diff.getAngle();
  return Vector.create(
    Math.cos(
      diff.getMagnitude() / (2 * dt) + (angle - Math.PI) - timeSoFar / 0.5
    ),
    Math.sin(
      diff.getMagnitude() / (3 * dt) + (angle - Math.PI) - timeSoFar / 0.5
    )
  );
}

function animationFrame({
  canvas,
  ctx,
  time,
  state,
}: AppContextWithState<typeof config, State>) {
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const center = Vector.create(canvas.width / 2, canvas.height / 2);

  ctx.beginPath();
  for (const particle of state.particles) {
    const vel = getVelocity(
      particle,
      center,
      time.delta,
      time.now - time.animationStart
    );
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
