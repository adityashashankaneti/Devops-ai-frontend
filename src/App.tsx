import { useCallback, useState } from 'react';
import { Node, Edge } from 'reactflow';
import TopNav from './components/TopNav';
import LeftSidebar from './components/LeftSidebar';
import ArchitectureCanvas, { updateCanvasNodeConfig, placeResourceOnCanvas } from './components/ArchitectureCanvas';
import ChatbotView from './components/ChatbotView';
import PropertiesPanel from './components/PropertiesPanel';
import DeployBar from './components/DeployBar';
import { AppMode, AWSResource, ConnectorType } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('architecture');
  const [connectorType, setConnectorType] = useState<ConnectorType>('default');
  const [selectedNode, setSelectedNode] = useState<Node<AWSResource> | null>(null);
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([]);

  const handleResourceDragStart = useCallback((e: React.DragEvent, resource: AWSResource) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(resource));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleNodeSelect = useCallback((node: Node<AWSResource> | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, config: Record<string, string | boolean | number>) => {
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
            />
          ) : (
            <ChatbotView />
          )}

          {/* Deploy bar at the bottom of the canvas */}
          {mode === 'architecture' && (
            <DeployBar nodes={canvasNodes} edges={canvasEdges} />
          )}
        </main>

        {mode === 'architecture' && selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
          />
        )}
      </div>
    </div>
  );
}
