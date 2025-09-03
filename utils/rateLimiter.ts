// Rate limiting ve güvenlik middleware
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityConfig, logSecurityEvent } from '../config/security';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RequestLog {
  timestamp: number;
  success: boolean;
  endpoint: string;
  userAgent?: string;
  ip?: string;
}

class RateLimiter {
  private storage: Map<string, RequestLog[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanupExpiredEntries();
  }

  // Rate limit kontrolü
  async checkRateLimit(identifier: string, endpoint: string = 'default'): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Mevcut istekleri al
    let requests = this.storage.get(key) || [];
    
    // Eski istekleri temizle
    requests = requests.filter(req => req.timestamp > windowStart);
    
    // Başarılı/başarısız istekleri filtrele
    if (this.config.skipSuccessfulRequests) {
      requests = requests.filter(req => !req.success);
    }
    if (this.config.skipFailedRequests) {
      requests = requests.filter(req => req.success);
    }

    const requestCount = requests.length;
    const remaining = Math.max(0, this.config.maxRequests - requestCount);
    const resetTime = windowStart + this.config.windowMs;

    if (requestCount >= this.config.maxRequests) {
      // Rate limit aşıldı
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        identifier: this.maskIdentifier(identifier),
        endpoint,
        requestCount,
        windowMs: this.config.windowMs
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime
    };
  }

  // İstek kaydet
  async recordRequest(identifier: string, endpoint: string, success: boolean, userAgent?: string, ip?: string): Promise<void> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();

    const request: RequestLog = {
      timestamp: now,
      success,
      endpoint,
      userAgent,
      ip
    };

    const requests = this.storage.get(key) || [];
    requests.push(request);
    
    // Sadece son 24 saatlik veriyi sakla
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const filteredRequests = requests.filter(req => req.timestamp > dayAgo);
    
    this.storage.set(key, filteredRequests);

    // AsyncStorage'a da kaydet (persistence için)
    try {
      await AsyncStorage.setItem(`rate_limit_${key}`, JSON.stringify(filteredRequests));
    } catch (error) {
      console.warn('Rate limit data could not be saved to AsyncStorage:', error);
    }
  }

  // Rate limit durumunu al
  async getRateLimitStatus(identifier: string): Promise<{
    requests: number;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requests = this.storage.get(key) || [];
    requests = requests.filter(req => req.timestamp > windowStart);

    const requestCount = requests.length;
    const remaining = Math.max(0, this.config.maxRequests - requestCount);
    const resetTime = windowStart + this.config.windowMs;

    return {
      requests: requestCount,
      remaining,
      resetTime
    };
  }

  // Rate limit sıfırla
  async resetRateLimit(identifier: string): Promise<void> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.storage.delete(key);
    
    try {
      await AsyncStorage.removeItem(`rate_limit_${key}`);
    } catch (error) {
      console.warn('Rate limit data could not be removed from AsyncStorage:', error);
    }
  }

  // Eski kayıtları temizle
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);

    for (const [key, requests] of this.storage.entries()) {
      const filteredRequests = requests.filter(req => req.timestamp > dayAgo);
      if (filteredRequests.length === 0) {
        this.storage.delete(key);
      } else {
        this.storage.set(key, filteredRequests);
      }
    }
  }

  // Identifier'ı maskele (privacy için)
  private maskIdentifier(identifier: string): string {
    if (identifier.length <= 4) {
      return '*'.repeat(identifier.length);
    }
    return identifier.slice(0, 2) + '*'.repeat(identifier.length - 4) + identifier.slice(-2);
  }

  // AsyncStorage'dan veri yükle
  async loadFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith('rate_limit_'));
      
      for (const key of rateLimitKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const requests: RequestLog[] = JSON.parse(data);
          const identifier = key.replace('rate_limit_', '');
          this.storage.set(identifier, requests);
        }
      }
    } catch (error) {
      console.warn('Rate limit data could not be loaded from AsyncStorage:', error);
    }
  }
}

// Önceden tanımlanmış rate limiter'lar
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 dakika
  maxRequests: securityConfig.rateLimiting.maxLoginAttempts,
  keyGenerator: (identifier) => `auth_${identifier}`,
  skipSuccessfulRequests: true
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 dakika
  maxRequests: securityConfig.rateLimiting.maxRequestsPerMinute,
  keyGenerator: (identifier) => `api_${identifier}`
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 saat
  maxRequests: 10, // Saatte maksimum 10 upload
  keyGenerator: (identifier) => `upload_${identifier}`
});

