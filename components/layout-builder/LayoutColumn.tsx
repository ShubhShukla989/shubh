'use client';

import { useState } from 'react';
import { Column, Widget, Row } from './types';
import { WidgetComponent } from './WidgetComponent';
import { WidgetModal } from './WidgetModal';
import { ResizableColumn } from './ResizableColumn';
import { ColumnPropertiesModal } from './ColumnPropertiesModal';

interface LayoutColumnProps {
  column: Column;
  onUpdate: (column: Column) => void;
  onDelete: () => void;
}

export function LayoutColumn({ column, onUpdate, onDelete }: LayoutColumnProps) {
  const [showWidgetDropdown, setShowWidgetDropdown] = useState(false);
  const [showColumnProperties, setShowColumnProperties] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      config: getDefaultConfig(type),
    };
    onUpdate({ ...column, widgets: [...column.widgets, newWidget] });
    setShowWidgetDropdown(false);
  };

  const updateWidget = (widgetId: string, updatedWidget: any) => {
    onUpdate({
      ...column,
      widgets: column.widgets.map(w => w.id === widgetId ? updatedWidget : w),
    });
    setEditingWidget(null);
  };

  const deleteWidget = (widgetId: string) => {
    onUpdate({
      ...column,
      widgets: column.widgets.filter(w => w.id !== widgetId),
    });
  };

  const duplicateWidget = (widgetId: string) => {
    const widget = column.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const newWidget = { ...widget, id: `widget-${Date.now()}` };
    onUpdate({ ...column, widgets: [...column.widgets, newWidget] });
  };

  const addNestedRow = () => {
    const newRow: Row = {
      id: `nested-row-${Date.now()}`,
      columns: [],
    };
    onUpdate({ ...column, rows: [...column.rows, newRow] });
  };

  const updateNestedRow = (rowId: string, updatedRow: Row) => {
    onUpdate({
      ...column,
      rows: column.rows.map(r => r.id === rowId ? updatedRow : r),
    });
  };

  const deleteNestedRow = (rowId: string) => {
    onUpdate({
      ...column,
      rows: column.rows.filter(r => r.id !== rowId),
    });
  };

  const handleColumnPropertiesSave = (properties: any) => {
    onUpdate({ ...column, properties });
  };

  const widgetCategories = [
    {
      name: 'External Epaper',
      widgets: [
        { type: 'social' as const, label: 'Social Links' },
        { type: 'social' as const, label: 'Social Sharing' },
      ]
    },
    {
      name: 'Navigation',
      widgets: [
        { type: 'navigation' as const, label: 'Navigation Bar' },
        { type: 'menu' as const, label: 'Menu Items' },
      ]
    },
    {
      name: 'Interactive',
      widgets: [
        { type: 'pwa-install' as const, label: 'PWA Install Prompt' },
        { type: 'youtube' as const, label: 'YouTube Channel Videos' },
        { type: 'rss' as const, label: 'RSS Display Widget' },
        { type: 'slideshow' as const, label: 'Slideshow' },
      ]
    },
    {
      name: 'Content',
      widgets: [
        { type: 'html' as const, label: 'HTML Code Widget' },
        { type: 'tinymce' as const, label: 'TinyMCE Widget' },
        { type: 'page-content' as const, label: 'Page Content Widget' },
      ]
    },
    {
      name: 'Media',
      widgets: [
        { type: 'image' as const, label: 'Image Widget' },
        { type: 'infobox' as const, label: 'InfoBox Image' },
        { type: 'video' as const, label: 'Video Widget' },
        { type: 'audio' as const, label: 'Audio Player Widget' },
      ]
    },
    {
      name: 'UI Elements',
      widgets: [
        { type: 'cards' as const, label: 'Cards' },
        { type: 'heading' as const, label: 'Heading' },
        { type: 'button' as const, label: 'Button' },
      ]
    },
    {
      name: 'Advanced',
      widgets: [
        { type: 'datetime' as const, label: 'Current DateTime Widget' },
        { type: 'reusable' as const, label: 'Reusable Component Widget' },
      ]
    },
    {
      name: 'Epaper',
      widgets: [
        { type: 'epaper-category' as const, label: 'Epaper CategoryWise Epapers' },
        { type: 'epaper-gallery' as const, label: 'Epaper Galleries' },
        { type: 'epaper-featured' as const, label: 'Epaper Featured Editions' },
        { type: 'epaper-featured' as const, label: 'Epaper Featured Categories' },
      ]
    },
  ];

  return (
    <ResizableColumn
      column={column}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onShowProperties={() => setShowColumnProperties(true)}
    >
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowWidgetDropdown(!showWidgetDropdown)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
          >
            <span>+</span> Add Widgets
          </button>
          
          {showWidgetDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowWidgetDropdown(false)}
              />
              <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-300 rounded shadow-lg z-20 max-h-96 overflow-y-auto">
                {widgetCategories.map((category, idx) => (
                  <div key={idx}>
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-sm border-b">
                      {category.name}
                    </div>
                    {category.widgets.map((widget, widgetIdx) => (
                      <button
                        key={widgetIdx}
                        onClick={() => addWidget(widget.type)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                      >
                        {widget.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <button
          onClick={addNestedRow}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-1"
        >
          <span>★</span> Add Nested Row
        </button>
      </div>

      <div className="space-y-2">
        {column.widgets.map((widget) => (
          <WidgetComponent
            key={widget.id}
            widget={widget}
            onEdit={() => setEditingWidget(widget)}
            onDelete={() => deleteWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget.id)}
          />
        ))}

        {column.rows.map((row) => (
          <div key={row.id} className="border-2 border-purple-300 rounded p-2 bg-purple-50">
            <div className="text-xs text-purple-600 mb-2">Nested Row (ID: {row.id.slice(-8)})</div>
            <button
              onClick={() => deleteNestedRow(row.id)}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Delete Nested Row
            </button>
          </div>
        ))}

        {column.widgets.length === 0 && column.rows.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            Empty column - add widgets or nested rows
          </div>
        )}
      </div>

      {/* Column Properties Modal */}
      {showColumnProperties && (
        <ColumnPropertiesModal
          properties={column.properties || {
            extraSmallWidth: '12',
            smallWidth: '12',
            mediumWidth: '12',
            largeWidth: '12',
            extraLargeWidth: '12',
            cssClass: '',
            customStyle: '',
          }}
          onSave={handleColumnPropertiesSave}
          onClose={() => setShowColumnProperties(false)}
        />
      )}

      {/* Widget Edit Modal */}
      {editingWidget && (
        <WidgetModal
          widget={editingWidget}
          onSave={(updatedWidget) => updateWidget(editingWidget.id, updatedWidget)}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </ResizableColumn>
  );
}

function getDefaultConfig(type: Widget['type']) {
  switch (type) {
    case 'ticker':
      return { text: 'Breaking News...', speed: 50 };
    case 'social':
      return { links: [] };
    case 'image':
      return { src: '', alt: '', width: '100%' };
    case 'text':
      return { content: '<p>Enter your text here</p>' };
    case 'button':
      return { text: 'Click Me', link: '#', style: 'primary' };
    case 'menu':
      return { items: [] };
    case 'embed':
    case 'html':
      return { html: '' };
    case 'navigation':
      return { menuId: null };
    case 'slideshow':
      return { sliderId: null };
    case 'tinymce':
      return { content: '' };
    case 'page-content':
      return { pageId: null };
    case 'infobox':
      return { title: '', image: '', description: '' };
    case 'cards':
      return { items: [] };
    case 'heading':
      return { text: 'Heading', level: 'h2' };
    case 'video':
      return { url: '' };
    case 'audio':
      return { url: '' };
    case 'datetime':
      return { format: 'YYYY-MM-DD HH:mm:ss' };
    case 'reusable':
      return { componentId: null };
    case 'epaper-category':
    case 'epaper-gallery':
    case 'epaper-featured':
      return { categoryId: null };
    case 'pwa-install':
      return { text: 'Install App' };
    case 'youtube':
      return { channelId: '' };
    case 'rss':
      return { feedUrl: '' };
    default:
      return {};
  }
}
