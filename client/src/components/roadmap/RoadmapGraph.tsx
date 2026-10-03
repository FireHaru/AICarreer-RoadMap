import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { Roadmap } from '../../lib/types';
import { layoutDag, relatedSet, type Direction } from './layout';
import { nodeTypes, type CourseNodeData, type GoalNodeData } from './nodes';

const EDGE_COLORS = {
  done: '#34d399',
  active: '#22d3ee',
  open: '#a78bfa',
  locked: 'rgb(148 163 184 / 0.35)',
};

interface Props {
  roadmap: Pick<Roadmap, 'items' | 'edges' | 'career' | 'progress' | 'path'>;
  direction: Direction;
  onOpen?: (courseId: number) => void;
  className?: string;
  minimap?: boolean;
  /** Re-fit the viewport whenever this key changes (e.g. switching path or direction). */
  fitKey?: string;
}

function Graph({ roadmap, direction, onOpen, className, minimap = true, fitKey }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const ids = roadmap.items.map((i) => i.course.id);
    const { positions, goal, sinks } = layoutDag(ids, roadmap.edges, direction);
    const related = hovered ? relatedSet(hovered, roadmap.edges) : null;
    const statusOf = new Map(roadmap.items.map((i) => [i.course.id, i.status]));

    const nodes: Node[] = roadmap.items.map((item) => ({
      id: String(item.course.id),
      type: 'course',
      position: positions.get(item.course.id)!,
      data: {
        item,
        direction,
        dimmed: Boolean(related && !related.has(item.course.id)),
        highlighted: Boolean(related?.has(item.course.id)),
      } satisfies CourseNodeData,
      draggable: false,
      connectable: false,
    }));
    nodes.push({
      id: 'goal',
      type: 'goal',
      position: goal,
      data: { name: roadmap.career.name, icon: roadmap.career.icon, pct: roadmap.progress.pct, direction, pathName: roadmap.path.name } satisfies GoalNodeData,
      draggable: false,
      selectable: false,
    });

    const edgeStyle = (source: number, target: number | 'goal') => {
      const s = statusOf.get(source);
      const t = target === 'goal' ? undefined : statusOf.get(target);
      if (s === 'completed' && (t === 'completed' || t === undefined)) return { color: EDGE_COLORS.done, animated: false, dashed: false };
      if (t === 'current' || (s === 'current' && target === 'goal')) return { color: EDGE_COLORS.active, animated: true, dashed: false };
      if (t === 'locked' || t === undefined) return { color: EDGE_COLORS.locked, animated: false, dashed: true };
      return { color: EDGE_COLORS.open, animated: false, dashed: false };
    };

    const make = (source: number, target: number | 'goal'): Edge => {
      const st = edgeStyle(source, target);
      const inChain = related ? related.has(source) && (target === 'goal' || related.has(target)) : true;
      return {
        id: `${source}-${target}`,
        source: String(source),
        target: String(target),
        type: 'smoothstep',
        animated: st.animated,
        style: {
          stroke: st.color,
          strokeWidth: related && inChain ? 2.4 : 1.6,
          strokeDasharray: st.dashed ? '5 5' : undefined,
          opacity: related && !inChain ? 0.12 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: st.color, width: 16, height: 16 },
      };
    };

    const edges = [...roadmap.edges.map((e) => make(e.source, e.target)), ...sinks.map((s) => make(s, 'goal'))];
    return { nodes, edges };
  }, [roadmap, direction, hovered]);

  useEffect(() => {
    const t = window.setTimeout(() => fitView({ padding: 0.12, minZoom: 0.5, duration: 400 }), 50);
    return () => window.clearTimeout(t);
  }, [fitKey, direction, fitView]);

  return (
    <div className={clsx('relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.5 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => node.type === 'course' && onOpen?.(Number(node.id))}
        onNodeMouseEnter={(_, node) => node.type === 'course' && setHovered(Number(node.id))}
        onNodeMouseLeave={() => setHovered(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(255 255 255 / 0.07)" />
        <Controls showInteractive={false} position="bottom-left" />
        {minimap && (
          <MiniMap
            pannable
            zoomable
            className="!hidden md:!block"
            nodeColor={(n) => {
              if (n.type === 'goal') return '#8b5cf6';
              const s = (n.data as CourseNodeData).item.status;
              return s === 'completed' ? '#34d399' : s === 'current' ? '#22d3ee' : s === 'recommended' ? '#a78bfa' : '#334155';
            }}
            maskColor="rgb(5 9 20 / 0.7)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function RoadmapGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
