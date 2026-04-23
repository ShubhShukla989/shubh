/**
 * Abuse Detection System
 * 
 * Detects and prevents:
 * - Login brute force attacks
 * - Account enumeration
 * - Credential stuffing
 * - Suspicious patterns
 * 
 * Works alongside rate limiting for comprehensive protection
 */

import { db } from "./db";
import { logger } from "./logger";
import { logAuditEvent, AUDIT_ACTIONS } from "./auditLog";

interface AbuseRecord {
  ip: string;
  failedLogins: number;
  lastFailedLogin: number;
  blockedUntil: number | null;
  suspiciousPatterns: string[];
}

// In-memory abuse tracking (use Redis in production)
const abuseStore = new Map<string, AbuseRecord>();

// Configuration
const ABUSE_CONFIG = {
  MAX_FAILED_LOGINS: 5,
  BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hour
  FAILED_LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  SUSPICIOUS_THRESHOLD: 3,
};

/**
 * Track failed login attempt
 */
export async function trackFailedLogin(
  ip: string,
  email: string,
  userAgent: string,
  requestId?: string
): Promise<{ blocked: boolean; reason?: string }> {
  const now = Date.now();
  let record = abuseStore.get(ip);
  
  if (!record) {
    record = {
      ip,
      failedLogins: 0,
      lastFailedLogin: 0,
      blockedUntil: null,
      suspiciousPatterns: [],
    };
    abuseStore.set(ip, record);
  }
  
  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    logger.warn("Blocked IP attempted login", {
      ip,
      email,
      requestId,
      remainingBlockTime: Math.ceil((record.blockedUntil - now) / 1000),
    });
    
    return {
      blocked: true,
      reason: "Too many failed login attempts. Please try again later.",
    };
  }
  
  // Reset counter if outside window
  if (now - record.lastFailedLogin > ABUSE_CONFIG.FAILED_LOGIN_WINDOW_MS) {
    record.failedLogins = 0;
    record.suspiciousPatterns = [];
  }
  
  // Increment failed login counter
  record.failedLogins++;
  record.lastFailedLogin = now;
  
  // Detect suspicious patterns
  const patterns = detectSuspiciousPatterns(email, userAgent, record);
  record.suspiciousPatterns.push(...patterns);
  
  // Block if threshold exceeded
  if (record.failedLogins >= ABUSE_CONFIG.MAX_FAILED_LOGINS) {
    record.blockedUntil = now + ABUSE_CONFIG.BLOCK_DURATION_MS;
    
    logger.warn("IP blocked due to failed login attempts", {
      ip,
      email,
      failedLogins: record.failedLogins,
      patterns: record.suspiciousPatterns,
      requestId,
    });
    
    // Log to audit trail
    await logAuditEvent({
      action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      details: {
        type: "brute_force_login",
        ip,
        email,
        failedLogins: record.failedLogins,
        patterns: record.suspiciousPatterns,
      },
      ip_address: ip,
      user_agent: userAgent,
      request_id: requestId,
    });
    
    return {
      blocked: true,
      reason: "Too many failed login attempts. Account temporarily locked.",
    };
  }
  
  // Warn if approaching threshold
  if (record.failedLogins >= ABUSE_CONFIG.MAX_FAILED_LOGINS - 2) {
    logger.warn("IP approaching failed login threshold", {
      ip,
      email,
      failedLogins: record.failedLogins,
      remaining: ABUSE_CONFIG.MAX_FAILED_LOGINS - record.failedLogins,
      requestId,
    });
  }
  
  return { blocked: false };
}

/**
 * Track successful login (clears abuse record)
 */
export function trackSuccessfulLogin(ip: string): void {
  const record = abuseStore.get(ip);
  if (record) {
    record.failedLogins = 0;
    record.suspiciousPatterns = [];
    record.blockedUntil = null;
  }
}

/**
 * Detect suspicious patterns
 */
function detectSuspiciousPatterns(
  email: string,
  userAgent: string,
  record: AbuseRecord
): string[] {
  const patterns: string[] = [];
  
  // Pattern 1: Rapid-fire attempts
  const now = Date.now();
  if (record.lastFailedLogin && now - record.lastFailedLogin < 1000) {
    patterns.push("rapid_fire_attempts");
  }
  
  // Pattern 2: Common test emails
  const testEmails = ["admin@", "test@", "user@", "demo@"];
  if (testEmails.some(test => email.toLowerCase().startsWith(test))) {
    patterns.push("test_email_pattern");
  }
  
  // Pattern 3: Missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    patterns.push("suspicious_user_agent");
  }
  
  // Pattern 4: Automated tool signatures
  const botSignatures = ["curl", "python", "bot", "crawler", "scanner"];
  if (botSignatures.some(sig => userAgent.toLowerCase().includes(sig))) {
    patterns.push("automated_tool");
  }
  
  return patterns;
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
  const record = abuseStore.get(ip);
  if (!record || !record.blockedUntil) return false;
  
  const now = Date.now();
  if (now >= record.blockedUntil) {
    // Block expired
    record.blockedUntil = null;
    return false;
  }
  
  return true;
}

/**
 * Get abuse status for IP
 */
export function getAbuseStatus(ip: string): {
  blocked: boolean;
  failedLogins: number;
  remainingAttempts: number;
  blockedUntil: Date | null;
} {
  const record = abuseStore.get(ip);
  
  if (!record) {
    return {
      blocked: false,
      failedLogins: 0,
      remainingAttempts: ABUSE_CONFIG.MAX_FAILED_LOGINS,
      blockedUntil: null,
    };
  }
  
  const now = Date.now();
  const blocked = record.blockedUntil ? now < record.blockedUntil : false;
  
  return {
    blocked,
    failedLogins: record.failedLogins,
    remainingAttempts: Math.max(0, ABUSE_CONFIG.MAX_FAILED_LOGINS - record.failedLogins),
    blockedUntil: record.blockedUntil ? new Date(record.blockedUntil) : null,
  };
}

/**
 * Manually unblock IP (admin function)
 */
export function unblockIP(ip: string): void {
  const record = abuseStore.get(ip);
  if (record) {
    record.blockedUntil = null;
    record.failedLogins = 0;
    record.suspiciousPatterns = [];
    logger.info("IP manually unblocked", { ip });
  }
}

/**
 * Clear abuse records (cleanup old entries)
 */
export function cleanupAbuseRecords(): void {
  const now = Date.now();
  const expiredIPs: string[] = [];
  
  for (const [ip, record] of abuseStore.entries()) {
    // Remove if block expired and no recent activity
    if (
      (!record.blockedUntil || now >= record.blockedUntil) &&
      now - record.lastFailedLogin > ABUSE_CONFIG.FAILED_LOGIN_WINDOW_MS
    ) {
      expiredIPs.push(ip);
    }
  }
  
  expiredIPs.forEach(ip => abuseStore.delete(ip));
  
  if (expiredIPs.length > 0) {
    logger.info("Cleaned up abuse records", { count: expiredIPs.length });
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupAbuseRecords, 5 * 60 * 1000);
}
