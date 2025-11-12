'use client';

import { Widget } from './types';

interface WidgetComponentProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function WidgetComponent({ widget, onEdit, onDelete, onDuplicate }: WidgetComponentProps) {
  const getWidgetLabel = () => {
    switch (widget.type) {
      case 'ticker': return 'Ticker';
      case 'social': return 'SocialWidget';
      case 'image': return 'ImageWidget';
      case 'text': return 'Text';
      case 'button': return 'Button';
      case 'menu': return 'Menu';
      case 'embed': return 'Embed';
      default: return 'Widget';
    }
  };

  const getWidgetColor = () => {
    switch (widget.type) {
      case 'ticker': return 'bg-cyan-500';
      case 'social': return 'bg-blue-500';
      case 'image': return 'bg-teal-500';
      case 'text': return 'bg-purple-500';
      case 'button': return 'bg-green-500';
      case 'menu': return 'bg-orange-500';
      case 'embed': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="border border-gray-300 rounded bg-white p-2 flex items-center justify-between group hover:border-blue-400">
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 ${getWidgetColor()} text-white rounded text-sm font-medium`}>
          {getWidgetLabel()}
        </span>
        <span className="text-xs text-gray-500">ID: {widget.id.slice(-8)}</span>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={onDuplicate}
          className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"
          title="Duplicate"
        >
          📋
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
