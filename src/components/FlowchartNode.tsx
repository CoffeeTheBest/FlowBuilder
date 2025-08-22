// React hooks for state and lifecycle
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
// Import Node type definition
import { Node } from '@/types/flowchart';

// Props for the FlowchartNode component
interface FlowchartNodeProps {
  node: Node; // Node data
  isSelected: boolean; // Is this node selected?
  isConnecting: boolean; // Is this node being connected from?
  panOffset: { x: number; y: number }; // Current pan offset of the canvas
  onMouseDown: (e: React.MouseEvent) => void; // Handler for mouse down (for dragging)
  onClick: () => void; // Handler for clicking the node
  onTextChange: (text: string) => void; // Handler for changing node text
  onMouseEnter?: () => void; // Handler for mouse enter (optional)
  onMouseLeave?: () => void; // Handler for mouse leave (optional)
}

// FlowchartNode component renders a single node of any supported type
export const FlowchartNode = ({
  node,
  isSelected,
  isConnecting,
  panOffset,
  onMouseDown,
  onClick,
  onTextChange,
  onMouseEnter,
  onMouseLeave
}: FlowchartNodeProps) => {
  // State for the editable text value
  const [editValue, setEditValue] = useState(node.text);
  // State for whether the node is in editing mode
  const [isEditing, setIsEditing] = useState(false);

  // Handler for double-clicking the node (enables editing)
  const handleDoubleClick = () => {
    setEditValue(node.text);
    setIsEditing(true);
  };

  // Handler for keydown in the textarea (Escape cancels editing)
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.text);
    }
    // Enter inserts a line break by default
  };

  // Handler for blur on the textarea (saves text)
  const handleTextAreaBlur = () => {
    onTextChange(editValue);
    setIsEditing(false);
  };

  // Auto-resizing textarea for editing node text
  function AutoResizingTextarea({ nodeHeight, ...props }: { nodeHeight: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
      const ta = ref.current;
      if (ta) {
        ta.style.height = 'auto';
        const newHeight = Math.min(ta.scrollHeight, nodeHeight);
        ta.style.height = newHeight + 'px';
      }
    }, [props.value, nodeHeight]);
    return (
      <textarea
        ref={ref}
        {...props}
        style={{
          ...props.style,
          height: undefined,
          maxHeight: nodeHeight,
          overflow: 'auto',
          resize: 'none',
        }}
      />
    );
  }

  // Show delete button if node is selected
  const showDelete = isSelected;
  // Base CSS classes for all node shapes
  const baseClasses = `absolute border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors text-center`;
  // CSS classes for selected node
  const selectedClasses = isSelected ? 'ring-2 ring-primary ring-offset-2' : '';
  // CSS classes for node being connected from
  const connectingClasses = isConnecting ? 'ring-2 ring-blue-500 ring-offset-2' : '';
  // Style for node position, size, and color
  const style = {
    left: node.x + panOffset.x,
    top: node.y + panOffset.y,
    width: node.width,
    height: node.height,
    backgroundColor: node.backgroundColor,
    borderColor: node.borderColor,
    zIndex: isSelected ? 10 : 2
  };

  // Content to render inside the node (editable or static)
  const content = isEditing ? (
    <AutoResizingTextarea
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      className="bg-transparent border-none outline-none w-full h-full p-1 text-sm flex items-center justify-center text-center"
      style={{
        minHeight: 0,
        minWidth: 0,
        maxWidth: '100%',
        maxHeight: node.height,
        overflow: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
        resize: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
      autoFocus
      onKeyDown={handleTextAreaKeyDown}
      onBlur={handleTextAreaBlur}
      onClick={e => e.stopPropagation()}
      spellCheck={true}
      nodeHeight={node.height}
    />
  ) : (
    <span
      className="px-2 text-center break-words whitespace-pre-line w-full h-full flex items-center justify-center"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        wordBreak: 'break-word',
        whiteSpace: 'pre-line',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >{node.text}</span>
  );

  // Handler for mouse up (selects the node)
  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // Render the correct shape for the node type
  function renderShape() {
    switch (node.type) {
      // Rectangle, circle, diamond, and text nodes
      case 'rectangle':
      case 'circle':
      case 'diamond':
      case 'text': {
        const isDiamond = node.type === 'diamond';
        // Main div for the shape
        const shapeDiv = (
          <div
            className={
              `${baseClasses} ${selectedClasses} ${connectingClasses}` +
              (node.type === 'rectangle' ? ' rounded' : '') +
              (node.type === 'circle' ? ' rounded-full' : '') +
              (node.type === 'text' ? ' border-dashed bg-white' : '')
            }
            style={
              node.type === 'diamond'
                ? {
                    ...style,
                    transform: `translate(${node.x + panOffset.x}px, ${node.y + panOffset.y}px) rotate(45deg)`,
                    left: 0,
                    top: 0
                  }
                : {
                    ...style
                  }
            }
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {isDiamond ? (
              // Rotate content back for diamond
              <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {content}
              </div>
            ) : (
              content
            )}
            {/* Delete button for node */}
            {showDelete && (
              <button
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  background: 'white',
                  border: '1px solid #f43f5e',
                  color: '#f43f5e',
                  fontWeight: 'bold',
                  fontSize: 14,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 20
                }}
                title="Delete node"
                onClick={e => {
                  e.stopPropagation();
                  const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } });
                  window.dispatchEvent(event);
                }}
              >×</button>
            )}
          </div>
        );
        return shapeDiv;
      }
      // Pill node (rounded rectangle)
      case 'pill': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses} rounded-full`}
            style={{ ...style }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Parallelogram node
      case 'parallelogram': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, transform: `skew(-20deg)` }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div style={{ transform: 'skew(20deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{content}</div>
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Flipped parallelogram node
      case 'parallelogram-flip': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, transform: `skew(20deg)` }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div style={{ transform: 'skew(-20deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{content}</div>
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Trapezoid node
      case 'trapezoid': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Triangle node
      case 'triangle': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Hexagon node
      case 'hexagon': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Cylinder node
      case 'cylinder': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, borderRadius: '50% / 20%' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Actor node (stick figure SVG)
      case 'actor': {
        // Simple stick figure actor
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <svg width={node.width} height={node.height} viewBox={`0 0 60 100`} style={{ display: 'block' }}>
              <circle cx="30" cy="20" r="15" stroke={node.borderColor} strokeWidth="2" fill={node.backgroundColor} />
              <line x1="30" y1="35" x2="30" y2="70" stroke={node.borderColor} strokeWidth="2" />
              <line x1="30" y1="45" x2="10" y2="60" stroke={node.borderColor} strokeWidth="2" />
              <line x1="30" y1="45" x2="50" y2="60" stroke={node.borderColor} strokeWidth="2" />
              <line x1="30" y1="70" x2="10" y2="90" stroke={node.borderColor} strokeWidth="2" />
              <line x1="30" y1="70" x2="50" y2="90" stroke={node.borderColor} strokeWidth="2" />
            </svg>
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Annotation node (dashed border, yellow background)
      case 'annotation': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses} border-dashed bg-yellow-100`}
            style={{ ...style }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Line node (horizontal line)
      case 'line': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, height: 4, minHeight: 4, backgroundColor: node.borderColor, border: 'none' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        );
      }
      // Bracket node (SVG path)
      case 'bracket': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <svg width={node.width} height={node.height} viewBox={`0 0 40 100`} style={{ display: 'block' }}>
              <path d="M30,5 Q10,50 30,95" stroke={node.borderColor} strokeWidth="4" fill="none" />
            </svg>
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Cloud node (SVG ellipses)
      case 'cloud': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <svg width={node.width} height={node.height} viewBox={`0 0 120 60`} style={{ display: 'block' }}>
              <ellipse cx="40" cy="30" rx="30" ry="20" fill={node.backgroundColor} stroke={node.borderColor} strokeWidth="2" />
              <ellipse cx="80" cy="30" rx="30" ry="20" fill={node.backgroundColor} stroke={node.borderColor} strokeWidth="2" />
              <ellipse cx="60" cy="20" rx="25" ry="15" fill={node.backgroundColor} stroke={node.borderColor} strokeWidth="2" />
            </svg>
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Star node (SVG polygon)
      case 'star': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseDown={onMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <svg width={node.width} height={node.height} viewBox={`0 0 80 80`} style={{ display: 'block' }}>
              <polygon points="40,5 48,30 75,30 52,47 60,72 40,57 20,72 28,47 5,30 32,30" fill={node.backgroundColor} stroke={node.borderColor} strokeWidth="2" />
            </svg>
            {content}
            {showDelete && (
              <button style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'white', border: '1px solid #f43f5e', color: '#f43f5e', fontWeight: 'bold', fontSize: 14, borderRadius: '50%', cursor: 'pointer', zIndex: 20 }} title="Delete node" onClick={e => { e.stopPropagation(); const event = new CustomEvent('deleteNode', { detail: { nodeId: node.id } }); window.dispatchEvent(event); }}>×</button>
            )}
          </div>
        );
      }
      // Default: unknown node type
      default:
        return null;
    }
  }

  // Render the node shape
  return renderShape();
}