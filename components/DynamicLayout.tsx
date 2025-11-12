'use client';

import { useEffect, useState } from 'react';
import { LayoutStructure } from './layout-builder/types';

interface DynamicLayoutProps {
  layoutName: string;
  fallback?: React.ReactNode;
}

export default function DynamicLayout({ layoutName, fallback }: DynamicLayoutProps) {
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLayout();
  }, [layoutName]);

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}`);
      const data = await response.json();

      if (data.success) {
        setLayout(data.data);
      } else {
        setError(data.error || 'Failed to load layout');
      }
    } catch (err) {
      console.error('Error fetching layout:', err);
      setError('Failed to load layout');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !layout) {
    return fallback || (
      <div className="text-center py-12 text-gray-500">
        <p>Layout not available</p>
      </div>
    );
  }

  const structure: LayoutStructure = layout.structure || { rows: [] };

  return (
    <>
      {/* Custom CSS */}
      {layout.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: layout.custom_css }} />
      )}

      {/* Render Layout Structure */}
      <div className="dynamic-layout">
        {structure.rows?.map((row: any, rowIndex: number) => (
          <div
            key={rowIndex}
            className="layout-row mb-4"
            style={{ minHeight: row.height || 'auto' }}
          >
            <div className="flex gap-4 flex-wrap">
              {row.columns?.map((col: any, colIndex: number) => (
                <div
                  key={colIndex}
                  className="layout-column"
                  style={{ flex: col.width || 1 }}
                >
                  {col.widgets?.map((widget: any, widgetIndex: number) => (
                    <div key={widgetIndex} className="widget mb-4">
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom JS */}
      {layout.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: layout.custom_js }} />
      )}
    </>
  );
}

function renderWidget(widget: any) {
  switch (widget.type) {
    case 'text':
      return (
        <div
          className="widget-text prose max-w-none"
          dangerouslySetInnerHTML={{ __html: widget.content || '' }}
        />
      );

    case 'image':
      return widget.url ? (
        <img
          src={widget.url}
          alt={widget.alt || ''}
          className="w-full rounded-lg shadow-md"
        />
      ) : null;

    case 'button':
      return (
        <a
          href={widget.link || '#'}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          target={widget.newTab ? '_blank' : undefined}
          rel={widget.newTab ? 'noopener noreferrer' : undefined}
        >
          {widget.text || 'Button'}
        </a>
      );

    case 'embed':
      return widget.code ? (
        <div dangerouslySetInnerHTML={{ __html: widget.code }} />
      ) : null;

    case 'ticker':
      return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
          <div className="animate-marquee whitespace-nowrap">
            {widget.text || 'Ticker text'}
          </div>
        </div>
      );

    case 'social':
      return (
        <div className="flex gap-3">
          {widget.links?.map((link: any, i: number) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-xl">{link.icon || '🔗'}</span>
            </a>
          ))}
        </div>
      );

    case 'menu':
      return (
        <nav className="flex gap-4">
          {widget.items?.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      );

    default:
      return <div className="text-gray-400">Unknown widget type: {widget.type}</div>;
  }
}
