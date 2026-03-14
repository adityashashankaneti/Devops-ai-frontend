import { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  MarkerType,
  NodeMouseHandler,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MousePointer2, Layers, AlertCircle } from 'lucide-react';
import AWSNode from './nodes/AWSNode';
import ContainerNode from './nodes/ContainerNode';
import Route53Node from './nodes/Route53Node';
import { AWSResource, ConnectorType } from '../types';
import { getPlacementError, getStandalonePlacementError } from '../data/placementRules';

const nodeTypes = {
  awsNode: AWSNode,
  containerNode: ContainerNode,
  route53Node: Route53Node,
};

const STORAGE_KEY = 'devops-canvas-state';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

function loadSavedState(): { nodes: Node[]; edges: Edge[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.nodes && parsed.edges) return parsed;
  } catch { /* ignore corrupt data */ }
  return null;
}

function syncNodeIdCounter(nodes: Node[]) {
  let max = 0;
  for (const n of nodes) {
    const match = n.id.match(/^node_(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  nodeId = max + 1;
}

function resolveNodeType(resource: AWSResource): string {
  if (resource.nodeType === 'container') return 'containerNode';
  if (resource.id === 'route53' || resource.nodeType === 'expandable') return 'route53Node';
  return 'awsNode';
}

function edgeOptions(type: ConnectorType) {
  switch (type) {
    case 'dashed':
      return { style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '7 4' }, animated: false, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } };
    case 'thick':
      return { style: { stroke: '#6366f1', strokeWidth: 4 }, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } };
    case 'bidirectional':
      return { style: { stroke: '#10b981', strokeWidth: 2 }, animated: false, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }, markerStart: { type: MarkerType.ArrowClosed, color: '#10b981' } };
    default:
      return { style: { stroke: '#6366f1', strokeWidth: 2 }, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } };
  }
}

interface Props {
  connectorType: ConnectorType;
  onNodeSelect: (node: Node<AWSResource> | null) => void;
  onStateChange?: (nodes: Node[], edges: Edge[]) => void;
}

