'use client';

/**
 * Client-side watermark strip using Canvas.
 * Mirrors applyWatermark (watermark.ts) — same fields, same behaviour.
 */

export interface ClientWatermarkSettings {
  enable_watermarking: boolean;
  logo_url?: string | null;
  logo_width_percentage?: number | null;
  opacity?: number | null;
  mode?: string | null;
  position?: string | null;
  min_width_px?: number | null;
  background_color?: string | null;
  foreground_color?: string | null;
  info_text?: string | null;
  enable_border?: boolean | null;
  border_width?: number | null;
  border_color?: string | null;
}

export interface ClientWatermarkContext {
  editionTitle?: string;
  date?: string;
  pageNumber?: number;
  url?: string;
}

const MAX_WIDTH = 1200;
const FONT_SIZE = 16;
const LINE_HEIGHT = Math.ceil(FONT_SIZE * 1.4);
const WATERMARK_PADDING = 20;
const GAP = 10;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

export async function applyClientWatermark(
  croppedBlob: Blob,
  settings: ClientWatermarkSettings,
  context: ClientWatermarkContext
): Promise<Blob> {
  if (!settings.enable_watermarking) return croppedBlob;

  // Load source image
  const blobUrl = URL.createObjectURL(croppedBlob);
  let srcImg: HTMLImageElement;
  try {
    srcImg = await loadImage(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  let srcW = srcImg.naturalWidth;
  let srcH = srcImg.naturalHeight;

  // min_width_px — skip watermark if image is too small
  const minWidth = settings.min_width_px ?? 0;
  if (minWidth > 0 && srcW < minWidth) return croppedBlob;

  // Cap width
  if (srcW > MAX_WIDTH) {
    srcH = Math.round(srcH * (MAX_WIDTH / srcW));
    srcW = MAX_WIDTH;
  }

  // mode — only show info text when mode is 'in_outerside'
  const mode = settings.mode ?? 'in_outerside';

  // Process info text placeholders
  const rawText = (mode === 'in_outerside' ? settings.info_text : '') || '';
  const infoText = rawText
    .replace(/\{edition_title\}/g, context.editionTitle || '')
    .replace(/\{page_title\}/g, context.editionTitle || '')
    .replace(/\{date\}/g, context.date || '')
    .replace(/\{url\}/g, context.url || '')
    .replace(/\{page_number\}/g, context.pageNumber?.toString() || '')
    .replace(/\{newline\}/g, '\n');

  const textLines = infoText.split('\n').filter(l => l.trim());
  const textHeight = textLines.length > 0 ? textLines.length * LINE_HEIGHT + 20 : 0;

  // Load logo
  let logoImg: HTMLImageElement | null = null;
  let logoW = 0;
  let logoH = 0;
  if (settings.logo_url) {
    try {
      logoImg = await loadImage(settings.logo_url);
      logoW = Math.floor(srcW * 0.6);
      logoH = Math.floor((logoImg.naturalHeight / logoImg.naturalWidth) * logoW);
    } catch {
      logoImg = null;
    }
  }

  const hasContent = logoH > 0 || textHeight > 0;
  const stripH = Math.max(logoH + textHeight + WATERMARK_PADDING, hasContent ? 40 : 0);
  if (stripH === 0) return croppedBlob;

  const totalH = srcH + GAP + stripH;
  const isTop = settings.position?.includes('top') ?? false;

  const canvas = document.createElement('canvas');
  canvas.width = srcW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // White base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, srcW, totalH);

  const imgY = isTop ? stripH + GAP : 0;
  const stripY = isTop ? 0 : srcH + GAP;

  // Draw source image
  ctx.drawImage(srcImg, 0, 0, srcImg.naturalWidth, srcImg.naturalHeight, 0, imgY, srcW, srcH);

  // Strip background
  ctx.fillStyle = settings.background_color || '#f3f4f6';
  ctx.fillRect(0, stripY, srcW, stripH);

  // Border around strip
  if (settings.enable_border) {
    const bw = settings.border_width ?? 2;
    ctx.strokeStyle = settings.border_color || '#000000';
    ctx.lineWidth = bw;
    ctx.strokeRect(
      bw / 2,
      stripY + bw / 2,
      srcW - bw,
      stripH - bw
    );
  }

  // Logo with opacity
  if (logoImg && logoW > 0) {
    const opacity = settings.opacity != null ? settings.opacity / 100 : 1;
    ctx.globalAlpha = opacity;
    const logoX = Math.floor((srcW - logoW) / 2);
    ctx.drawImage(logoImg, logoX, stripY + 10, logoW, logoH);
    ctx.globalAlpha = 1;
  }

  // Text
  if (textLines.length > 0) {
    ctx.fillStyle = settings.foreground_color || '#000000';
    ctx.font = `${FONT_SIZE}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const textStartY = stripY + logoH + 10;
    for (let i = 0; i < textLines.length; i++) {
      ctx.fillText(textLines[i].trim(), srcW / 2, textStartY + i * LINE_HEIGHT);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob returned null')),
      'image/webp',
      0.92
    );
  });
}