export const commentRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 dakika
  maxRequests: 5, // Dakikada maksimum 5 yorum
  keyGenerator: (identifier) => `comment_${identifier}`
});

// Rate limiting middleware
export const createRateLimitMiddleware = (rateLimiter: RateLimiter) => {
  return async (identifier: string, endpoint: string, userAgent?: string, ip?: string) => {
    // Rate limit kontrolü
    const rateLimitResult = await rateLimiter.checkRateLimit(identifier, endpoint);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }

    return {
      recordSuccess: () => rateLimiter.recordRequest(identifier, endpoint, true, userAgent, ip),
      recordFailure: () => rateLimiter.recordRequest(identifier, endpoint, false, userAgent, ip),
      rateLimitInfo: rateLimitResult
    };
  };
};

// IP-based rate limiting
export const createIpRateLimitMiddleware = (rateLimiter: RateLimiter) => {
  return async (ip: string, endpoint: string, userAgent?: string) => {
    return createRateLimitMiddleware(rateLimiter)(ip, endpoint, userAgent, ip);
  };
};

// User-based rate limiting
export const createUserRateLimitMiddleware = (rateLimiter: RateLimiter) => {
  return async (userId: string, endpoint: string, userAgent?: string, ip?: string) => {
    return createRateLimitMiddleware(rateLimiter)(userId, endpoint, userAgent, ip);
  };
};

// Device fingerprint-based rate limiting
export const createDeviceRateLimitMiddleware = (rateLimiter: RateLimiter) => {
  return async (deviceFingerprint: string, endpoint: string, userAgent?: string, ip?: string) => {
    return createRateLimitMiddleware(rateLimiter)(deviceFingerprint, endpoint, userAgent, ip);
  };
};

// Brute force protection
export class BruteForceProtection {
  private failedAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();

  async recordFailedAttempt(identifier: string): Promise<{ isLocked: boolean; remainingAttempts: number; lockoutTime?: number }> {
    const now = Date.now();
    const lockoutDuration = securityConfig.rateLimiting.lockoutDuration * 60 * 1000; // dakika to ms
    
    let attempts = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // Lockout süresi geçmişse sıfırla
    if (attempts.lockedUntil && now > attempts.lockedUntil) {
      attempts = { count: 0, lastAttempt: 0 };
    }
    
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    // Maksimum deneme sayısına ulaşıldıysa kilitle
    if (attempts.count >= securityConfig.rateLimiting.maxLoginAttempts) {
      attempts.lockedUntil = now + lockoutDuration;
      
      logSecurityEvent('BRUTE_FORCE_LOCKOUT', {
        identifier: this.maskIdentifier(identifier),
        attempts: attempts.count,
        lockoutDuration: securityConfig.rateLimiting.lockoutDuration
      });
    }
    
    this.failedAttempts.set(identifier, attempts);
    
    return {
      isLocked: !!(attempts.lockedUntil && now < attempts.lockedUntil),
      remainingAttempts: Math.max(0, securityConfig.rateLimiting.maxLoginAttempts - attempts.count),
      lockoutTime: attempts.lockedUntil
    };
  }

  async recordSuccessfulAttempt(identifier: string): Promise<void> {
    this.failedAttempts.delete(identifier);
  }

  async isLocked(identifier: string): Promise<boolean> {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return false;
    
    const now = Date.now();
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return true;
    }
    
    // Lockout süresi geçmişse temizle
    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
      this.failedAttempts.delete(identifier);
    }
    
    return false;
  }

  private maskIdentifier(identifier: string): string {
    if (identifier.length <= 4) {
      return '*'.repeat(identifier.length);
    }
    return identifier.slice(0, 2) + '*'.repeat(identifier.length - 4) + identifier.slice(-2);
  }
}

export const bruteForceProtection = new BruteForceProtection();

export default {
  RateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  commentRateLimiter,
  createRateLimitMiddleware,
  createIpRateLimitMiddleware,
  createUserRateLimitMiddleware,
  createDeviceRateLimitMiddleware,
  BruteForceProtection,
  bruteForceProtection
};
