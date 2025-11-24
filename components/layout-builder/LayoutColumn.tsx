'use client';

import { useState } from 'react';
import { Column, Widget, Row } from './types';
import { WidgetComponent } from './WidgetComponent';
import { WidgetModal } from './WidgetModal';
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
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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

  // Widget drag and drop handlers
  const handleWidgetDragStart = (widgetId: string) => {
    setDraggedWidgetId(widgetId);
  };

  const handleWidgetDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  };

  const handleWidgetDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedWidgetId) return;
    
    const draggedIndex = column.widgets.findIndex(w => w.id === draggedWidgetId);
    if (draggedIndex === -1) {
      setDraggedWidgetId(null);
      setDropTargetIndex(null);
      return;
    }

    if (draggedIndex === targetIndex) {
      setDraggedWidgetId(null);
      setDropTargetIndex(null);
      return;
    }

    const newWidgets = [...column.widgets];
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedWidget);

    onUpdate({ ...column, widgets: newWidgets });
    setDraggedWidgetId(null);
    setDropTargetIndex(null);
  };

  const handleWidgetDragEnd = () => {
    setDraggedWidgetId(null);
    setDropTargetIndex(null);
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
        { type: 'epaper-archive' as const, label: 'Epaper Archive Page' },
        { type: 'epaper-calendar' as const, label: 'Epaper Calendar' },
        { type: 'epaper-display' as const, label: 'Epaper Display Page: Epaper Display' },
        { type: 'epaper-pagination' as const, label: 'Epaper Display Page: Pagination Control' },
        { type: 'epaper-pdf-download' as const, label: 'Epaper Display Page: PDF Download Widget' },
        { type: 'epaper-thumb-navigation' as const, label: 'Epaper Display Page: Thumb Navigation' },
        { type: 'epaper-clip-share' as const, label: 'Epaper Display Page: Clip and Share' },
      ]
    },
  ];

  // Calculate flex-basis based on column width (out of 12)
  const widthPercentage = ((column.width || 6) / 12) * 100;

  return (
    <div 
      className="rounded bg-gray-50 relative transition-all duration-300"
      style={{
        flex: `0 0 ${widthPercentage}%`,
        maxWidth: `${widthPercentage}%`,
        minWidth: '150px',
        boxSizing: 'border-box',
      }}
    >

      {/* Width Indicator */}
      <div className="absolute top-0.5 left-0.5 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
        {column.width || 6}/12
      </div>
      
      <div className="flex gap-1 mb-2 flex-wrap items-center">
        <div className="relative">
          <button
            onClick={() => setShowWidgetDropdown(!showWidgetDropdown)}
            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1 text-xs shadow-sm transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Widgets
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
        
        {/* Settings Button (Three Dots) */}
        <button
          onClick={() => setShowColumnProperties(true)}
          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm transition-all"
          title="Column Settings"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm transition-all"
          title="Delete Column"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Plus Button - Increase Width */}
        <button
          onClick={() => {
            const currentWidth = column.width || 6;
            const newWidth = Math.min(12, currentWidth + 1);
            onUpdate({ ...column, width: newWidth });
          }}
          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm transition-all"
          title="Increase Width"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Minus Button - Decrease Width */}
        <button
          onClick={() => {
            const currentWidth = column.width || 6;
            const newWidth = Math.max(1, currentWidth - 1);
            onUpdate({ ...column, width: newWidth });
          }}
          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm transition-all"
          title="Decrease Width"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Add Nested Row Button */}
        <button
          onClick={addNestedRow}
          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1 text-xs shadow-sm transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Add Nested Row
        </button>
      </div>

      <div className="space-y-2">
        {column.widgets.map((widget, index) => (
          <div
            key={widget.id}
            onDragOver={(e) => handleWidgetDragOver(e, index)}
            onDrop={(e) => handleWidgetDrop(e, index)}
            className={dropTargetIndex === index ? 'border-t-2 border-green-500' : ''}
          >
            <WidgetComponent
              widget={widget}
              onEdit={() => setEditingWidget(widget)}
              onDelete={() => deleteWidget(widget.id)}
              onDuplicate={() => duplicateWidget(widget.id)}
              onDragStart={() => handleWidgetDragStart(widget.id)}
              onDragEnd={handleWidgetDragEnd}
            />
          </div>
        ))}

        {column.rows.map((row) => (
          <div key={row.id} className="w-full mt-2">
            <NestedLayoutRow
              row={row}
              onUpdate={(updatedRow) => updateNestedRow(row.id, updatedRow)}
              onDelete={() => deleteNestedRow(row.id)}
            />
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
          properties={{
            extraSmallWidth: column.properties?.extraSmallWidth || '12',
            smallWidth: column.properties?.smallWidth || '12',
            mediumWidth: column.properties?.mediumWidth || '12',
            largeWidth: column.properties?.largeWidth || '12',
            extraLargeWidth: column.properties?.extraLargeWidth || '12',
            cssClass: column.properties?.cssClass || '',
            customStyle: column.properties?.customStyle || '',
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
    </div>
  );
}

// Nested Row Component
function NestedLayoutRow({ row, onUpdate, onDelete }: { row: Row; onUpdate: (row: Row) => void; onDelete: () => void }) {
  const addColumn = () => {
    const existingColumns = row.columns.length;
    const defaultWidth = existingColumns === 0 ? '12' : '6';
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      width: 12,
      widgets: [],
      rows: [],
      properties: {
        extraSmallWidth: '12',
        smallWidth: '12',
        mediumWidth: defaultWidth,
        largeWidth: defaultWidth,
        extraLargeWidth: defaultWidth,
        cssClass: '',
        customStyle: '',
      },
    };
    onUpdate({ ...row, columns: [...row.columns, newColumn] });
  };

  const deleteColumn = (colId: string) => {
    onUpdate({
      ...row,
      columns: row.columns.filter(c => c.id !== colId),
    });
  };

  const updateColumn = (colId: string, updatedColumn: any) => {
    onUpdate({
      ...row,
      columns: row.columns.map(c => c.id === colId ? updatedColumn : c),
    });
  };

  return (
    <div className="rounded bg-purple-50 p-2 border border-purple-300 w-full">
      {/* Nested Row Header */}
      <div className="bg-purple-500 -mx-2 -mt-2 mb-2 px-2 py-1 rounded-t flex items-center justify-between">
        <span className="text-white text-[10px] font-bold">NESTED ROW</span>
        <button
          onClick={onDelete}
          className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm transition-all"
          title="Delete Nested Row"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Add Column Button */}
      <div className="mb-2">
        <button
          onClick={addColumn}
          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 flex items-center gap-1 shadow-sm transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Column
        </button>
      </div>

      {/* Columns */}
      {row.columns.length === 0 ? (
        <div className="text-center py-4 text-purple-400 text-xs border border-dashed border-purple-300 rounded">
          Click "Add Column" to add columns
        </div>
      ) : (
        <div className="flex flex-wrap">
          {row.columns.map((column) => (
            <LayoutColumn
              key={column.id}
              column={column}
              onUpdate={(updatedColumn) => updateColumn(column.id, updatedColumn)}
              onDelete={() => deleteColumn(column.id)}
            />
          ))}
        </div>
      )}
    </div>
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
      return { categoryId: null };
    case 'epaper-featured':
      return { 
        categoryTree: [], 
        title: '', 
        thumbnailWidth: 300, 
        thumbnailHeight: 450, 
        perRowCount: 3,
        cropThumbnails: 'yes',
        categoryNamePosition: 'none',
        datePosition: 'none',
        backButtonText: 'Back',
        shareIconPosition: 'none',
        shareIconSize: 20,
        linkTo: 'category-archive'
      };
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
