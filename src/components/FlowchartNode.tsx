import { useState } from 'react';
import { Node } from '@/types/flowchart';

interface FlowchartNodeProps {
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  panOffset: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  onTextChange: (text: string) => void;
}

export const FlowchartNode = ({
  node,
  isSelected,
  isConnecting,
  panOffset,
  onMouseDown,
  onClick,
  onTextChange
}: FlowchartNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onTextChange(e.target.value);
    setIsEditing(false);
  };

  const renderShape = () => {
    const baseClasses = `absolute border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors`;
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
      <input
        type="text"
        defaultValue={node.text}
        className="bg-transparent border-none outline-none text-center w-full h-full"
        autoFocus
        onKeyDown={handleTextSubmit}
        onBlur={handleTextBlur}
        onClick={(e) => e.stopPropagation()}
      />
    ) : (
      <span className="px-2 text-center break-words">{node.text}</span>
    );

    switch (node.type) {
      case 'rectangle':
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses} rounded`}
            style={style}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
          >
            {content}
          </div>
        );
      
      case 'circle':
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses} rounded-full`}
            style={style}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
          >
            {content}
          </div>
        );
      
      case 'diamond':
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses}`}
            style={{
              ...style,
              transform: `translate(${node.x + panOffset.x}px, ${node.y + panOffset.y}px) rotate(45deg)`,
              left: 0,
              top: 0
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
          >
            <div style={{ transform: 'rotate(-45deg)' }}>
              {content}
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div
            className={`${baseClasses} ${selectedClasses} ${connectingClasses} border-dashed bg-transparent`}
            style={style}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onDoubleClick={handleDoubleClick}
          >
            {content}
          </div>
        );
      
      default:
        return null;
    }
  };

  return renderShape();
};