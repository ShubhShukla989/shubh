import { NextRequest, NextResponse } from 'next/server';
import { mkdir, rename, copyFile, unlink, readdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { db } from '@/lib/db';
import { editions, edition_pages, epaper_categories } from '@/lib/schema/index';
import { eq } from 'drizzle-orm';
import { getUploadsDir, resolvePublicPath } from '@/lib/paths';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { invalidateCompleteEditionCache } from '@/lib/services/editionService';
import { deleteCachePattern } from '@/lib/cache/redis';
import { revalidatePath } from 'next/cache';

const execAsync = promisify(exec);
const IS_WINDOWS = process.platform === 'win32';

/**
 * Wraps a path for GS CLI usage.
 * On Windows, GS chokes on spaces even with quotes in -sOutputFile,
 * so we route output through %TEMP% which is guaranteed space-free.
 */
function gsOutputPath(pattern: string): { arg: string; tmpDir: string | null } {
  if (!IS_WINDOWS || !pattern.includes(' ')) {
    return { arg: `-sOutputFile="${pattern}"`, tmpDir: null };
  }
  // Use temp dir to avoid spaces issue
  const tmp = tmpdir();
  const filename = pattern.split(/[\\/]/).pop()!;
  return { arg: `-sOutputFile="${join(tmp, filename)}"`, tmpDir: tmp };
}

function buildGsCommand(gsPath: string, args: string[]): string {
  const joined = args.filter(Boolean).join(' ');
  return IS_WINDOWS ? `"${gsPath}" ${joined}` : `${gsPath} ${joined}`;
}

async function runGs(command: string, label: string): Promise<void> {
  console.log(`🔧 ${label}:`, command);
  const { stdout, stderr } = await execAsync(command, { timeout: 180000 });
  if (stdout) console.log(`${label} stdout:`, stdout.trim());
  if (stderr) console.log(`${label} stderr:`, stderr.trim());
}

async function moveTempFiles(
  tmpDir: string,
  uploadsDir: string,
  editionId: number,
  pageCount: number,
  suffix: string,
  ext: string
): Promise<void> {
  // List all files in tmpDir matching this edition's pattern
  // GS may zero-pad page numbers (e.g. edition-1-page-01.jpg) on some versions
  const allFiles = await readdir(tmpDir).catch(() => [] as string[]);
  const prefix = `edition-${editionId}-page-`;
  const pattern = new RegExp(`^edition-${editionId}-page-(\\d+)${suffix.replace('-', '\\-')}\\.${ext}$`);

  for (const file of allFiles) {
    const match = file.match(pattern);
    if (!match) continue;
    const pageNum = parseInt(match[1], 10);
    const src = join(tmpDir, file);
    // Always normalize destination to non-padded page number
    const dest = join(uploadsDir, `edition-${editionId}-page-${pageNum}${suffix}.${ext}`);
    try {
      await rename(src, dest);
    } catch {
      try {
        await copyFile(src, dest);
        await unlink(src).catch(() => {});
      } catch (copyErr: any) {
        console.error(`Failed to move ${src} -> ${dest}:`, copyErr.message);
        throw copyErr;
      }
    }
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const editionId = parseInt(params.id);
    const body = await request.json();

    const resolution = Math.min(body.resolution || 150, 300);
    const format: 'jpg' | 'png' = body.format === 'png' ? 'png' : 'jpg';
    const quality = body.quality || 95;

    // Fetch edition
    const [edition] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition?.pdf_url) {
      return NextResponse.json({ success: false, error: 'Edition or PDF not found' }, { status: 404 });
    }

    const pdfPath = resolvePublicPath(edition.pdf_url.replace(/^\//, ''));
    if (!existsSync(pdfPath)) {
      return NextResponse.json({ success: false, error: `PDF not found at: ${pdfPath}` }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.load(await readFile(pdfPath));
    const pageCount = pdfDoc.getPageCount();

    const uploadsDir = getUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    const gsPath = process.env.GHOSTSCRIPT_PATH || (IS_WINDOWS ? 'gswin64c' : 'gs');
    const device = format === 'png' ? 'png16m' : 'jpeg';

    // ── Full-res page extraction ──────────────────────────────────────────────
    const pagePattern = join(uploadsDir, `edition-${editionId}-page-%d.${format}`);
    const { arg: pageOutputArg, tmpDir: pageTmpDir } = gsOutputPath(pagePattern);

    await runGs(buildGsCommand(gsPath, [
      '-dNOPAUSE', '-dBATCH', '-dNOSAFER',
      `-sDEVICE=${device}`,
      `-r${resolution}`,
      format === 'jpg' ? `-dJPEGQ=${quality}` : '',
      pageOutputArg,
      `"${pdfPath}"`,
    ]), 'GS pages');

    if (pageTmpDir) await moveTempFiles(pageTmpDir, uploadsDir, editionId, pageCount, '', format);

    // ── Thumbnail extraction: GS renders at 50 DPI, Sharp compresses to 150px ──
    const thumbPattern = join(uploadsDir, `edition-${editionId}-page-%d-thumb.jpg`);
    const { arg: thumbOutputArg, tmpDir: thumbTmpDir } = gsOutputPath(thumbPattern);

    await runGs(buildGsCommand(gsPath, [
      '-dNOPAUSE', '-dBATCH', '-dNOSAFER',
      '-sDEVICE=jpeg',
      '-r50',
      '-dJPEGQ=85', // keep GS quality high — Sharp will compress it down
      thumbOutputArg,
      `"${pdfPath}"`,
    ]), 'GS thumbs');

    if (thumbTmpDir) await moveTempFiles(thumbTmpDir, uploadsDir, editionId, pageCount, '-thumb', 'jpg');

    // ── Sharp post-compression: resize to 150px wide, quality 15 ─────────────
    const sharp = require('sharp');
    const fsPromises = require('fs/promises');
    for (let i = 1; i <= pageCount; i++) {
      const thumbPath = join(uploadsDir, `edition-${editionId}-page-${i}-thumb.jpg`);
      if (!existsSync(thumbPath)) continue;
      try {
        // Read into buffer first to avoid Windows file lock issues
        const inputBuffer = await fsPromises.readFile(thumbPath);
        const compressed = await sharp(inputBuffer)
          .resize(250, null, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 65, mozjpeg: true })
          .toBuffer();
        await fsPromises.writeFile(thumbPath, compressed);
      } catch (e: any) {
        console.warn(`⚠️ Sharp compression failed for page ${i}:`, e.message);
      }
    }

    // ── Build DB records ──────────────────────────────────────────────────────
    await db.delete(edition_pages).where(eq(edition_pages.edition_id, editionId));

    const newPages = [];

    for (let i = 1; i <= pageCount; i++) {
      // Find extracted page (format may vary)
      const candidates = [
        join(uploadsDir, `edition-${editionId}-page-${i}.${format}`),
        join(uploadsDir, `edition-${editionId}-page-${i}.jpg`),
        join(uploadsDir, `edition-${editionId}-page-${i}.png`),
      ];
      const foundPath = candidates.find(existsSync) ?? null;

      if (!foundPath) {
        console.warn(`⚠️ Page ${i} not found after extraction`);
        continue;
      }

      // Normalize filename
      const finalFilename = `edition-${editionId}-page-${i}.${format}`;
      const finalPath = join(uploadsDir, finalFilename);
      if (foundPath !== finalPath) await rename(foundPath, finalPath);

      const thumbFilename = `edition-${editionId}-page-${i}-thumb.jpg`;
      const thumbExists = existsSync(join(uploadsDir, thumbFilename));

      newPages.push({
        edition_id: editionId,
        page_number: i,
        image_url: `/uploads/${finalFilename}`,
        thumb_url: thumbExists ? `/uploads/${thumbFilename}` : null,
      });
    }

    if (newPages.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No pages extracted. Expected ${pageCount}. GS path: ${gsPath}`,
      }, { status: 500 });
    }

    const insertedPages = await db.insert(edition_pages).values(newPages).returning();

    // Invalidate caches
    await Promise.all([
      invalidateCompleteEditionCache(editionId),
      deleteCachePattern('editions:featured:*'),
      deleteCachePattern('editions:latest-by-categories:*'),
      deleteCachePattern('epaper:editions-by-category:*'),
    ]);

    // 🚀 AUTO-CLEAR Next.js cache after page extraction
    try {
      const [edition] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
      
      if (edition?.status === 'published') {
        revalidatePath('/', 'page');
        revalidatePath('/epaper/display', 'page');
        revalidatePath(`/epaper/view/${editionId}`, 'page');
        
        if (edition.category_id) {
          const [cat] = await db.select({ alias: epaper_categories.alias })
            .from(epaper_categories)
            .where(eq(epaper_categories.id, edition.category_id))
            .limit(1);
          
          if (cat?.alias) {
            revalidatePath(`/epaper/category/${cat.alias}`, 'page');
          }
        }
        
        console.log('✅ Cache cleared after page extraction');
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Extracted ${newPages.length} of ${pageCount} pages`,
      data: { pageCount: newPages.length, totalPages: pageCount, pages: insertedPages },
    });

  } catch (error: any) {
    console.error('❌ Extraction error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Extraction failed' }, { status: 500 });
  }
}
