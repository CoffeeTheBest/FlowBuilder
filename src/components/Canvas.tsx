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
  zoomLevel: number;
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
  connectingFrom,
  zoomLevel
}: CanvasProps) => {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Listen for delete key to remove selected edge
  // Track if label is being edited
  const [editingLabelEdgeId, setEditingLabelEdgeId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState<string>('');
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
          const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
          const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
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
      const x = (e.clientX - rect.left - draggedNode.offset.x - panOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - draggedNode.offset.y - panOffset.y) / zoomLevel;
      onNodeUpdate(draggedNode.nodeId, { x, y }, false);
    }
  }, [isPanning, panStart, draggedNode, onNodeUpdate, panOffset, zoomLevel]);

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
        const offsetX = e.clientX - rect.left - (node.x * zoomLevel) - panOffset.x;
        const offsetY = e.clientY - rect.top - (node.y * zoomLevel) - panOffset.y;
        setDraggedNode({ nodeId, offset: { x: offsetX, y: offsetY } });
        setHasDragged(false);
        // Prevent panning while dragging nodes
        setIsPanning(false);
      }
    }
  }, [activeTool, nodes, panOffset, zoomLevel]);

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
    
    // Handle case where target is at center
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: cx, y: cy };
    }

    switch (node.type) {
      case 'circle':
      case 'pill': {
        const r = Math.min(node.width, node.height) / 2;
        const len = Math.sqrt(dx * dx + dy * dy);
        return { x: cx + (dx * r) / len, y: cy + (dy * r) / len };
      }

      case 'diamond': {
        // Diamond is a 45-degree rotated square
        // Transform the direction vector by -45 degrees to work in diamond's local space
        const cos45 = Math.cos(-Math.PI / 4);
        const sin45 = Math.sin(-Math.PI / 4);
        const localDx = dx * cos45 - dy * sin45;
        const localDy = dx * sin45 + dy * cos45;
        
        // Find intersection with square in local space
        const w = node.width / 2;
        const h = node.height / 2;
        let localTx, localTy;
        
        if (Math.abs(localDx / w) > Math.abs(localDy / h)) {
          localTx = localDx > 0 ? w : -w;
          localTy = (localDy / localDx) * localTx;
        } else {
          localTy = localDy > 0 ? h : -h;
          localTx = (localDx / localDy) * localTy;
        }
        
        // Transform back to world space by rotating 45 degrees
        const cos45Back = Math.cos(Math.PI / 4);
        const sin45Back = Math.sin(Math.PI / 4);
        const worldTx = localTx * cos45Back - localTy * sin45Back;
        const worldTy = localTx * sin45Back + localTy * cos45Back;
        
        return { x: cx + worldTx, y: cy + worldTy };
      }

      case 'triangle': {
        // Triangle: polygon(50% 0%, 100% 100%, 0% 100%)
        // Three vertices: top-center, bottom-right, bottom-left
        const w = node.width / 2;
        const h = node.height / 2;
        const vertices = [
          { x: 0, y: -h },      // Top center
          { x: w, y: h },       // Bottom right
          { x: -w, y: h }       // Bottom left
        ];
        return getPolygonBoundaryPoint(vertices, dx, dy, cx, cy);
      }

      case 'hexagon': {
        // Hexagon: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)
        const w = node.width / 2;
        const h = node.height / 2;
        const vertices = [
          { x: -w * 0.5, y: -h },    // 25% 0%
          { x: w * 0.5, y: -h },     // 75% 0%
          { x: w, y: 0 },            // 100% 50%
          { x: w * 0.5, y: h },      // 75% 100%
          { x: -w * 0.5, y: h },     // 25% 100%
          { x: -w, y: 0 }            // 0% 50%
        ];
        return getPolygonBoundaryPoint(vertices, dx, dy, cx, cy);
      }

      case 'trapezoid': {
        // Trapezoid: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)
        const w = node.width / 2;
        const h = node.height / 2;
        const vertices = [
          { x: -w * 0.6, y: -h },    // 20% 0%
          { x: w * 0.6, y: -h },     // 80% 0%
          { x: w, y: h },            // 100% 100%
          { x: -w, y: h }            // 0% 100%
        ];
        return getPolygonBoundaryPoint(vertices, dx, dy, cx, cy);
      }

      case 'star': {
        // Star: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)
        // Convert percentages to coordinates relative to center
        const w = node.width / 2;
        const h = node.height / 2;
        const vertices = [
          { x: 0, y: -h },                    // 50% 0% - top point
          { x: w * 0.22, y: -h * 0.3 },       // 61% 35%
          { x: w * 0.96, y: -h * 0.3 },       // 98% 35%
          { x: w * 0.36, y: h * 0.14 },       // 68% 57%
          { x: w * 0.58, y: h * 0.82 },       // 79% 91%
          { x: 0, y: h * 0.4 },               // 50% 70%
          { x: -w * 0.58, y: h * 0.82 },      // 21% 91%
          { x: -w * 0.36, y: h * 0.14 },      // 32% 57%
          { x: -w * 0.96, y: -h * 0.3 },      // 2% 35%
          { x: -w * 0.22, y: -h * 0.3 }       // 39% 35%
        ];
        return getPolygonBoundaryPoint(vertices, dx, dy, cx, cy);
      }

      case 'parallelogram': {
        // Parallelogram with skew(-20deg) - approximate as transformed rectangle
        const w = node.width / 2;
        const h = node.height / 2;
        const skewAngle = -20 * Math.PI / 180; // -20 degrees in radians
        
        // Apply inverse skew to the direction vector
        const skewedDx = dx - dy * Math.tan(skewAngle);
        const skewedDy = dy;
        
        // Find intersection with rectangle
        let tx, ty;
        if (Math.abs(skewedDx / w) > Math.abs(skewedDy / h)) {
          tx = skewedDx > 0 ? w : -w;
          ty = (skewedDy / skewedDx) * tx;
          if (Math.abs(ty) > h) {
            ty = skewedDy > 0 ? h : -h;
            tx = (skewedDx / skewedDy) * ty;
          }
        } else {
          ty = skewedDy > 0 ? h : -h;
          tx = (skewedDx / skewedDy) * ty;
          if (Math.abs(tx) > w) {
            tx = skewedDx > 0 ? w : -w;
            ty = (skewedDy / skewedDx) * tx;
          }
        }
        
        // Apply skew back to get the actual boundary point
        const finalTx = tx + ty * Math.tan(skewAngle);
        return { x: cx + finalTx, y: cy + ty };
      }

      case 'parallelogram-flip': {
        // Parallelogram with skew(20deg) - approximate as transformed rectangle
        const w = node.width / 2;
        const h = node.height / 2;
        const skewAngle = 20 * Math.PI / 180; // 20 degrees in radians
        
        // Apply inverse skew to the direction vector
        const skewedDx = dx - dy * Math.tan(skewAngle);
        const skewedDy = dy;
        
        // Find intersection with rectangle
        let tx, ty;
        if (Math.abs(skewedDx / w) > Math.abs(skewedDy / h)) {
          tx = skewedDx > 0 ? w : -w;
          ty = (skewedDy / skewedDx) * tx;
          if (Math.abs(ty) > h) {
            ty = skewedDy > 0 ? h : -h;
            tx = (skewedDx / skewedDy) * ty;
          }
        } else {
          ty = skewedDy > 0 ? h : -h;
          tx = (skewedDx / skewedDy) * ty;
          if (Math.abs(tx) > w) {
            tx = skewedDx > 0 ? w : -w;
            ty = (skewedDy / skewedDx) * tx;
          }
        }
        
        // Apply skew back to get the actual boundary point
        const finalTx = tx + ty * Math.tan(skewAngle);
        return { x: cx + finalTx, y: cy + ty };
      }

      case 'cylinder': {
        // Cylinder with borderRadius '50% / 20%' - approximate as ellipse
        const rx = node.width / 2;
        const ry = node.height / 2 * 0.8; // Slightly smaller due to curved ends
        const len = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
        return { x: cx + dx / len, y: cy + dy / len };
      }

      case 'cloud': {
        // Cloud - approximate as circle
        const r = Math.min(node.width, node.height) / 2 * 0.7;
        const len = Math.sqrt(dx * dx + dy * dy);
        return { x: cx + (dx * r) / len, y: cy + (dy * r) / len };
      }

      case 'actor': {
        // Actor (stick figure) - approximate as rectangle
        const w = node.width / 2 * 0.8;
        const h = node.height / 2;
        let tx, ty;
        if (Math.abs(dx / w) > Math.abs(dy / h)) {
          tx = dx > 0 ? w : -w;
          ty = (dy / dx) * tx;
          if (Math.abs(ty) > h) {
            ty = dy > 0 ? h : -h;
            tx = (dx / dy) * ty;
          }
        } else {
          ty = dy > 0 ? h : -h;
          tx = (dx / dy) * ty;
          if (Math.abs(tx) > w) {
            tx = dx > 0 ? w : -w;
            ty = (dy / dx) * tx;
          }
        }
        return { x: cx + tx, y: cy + ty };
      }

      default:
        // Rectangle, text, annotation, line, bracket and other rectangular shapes
        const w = node.width / 2;
        const h = node.height / 2;
        let tx, ty;
        if (Math.abs(dx / w) > Math.abs(dy / h)) {
          tx = dx > 0 ? w : -w;
          ty = (dy / dx) * tx;
          if (Math.abs(ty) > h) {
            ty = dy > 0 ? h : -h;
            tx = (dx / dy) * ty;
          }
        } else {
          ty = dy > 0 ? h : -h;
          tx = (dx / dy) * ty;
          if (Math.abs(tx) > w) {
            tx = dx > 0 ? w : -w;
            ty = (dy / dx) * tx;
          }
        }
        return { x: cx + tx, y: cy + ty };
    }
  }

  // Helper function for polygon boundary intersection
  function getPolygonBoundaryPoint(vertices, dx, dy, cx, cy) {
    // Normalize direction vector
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return { x: cx, y: cy };
    
    const normDx = dx / len;
    const normDy = dy / len;
    
    let closestIntersection = null;
    let closestDistance = Infinity;
    
    // Check intersection with each edge of the polygon
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      // Ray from origin (0,0) in direction (normDx, normDy): P = t * (normDx, normDy)
      // Edge from v1 to v2: P = v1 + s * (v2 - v1)
      // Solve: t * (normDx, normDy) = v1 + s * (v2 - v1)
      // Rearranging: t * normDx - s * (v2.x - v1.x) = v1.x
      //              t * normDy - s * (v2.y - v1.y) = v1.y
      
      const edgeDx = v2.x - v1.x;
      const edgeDy = v2.y - v1.y;
      
      // Matrix form: [normDx, -edgeDx] [t] = [v1.x]
      //              [normDy, -edgeDy] [s]   [v1.y]
      const det = normDx * (-edgeDy) - normDy * (-edgeDx);
      const det2 = normDx * edgeDy - normDy * edgeDx;
      
      if (Math.abs(det2) > 0.001) { // Not parallel
        const t = (v1.x * edgeDy - v1.y * edgeDx) / det2;
        const s = (v1.x * normDy - v1.y * normDx) / det2;
        
        // Check if intersection is on the edge (0 <= s <= 1) and in the right direction (t > 0)
        if (s >= 0 && s <= 1 && t > 0.001 && t < closestDistance) {
          closestDistance = t;
          closestIntersection = {
            x: t * normDx,
            y: t * normDy
          };
        }
      }
    }
    
    if (closestIntersection) {
      return { x: cx + closestIntersection.x, y: cy + closestIntersection.y };
    }
    
    // Fallback to circle approximation if no intersection found
    const r = Math.min(50, Math.min(Math.abs(dx), Math.abs(dy)) * 0.8);
    return { x: cx + (dx * r) / len, y: cy + (dy * r) / len };
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
            {isEditingLabel ? (
              <input
                type="text"
                value={editingLabelText}
                onChange={e => setEditingLabelText(e.target.value)}
                onBlur={() => {
                  setEditingLabelEdgeId(null);
                  handleEdgeLabelChange(edge.id, editingLabelText);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setEditingLabelEdgeId(null);
                    handleEdgeLabelChange(edge.id, editingLabelText);
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingLabelEdgeId(null);
                    setEditingLabelText(label);
                  }
                }}
                autoFocus
                style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 14,
                  width: 60,
                  height: 32,
                  margin: 'auto',
                  outline: 'none',
                  boxShadow: '0 0 0 2px #f59e0b'
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
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
                  cursor: 'pointer',
                  boxShadow: selectedEdgeId === edge.id ? '0 0 0 2px #f59e0b' : undefined
                }}
                onClick={e => {
                  handleEdgeClick(e, edge.id);
                  if (selectedEdgeId === edge.id) {
                    setEditingLabelEdgeId(edge.id);
                    setEditingLabelText(label);
                  }
                }}
                onMouseEnter={handleEdgeMouseEnter}
                onMouseLeave={handleEdgeMouseLeave}
              >
                {label || 'Label'}
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
            )}
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
        backgroundSize: `${20 * zoomLevel}px ${20 * zoomLevel}px, ${20 * zoomLevel}px ${20 * zoomLevel}px, ${100 * zoomLevel}px ${100 * zoomLevel}px, ${100 * zoomLevel}px ${100 * zoomLevel}px`,
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
      
      {/* Zoomable content container */}
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: '0 0',
          width: `${100 / zoomLevel}%`,
          height: `${100 / zoomLevel}%`,
        }}
      >
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
      </div>

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