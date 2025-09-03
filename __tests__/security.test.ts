// Güvenlik testleri
import { validateEmail, validatePassword, validateString, sanitizeHtml } from '../utils/validation';
import { encrypt, decrypt, createHash } from '../utils/encryption';
import { authRateLimiter, bruteForceProtection } from '../utils/rateLimiter';

describe('Security Tests', () => {
  describe('Input Validation', () => {
    test('Email validation should work correctly', () => {
      // Valid emails
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true);
      
      // Invalid emails
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
      expect(validateEmail('@domain.com').isValid).toBe(false);
    });

    test('Password validation should enforce strong passwords', () => {
      // Valid passwords
      expect(validatePassword('StrongPass123!').isValid).toBe(true);
      expect(validatePassword('MySecure1@').isValid).toBe(true);
      
      // Invalid passwords
      expect(validatePassword('weak').isValid).toBe(false);
      expect(validatePassword('12345678').isValid).toBe(false);
      expect(validatePassword('password').isValid).toBe(false);
    });

    test('String validation should prevent XSS', () => {
      const xssString = '<script>alert("xss")</script>';
      const validation = validateString(xssString, {
        required: true,
        minLength: 1,
        maxLength: 100,
        fieldName: 'Test'
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Test geçersiz karakterler içeriyor');
    });
  });

  describe('XSS Protection', () => {
    test('HTML sanitization should remove dangerous tags', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(maliciousInput);
      
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('Safe content');
      expect(result.hasChanges).toBe(true);
    });

    test('Should remove iframe tags', () => {
      const input = '<iframe src="malicious.com"></iframe>Safe content';
      const result = sanitizeHtml(input);
      
      expect(result.sanitized).not.toContain('<iframe');
      expect(result.sanitized).toContain('Safe content');
    });

    test('Should remove javascript: protocols', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeHtml(input);
      
      expect(result.sanitized).not.toContain('javascript:');
    });
  });

  describe('Encryption', () => {
    test('Encryption and decryption should work correctly', () => {
      const originalText = 'Sensitive data';
      const password = 'test-password';
      
      const encrypted = encrypt(originalText, password);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      
      const decrypted = decrypt(encrypted, password);
      expect(decrypted.success).toBe(true);
      expect(decrypted.decrypted).toBe(originalText);
    });

    test('Decryption should fail with wrong password', () => {
      const originalText = 'Sensitive data';
      const password = 'test-password';
      const wrongPassword = 'wrong-password';
      
      const encrypted = encrypt(originalText, password);
      const decrypted = decrypt(encrypted, wrongPassword);
      
      expect(decrypted.success).toBe(false);
      expect(decrypted.decrypted).toBe('');
    });

    test('Hash function should produce consistent results', () => {
      const text = 'test text';
      const hash1 = createHash(text);
      const hash2 = createHash(text);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });
  });

  describe('Rate Limiting', () => {
    test('Rate limiter should allow requests within limit', async () => {
      const identifier = 'test-user';
      const result = await authRateLimiter.checkRateLimit(identifier, 'test');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    test('Rate limiter should block requests exceeding limit', async () => {
      const identifier = 'test-user-2';
      
      // Make multiple requests to exceed limit
      for (let i = 0; i < 10; i++) {
        await authRateLimiter.recordRequest(identifier, 'test', true);
      }
      
      const result = await authRateLimiter.checkRateLimit(identifier, 'test');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Brute Force Protection', () => {
    test('Should track failed attempts', async () => {
      const identifier = 'test-user-3';
      
      const result1 = await bruteForceProtection.recordFailedAttempt(identifier);
      expect(result1.remainingAttempts).toBe(4);
      
      const result2 = await bruteForceProtection.recordFailedAttempt(identifier);
      expect(result2.remainingAttempts).toBe(3);
    });

    test('Should lock after max attempts', async () => {
      const identifier = 'test-user-4';
      
      // Make max failed attempts
      for (let i = 0; i < 5; i++) {
        await bruteForceProtection.recordFailedAttempt(identifier);
      }
      
      const isLocked = await bruteForceProtection.isLocked(identifier);
      expect(isLocked).toBe(true);
    });

    test('Should unlock after successful attempt', async () => {
      const identifier = 'test-user-5';
      
      // Make failed attempts
      await bruteForceProtection.recordFailedAttempt(identifier);
      await bruteForceProtection.recordFailedAttempt(identifier);
      
      // Record successful attempt
      await bruteForceProtection.recordSuccessfulAttempt(identifier);
      
      const isLocked = await bruteForceProtection.isLocked(identifier);
      expect(isLocked).toBe(false);
    });
  });

  describe('Security Configuration', () => {
    test('Should have proper security config', () => {
      const { securityConfig } = require('../config/security');
      
      expect(securityConfig.rateLimiting.maxRequestsPerMinute).toBe(60);
      expect(securityConfig.rateLimiting.maxLoginAttempts).toBe(5);
      expect(securityConfig.rateLimiting.lockoutDuration).toBe(15);
      expect(securityConfig.encryption.algorithm).toBe('AES-256-GCM');
      expect(securityConfig.validation.maxStringLength).toBe(1000);
    });
  });

  describe('Data Sanitization', () => {
    test('Should sanitize SQL injection attempts', () => {
      const { sanitizeSqlInput } = require('../utils/validation');
      
      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = sanitizeSqlInput(maliciousInput);
      
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain("'");
    });

    test('Should handle empty and null inputs', () => {
      const { sanitizeHtml } = require('../utils/validation');
      
      expect(sanitizeHtml('').sanitized).toBe('');
      expect(sanitizeHtml(null as any).sanitized).toBe('');
      expect(sanitizeHtml(undefined as any).sanitized).toBe('');
    });
  });

  describe('File Validation', () => {
    test('Should validate file types', () => {
      const { validateFile } = require('../utils/validation');
      
      // Valid file
      const validFile = {
        name: 'test.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };
      expect(validateFile(validFile).isValid).toBe(true);
      
      // Invalid file type
      const invalidFile = {
        name: 'test.exe',
        size: 1024,
        type: 'application/x-executable'
      };
      expect(validateFile(invalidFile).isValid).toBe(false);
      
      // File too large
      const largeFile = {
        name: 'test.jpg',
        size: 20 * 1024 * 1024, // 20MB
        type: 'image/jpeg'
      };
      expect(validateFile(largeFile).isValid).toBe(false);
    });
  });
});

// Integration tests
describe('Security Integration Tests', () => {
  test('Complete authentication flow should be secure', async () => {
    const email = 'test@example.com';
    const password = 'StrongPass123!';
    const deviceFingerprint = 'test-device';
    
    // Validate inputs
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    expect(emailValidation.isValid).toBe(true);
    expect(passwordValidation.isValid).toBe(true);
    
    // Check rate limiting
    const rateLimitCheck = await authRateLimiter.checkRateLimit(deviceFingerprint, 'login');
    expect(rateLimitCheck.allowed).toBe(true);
    
    // Check brute force protection
    const isLocked = await bruteForceProtection.isLocked(deviceFingerprint);
    expect(isLocked).toBe(false);
  });

  test('Data processing should be secure', () => {
    const userInput = '<script>alert("xss")</script>Hello World';
    const sensitiveData = 'Credit card: 1234-5678-9012-3456';
    
    // Sanitize input
    const sanitized = sanitizeHtml(userInput);
    expect(sanitized.sanitized).not.toContain('<script>');
    expect(sanitized.sanitized).toContain('Hello World');
    
    // Encrypt sensitive data
    const encrypted = encrypt(sensitiveData, 'test-key');
    expect(encrypted.encrypted).toBeDefined();
    expect(encrypted.encrypted).not.toContain('1234-5678');
  });
});
