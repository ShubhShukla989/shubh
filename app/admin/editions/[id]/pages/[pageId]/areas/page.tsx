'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Area = { id: string; x: number; y: number; width: number; height: number; };

export default function AreaMappingPage() {
  const params = useParams<{ id: string; pageId: string }>();
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (!params) return;
    
    // Load the actual page image from edition_pages, else fallback
    const load = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
        // Use placeholder image
        const src = 'https://via.placeholder.com/850x1100?text=Page+' + params.pageId;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => setImgEl(img);
        return;
      }

      const { data: page, error } = await supabase
        .from('edition_pages')
        .select('id, image_url, thumb_url')
        .eq('id', Number(params.pageId))
        .single();

      let src = page?.image_url || page?.thumb_url;
      if (!src) {
        src = 'https://via.placeholder.com/850x1100?text=Page+' + params.pageId;
      }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => setImgEl(img);

      // Load existing areas
      const { data: areasRes } = await supabase
        .from('edition_page_areas')
        .select('id, x, y, width, height')
        .eq('page_id', Number(params.pageId));
      if (areasRes) {
        setAreas(areasRes.map((a: any) => ({
          id: String(a.id),
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
        })));
      }
    };
    load();
  }, [params.pageId]);

  const onMouseDown = (e: any) => {
    if (!drawing) return;
    const pos = e.target.getStage().getPointerPosition();
    if (pos) setStartPos({ x: pos.x, y: pos.y });
  };

  const onMouseMove = (e: any) => {
    if (!drawing || !startPos) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    setAreas((prev) => {
      const next = [...prev];
      const idx = next.findIndex((a) => a.id === 'temp');
      const rect = { id: 'temp', x: startPos.x, y: startPos.y, width: w, height: h };
      if (idx === -1) next.push(rect);
      else next[idx] = rect;
      return next;
    });
  };

  const onMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    setStartPos(null);
    setAreas((prev) => prev.filter((a) => a.id !== 'temp'));
  };

  const startDraw = () => {
    setDrawing(true);
    setSelectedId(null);
  };

  const saveAreas = () => {
    alert('Saved ' + areas.filter((a) => a.id !== 'temp').length + ' areas (stub).');
  };

  const nextPage = () => {
    const next = Number(params.pageId) + 1;
    window.location.href = `/admin/editions/${params.id}/pages/${next}/areas`;
  };

  const addTempToFinal = () => {
    const temp = areas.find((a) => a.id === 'temp');
    if (!temp) return;
    const final = { ...temp, id: Date.now().toString() };
    setAreas((prev) => [...prev.filter((a) => a.id !== 'temp'), final]);
  };

  const canvasSize = useMemo(() => ({ width: 980, height: 1200 }), []);

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-gray-900">Edit Area Map</h1>
      </div>

      {!supabase && (
        <div className="mb-4 p-4 rounded bg-red-50 border border-red-200">
          <p className="text-sm text-red-800 font-medium">⚠️ Supabase Configuration Error</p>
          <p className="text-sm text-red-700 mt-1">
            The Supabase client is not initialized. Please check your <code className="bg-red-100 px-1 rounded">.env.local</code> file and ensure:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 mt-2 ml-2">
            <li><code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> is set</li>
            <li><code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is set</li>
          </ul>
          <p className="text-sm text-red-700 mt-2">After updating, restart your development server.</p>
        </div>
      )}

      <div className="relative">
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Link href="/admin/editions" className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100">All Editions »</Link>
          <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100">Edit Edition »</button>
          <Link href={`/admin/editions/${params.id}/pages`} className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100">Upload/Manage Pages »</Link>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded">Edit Area Maps »</button>
          <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100">View</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="p-3 border-b border-gray-200 flex items-center gap-2 flex-wrap">
          <button onClick={() => { startDraw(); }} className="px-3 py-2 bg-rose-600 text-white text-sm rounded">+ Add Area Map</button>
          <button onClick={saveAreas} className="px-3 py-2 bg-emerald-600 text-white text-sm rounded">Save All Area Maps</button>
          <button onClick={nextPage} className="px-3 py-2 bg-blue-600 text-white text-sm rounded">Next Page</button>
          <button className="px-3 py-2 bg-amber-500 text-white text-sm rounded">Import/Export Area Maps</button>
          <button onClick={addTempToFinal} className="px-3 py-2 border border-gray-300 rounded text-sm">Finish Drawing</button>
          <div className="ml-auto flex items-center gap-1 text-sm text-gray-600">
            Tools <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3">
          <div className="overflow-auto border border-gray-200 rounded bg-gray-50">
            <Stage
              ref={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onDblClick={() => setDrawing(true)}
              className="cursor-crosshair"
            >
              <Layer>
                {imgEl && <KonvaImage image={imgEl} width={canvasSize.width} height={canvasSize.height} />}
                {areas.map((a) => (
                  a.id !== 'temp' ? (
                    <Rect
                      key={a.id}
                      x={a.x}
                      y={a.y}
                      width={a.width}
                      height={a.height}
                      stroke={selectedId === a.id ? '#ef4444' : '#22c55e'}
                      strokeWidth={2}
                      draggable
                      onClick={() => setSelectedId(a.id)}
                      onDragEnd={(e) => {
                        const { x, y } = e.target.position();
                        setAreas((prev) => prev.map((r) => (r.id === a.id ? { ...r, x, y } : r)));
                      }}
                    />
                  ) : (
                    <Rect
                      key="temp"
                      x={a.x}
                      y={a.y}
                      width={a.width}
                      height={a.height}
                      stroke="#3b82f6"
                      dash={[6, 4]}
                      strokeWidth={2}
                    />
                  )
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
