export interface Node {
  id: string;
  type: Tool;
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

export type Tool =
  | 'select'
  | 'rectangle'
  | 'pill'
  | 'circle'
  | 'diamond'
  | 'parallelogram'
  | 'parallelogram-flip'
  | 'trapezoid'
  | 'triangle'
  | 'hexagon'
  | 'cylinder'
  | 'actor'
  | 'annotation'
  | 'line'
  | 'bracket'
  | 'cloud'
  | 'star'
  | 'text'
  | 'connect';