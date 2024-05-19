import { config, numberConfig, selectConfig } from "../configParser/create";

export default config(
  numberConfig({
    id: "num-particles",
    label: "Number of Particles",
    default: 10000,
    attrs: {
      min: "0",
      max: "1000000",
    },
  }),
  selectConfig({
    id: "curve",
    label: "Curve",
    default: "Sweeping Right",
    options: ["Vortex", "Sweeping Right"],
  })
);
