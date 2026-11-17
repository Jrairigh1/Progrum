export const COLS = 4;
export const ROWS = 3;
export const CELL = 250;
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
export const STROKE_PAD = 8;

export type Tab = -1 | 0 | 1;

export interface Tabs {
  top: Tab;
  right: Tab;
  bottom: Tab;
  left: Tab;
}

function shared(col: number, row: number, salt: number): Tab {
  const n = Math.abs(Math.sin((col + 3) * 12.9898 + (row + 5) * 78.233 + salt * 45.164) * 43758.5453);
  return n - Math.floor(n) > 0.5 ? 1 : -1;
}

export function cellTabs(col: number, row: number): Tabs {
  return {
    top: row === 0 ? 0 : (-shared(col, row - 1, 2) as Tab),
    right: col === COLS - 1 ? 0 : shared(col, row, 1),
    bottom: row === ROWS - 1 ? 0 : shared(col, row, 2),
    left: col === 0 ? 0 : (-shared(col - 1, row, 1) as Tab),
  };
}

export function rowTabs(index: number, count: number): Tabs {
  const right: Tab = index === count - 1 ? 0 : index % 2 === 0 ? 1 : -1;
  const left: Tab = index === 0 ? 0 : index % 2 === 0 ? 1 : -1;
  return { top: 0, bottom: 0, left, right };
}

/** Symmetric knob depth so a tab and the neighboring blank are the same curve. */
export function knobDepth(t: number): number {
  if (t <= 0.32 || t >= 0.68) return 0;
  const u = (t - 0.5) / 0.18;
  const a = Math.abs(u);
  if (a >= 1) return 0;
  const shoulder = Math.cos(a * Math.PI * 0.5);
  const neck = Math.sin(a * Math.PI);
  return 0.045 * neck + 0.125 * Math.pow(shoulder, 1.15);
}

function side(x1: number, y1: number, x2: number, y2: number, tab: Tab): string {
  if (tab === 0) return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ox = uy;
  const oy = -ux;
  const steps = 32;
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const depth = knobDepth(t);
    const x = x1 + ux * len * t + ox * depth * len * tab;
    const y = y1 + uy * len * t + oy * depth * len * tab;
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `L ${points.join(" L ")}`;
}

export function piecePath(x: number, y: number, w: number, h: number, tabs: Tabs): string {
  const x2 = x + w;
  const y2 = y + h;
  return [
    `M ${x.toFixed(2)} ${y.toFixed(2)}`,
    side(x, y, x2, y, tabs.top),
    side(x2, y, x2, y2, tabs.right),
    side(x2, y2, x, y2, tabs.bottom),
    side(x, y2, x, y, tabs.left),
    "Z",
  ].join(" ");
}
