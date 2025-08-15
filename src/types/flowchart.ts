export interface Node {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  backgroundColor: string;
  borderColor: string;
}

export interface Edge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
}

export interface FlowchartState {
  nodes: Node[];
  edges: Edge[];
}

export type Tool = 'select' | 'rectangle' | 'circle' | 'diamond' | 'text' | 'connect';