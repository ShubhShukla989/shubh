import { db } from "./db";
import { audit_logs } from "./schema";
import { logger } from "./logger";

export interface AuditEvent {
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string; // For request tracing
}

/**
 * Log audit event to database and monitoring
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await db.insert(audit_logs).values({
      user_id: event.user_id || null,
      action: event.action,
      entity_type: event.entity_type || null,
      entity_id: event.entity_id || null,
      details: event.details ? JSON.stringify({ ...event.details, user_agent: event.user_agent }) : null,
      ip_address: event.ip_address || null,
      created_at: new Date().toISOString(),
    });
    
    logger.info("Audit event logged", {
      action: event.action,
      user_id: event.user_id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      request_id: event.request_id, // Include in logs for tracing
    });
  } catch (error) {
    logger.error("Failed to log audit event", error as Error, {
      ...event,
      request_id: event.request_id,
    });
  }
}

/**
 * Audit action constants
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  OTP_VERIFIED: "OTP_VERIFIED",
  OTP_FAILED: "OTP_FAILED",
  
  // Users
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_BANNED: "USER_BANNED",
  USER_UNBANNED: "USER_UNBANNED",
  
  // Categories
  CATEGORY_CREATED: "CATEGORY_CREATED",
  CATEGORY_UPDATED: "CATEGORY_UPDATED",
  CATEGORY_DELETED: "CATEGORY_DELETED",
  
  // Editions
  EDITION_CREATED: "EDITION_CREATED",
  EDITION_UPDATED: "EDITION_UPDATED",
  EDITION_PUBLISHED: "EDITION_PUBLISHED",
  EDITION_DELETED: "EDITION_DELETED",
  
  // Media
  MEDIA_UPLOADED: "MEDIA_UPLOADED",
  MEDIA_DELETED: "MEDIA_DELETED",
  
  // Pages
  PAGE_CREATED: "PAGE_CREATED",
  PAGE_UPDATED: "PAGE_UPDATED",
  PAGE_DELETED: "PAGE_DELETED",
  PAGE_PUBLISHED: "PAGE_PUBLISHED",
  
  // Settings
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
  
  // Security
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT: "INVALID_INPUT",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
