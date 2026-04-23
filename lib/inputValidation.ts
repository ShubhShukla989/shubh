/**
 * Input Validation Utilities
 * 
 * Provides server-side input validation helpers.
 * Prevents invalid data from reaching the database.
 * 
 * Fix for Assumptions: 10.1, 10.3
 */

import { logger } from './logger';

/**
 * Validate and parse integer ID
 */
export function validateId(id: string | number, fieldName: string = 'id'): number {
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id;

  if (isNaN(parsed)) {
    logger.warn(`Invalid ${fieldName}: Not a number`, { value: id });
    throw new Error(`Invalid ${fieldName}: must be a number`);
  }

  if (parsed < 1) {
    logger.warn(`Invalid ${fieldName}: Must be positive`, { value: parsed });
    throw new Error(`Invalid ${fieldName}: must be a positive number`);
  }

  if (!Number.isInteger(parsed)) {
    logger.warn(`Invalid ${fieldName}: Must be integer`, { value: parsed });
    throw new Error(`Invalid ${fieldName}: must be an integer`);
  }

  // Check for overflow (JavaScript safe integer range)
  if (parsed > Number.MAX_SAFE_INTEGER) {
    logger.warn(`Invalid ${fieldName}: Number too large`, { value: parsed });
    throw new Error(`Invalid ${fieldName}: number too large`);
  }

  return parsed;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'field'
): void {
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
}

/**
 * Validate required string field
 */
export function validateRequiredString(value: any, fieldName: string = 'field'): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return trimmed;
}

/**
 * Validate optional string field
 */
export function validateOptionalString(value: any, fieldName: string = 'field'): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  return value.trim();
}

/**
 * Validate boolean field
 */
export function validateBoolean(value: any, fieldName: string = 'field'): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }

  throw new Error(`${fieldName} must be a boolean`);
}

/**
 * Validate date string
 */
export function validateDate(value: string, fieldName: string = 'date'): Date {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string = 'field'
): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }

  return value as T;
}

/**
 * Validate array
 */
export function validateArray(value: any, fieldName: string = 'field'): any[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value;
}

/**
 * Validate URL
 */
export function validateUrl(value: string, fieldName: string = 'url'): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

/**
 * Sanitize HTML to prevent XSS
 * Basic implementation - use a library like DOMPurify for production
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function validatePagination(
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): PaginationParams {
  const parsedPage = page ? validateId(page, 'page') : 1;
  let parsedLimit = limit ? validateId(limit, 'limit') : 20;

  // Enforce max limit
  if (parsedLimit > maxLimit) {
    parsedLimit = maxLimit;
  }

  const offset = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset,
  };
}

/**
 * Validate sort parameters
 */
export function validateSort(
  sortBy?: string,
  sortOrder?: string,
  allowedFields: readonly string[] = []
): { sortBy: string; sortOrder: 'asc' | 'desc' } | null {
  if (!sortBy) {
    return null;
  }

  // Validate sort field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw new Error(`Invalid sort field. Allowed: ${allowedFields.join(', ')}`);
  }

  // Validate sort order
  const order = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    sortBy,
    sortOrder: order,
  };
}

/**
 * Create validation error response
 */
export function createValidationError(message: string, field?: string) {
  return {
    success: false,
    error: message,
    field,
  };
}
