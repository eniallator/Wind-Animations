import { findAndMap, posMod, raise, tuple } from "@web-art/core";

function blendColors(a: string, b: string, percent: number): string {
  const aChannels =
    a.match(/[\da-f]{2}/gi)?.map(n => parseInt(n, 16)) ??
    raise<number[]>(new Error(`Invalid colour ${a}`));
  const bChannels =
    b.match(/[\da-f]{2}/gi)?.map(n => parseInt(n, 16)) ??
    raise<number[]>(new Error(`Invalid colour ${b}`));

  return aChannels
    .map((channel, i) =>
      Math.floor(
        channel -
          (channel -
            (bChannels[i] ??
              raise<number>(new Error(`Invalid b colour ${b}`)))) *
            percent
      )
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

export function calcColor(colorMap: (readonly [string, number])[]) {
  const totalWeight = colorMap.reduce((acc, row) => acc + row[1], 0);
  const percentWeights = colorMap.reduce(
    (acc, [color, weight], i) => [
      ...acc,
      tuple(color, weight / totalWeight + (acc[i - 1]?.[1] ?? 0)),
    ],
    [] as typeof colorMap
  );

  return (colorPercent: number): string =>
    findAndMap(percentWeights, ([color, weightPercent], i) => {
      if (colorPercent > weightPercent) return null;

      const prevRow =
        percentWeights[posMod(i - 1, percentWeights.length)] ??
        raise<[string, number]>(new Error("Should never happen ..."));
      const nextRow =
        percentWeights[(i + 1) % percentWeights.length] ??
        raise<[string, number]>(new Error("Should never happen ..."));

      const blendPercent =
        i > 0
          ? (colorPercent - prevRow[1]) / (weightPercent - prevRow[1])
          : colorPercent / weightPercent;

      return blendPercent <= 0.5
        ? blendColors(prevRow[0], color, blendPercent + 0.5)
        : blendColors(color, nextRow[0], blendPercent - 0.5);
    }) ??
    colorMap[colorMap.length - 1]?.[0] ??
    raise<string>(new Error("Should never happen ..."));
}
