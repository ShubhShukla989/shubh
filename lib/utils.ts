import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * HTML escape function to prevent XSS attacks
 */
export function htmlEscape(str: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (match) => htmlEscapeMap[match]);
}

/**
 * Generate a secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Validate email format with comprehensive regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Rate limiting helper
 */
export function isRateLimited(attempts: number, maxAttempts: number, windowMs: number, lastAttempt: string): boolean {
  if (attempts < maxAttempts) {
    return false;
  }
  
  const now = Date.now();
  const lastAttemptTime = new Date(lastAttempt).getTime();
  
  return (now - lastAttemptTime) < windowMs;
}

/**
 * Password strength validator
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password should contain at least one special character');
  } else {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  return {
    isValid: score >= 4 && feedback.length === 0,
    score,
    feedback
  };
}

/**
 * Sanitize and validate request input
 */
export function sanitizeInput(input: any, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input too long. Maximum ${maxLength} characters allowed`);
  }
  
  // Remove potential XSS and injection attempts while preserving functionality
  const sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  
  return sanitized;
}

/**
 * Validate file content by checking magic bytes
 */
export function validateFileContent(buffer: Buffer, expectedType: 'pdf' | 'image'): boolean {
  if (!buffer || buffer.length < 4) return false;
  
  switch (expectedType) {
    case 'pdf':
      // PDF magic bytes: %PDF
      return buffer.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]));
    
    case 'image':
      // Check for common image formats
      const first4 = buffer.subarray(0, 4);
      const first3 = buffer.subarray(0, 3);
      const first2 = buffer.subarray(0, 2);
      
      // JPEG: FF D8 FF
      if (first3.equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return true;
      // PNG: 89 50 4E 47
      if (first4.equals(Buffer.from([0x89, 0x50, 0x4E, 0x47]))) return true;
      // GIF: 47 49 46 38
      if (first4.equals(Buffer.from([0x47, 0x49, 0x46, 0x38]))) return true;
      // WebP: 52 49 46 46 (RIFF)
      if (first4.equals(Buffer.from([0x52, 0x49, 0x46, 0x46]))) {
        // Check for WEBP at offset 8
        const webpCheck = buffer.subarray(8, 12);
        return webpCheck.equals(Buffer.from([0x57, 0x45, 0x42, 0x50]));
      }
      
      return false;
    
    default:
      return false;
  }
}

/**
 * Generate secure filename to prevent path traversal
 */
export function generateSecureFilename(originalName: string, prefix: string = ''): string {
  // Extract extension safely
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('File type not allowed');
  }
  
  // Generate completely random filename
  const randomName = crypto.randomUUID();
  const timestamp = Date.now();
  
  return `${prefix}${timestamp}-${randomName}.${ext}`;
}

/**
 * Validate and sanitize file path to prevent directory traversal
 */
export function validateFilePath(basePath: string, filePath: string): string {
  const path = require('path');
  
  // Resolve paths to absolute paths
  const resolvedBase = path.resolve(basePath);
  const resolvedPath = path.resolve(basePath, filePath);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path - directory traversal detected');
  }
  
  return resolvedPath;
}

/**
 * Create standardized API error response
 */
export interface APIErrorResponse {
  success: false;
  error: string;
  code: string;
  errorId: string;
  timestamp: string;
  details?: any;
}

export function createErrorResponse(
  error: string,
  code: string,
  details?: any
): APIErrorResponse {
  return {
    success: false,
    error,
    code,
    errorId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
}