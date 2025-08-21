import { useRef, useState, useCallback, useEffect } from 'react';
import type { Node, Edge, Tool } from '@/types/flowchart';
import { FlowchartNode } from './FlowchartNode';

type CanvasProps = {
  nodes: Node[];
  edges: Edge[];
  activeTool: Tool;
  selectedNodeId: string | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>, pushToHistory?: boolean) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeClick: (nodeId: string) => void;
  connectingFrom: string | null;
};

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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Listen for delete key to remove selected edge
  // Track if label is being edited
  const [editingLabelEdgeId, setEditingLabelEdgeId] = useState<string | null>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent edge deletion if editing label
      if (editingLabelEdgeId) return;
      // Escape unselects edge or node
      if (e.key === 'Escape') {
        setSelectedEdgeId(null);
        onNodeSelect(null);
        return;
      }
      // Delete/Backspace deletes selected edge only
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        // Remove edge from edges array
        const newEdges = edges.filter(edge => edge.id !== selectedEdgeId);
        const event = new CustomEvent('deleteEdge', { detail: { edgeId: selectedEdgeId, newEdges } });
        window.dispatchEvent(event);
        setSelectedEdgeId(null);
        return;
      }
      // (No node deletion by keyboard)
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, edges, editingLabelEdgeId, onNodeSelect]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    
    // Allow shape adding if clicking on the canvas or the SVG overlay
    const isCanvasOrSvg =
      e.target === canvasRef.current ||
      (e.target instanceof SVGSVGElement && e.target.classList.contains('pointer-events-auto'));
    if (isCanvasOrSvg) {
      e.preventDefault();
      if (e.button === 0) { // Left click
        if (activeTool !== 'select' && activeTool !== 'connect') {
          const rect = canvasRef.current!.getBoundingClientRect();
          const x = e.clientX - rect.left - panOffset.x;
          const y = e.clientY - rect.top - panOffset.y;
          onCanvasClick(x, y);
        } else if (!isOverInteractive) {
          onNodeSelect(null);
          // Start panning if not over interactive elements
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          document.body.style.cursor = 'grabbing';
        }
      }
    }
  }, [activeTool, onCanvasClick, onNodeSelect, panOffset, isOverInteractive]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      if (e.buttons !== 1) return; // Only pan while mouse is down
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setPanStart({ x: e.clientX, y: e.clientY });
      setDraggedNode(null); // Prevent node drag while panning
      return;
    }
    if (draggedNode) {
      if (e.buttons !== 1) return; // Only drag while mouse is down
      setHasDragged(true);
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left - draggedNode.offset.x - panOffset.x;
      const y = e.clientY - rect.top - draggedNode.offset.y - panOffset.y;
      onNodeUpdate(draggedNode.nodeId, { x, y }, false);
    }
  }, [isPanning, panStart, draggedNode, onNodeUpdate, panOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    if (draggedNode && hasDragged) {
      // Push to history only if node was actually dragged
      onNodeUpdate(draggedNode.nodeId, {}, true);
    }
    setDraggedNode(null);
    setHasDragged(false);
    setIsPanning(false);
    document.body.style.cursor = isOverInteractive ? 'pointer' : 'default';
  }, [draggedNode, hasDragged, onNodeUpdate, isOverInteractive]);

  const startNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select' && e.button === 0) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - node.x - panOffset.x;
        const offsetY = e.clientY - rect.top - node.y - panOffset.y;
        setDraggedNode({ nodeId, offset: { x: offsetX, y: offsetY } });
        setHasDragged(false);
        // Prevent panning while dragging nodes
        setIsPanning(false);
      }
    }
  }, [activeTool, nodes, panOffset]);

  // Event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleMouseMove, handleCanvasMouseUp]);

  // Helper: get intersection point with node boundary
  function getBoundaryPoint(node, targetX, targetY) {
    const cx = node.x + node.width / 2 + panOffset.x;
    const cy = node.y + node.height / 2 + panOffset.y;
    const dx = targetX - cx;
    const dy = targetY - cy;
    if (node.type === 'circle') {
      const r = node.width / 2;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return { x: cx, y: cy };
      return { x: cx + (dx * r) / len, y: cy + (dy * r) / len };
    } else if (node.type === 'diamond') {
      // Diamond: rotated square, approximate as ellipse for intersection
      const w = node.width / 2, h = node.height / 2;
      const len = Math.sqrt((dx * dx) / (w * w) + (dy * dy) / (h * h));
      if (len === 0) return { x: cx, y: cy };
      return { x: cx + dx / len, y: cy + dy / len };
    } else {
      // Rectangle or text: clamp to edge
      const w = node.width / 2, h = node.height / 2;
      let tx = 0, ty = 0;
      if (Math.abs(dx / w) > Math.abs(dy / h)) {
        tx = dx > 0 ? w : -w;
        ty = (dy / dx) * tx;
        if (Math.abs(ty) > h) ty = dy > 0 ? h : -h, tx = (dx / dy) * ty;
      } else {
        ty = dy > 0 ? h : -h;
        tx = (dx / dy) * ty;
        if (Math.abs(tx) > w) tx = dx > 0 ? w : -w, ty = (dy / dx) * tx;
      }
      return { x: cx + tx, y: cy + ty };
    }
  }

  // Helper for edge label
  function getEdgeLabel(edge: Edge) {
    return edge.label || '';
  }

  // Helper for edge click
  function handleEdgeClick(e: React.MouseEvent, edgeId: string) {
    e.stopPropagation();
    setSelectedEdgeId(edgeId);
  }

  // Helper for edge hover
  function handleEdgeMouseEnter() {
    setIsOverInteractive(true);
  }

  function handleEdgeMouseLeave() {
    setIsOverInteractive(false);
  }

  // Helper for edge label editing
  function handleEdgeLabelChange(edgeId: string, label: string) {
    // Emit a custom event to parent to update edge label
    const event = new CustomEvent('editEdgeLabel', { detail: { edgeId, label } });
    window.dispatchEvent(event);
  }

  const renderEdge = (edge: Edge) => {
    const fromNode = nodes.find(n => n.id === edge.fromNodeId);
    const toNode = nodes.find(n => n.id === edge.toNodeId);
    if (!fromNode || !toNode) return null;
    const fromCenter = {
      x: fromNode.x + fromNode.width / 2 + panOffset.x,
      y: fromNode.y + fromNode.height / 2 + panOffset.y
    };
    const toCenter = {
      x: toNode.x + toNode.width / 2 + panOffset.x,
      y: toNode.y + toNode.height / 2 + panOffset.y
    };
    const start = getBoundaryPoint(fromNode, toCenter.x, toCenter.y);
    const end = getBoundaryPoint(toNode, fromCenter.x, fromCenter.y);

    // For label: find midpoint
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const label = getEdgeLabel(edge);
  let lineStart = start, lineEnd = end;
  const showLabelBox = !!label || selectedEdgeId === edge.id;
  const isEditingLabel = editingLabelEdgeId === edge.id;
  // Always draw the line from node boundary to node boundary, even with a label

    return (
      <g key={edge.id}>
        {/* Connector line */}
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke={selectedEdgeId === edge.id && !isEditingLabel ? "#f59e0b" : "#000"}
          strokeWidth={selectedEdgeId === edge.id && !isEditingLabel ? 4 : 2.5}
          markerEnd="url(#arrowhead)"
          style={{ cursor: 'pointer' }}
          onClick={e => handleEdgeClick(e, edge.id)}
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
        />
        {/* Edge label (always show box if selected) */}
        {showLabelBox && (
          <foreignObject
            x={mx - 30}
            y={my - 16}
            width={60}
            height={32}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                border: '1px solid #ddd',
                textAlign: 'center',
                fontSize: 14,
                lineHeight: '32px',
                width: 60,
                height: 32,
                margin: 'auto',
                userSelect: 'text',
                cursor: 'pointer',
                boxShadow: selectedEdgeId === edge.id ? '0 0 0 2px #f59e0b' : undefined
              }}
              contentEditable={selectedEdgeId === edge.id}
              suppressContentEditableWarning
              onClick={e => handleEdgeClick(e, edge.id)}
              onMouseEnter={handleEdgeMouseEnter}
              onMouseLeave={handleEdgeMouseLeave}
              onFocus={() => setEditingLabelEdgeId(edge.id)}
              onBlur={e => {
                setEditingLabelEdgeId(null);
                handleEdgeLabelChange(edge.id, e.currentTarget.textContent || '');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  (e.target as HTMLElement).blur();
                }
              }}
            >
              {label}
              {/* Delete button for edge label */}
              {selectedEdgeId === edge.id && !isEditingLabel && (
                <button
                  style={{
                    position: 'absolute',
                    right: -18,
                    top: 0,
                    width: 18,
                    height: 18,
                    background: 'transparent',
                    border: 'none',
                    color: '#f43f5e',
                    fontWeight: 'bold',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                  title="Delete edge"
                  onClick={e => {
                    e.stopPropagation();
                    const event = new CustomEvent('deleteEdge', { detail: { edgeId: edge.id } });
                    window.dispatchEvent(event);
                    setSelectedEdgeId(null);
                  }}
                >×</button>
              )}
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 overflow-hidden bg-background select-none${isPanning || draggedNode ? ' dragging' : ''}`}
      style={{
/* Prevent text selection while dragging or panning */
// Add this style to your global CSS or inside a <style> tag if using CSS-in-JS
// .dragging * { user-select: none !important; }
        backgroundImage: `
          linear-gradient(#e5e7eb 1px, transparent 1px),
          linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
          linear-gradient(#cbd5e1 2px, transparent 2px),
          linear-gradient(90deg, #cbd5e1 2px, transparent 2px)
        `,
        backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
        backgroundPosition: `
          ${panOffset.x}px ${panOffset.y}px,
          ${panOffset.x}px ${panOffset.y}px,
          ${panOffset.x}px ${panOffset.y}px,
          ${panOffset.x}px ${panOffset.y}px
        `,
        cursor: isPanning ? 'grabbing' : isOverInteractive ? 'pointer' : activeTool === 'select' ? 'grab' : 'crosshair',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        zIndex: 0
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Grid pattern */}
      
      {/* SVG for edges */}
      <svg
        className="absolute left-0 top-0 pointer-events-auto"
        width="100%"
        height="100%"
        style={{ zIndex: 1 }}
      >
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
              fill="#000"
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
          onMouseEnter={() => setIsOverInteractive(true)}
          onMouseLeave={() => setIsOverInteractive(false)}
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