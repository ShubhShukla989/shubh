/**
 * File Upload Security
 * 
 * Provides secure file upload handling with validation and sanitization.
 * Prevents path traversal, validates file types, and enforces size limits.
 * 
 * Fix for Assumptions: 4.3, 10.2
 */

import { randomUUID } from 'crypto';
import path from 'path';
import { logger } from './logger';

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
] as const;

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  
  // Remove any non-alphanumeric characters except dots, dashes, and underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    return '_' + sanitized;
  }
  
  return sanitized;
}

/**
 * Generate a safe, unique filename
 */
export function generateSafeFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const uuid = randomUUID();
  
  // Use UUID as filename to prevent collisions and attacks
  return `${uuid}${ext}`;
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: readonly string[] = ALLOWED_FILE_TYPES
): boolean {
  return allowedTypes.includes(mimeType as any);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Get max size for file type
 */
export function getMaxSizeForType(mimeType: string): number {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType as any)) {
    return MAX_IMAGE_SIZE;
  }
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType as any)) {
    return MAX_PDF_SIZE;
  }
  return MAX_FILE_SIZE;
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filePath: string): boolean {
  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return false;
  }
  
  // Check for absolute paths
  if (path.isAbsolute(filePath)) {
    return false;
  }
  
  // Check for null bytes
  if (filePath.includes('\0')) {
    return false;
  }
  
  return true;
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[] = ALLOWED_FILE_TYPES
): FileValidationResult {
  // Validate file type
  if (!validateFileType(file.type, allowedTypes)) {
    logger.warn('File upload rejected: Invalid file type', {
      type: file.type,
      name: file.name,
    });
    
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Validate file size
  const maxSize = getMaxSizeForType(file.type);
  if (!validateFileSize(file.size, maxSize)) {
    logger.warn('File upload rejected: File too large', {
      size: file.size,
      maxSize,
      name: file.name,
    });
    
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Generate safe filename
  const sanitizedFilename = generateSafeFilename(file.name);

  logger.info('File validation passed', {
    originalName: file.name,
    sanitizedName: sanitizedFilename,
    type: file.type,
    size: file.size,
  });

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Validate upload path
 */
export function validateUploadPath(uploadPath: string, baseDir: string): FileValidationResult {
  // Ensure path is within base directory
  const resolvedPath = path.resolve(baseDir, uploadPath);
  const resolvedBase = path.resolve(baseDir);

  if (!resolvedPath.startsWith(resolvedBase)) {
    logger.error('Path traversal attempt detected', undefined, {
      uploadPath,
      baseDir,
      resolvedPath,
    });
    
    return {
      valid: false,
      error: 'Invalid upload path',
    };
  }

  // Validate path components
  if (!validateFilePath(uploadPath)) {
    logger.error('Invalid file path detected', undefined, { uploadPath });
    
    return {
      valid: false,
      error: 'Invalid file path',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Create safe upload path
 */
export function createSafeUploadPath(
  baseDir: string,
  subDir: string,
  filename: string
): { valid: boolean; path?: string; error?: string } {
  // Sanitize subdirectory
  const sanitizedSubDir = sanitizeFilename(subDir);
  
  // Validate subdirectory
  if (!validateFilePath(sanitizedSubDir)) {
    return {
      valid: false,
      error: 'Invalid subdirectory',
    };
  }

  // Create full path
  const fullPath = path.join(baseDir, sanitizedSubDir, filename);

  // Validate final path
  const validation = validateUploadPath(fullPath, baseDir);
  if (!validation.valid) {
    return validation;
  }

  return {
    valid: true,
    path: fullPath,
  };
}
