'use client';

import { useEffect, useState } from 'react';

interface CompiledLayoutRendererProps {
  layoutName: string;
  fallback?: React.ReactNode;
}

interface CompiledLayout {
  html: string;
  css: string;
  js: string;
  metadata: {
    layoutName: string;
    compiledAt: number;
    widgetCount: number;
    version: string;
  };
}

export default function CompiledLayoutRenderer({ layoutName, fallback }: CompiledLayoutRendererProps) {
  const [compiled, setCompiled] = useState<CompiledLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompiledLayout();
  }, [layoutName]);

  const fetchCompiledLayout = async () => {
    try {
      setLoading(true);
      
      // Try to fetch pre-compiled version first
      const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}/compiled`, {
        cache: 'no-store'
      });
      
      const data = await response.json();

      if (data.success && data.data) {
        setCompiled(data.data);
        console.log(`✅ Loaded pre-compiled layout: ${layoutName} (${data.data.metadata.widgetCount} widgets)`);
      } else {
        // Fallback to regular layout rendering
        console.log(`⚠️ No pre-compiled version for: ${layoutName}, using regular renderer`);
        setError('Not compiled');
      }
    } catch (err) {
      console.error('Error fetching compiled layout:', err);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // No loading indicator - instant render
  }

  if (error || !compiled) {
    // Fallback to regular layout renderer
    return fallback || null;
  }

  return (
    <>
      {/* Custom CSS */}
      {compiled.css && (
        <style 
          dangerouslySetInnerHTML={{ __html: compiled.css }}
          data-layout={layoutName}
          data-compiled="true"
        />
      )}

      {/* Pre-compiled HTML */}
      <div 
        dangerouslySetInnerHTML={{ __html: compiled.html }}
        data-layout={layoutName}
        data-compiled="true"
        data-compiled-at={compiled.metadata.compiledAt}
      />

      {/* Custom JS */}
      {compiled.js && (
        <script 
          dangerouslySetInnerHTML={{ __html: compiled.js }}
          data-layout={layoutName}
        />
      )}
    </>
  );
}
