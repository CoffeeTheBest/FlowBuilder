// Import icons from lucide-react
import { MousePointer, GitBranch, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';
// Import Button component
import { Button } from './ui/button';
// Import Tool type
import { Tool } from '@/types/flowchart';
// Import DropdownMenu for shape selection
import * as DropdownMenu from './ui/dropdown-menu';
// Import ReactNode for icon typing
import { ReactNode } from 'react';

// Props for the Toolbar component
interface ToolbarProps {
  activeTool: Tool; // Currently selected tool
  onToolChange: (tool: Tool) => void; // Callback for changing tool
  onUndo: () => void; // Undo action
  onRedo: () => void; // Redo action
  canUndo: boolean; // Is undo available?
  canRedo: boolean; // Is redo available?
  zoomLevel: number; // Current zoom level
  onZoomIn: () => void; // Zoom in
  onZoomOut: () => void; // Zoom out
  onZoomReset: () => void; // Reset zoom
}

// Toolbar component renders the top bar with tool, shape, undo/redo, and zoom controls
export const Toolbar = ({ 
  activeTool, 
  onToolChange, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onZoomReset 
}: ToolbarProps) => {
  // List of available shapes for the shape dropdown
  const shapes: { id: Tool, label: string, icon: ReactNode }[] = [
    { id: 'rectangle', label: 'Rectangle', icon: <svg width="24" height="16"><rect x="2" y="2" width="20" height="12" rx="2" fill="#a5b4fc" stroke="#6366f1" strokeWidth="2"/></svg> },
    { id: 'pill', label: 'Pill', icon: <svg width="24" height="16"><rect x="2" y="2" width="20" height="12" rx="8" fill="#fbcfe8" stroke="#f43f5e" strokeWidth="2"/></svg> },
    { id: 'circle', label: 'Oval (Circle)', icon: <svg width="20" height="20"><ellipse cx="10" cy="10" rx="8" ry="8" fill="#f9a8d4" stroke="#be185d" strokeWidth="2"/></svg> },
    { id: 'diamond', label: 'Diamond', icon: <svg width="20" height="20"><polygon points="10,2 18,10 10,18 2,10" fill="#fef08a" stroke="#eab308" strokeWidth="2"/></svg> },
    { id: 'parallelogram', label: 'Parallelogram', icon: <svg width="24" height="16"><polygon points="6,2 22,2 18,14 2,14" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2"/></svg> },
    { id: 'parallelogram-flip', label: 'Flipped Parallelogram', icon: <svg width="24" height="16"><polygon points="2,2 18,2 22,14 6,14" fill="#fca5a5" stroke="#ef4444" strokeWidth="2"/></svg> },
    { id: 'trapezoid', label: 'Trapezoid', icon: <svg width="24" height="16"><polygon points="6,2 18,2 22,14 2,14" fill="#bbf7d0" stroke="#22c55e" strokeWidth="2"/></svg> },
    { id: 'triangle', label: 'Triangle', icon: <svg width="20" height="20"><polygon points="10,2 18,18 2,18" fill="#fcd34d" stroke="#f59e42" strokeWidth="2"/></svg> },
    { id: 'hexagon', label: 'Hexagon', icon: <svg width="24" height="20"><polygon points="6,2 18,2 22,10 18,18 6,18 2,10" fill="#a7f3d0" stroke="#059669" strokeWidth="2"/></svg> },
    { id: 'cylinder', label: 'Cylinder', icon: <svg width="20" height="20"><ellipse cx="10" cy="5" rx="8" ry="3" fill="#f3e8ff" stroke="#a21caf" strokeWidth="2"/><rect x="2" y="5" width="16" height="10" fill="#f3e8ff" stroke="#a21caf" strokeWidth="2"/><ellipse cx="10" cy="15" rx="8" ry="3" fill="#f3e8ff" stroke="#a21caf" strokeWidth="2"/></svg> },
    { id: 'actor', label: 'Sequence Diagram actor', icon: <svg width="20" height="20"><circle cx="10" cy="5" r="3" fill="#fef9c3" stroke="#eab308" strokeWidth="2"/><rect x="7" y="8" width="6" height="8" fill="#fef9c3" stroke="#eab308" strokeWidth="2"/></svg> },
    { id: 'annotation', label: 'Annotation', icon: <svg width="24" height="16"><rect x="2" y="2" width="20" height="12" fill="#f1f5f9" stroke="#64748b" strokeWidth="2"/><polyline points="2,2 8,8 2,14" fill="none" stroke="#64748b" strokeWidth="2"/></svg> },
    { id: 'line', label: 'Line', icon: <svg width="24" height="16"><line x1="2" y1="8" x2="22" y2="8" stroke="#64748b" strokeWidth="2"/></svg> },
    { id: 'bracket', label: 'Bracket', icon: <svg width="20" height="20"><path d="M6 2 Q2 10 6 18" fill="none" stroke="#64748b" strokeWidth="2"/><path d="M14 2 Q18 10 14 18" fill="none" stroke="#64748b" strokeWidth="2"/></svg> },
    { id: 'cloud', label: 'Cloud', icon: <svg width="24" height="16"><ellipse cx="8" cy="10" rx="5" ry="4" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2"/><ellipse cx="16" cy="8" rx="6" ry="5" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2"/></svg> },
    { id: 'star', label: 'Star', icon: <svg width="20" height="20"><polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="#fde68a" stroke="#f59e42" strokeWidth="2"/></svg> },
  ];

  return (
    <div className="h-14 border-b bg-background flex items-center px-4 gap-2">
      {/* Tool selection buttons */}
      <div className="flex items-center gap-1">
        {/* Select tool */}
        <Button
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('select')}
          className={`h-8 w-8 p-0${activeTool === 'select' ? ' ring-2 ring-blue-500' : ''}`}
          aria-pressed={activeTool === 'select'}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        {/* Shape dropdown menu */}
        <DropdownMenu.DropdownMenu>
          <DropdownMenu.DropdownMenuTrigger asChild>
            <Button
              variant={shapes.some(s => s.id === activeTool) ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 w-8 p-0${shapes.some(s => s.id === activeTool) ? ' ring-2 ring-blue-500' : ''}`}
              aria-pressed={shapes.some(s => s.id === activeTool)}
            >
              {/* Shapes icon */}
              <svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="2" width="8" height="8" fill="#a5b4fc"/><circle cx="15" cy="6" r="4" fill="#f9a8d4"/><polygon points="10,18 18,18 14,12" fill="#fef08a"/></svg>
            </Button>
          </DropdownMenu.DropdownMenuTrigger>
          <DropdownMenu.DropdownMenuContent sideOffset={8} align="start">
            {shapes.map(shape => (
              <DropdownMenu.DropdownMenuItem key={shape.id} onSelect={() => onToolChange(shape.id as Tool)} className="flex items-center gap-2">
                {shape.icon}
                <span>{shape.label}</span>
              </DropdownMenu.DropdownMenuItem>
            ))}
          </DropdownMenu.DropdownMenuContent>
        </DropdownMenu.DropdownMenu>
        {/* Text tool */}
        <Button
          variant={activeTool === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('text')}
          className={`h-8 w-8 p-0${activeTool === 'text' ? ' ring-2 ring-blue-500' : ''}`}
          aria-pressed={activeTool === 'text'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20"><text x="3" y="16" fontSize="16" fontWeight="bold" fill="#64748b">T</text></svg>
        </Button>
        {/* Connect tool */}
        <Button
          variant={activeTool === 'connect' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('connect')}
          className={`h-8 w-8 p-0${activeTool === 'connect' ? ' ring-2 ring-blue-500' : ''}`}
          aria-pressed={activeTool === 'connect'}
        >
          <GitBranch className="h-4 w-4" />
        </Button>
      </div>
      {/* Undo/redo controls */}
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
      {/* Zoom controls */}
      <div className="ml-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.1}
          className="h-8 w-8 p-0"
          title="Zoom Out (Ctrl + -)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        {/* Zoom reset button shows current zoom percent */}
        <button
          onClick={onZoomReset}
          className="h-8 min-w-[60px] px-2 text-sm font-medium bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Reset Zoom (Ctrl + 0)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={zoomLevel >= 2}
          className="h-8 w-8 p-0"
          title="Zoom In (Ctrl + +)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};