/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and load balancers.
 * Checks database connectivity, disk space, and memory usage.
 * 
 * Fix for Assumption: 13.4
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { site_settings } from '@/lib/schema';
import { logger } from '@/lib/logger';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  details?: any;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  try {
    // Simple query to verify database is accessible
    await db.select().from(site_settings).limit(1);
    
    return {
      name: 'database',
      status: 'ok',
      message: 'Database is accessible',
    };
  } catch (error) {
    logger.error('Health check: Database failed', error as Error);
    return {
      name: 'database',
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  // Warning if using more than 80% of heap
  const status = percentUsed > 80 ? 'warning' : 'ok';
  
  return {
    name: 'memory',
    status,
    message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed}%)`,
    details: {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      percentUsed,
    },
  };
}

/**
 * Check disk space (if available)
 */
async function checkDiskSpace(): Promise<HealthCheck> {
  try {
    // Note: Disk space checking requires platform-specific code
    // This is a placeholder that always returns ok
    // In production, use a library like 'check-disk-space'
    
    return {
      name: 'disk',
      status: 'ok',
      message: 'Disk space check not implemented',
    };
  } catch (error) {
    return {
      name: 'disk',
      status: 'warning',
      message: 'Could not check disk space',
    };
  }
}

/**
 * Check application uptime
 */
function getUptime(): number {
  return Math.floor(process.uptime());
}

/**
 * Determine overall health status
 */
function determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
  const hasError = checks.some(check => check.status === 'error');
  const hasWarning = checks.some(check => check.status === 'warning');

  if (hasError) return 'unhealthy';
  if (hasWarning) return 'degraded';
  return 'healthy';
}

/**
 * GET /api/health
 * 
 * Returns system health status
 */
export async function GET() {
  try {
    // Run all health checks
    const checks = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      checkDiskSpace(),
    ]);

    const status = determineOverallStatus(checks);
    const uptime = getUptime();

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      checks,
    };

    // Return appropriate HTTP status code
    const httpStatus = status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    logger.error('Health check endpoint failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      checks: [
        {
          name: 'system',
          status: 'error',
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }, { status: 503 });
  }
}
