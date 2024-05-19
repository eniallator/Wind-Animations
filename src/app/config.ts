import { config, numberConfig } from "../configParser/create";

export default config(
  numberConfig({
    id: "num-particles",
    label: "Number of Particles",
    default: 10000,
    attrs: {
      min: "0",
      max: "1000000",
    },
  })
);
