import { useRef, useState, useCallback, useEffect } from 'react';
import { Node, Edge, Tool } from '@/types/flowchart';
import { FlowchartNode } from './FlowchartNode';

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  activeTool: Tool;
  selectedNodeId: string | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeClick: (nodeId: string) => void;
  connectingFrom: string | null;
}

export const Canvas = ({
  nodes,
  edges,
  activeTool,
  selectedNodeId,
  onNodeUpdate,
  onNodeSelect,
  onCanvasClick,
  onNodeClick,
  connectingFrom
}: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      e.preventDefault();
      if (e.button === 0) { // Left click
        if (activeTool !== 'select' && activeTool !== 'connect') {
          const rect = canvasRef.current!.getBoundingClientRect();
          const x = e.clientX - rect.left - panOffset.x;
          const y = e.clientY - rect.top - panOffset.y;
          onCanvasClick(x, y);
        } else {
          onNodeSelect(null);
        }
      }
    }
    
    if (isPanning) {
      setPanStart({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'grabbing';
    }
  }, [activeTool, onCanvasClick, onNodeSelect, panOffset, isPanning]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !isPanning) {
      e.preventDefault();
      setIsPanning(true);
      document.body.style.cursor = 'grab';
    }
  }, [isPanning]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
    
    if (draggedNode) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left - draggedNode.offset.x - panOffset.x;
      const y = e.clientY - rect.top - draggedNode.offset.y - panOffset.y;
      onNodeUpdate(draggedNode.nodeId, { x: Math.max(0, x), y: Math.max(0, y) });
    }
  }, [isPanning, panStart, draggedNode, onNodeUpdate, panOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggedNode(null);
    if (isPanning) {
      document.body.style.cursor = 'grab';
    }
  }, [isPanning]);

  const startNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - node.x - panOffset.x;
        const offsetY = e.clientY - rect.top - node.y - panOffset.y;
        setDraggedNode({ nodeId, offset: { x: offsetX, y: offsetY } });
      }
    }
  }, [activeTool, nodes, panOffset]);

  // Event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleCanvasMouseUp]);

  const renderEdge = (edge: Edge) => {
    const fromNode = nodes.find(n => n.id === edge.fromNodeId);
    const toNode = nodes.find(n => n.id === edge.toNodeId);
    
    if (!fromNode || !toNode) return null;

    const fromX = fromNode.x + fromNode.width / 2 + panOffset.x;
    const fromY = fromNode.y + fromNode.height / 2 + panOffset.y;
    const toX = toNode.x + toNode.width / 2 + panOffset.x;
    const toY = toNode.y + toNode.height / 2 + panOffset.y;

    return (
      <line
        key={edge.id}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="hsl(var(--border))"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 relative overflow-hidden bg-background"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        cursor: isPanning ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair'
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Grid pattern */}
      
      {/* SVG for edges */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--border))"
            />
          </marker>
        </defs>
        {edges.map(renderEdge)}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <FlowchartNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isConnecting={connectingFrom === node.id}
          panOffset={panOffset}
          onMouseDown={(e) => startNodeDrag(node.id, e)}
          onClick={() => onNodeClick(node.id)}
          onTextChange={(text) => onNodeUpdate(node.id, { text })}
        />
      ))}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">Start creating your flowchart</h3>
            <p className="text-sm">Select a shape from the toolbar and click anywhere to add it</p>
          </div>
        </div>
      )}
    </div>
  );
};