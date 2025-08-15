import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, Tool, FlowchartState } from '@/types/flowchart';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { StylePanel } from '@/components/StylePanel';


const Index = () => {

  // ...existing code...


  // ...existing code...

  // ...existing code...
  // ...existing code...

  // ...existing code...



  // ...existing code...

  // ...existing code...

  // Place this useEffect after all state and function declarations, immediately before return
  
  const [state, setState] = useState<FlowchartState>({ nodes: [], edges: [] });
  const [history, setHistory] = useState<FlowchartState[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);


  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);



  const saveToHistory = useCallback((newState: FlowchartState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setState(newState);
  }, [history, historyIndex]);

  const createNode = useCallback((type: Exclude<Tool, 'select' | 'connect'>, x: number, y: number): Node => {
    const id = Date.now().toString();
    const baseNode = {
      id,
      type,
      x,
      y,
      text: type === 'text' ? 'Text' : `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb'
    };

    switch (type) {
      case 'rectangle':
        return { ...baseNode, width: 120, height: 60 };
      case 'circle':
        return { ...baseNode, width: 80, height: 80 };
      case 'diamond':
        return { ...baseNode, width: 100, height: 100 };
      case 'text':
        return { ...baseNode, width: 100, height: 40 };
      default:
        return { ...baseNode, width: 100, height: 60 };
    }
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (activeTool !== 'select' && activeTool !== 'connect') {
      const newNode = createNode(activeTool, x - 50, y - 30);
      const newState = { ...state, nodes: [...state.nodes, newNode] };
      saveToHistory(newState);
      setActiveTool('select');
    }
  }, [activeTool, createNode, state, saveToHistory]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (activeTool === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(nodeId);
      } else if (connectingFrom !== nodeId) {
        const newEdge: Edge = {
          id: Date.now().toString(),
          fromNodeId: connectingFrom,
          toNodeId: nodeId
        };
        const newState = { ...state, edges: [...state.edges, newEdge] };
        saveToHistory(newState);
        setConnectingFrom(null);
        setActiveTool('select');
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  }, [activeTool, connectingFrom, state, saveToHistory]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<Node>, pushToHistory: boolean = true) => {
    const newNodes = state.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    const newState = { ...state, nodes: newNodes };
    if (pushToHistory) {
      saveToHistory(newState);
    } else {
      setState(newState);
    }
  }, [state, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setState(history[historyIndex - 1]);
      setSelectedNodeId(null);
      setConnectingFrom(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setState(history[historyIndex + 1]);
      setSelectedNodeId(null);
      setConnectingFrom(null);
    }
  }, [historyIndex, history]);

  const selectedNode = selectedNodeId ? state.nodes.find(n => n.id === selectedNodeId) || null : null;
useEffect(() => {
    function handleDeleteNode(e: any) {
      const nodeId = e.detail?.nodeId;
      if (!nodeId) return;
      // Remove node and any connected edges
      const newNodes = state.nodes.filter(n => n.id !== nodeId);
      const newEdges = state.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
      const newState = { ...state, nodes: newNodes, edges: newEdges };
      saveToHistory(newState);
      setSelectedNodeId(null);
    }
    function handleDeleteEdge(e: any) {
      const edgeId = e.detail?.edgeId;
      if (!edgeId) return;
      const newEdges = state.edges.filter(edge => edge.id !== edgeId);
      const newState = { ...state, edges: newEdges };
      saveToHistory(newState);
    }
    function handleEditEdgeLabel(e: any) {
      const { edgeId, label } = e.detail || {};
      if (!edgeId) return;
      const newEdges = state.edges.map(edge => edge.id === edgeId ? { ...edge, label } : edge);
      const newState = { ...state, edges: newEdges };
      saveToHistory(newState);
    }
    window.addEventListener('deleteNode', handleDeleteNode);
    window.addEventListener('deleteEdge', handleDeleteEdge);
    window.addEventListener('editEdgeLabel', handleEditEdgeLabel);
    return () => {
      window.removeEventListener('deleteNode', handleDeleteNode);
      window.removeEventListener('deleteEdge', handleDeleteEdge);
      window.removeEventListener('editEdgeLabel', handleEditEdgeLabel);
    };
  }, [state, saveToHistory]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      <div className="flex-1 relative">
        <Canvas
          nodes={state.nodes}
          edges={state.edges}
          activeTool={activeTool}
          selectedNodeId={selectedNodeId}
          onNodeUpdate={handleNodeUpdate}
          onNodeSelect={setSelectedNodeId}
          onCanvasClick={handleCanvasClick}
          onNodeClick={handleNodeClick}
          connectingFrom={connectingFrom}
        />
        
        <StylePanel
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
};

export default Index;
