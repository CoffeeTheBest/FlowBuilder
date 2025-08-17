import { Node } from '@/types/flowchart';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface StylePanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onClose: () => void;
  floating?: boolean;
  panOffset?: { x: number; y: number };
}

export const StylePanel = ({ selectedNode, onNodeUpdate, onClose, floating, panOffset }: StylePanelProps) => {
  if (!selectedNode) return null;

  const colors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Floating panel position
  let panelStyle: React.CSSProperties = {};
  if (floating && panOffset) {
    const panelHeight = 44; // px, adjust as needed
    const panelWidth = 260; // px, adjust as needed
    const left = selectedNode.x + (selectedNode.width / 2) + panOffset.x - (panelWidth / 2);
    const top = selectedNode.y + panOffset.y - panelHeight - 5;
    panelStyle = {
      position: 'absolute',
      left,
      top,
      width: panelWidth,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      borderRadius: 8,
      background: 'white',
      border: '1px solid #e5e7eb',
      padding: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: panelHeight,
    };
  }

  return (
  <div className={floating ? '' : 'absolute top-4 right-4 w-64 bg-background border rounded-lg shadow-lg p-4'} style={floating ? panelStyle : { zIndex: 9999, border: '2px solid red' }}>
      {/* Horizontal bar for floating mode */}
      {floating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <Input
            value={selectedNode.text}
            onChange={(e) => onNodeUpdate(selectedNode.id, { text: e.target.value })}
            className="w-24 text-xs px-2 py-1 border rounded"
            style={{ minWidth: 60, maxWidth: 100 }}
          />
          <div className="flex gap-1 items-center">
            {colors.map((color) => (
              <button
                key={color}
                className="w-5 h-5 rounded border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: color, borderColor: selectedNode.backgroundColor === color ? '#000' : '#e5e7eb' }}
                title={color}
                onClick={() => onNodeUpdate(selectedNode.id, { backgroundColor: color })}
              />
            ))}
          </div>
          <div className="flex gap-1 items-center">
            {colors.map((color) => (
              <button
                key={color}
                className="w-5 h-5 rounded border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: color, borderColor: selectedNode.borderColor === color ? '#000' : '#e5e7eb' }}
                title={color}
                onClick={() => onNodeUpdate(selectedNode.id, { borderColor: color })}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ marginLeft: 4, fontSize: 18, lineHeight: 1 }}>×</Button>
        </div>
      ) : (
        <>
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
                    style={{ backgroundColor: color, borderColor: selectedNode.backgroundColor === color ? '#000' : '#e5e7eb' }}
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
                    style={{ backgroundColor: color, borderColor: selectedNode.borderColor === color ? '#000' : '#e5e7eb' }}
                    onClick={() => onNodeUpdate(selectedNode.id, { borderColor: color })}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};