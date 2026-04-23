/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at application startup.
 * Prevents runtime crashes due to missing configuration.
 * 
 * Fix for Assumptions: 1.1, 2.1
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

const PRODUCTION_REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SITE_URL',
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are set
 * @throws Error if critical environment variables are missing
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check production-specific variables
  if (process.env.NODE_ENV === 'production') {
    for (const key of PRODUCTION_REQUIRED_ENV_VARS) {
      if (!process.env[key]) {
        warnings.push(key);
      }
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    warnings.push('DATABASE_URL should start with "postgresql://" for PostgreSQL');
  }

  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters for security');
  }

  const result: ValidationResult = {
    valid: missing.length === 0,
    missing,
    warnings,
  };

  return result;
}

/**
 * Validates environment and throws if critical variables are missing
 * Call this at application startup
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = [
      '❌ Environment Validation Failed',
      '',
      'Missing required environment variables:',
      ...result.missing.map(key => `  - ${key}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.local.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log warnings but don't throw
  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with validation
 * Throws clear error if variable is missing
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
