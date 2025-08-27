import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Node } from '@/types/flowchart';

interface FlowchartNodeProps {
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  panOffset: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  onTextChange: (text: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

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
  const [editValue, setEditValue] = useState(node.text);
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = () => {
    setEditValue(node.text);
    setIsEditing(true);
  };

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.text);
    }
    // Enter inserts a line break by default
  };

  const handleTextAreaBlur = () => {
    onTextChange(editValue);
    setIsEditing(false);
  };


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

  const showDelete = isSelected;
  const baseClasses = `absolute border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors text-center`;
  const selectedClasses = isSelected ? 'ring-2 ring-primary ring-offset-2' : '';
  const connectingClasses = isConnecting ? 'ring-2 ring-blue-500 ring-offset-2' : '';
  const style = {
    left: node.x + panOffset.x,
    top: node.y + panOffset.y,
    width: node.width,
    height: node.height,
    backgroundColor: node.backgroundColor,
    borderColor: node.borderColor,
    zIndex: isSelected ? 10 : 2
  };

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

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  function renderShape() {
    switch (node.type) {
      case 'rectangle':
      case 'circle':
      case 'diamond':
      case 'text': {
        const isDiamond = node.type === 'diamond';
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
              <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {content}
              </div>
            ) : (
              content
            )}
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
      case 'star': {
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{ ...style, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
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
      default:
        return null;
    }
  }

  return renderShape();
}