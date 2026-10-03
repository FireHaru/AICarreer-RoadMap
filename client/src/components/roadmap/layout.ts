export type Direction = 'LR' | 'TB';

export const NODE_W = 264;
export const NODE_H = 178;

interface Edge { source: number; target: number }

/**
 * Layered layout for a prerequisite DAG: a course sits one layer after its deepest prerequisite,
 * and courses within a layer are ordered by the barycentre of their neighbours to reduce crossings.
 */
export function layoutDag(ids: number[], edges: Edge[], direction: Direction) {
  const parents = new Map<number, number[]>(ids.map((id) => [id, []]));
  const children = new Map<number, number[]>(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!parents.has(e.target) || !children.has(e.source)) continue;
    parents.get(e.target)!.push(e.source);
    children.get(e.source)!.push(e.target);
  }

  const level = new Map<number, number>();
  const levelOf = (id: number, seen = new Set<number>()): number => {
    const known = level.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0;
    seen.add(id);
    const ps = parents.get(id)!;
    const l = ps.length ? Math.max(...ps.map((p) => levelOf(p, seen))) + 1 : 0;
    level.set(id, l);
    return l;
  };
  ids.forEach((id) => levelOf(id));

  const depth = Math.max(0, ...level.values()) + 1;
  const layers: number[][] = Array.from({ length: depth }, () => []);
  ids.forEach((id) => layers[level.get(id)!].push(id)); // ids arrive in roadmap order

  const key = (id: number) => {
    const layer = layers[level.get(id)!];
    return (layer.indexOf(id) + 0.5) / layer.length;
  };
  const reorder = (layer: number[], neighbours: (id: number) => number[]) => {
    const scored = layer.map((id, i) => {
      const ns = neighbours(id);
      return { id, i, k: ns.length ? ns.reduce((s, n) => s + key(n), 0) / ns.length : (i + 0.5) / layer.length };
    });
    scored.sort((a, b) => a.k - b.k || a.i - b.i);
    layer.splice(0, layer.length, ...scored.map((s) => s.id));
  };
  for (let iter = 0; iter < 4; iter++) {
    for (let l = 1; l < depth; l++) reorder(layers[l], (id) => parents.get(id)!);
    for (let l = depth - 2; l >= 0; l--) reorder(layers[l], (id) => children.get(id)!);
  }

  const gapMain = direction === 'LR' ? 92 : 84;
  const gapCross = direction === 'LR' ? 28 : 36;
  const positions = new Map<number, { x: number; y: number }>();
  layers.forEach((layer, l) => {
    layer.forEach((id, i) => {
      const cross = (i - (layer.length - 1) / 2) * ((direction === 'LR' ? NODE_H : NODE_W) + gapCross);
      const main = l * ((direction === 'LR' ? NODE_W : NODE_H) + gapMain);
      positions.set(id, direction === 'LR' ? { x: main, y: cross } : { x: cross, y: main });
    });
  });

  const goalMain = depth * ((direction === 'LR' ? NODE_W : NODE_H) + gapMain);
  const goal = direction === 'LR' ? { x: goalMain, y: NODE_H / 2 - 60 } : { x: NODE_W / 2 - 110, y: goalMain };
  const sinks = ids.filter((id) => children.get(id)!.length === 0);
  return { positions, goal, sinks };
}

/** All ancestors and descendants of `id`, used to highlight a course's dependency chain. */
export function relatedSet(id: number, edges: Edge[]) {
  const up = new Map<number, number[]>();
  const down = new Map<number, number[]>();
  for (const e of edges) {
    (up.get(e.target) ?? up.set(e.target, []).get(e.target)!).push(e.source);
    (down.get(e.source) ?? down.set(e.source, []).get(e.source)!).push(e.target);
  }
  const out = new Set<number>([id]);
  const walk = (start: number, graph: Map<number, number[]>) => {
    const stack = [start];
    while (stack.length) {
      const n = stack.pop()!;
      for (const m of graph.get(n) ?? []) {
        if (!out.has(m)) {
          out.add(m);
          stack.push(m);
        }
      }
    }
  };
  walk(id, up);
  walk(id, down);
  return out;
}
