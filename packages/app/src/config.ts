import {
  collectionParser,
  colorParser,
  createParsers,
  numberParser,
  rangeParser,
  selectParser,
} from "@web-art/config-parser";

export const config = createParsers({
  "color-mode": selectParser({
    label: "Colour Mode",
    options: ["Hue Cycle", "Custom Gradient", "Black"],
    default: "Custom Gradient",
  }),
  speed: rangeParser({
    label: "Animation Speed",
    default: 0.5,
    attrs: { min: "0", max: "1", step: "0.01" },
  }),
  "num-particles": numberParser({
    label: "Number of Particles",
    default: 10000,
    attrs: {
      min: "0",
      max: (1e15).toString(),
    },
  }),
  background: colorParser({
    label: "Background Colour",
    default: "000000",
  }),
  "draw-opacity": rangeParser({
    label: "Draw Opacity",
    title: "Affects how long the colour trails are",
    default: 13,
    attrs: { min: "0", max: "255" },
  }),
  curve: selectParser({
    label: "Curve",
    default: "Sweeping Right",
    options: [
      "Vortex",
      "Sweeping Right",
      "Zig Zag",
      "Magnet",
      "Swirls",
      "Eyes",
      "Curved Stripes",
      "Attractor Repulsers",
    ],
  }),
  "color-map": collectionParser({
    label: "Colour Map",
    expandable: true,
    fields: [
      colorParser({ label: "Colour", default: "FFFFFF" }),
      numberParser({
        label: "Weight",
        default: 1,
        attrs: { min: "0.1", step: "0.1" },
      }),
    ],
    default: [
      ["FF0000", 1],
      ["00FF00", 1],
      ["0000FF", 1],
    ],
  }),
});
