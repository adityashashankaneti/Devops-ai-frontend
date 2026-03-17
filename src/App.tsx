import { useCallback, useState, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import TopNav from './components/TopNav';
import LeftSidebar from './components/LeftSidebar';
import ArchitectureCanvas, { updateCanvasNodeConfig, placeResourceOnCanvas } from './components/ArchitectureCanvas';
import ChatbotView from './components/ChatbotView';
import PropertiesPanel from './components/PropertiesPanel';
import DeployBar from './components/DeployBar';
import { AppMode, AWSResource, ConnectorType, DeployedNodeInfo } from './types';
import { DeployedNodesContext } from './contexts/DeployedNodesContext';

const DEPLOYED_NODES_KEY = 'devops-deployed-nodes';

function loadDeployedNodes(): Record<string, DeployedNodeInfo> {
  try {
    const raw = localStorage.getItem(DEPLOYED_NODES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDeployedNodes(nodes: Record<string, DeployedNodeInfo>) {
  try {
    localStorage.setItem(DEPLOYED_NODES_KEY, JSON.stringify(nodes));
  } catch { /* storage full */ }
}

/** Pending deploy batch: node IDs + their metadata, waiting for apply to confirm. */
interface PendingBatch {
  project: string;
  region: string;
  nodeIds: string[];
  nodeInfoMap: Record<string, { resourceType: string; resourceName: string }>;
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('architecture');
  const [connectorType, setConnectorType] = useState<ConnectorType>('default');
  const [selectedNode, setSelectedNode] = useState<Node<AWSResource> | null>(null);
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([]);

  // ── Deployed state ───────────────────────────────────────────────────────
  const [deployedNodes, setDeployedNodes] = useState<Record<string, DeployedNodeInfo>>(loadDeployedNodes);
  const [pendingBatch, setPendingBatch] = useState<PendingBatch | null>(null);

  const deployedNodeIds = useMemo(() => new Set(Object.keys(deployedNodes)), [deployedNodes]);

  // ── Callbacks for DeployBar ───────────────────────────────────────────────
  /** Called when the deploy button is clicked — captures only NEW (undeployed) nodes. */
  const handleDeployStarted = useCallback((project: string, region: string) => {
    const newNodes = canvasNodes.filter((n) => !deployedNodeIds.has(n.id));
    const nodeInfoMap: Record<string, { resourceType: string; resourceName: string }> = {};
    for (const node of newNodes) {
      nodeInfoMap[node.id] = {
        resourceType: (node.data as AWSResource).id,
        resourceName: ((node.data as AWSResource & { config?: Record<string, unknown> }).config?.name as string)
          || (node.data as AWSResource).name,
      };
    }
    setPendingBatch({
      project,
      region,
      nodeIds: newNodes.map((n) => n.id),
      nodeInfoMap,
    });
  }, [canvasNodes, deployedNodeIds]);

  /** Called when CI apply succeeds — promotes pending batch to deployed. */
  const handleApplySucceeded = useCallback(() => {
    if (!pendingBatch) return;
    setDeployedNodes((prev) => {
      const next = { ...prev };
      for (const nodeId of pendingBatch.nodeIds) {
        const info = pendingBatch.nodeInfoMap[nodeId];
        if (info) {
          next[nodeId] = { project: pendingBatch.project, region: pendingBatch.region, ...info };
        }
      }
      saveDeployedNodes(next);
      return next;
    });
    setPendingBatch(null);
  }, [pendingBatch]);

  // ── Callback for Import State ──────────────────────────────────────────────
  /** Called after Import State succeeds — marks all imported nodes as deployed (they're live in AWS). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImportSucceeded = useCallback((importedNodes: any[], project: string, region: string) => {
    setDeployedNodes((prev) => {
      const next = { ...prev };
      for (const node of importedNodes) {
        next[node.id] = {
          project,
          region,
          resourceType: node.data?.id ?? '',
          resourceName: (node.data?.config?.name as string) || node.data?.name || '',
        };
      }
      saveDeployedNodes(next);
      return next;
    });
  }, []);

  // ── Callback for PropertiesPanel ──────────────────────────────────────────
  /** Called when a destroy apply succeeds — removes node from deployed state + canvas. */
  const handleNodeDestroyed = useCallback((nodeId: string) => {
    setDeployedNodes((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      saveDeployedNodes(next);
      return next;
    });
    // Remove node from canvas via custom event (ArchitectureCanvas listens)
    window.dispatchEvent(new CustomEvent('delete-canvas-node', { detail: { nodeId } }));
    setSelectedNode(null);
  }, []);

  // ── Standard canvas callbacks ─────────────────────────────────────────────
  const handleResourceDragStart = useCallback((e: React.DragEvent, resource: AWSResource) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(resource));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleNodeSelect = useCallback((node: Node<AWSResource> | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, config } } : prev,
      );
      updateCanvasNodeConfig(nodeId, config);
    },
    [],
  );

  const handleCanvasStateChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setCanvasNodes(nodes);
    setCanvasEdges(edges);
  }, []);

  return (
    <DeployedNodesContext.Provider value={deployedNodeIds}>
      <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
        <TopNav mode={mode} onModeChange={setMode} />
        <div className="flex flex-1 overflow-hidden relative">
          <LeftSidebar
            onResourceDragStart={handleResourceDragStart}
            onResourceClick={placeResourceOnCanvas}
            connectorType={connectorType}
            onConnectorChange={setConnectorType}
          />
          <main className="flex-1 overflow-hidden relative">
            {mode === 'architecture' ? (
              <ArchitectureCanvas
                connectorType={connectorType}
                onNodeSelect={handleNodeSelect}
                onStateChange={handleCanvasStateChange}
                deployedNodeIds={deployedNodeIds}
              />
            ) : (
              <ChatbotView />
            )}

            {mode === 'architecture' && (
              <DeployBar
                nodes={canvasNodes}
                edges={canvasEdges}
                deployedNodeIds={deployedNodeIds}
                onDeployStarted={handleDeployStarted}
                onApplySucceeded={handleApplySucceeded}
                onImportSucceeded={handleImportSucceeded}
              />
            )}
          </main>

          {mode === 'architecture' && selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleNodeUpdate}
              deployedNodeInfo={deployedNodes[selectedNode.id]}
              onNodeDestroyed={handleNodeDestroyed}
              allDeployedNodes={deployedNodes}
            />
          )}
        </div>
      </div>
    </DeployedNodesContext.Provider>
  );
}
