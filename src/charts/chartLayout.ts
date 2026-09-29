import type { PreparedPoint, PreparedSeries } from "../app/types";

export const CHART_MARGIN = Object.freeze({
  top: 24,
  right: 28,
  bottom: 44,
  left: 56,
});

/* In-plot line-style key geometry (see computeKeyBandHeight): the line sample plus its gap, an approximate glyph width at the key's 13px size, the flex gap between items, one row's height, and the vertical padding around the rows. */
const KEY_SAMPLE_WIDTH = 26;
const KEY_CHARACTER_WIDTH = 6.5;
const KEY_ITEM_GAP = 12;
const KEY_ROW_HEIGHT = 18;
const KEY_BAND_PADDING = 12;

const Y_AXIS_CHARACTER_WIDTH = 7;
const Y_AXIS_PADDING = 16;
const Y_AXIS_MAX_MARGIN = 112;

export interface YAxisScale {
  min: number;
  max: number;
  ticks: readonly number[];
}

/** Gives raw-count axes enough left margin for their longest formatted tick label. */
export function computeChartLeftMargin(longestYAxisLabelLength: number): number {
  return Math.min(
    Y_AXIS_MAX_MARGIN,
    Math.max(CHART_MARGIN.left, Math.ceil(longestYAxisLabelLength * Y_AXIS_CHARACTER_WIDTH + Y_AXIS_PADDING)),
  );
}

/**
 * A point is safe to plot (line vertex, marker, or direct label anchor) only
 * when it has positive population and a real value -- ported from v0's
 * isRenderablePoint. A suppressed comparison's points are excluded by the
 * caller before reaching here (see prepareComparisons's whole-comparison
 * suppression), so `status === "suppressed"` should not occur, but the check
 * is kept as a defense-in-depth guard against ever plotting a suppressed
 * value.
 */
export function isRenderablePoint(point: PreparedPoint): boolean {
  return point.totalPopulation > 0 && point.status !== "suppressed" && point.displayedValue !== null;
}

export function getYearDomain(series: readonly PreparedSeries[]): [number, number] | null {
  const years = series
    .filter((entry) => !entry.hidden)
    .flatMap((entry) => [...entry.actual, ...entry.projected].map((point) => point.year));
  if (years.length === 0) {
    return null;
  }
  return [Math.min(...years), Math.max(...years)];
}

export function getRenderableDisplayValues(series: readonly PreparedSeries[]): number[] {
  return series
    .filter((entry) => !entry.hidden)
    .flatMap((entry) => [...entry.actual, ...entry.projected])
    .filter(isRenderablePoint)
    .map((point) => point.displayedValue as number);
}

function getNiceStep(minimumStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(minimumStep));
  const normalizedStep = minimumStep / magnitude;
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => normalizedStep <= candidate) ?? 10;
  return factor * magnitude;
}

/**
 * Ported from v0's buildYAxisScale/getNiceStep. Never lets the axis minimum
 * go negative (per the PPIC chart guide default of a zero baseline, since
 * every outcome rendered here is a non-negative share or count), and picks
 * the axis minimum as a "nice" step multiple at or below the padded data
 * minimum -- so it lands exactly on zero whenever the data is close enough
 * to zero for that to be the nearest nice value, but not always.
 */
export function computeYAxisScale(minValue: number, maxValue: number, tickCount = 4): YAxisScale {
  if (minValue === maxValue) {
    const padding = maxValue === 0 ? 1 : Math.abs(maxValue) * 0.06;
    return computePaddedYAxisScale(Math.max(0, minValue - padding), maxValue + padding, tickCount);
  }

  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.06;
  return computePaddedYAxisScale(Math.max(0, minValue - padding), maxValue + padding, tickCount);
}

function computePaddedYAxisScale(targetMin: number, targetMax: number, tickCount: number): YAxisScale {
  let step = getNiceStep((targetMax - targetMin) / (tickCount - 1));
  let axisMin = Math.max(0, Math.floor(targetMin / step) * step);
  let axisMax = axisMin + step * (tickCount - 1);

  while (axisMax < targetMax) {
    step = getNiceStep(step * 1.001);
    axisMin = Math.max(0, Math.floor(targetMin / step) * step);
    axisMax = axisMin + step * (tickCount - 1);
  }

  return { min: axisMin, max: axisMax, ticks: tickList(axisMin, step, tickCount) };
}

/**
 * Height of the strip along the bottom of the plot that holds the in-plot
 * line-style key. Items wrap onto extra rows when the plot is too narrow for
 * them side by side, so the strip grows with an estimate of how many rows the
 * labels need; series are scaled to stay above it.
 */
export function computeKeyBandHeight(labels: readonly string[], innerWidth: number): number {
  let rows = 1;
  let rowWidth = 0;
  for (const label of labels) {
    const itemWidth = KEY_SAMPLE_WIDTH + label.length * KEY_CHARACTER_WIDTH;
    const candidate = rowWidth === 0 ? itemWidth : rowWidth + KEY_ITEM_GAP + itemWidth;
    if (rowWidth > 0 && candidate > innerWidth) {
      rows += 1;
      rowWidth = itemWidth;
    } else {
      rowWidth = candidate;
    }
  }
  return rows * KEY_ROW_HEIGHT + KEY_BAND_PADDING;
}

/**
 * Extends a y-axis domain downward so that `axisMin` lands `bandHeight` pixels
 * above the x axis: everything the axis ticks span is drawn above the band,
 * so no series line can enter the strip the in-plot key occupies. The band is
 * capped at a third of the plot so tiny charts still show their data.
 */
export function extendDomainBelowForBand(
  axisMin: number,
  axisMax: number,
  innerHeight: number,
  bandHeight: number,
): { domainMin: number; bandHeight: number } {
  const band = Math.max(0, Math.min(bandHeight, Math.floor(innerHeight / 3)));
  const dataHeight = innerHeight - band;
  if (dataHeight <= 0 || axisMax <= axisMin) {
    return { domainMin: axisMin, bandHeight: 0 };
  }
  const valuePerPixel = (axisMax - axisMin) / dataHeight;
  return { domainMin: axisMin - band * valuePerPixel, bandHeight: band };
}

/** Roughly one tick per 70px of available width, so year labels never collide at narrow viewports. */
export function computeXAxisTickCount(innerWidth: number, maxTicks = 8): number {
  return Math.max(2, Math.min(maxTicks, Math.floor(innerWidth / 70)));
}

function tickList(axisMin: number, step: number, tickCount: number): number[] {
  return Array.from({ length: tickCount }, (_, index) => Number((axisMin + step * index).toPrecision(12)));
}

export interface LineSegment {
  from: PreparedPoint;
  to: PreparedPoint;
  /** True when either endpoint is the interpolated 2020 poverty point. */
  interpolatedEdge: boolean;
}

/** Consecutive renderable point pairs; a missing/suppressed point between them breaks the line, matching v0. */
export function buildLineSegments(points: readonly PreparedPoint[]): LineSegment[] {
  const segments: LineSegment[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    if (isRenderablePoint(from) && isRenderablePoint(to)) {
      segments.push({ from, to, interpolatedEdge: from.status === "interpolated" || to.status === "interpolated" });
    }
  }
  return segments;
}
