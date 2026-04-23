import { join, resolve, isAbsolute } from 'path';
import { existsSync } from 'fs';

/**
 * In Next.js standalone mode, process.cwd() points to .next/standalone/
 * instead of the project root. This resolves the correct paths regardless.
 * 
 * Fix: Set UPLOAD_DIR as an absolute path in production .env
 * e.g. UPLOAD_DIR=/home/newsone/epaper-final/epaper-final/public/uploads
 */

function findProjectRoot(): string {
  // If UPLOAD_DIR is absolute, derive root from it (uploads is 2 levels under root)
  if (process.env.UPLOAD_DIR && isAbsolute(process.env.UPLOAD_DIR)) {
    return resolve(process.env.UPLOAD_DIR, '../..');
  }

  // Walk up from cwd until we find a folder containing 'public'
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'public'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  return process.cwd();
}

let _root: string | null = null;

function getRoot(): string {
  if (!_root) _root = findProjectRoot();
  return _root;
}

export function getPublicDir(): string {
  return join(getRoot(), 'public');
}

export function getUploadsDir(): string {
  if (process.env.UPLOAD_DIR && isAbsolute(process.env.UPLOAD_DIR)) {
    return process.env.UPLOAD_DIR;
  }
  return join(getPublicDir(), 'uploads');
}

export function resolvePublicPath(...segments: string[]): string {
  return join(getPublicDir(), ...segments);
}

export function resolveUploadPath(...segments: string[]): string {
  return join(getUploadsDir(), ...segments);
}
