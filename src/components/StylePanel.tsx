import { Node } from '@/types/flowchart';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface StylePanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onClose: () => void;
}

export const StylePanel = ({ selectedNode, onNodeUpdate, onClose }: StylePanelProps) => {
  if (!selectedNode) return null;

  const colors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  return (
    <div className="absolute top-4 right-4 w-64 bg-background border rounded-lg shadow-lg p-4 z-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Style Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium">Text</Label>
          <Input
            value={selectedNode.text}
            onChange={(e) => onNodeUpdate(selectedNode.id, { text: e.target.value })}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium mb-2 block">Background Color</Label>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color,
                  borderColor: selectedNode.backgroundColor === color ? '#000' : '#e5e7eb'
                }}
                onClick={() => onNodeUpdate(selectedNode.id, { backgroundColor: color })}
              />
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-xs font-medium mb-2 block">Border Color</Label>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color,
                  borderColor: selectedNode.borderColor === color ? '#000' : '#e5e7eb'
                }}
                onClick={() => onNodeUpdate(selectedNode.id, { borderColor: color })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};