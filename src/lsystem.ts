export interface LSystem {
  id: string;
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  step: number;
  blurb: string;
  draw: Set<string>;
}

export const LSYSTEMS: LSystem[] = [
  {
    id: "koch",
    name: "Koch curve",
    axiom: "F",
    rules: { F: "F+F--F+F" },
    angle: 60,
    step: 1,
    blurb: "One production. Iteration n yields length 4·5^{n-1} + 1 — state never grows.",
    draw: new Set(["F"]),
  },
  {
    id: "sierpinski",
    name: "Sierpiński",
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    step: 1,
    blurb: "A triangle that fills itself. Two rules, unbounded detail.",
    draw: new Set(["F", "G"]),
  },
  {
    id: "plant",
    name: "Branching plant",
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    step: 1,
    blurb: "Bracketed turtle stack. Morphology from a sentence, not a mesh.",
    draw: new Set(["F"]),
  },
  {
    id: "dragon",
    name: "Dragon curve",
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    step: 1,
    blurb: "Heighway dragon. A finite grammar whose trace never self-crosses.",
    draw: new Set(["F"]),
  },
  {
    id: "fibonacci",
    name: "Algae / Fibonacci",
    axiom: "A",
    rules: { A: "AB", B: "A" },
    angle: 60,
    step: 1,
    blurb: "Lindenmayer’s original algae. The word length is a Fibonacci number.",
    draw: new Set(["A", "B"]),
  },
];

export function expandLSystem(sys: LSystem, iterations: number): string {
  let s = sys.axiom;
  const cap = 25000;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of s) next += sys.rules[ch] ?? ch;
    s = next;
    if (s.length > cap) break;
  }
  return s;
}

export function grammarStateSize(sys: LSystem): number {
  let n = sys.axiom.length;
  for (const rhs of Object.values(sys.rules)) n += rhs.length;
  return n;
}

export interface TurtlePoint {
  x: number;
  y: number;
  draw: boolean;
}

export function turtle(sys: LSystem, word: string): TurtlePoint[] {
  const deg = (sys.angle * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let a = -Math.PI / 2;
  const stack: { x: number; y: number; a: number }[] = [];
  const pts: TurtlePoint[] = [{ x, y, draw: false }];

  for (const ch of word) {
    if (sys.draw.has(ch)) {
      x += Math.cos(a) * sys.step;
      y += Math.sin(a) * sys.step;
      pts.push({ x, y, draw: true });
    } else if (ch === "+") {
      a += deg;
    } else if (ch === "-") {
      a -= deg;
    } else if (ch === "[") {
      stack.push({ x, y, a });
    } else if (ch === "]") {
      const s = stack.pop();
      if (s) {
        x = s.x;
        y = s.y;
        a = s.a;
        pts.push({ x, y, draw: false });
      }
    }
  }
  return pts;
}

export function bounds(pts: TurtlePoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  if (maxX === minX) maxX = minX + 1;
  if (maxY === minY) maxY = minY + 1;
  return { minX, minY, maxX, maxY };
}