export default function ArchitectureCanvas({ connectorType, onNodeSelect, onStateChange }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const savedState = useRef(loadSavedState());
  const initialNodes = savedState.current?.nodes ?? [];
  const initialEdges = savedState.current?.edges ?? [];
  if (savedState.current) { syncNodeIdCounter(initialNodes); savedState.current = null; }

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const undoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const redoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const isUndoRedoing = useRef(false);

  const pushHistory = useCallback(() => {
    if (isUndoRedoing.current) return;
    undoStack.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (undoStack.current.length > 60) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    isUndoRedoing.current = true;
    redoStack.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const prev = undoStack.current.pop()!;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    requestAnimationFrame(() => { isUndoRedoing.current = false; });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    isUndoRedoing.current = true;
    undoStack.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const next = redoStack.current.pop()!;
    setNodes(next.nodes);
    setEdges(next.edges);
    requestAnimationFrame(() => { isUndoRedoing.current = false; });
  }, [setNodes, setEdges]);

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // Intercept delete changes to push history before they're applied
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (changes.some((c) => c.type === 'remove')) pushHistory();
    onNodesChange(changes);
  }, [onNodesChange, pushHistory]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (changes.some((c) => c.type === 'remove')) pushHistory();
    onEdgesChange(changes);
  }, [onEdgesChange, pushHistory]);

  // Persist to localStorage
  const saveToStorage = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } catch { /* storage full — silently fail */ }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  }, [nodes, edges]);

  // Track whether the canvas has ever been populated (to distinguish "user cleared" from "initial empty mount")
  const hasBeenPopulated = useRef(initialNodes.length > 0);
  useEffect(() => {
    if (nodes.length > 0) hasBeenPopulated.current = true;
  }, [nodes.length]);

  // Auto-save on changes (debounced 1s)
  // Skip only on the initial empty mount, not when the user deliberately clears the canvas.
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0 && !hasBeenPopulated.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToStorage(), 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [nodes, edges, saveToStorage]);

  // Expose current nodes/edges to parent for deploy bar
  useEffect(() => {
    onStateChange?.(nodes, edges);
  }, [nodes, edges, onStateChange]);

  // Expose manual save via custom event
  useEffect(() => {
    const handler = () => saveToStorage();
    window.addEventListener('canvas-save' as never, handler as EventListener);
    return () => window.removeEventListener('canvas-save' as never, handler as EventListener);
  }, [saveToStorage]);

  // Expose save status via custom event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-save-status', { detail: saveStatus }));
  }, [saveStatus]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const currentEdgeOpts = edgeOptions(connectorType);
  // Keep a ref so onConnectEnd can read the latest value without stale closure
  const currentEdgeOptsRef = useRef(currentEdgeOpts);
  useEffect(() => { currentEdgeOptsRef.current = currentEdgeOpts; }, [currentEdgeOpts]);

  // Track whether onConnect already handled this drag (to avoid double-creating in onConnectEnd)
  const connectionHandled = useRef(false);
  // Track source node of an in-progress connection drag
  const connectSourceId = useRef<string | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      connectionHandled.current = true;
      pushHistory();
      setEdges((eds) => addEdge({ ...params, ...currentEdgeOpts }, eds));
    },
    [setEdges, currentEdgeOpts, pushHistory],
  );

  const onConnectStart = useCallback((_: unknown, params: { nodeId?: string | null }) => {
    connectSourceId.current = params.nodeId ?? null;
    connectionHandled.current = false;
  }, []);

  // When user drops a connection on the BODY of a node (not on a specific handle),
  // auto-create the edge so connecting works from anywhere → anywhere.
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (connectionHandled.current) { connectionHandled.current = false; return; }
    if (!connectSourceId.current) return;

    const clientX = event instanceof TouchEvent ? event.changedTouches[0].clientX : (event as MouseEvent).clientX;
    const clientY = event instanceof TouchEvent ? event.changedTouches[0].clientY : (event as MouseEvent).clientY;
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return;

    // Ignore if released on a handle — ReactFlow would have fired onConnect in that case
    if (el.closest('.react-flow__handle')) return;

    const nodeEl = el.closest('.react-flow__node');
    if (!nodeEl) return;

    const targetNodeId = nodeEl.getAttribute('data-id');
    if (!targetNodeId || targetNodeId === connectSourceId.current) return;

    pushHistory();
    setEdges((eds) => addEdge({
      id: `e_${Date.now()}`,
      source: connectSourceId.current!,
      target: targetNodeId,
      ...currentEdgeOptsRef.current,
    }, eds));
    connectSourceId.current = null;
  }, [setEdges, pushHistory]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!wrapper.current || !rfInstance) return;
      const raw = e.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      const resource: AWSResource = JSON.parse(raw);
      const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const type = resolveNodeType(resource);

      // Find the innermost container at the drop position.
      // Child nodes have positions relative to their parent, so we must compute absolute positions.
      const getAbsolutePosition = (node: Node) => {
        let x = node.position.x;
        let y = node.position.y;
        let parentId = node.parentNode;
        while (parentId) {
          const parent = nodes.find((n) => n.id === parentId);
          if (!parent) break;
          x += parent.position.x;
          y += parent.position.y;
          parentId = parent.parentNode;
        }
        return { x, y };
      };

      // Collect all containers that contain the drop point, pick the smallest (innermost)
      const matchingContainers = nodes
        .filter((n) => {
          if (n.type !== 'containerNode') return false;
          const abs = getAbsolutePosition(n);
          const w = (n.style?.width as number) ?? 320;
          const h = (n.style?.height as number) ?? 200;
          return flowPos.x >= abs.x && flowPos.x <= abs.x + w &&
                 flowPos.y >= abs.y && flowPos.y <= abs.y + h;
        })
        .sort((a, b) => {
          const areaA = ((a.style?.width as number) ?? 320) * ((a.style?.height as number) ?? 200);
          const areaB = ((b.style?.width as number) ?? 320) * ((b.style?.height as number) ?? 200);
          return areaA - areaB; // smallest first = innermost
        });

      const container = matchingContainers[0] ?? null;

      if (container) {
        const containerResource = container.data as AWSResource;
        const err = getPlacementError(resource, containerResource);
        if (err) { showToast(err); return; }

        // Warn (non-blocking) when an internet-facing load balancer lands in a private subnet
        if (
          (resource.id === 'alb' || resource.id === 'nlb') &&
          containerResource.id === 'subnet-private'
        ) {
          showToast(`⚠️ ${resource.name} is internet-facing by default — place in a Public Subnet unless you set internal: true.`);
        }

        pushHistory();

        const absPos = getAbsolutePosition(container);

        if (type === 'containerNode') {
          setNodes((nds) => nds.concat({
            id: getId(), type: 'containerNode',
            position: { x: flowPos.x - absPos.x - 60, y: flowPos.y - absPos.y - 40 },
            data: { ...resource, config: {} },
            style: { width: 280, height: 180 },
            parentNode: container.id,
            extent: 'parent' as const,
            zIndex: -1,
          }));
        } else {
          setNodes((nds) => nds.concat({
            id: getId(), type,
            position: { x: flowPos.x - absPos.x - 50, y: flowPos.y - absPos.y - 50 },
            data: { ...resource, config: {} },
            parentNode: container.id,
            extent: 'parent' as const,
          }));
        }
      } else {
        // Standalone placement — validate
        const standaloneErr = getStandalonePlacementError(resource);
        if (standaloneErr) { showToast(standaloneErr); return; }
        pushHistory();

        if (type === 'containerNode') {
          setNodes((nds) => nds.concat({
            id: getId(), type: 'containerNode',
            position: { x: flowPos.x - 160, y: flowPos.y - 80 },
            data: { ...resource, config: {} },
            style: { width: 320, height: 200 },
            zIndex: -1,
          }));
        } else {
          setNodes((nds) => nds.concat({
            id: getId(), type,
            position: { x: flowPos.x - 50, y: flowPos.y - 50 },
            data: { ...resource, config: {} },
          }));
        }
      }
    },
    [rfInstance, nodes, setNodes],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => onNodeSelect(node as Node<AWSResource>),
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => onNodeSelect(null), [onNodeSelect]);

  // Update node config from properties panel or from node-internal state (e.g. Route53Node)
  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
        ),
      );
    },
    [setNodes],
  );

  // Expose updateNodeConfig via custom event
  useEffect(() => {
    const handler = (e: CustomEvent) => updateNodeConfig(e.detail.id, e.detail.config);
    window.addEventListener('update-node-config' as never, handler as EventListener);
    return () => window.removeEventListener('update-node-config' as never, handler as EventListener);
  }, [updateNodeConfig]);

  // Load imported canvas state (replaces current nodes/edges)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { nodes: newNodes, edges: newEdges } = e.detail;
      pushHistory();
      syncNodeIdCounter(newNodes);
      setNodes(newNodes);
      setEdges(newEdges);
    };
    window.addEventListener('load-canvas' as never, handler as EventListener);
    return () => window.removeEventListener('load-canvas' as never, handler as EventListener);
  }, [setNodes, setEdges, pushHistory]);

  // Click-to-place: add resource at canvas center
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const resource: AWSResource = e.detail.resource;
      if (!wrapper.current || !rfInstance) return;

      // Click-to-place: validate standalone placement
      const standaloneErr = getStandalonePlacementError(resource);
      if (standaloneErr) { showToast(standaloneErr); return; }

      const rect = wrapper.current.getBoundingClientRect();
      // Offset each click slightly so stacked items don't perfectly overlap
      const jitter = () => (Math.random() - 0.5) * 60;
      const position = rfInstance.screenToFlowPosition({
        x: rect.left + rect.width / 2 + jitter(),
        y: rect.top + rect.height / 2 + jitter(),
      });
      const type = resolveNodeType(resource);
      const newNode: Node =
        type === 'containerNode'
          ? { id: getId(), type, position: { x: position.x - 160, y: position.y - 80 }, data: { ...resource, config: {} }, style: { width: 320, height: 200 }, zIndex: -1 }
          : { id: getId(), type, position: { x: position.x - 50, y: position.y - 50 }, data: { ...resource, config: {} } };
      pushHistory();
      setNodes((nds) => nds.concat(newNode));
    };
    window.addEventListener('place-resource' as never, handler as EventListener);
    return () => window.removeEventListener('place-resource' as never, handler as EventListener);
  }, [rfInstance, setNodes]);

  const isEmpty = nodes.length === 0;

  return (
    <div ref={wrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        connectionMode={ConnectionMode.Loose}
        className="bg-slate-950"
        defaultEdgeOptions={currentEdgeOpts}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
      >
        <Controls className="!bg-slate-800 !border-slate-700 !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700" />
        <MiniMap
          className="!bg-slate-900 !border-slate-700 !rounded-xl"
          nodeColor={(n) => (n.data as AWSResource).color ?? '#6366f1'}
          maskColor="rgba(2, 6, 23, 0.8)"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
      </ReactFlow>

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              <Layers size={28} className="text-slate-600" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Drag AWS resources onto the canvas</p>
              <p className="text-slate-600 text-xs flex items-center gap-1.5 justify-center">
                <MousePointer2 size={11} />
                VPC / Subnets = resizable containers · Click any node to edit properties
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Placement error toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-red-950/95 border border-red-700/60 text-red-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl max-w-sm text-center">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          {toast}
        </div>
      )}

    </div>
  );
}

export function updateCanvasNodeConfig(id: string, config: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('update-node-config', { detail: { id, config } }));
}

export function placeResourceOnCanvas(resource: AWSResource) {
  window.dispatchEvent(new CustomEvent('place-resource', { detail: { resource } }));
}

export function loadCanvasFromImport(nodes: Node[], edges: Edge[]) {
  window.dispatchEvent(new CustomEvent('load-canvas', { detail: { nodes, edges } }));
}
