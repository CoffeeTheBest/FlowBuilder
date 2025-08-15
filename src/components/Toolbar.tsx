import { MousePointer, Square, Circle, Diamond, Type, GitBranch, Undo, Redo } from 'lucide-react';
import { Button } from './ui/button';
import { Tool } from '@/types/flowchart';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar = ({ activeTool, onToolChange, onUndo, onRedo, canUndo, canRedo }: ToolbarProps) => {
  const tools = [
    { id: 'select' as Tool, icon: MousePointer, label: 'Select' },
    { id: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as Tool, icon: Circle, label: 'Circle' },
    { id: 'diamond' as Tool, icon: Diamond, label: 'Diamond' },
    { id: 'text' as Tool, icon: Type, label: 'Text' },
    { id: 'connect' as Tool, icon: GitBranch, label: 'Connect' },
  ];

  return (
    <div className="h-14 border-b bg-background flex items-center px-4 gap-2">
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              console.log('[DEBUG] Tool clicked:', tool.id);
              onToolChange(tool.id);
            }}
            className={`h-8 w-8 p-0${activeTool === tool.id ? ' ring-2 ring-blue-500' : ''}`}
            aria-pressed={activeTool === tool.id}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      
      <div className="ml-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};