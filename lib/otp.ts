import crypto from 'crypto';

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  blockDurationMinutes: number;
}

export const DEFAULT_OTP_CONFIG: OTPConfig = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  blockDurationMinutes: 60,
};

export class OTPService {
  private config: OTPConfig;

  constructor(config: OTPConfig = DEFAULT_OTP_CONFIG) {
    this.config = config;
  }

  /**
   * Get OTP configuration (public getter)
   */
  getConfig(): OTPConfig {
    return { ...this.config };
  }

  /**
   * Get max attempts setting
   */
  getMaxAttempts(): number {
    return this.config.maxAttempts;
  }

  /**
   * Get block duration in minutes
   */
  getBlockDurationMinutes(): number {
    return this.config.blockDurationMinutes;
  }

  /**
   * Generate a cryptographically secure OTP
   */
  generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < this.config.length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Generate expiry timestamp
   */
  generateExpiryTime(): string {
    const now = new Date();
    const expiry = new Date(now.getTime() + (this.config.expiryMinutes * 60 * 1000));
    return expiry.toISOString();
  }

  /**
   * Check if OTP is expired
   */
  isExpired(expiryTime: string): boolean {
    const now = new Date();
    const expiry = new Date(expiryTime);
    return now > expiry;
  }

  /**
   * Validate OTP format
   */
  isValidFormat(otp: string): boolean {
    const otpRegex = new RegExp(`^\\d{${this.config.length}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Generate block expiry time for rate limiting
   */
  generateBlockExpiry(): string {
    const now = new Date();
    const blockUntil = new Date(now.getTime() + (this.config.blockDurationMinutes * 60 * 1000));
    return blockUntil.toISOString();
  }

  /**
   * Check if user is currently blocked
   */
  isBlocked(blockUntil: string | null): boolean {
    if (!blockUntil) return false;
    const now = new Date();
    const blockExpiry = new Date(blockUntil);
    return now < blockExpiry;
  }

  /**
   * Get remaining block time in minutes
   */
  getRemainingBlockTime(blockUntil: string): number {
    const now = new Date();
    const blockExpiry = new Date(blockUntil);
    const diffMs = blockExpiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60));
  }

  /**
   * Hash OTP for secure storage (optional security layer)
   */
  hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify hashed OTP
   */
  verifyHashedOTP(otp: string, hashedOTP: string): boolean {
    const inputHash = this.hashOTP(otp);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedOTP));
  }

  /**
   * Get client IP from request headers
   */
  getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || remoteAddr || 'unknown';
  }

  /**
   * Get user agent from request
   */
  getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown';
  }

  /**
   * Generate secure random token for additional security
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Singleton instance
export const otpService = new OTPService();
export default otpService;