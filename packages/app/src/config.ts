import {
  checkboxConfig,
  colorConfig,
  config,
  numberConfig,
  rangeConfig,
  selectConfig,
} from "@web-art/config-parser";

export default config(
  checkboxConfig({
    id: "use-color",
    label: "Use Colour",
    default: true,
  }),
  rangeConfig({
    id: "speed",
    label: "Animation Speed",
    default: 0.5,
    attrs: { min: "0", max: "1", step: "0.01" },
  }),
  numberConfig({
    id: "num-particles",
    label: "Number of Particles",
    default: 10000,
    attrs: {
      min: "0",
      max: `${1e15}`,
    },
  }),
  colorConfig({
    id: "background",
    label: "Background Colour",
    default: "FFFFFF",
  }),
  rangeConfig({
    id: "draw-opacity",
    label: "Draw Opacity",
    tooltip: "Affects how long the colour trails are",
    default: 13,
    attrs: { min: "0", max: "255" },
  }),
  selectConfig({
    id: "curve",
    label: "Curve",
    default: "Sweeping Right",
    options: [
      "Vortex",
      "Sweeping Right",
      "Zig Zag",
      "Magnet",
      "Swirls",
      "Eyes",
    ],
  })
);
