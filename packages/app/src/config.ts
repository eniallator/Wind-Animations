import {
  colorConfig,
  config,
  configCollection,
  numberConfig,
  rangeConfig,
  selectConfig,
} from "@web-art/config-parser";

export default config(
  selectConfig({
    id: "color-mode",
    label: "Colour Mode",
    options: ["Hue Cycle", "Custom Gradient", "Black"],
    default: "Custom Gradient",
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
      max: (1e15).toString(),
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
  }),
  configCollection({
    id: "color-map",
    label: "Colour Map",
    expandable: true,
    fields: [
      colorConfig({
        id: "color-map-color",
        label: "Colour",
        default: "FFFFFF",
      }),
      numberConfig({ id: "color-map-weight", label: "Weight", default: 1 }),
    ],
    default: [
      ["FF0000", 1],
      ["00FF00", 1],
      ["0000FF", 1],
    ],
  })
);
