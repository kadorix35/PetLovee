// Encryption ve güvenlik yardımcı fonksiyonları
import CryptoJS from 'crypto-js';
import { securityConfig } from '../config/security';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface DecryptionResult {
  decrypted: string;
  success: boolean;
}

// Güvenli rastgele string oluşturma
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Salt oluşturma
export const generateSalt = (): string => {
  return generateSecureRandomString(16);
};

// Key derivation (PBKDF2)
export const deriveKey = (password: string, salt: string, iterations: number = 10000): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: securityConfig.encryption.keyLength / 4, // CryptoJS uses 32-bit words
    iterations: iterations
  }).toString();
};

// AES-256-GCM encryption
export const encrypt = (text: string, password: string): EncryptionResult => {
  try {
    const salt = generateSalt();
    const key = deriveKey(password, salt);
    const iv = generateSecureRandomString(16);
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv,
      salt: salt
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error);
  }
};

// AES-256-GCM decryption
export const decrypt = (encryptedData: EncryptionResult, password: string): DecryptionResult => {
  try {
    const key = deriveKey(password, encryptedData.salt);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    return {
      decrypted: decryptedText,
      success: decryptedText.length > 0
    };
  } catch (error) {
    return {
      decrypted: '',
      success: false
    };
  }
};

// Hash oluşturma (SHA-256)
export const createHash = (text: string, salt?: string): string => {
  const textToHash = salt ? text + salt : text;
  return CryptoJS.SHA256(textToHash).toString();
};

// HMAC oluşturma
export const createHmac = (text: string, secret: string): string => {
  return CryptoJS.HmacSHA256(text, secret).toString();
};

// Token oluşturma
export const generateSecureToken = (length: number = 64): string => {
  return generateSecureRandomString(length);
};

// JWT benzeri token oluşturma
export const createSecureToken = (payload: any, secret: string, expiresIn: number = 3600): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(tokenPayload));
  
  const signature = createHmac(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Token doğrulama
export const verifySecureToken = (token: string, secret: string): { valid: boolean; payload?: any; error?: string } => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Signature doğrulama
    const expectedSignature = createHmac(`${encodedHeader}.${encodedPayload}`, secret);
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Payload decode
    const payload = JSON.parse(atob(encodedPayload));
    
    // Expiration kontrolü
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
};

// Sensitive data masking
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  
  return masked + visible;
};

// Email masking
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const maskedLocal = localPart.length > 2 
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
};

// Phone number masking
export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length < 4) return '*'.repeat(phone.length);
  
  const visible = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  
  return masked + visible;
};

// Credit card masking
export const maskCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return '*'.repeat(cardNumber.length);
  
  const visible = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  
  return masked + visible;
};

// Secure comparison (timing attack koruması)
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('En az 8 karakter olmalı');

  if (password.length >= 12) score += 1;
  else feedback.push('12+ karakter daha güvenli');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Küçük harf ekleyin');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Büyük harf ekleyin');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Rakam ekleyin');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Özel karakter ekleyin');

  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123|abc|qwe/i, // Sequential patterns
    /password|admin|user/i // Common words
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (!hasCommonPattern) score += 1;
  else feedback.push('Yaygın kalıplardan kaçının');

  return { score, feedback };
};

export default {
  generateSecureRandomString,
  generateSalt,
  deriveKey,
  encrypt,
  decrypt,
  createHash,
  createHmac,
  generateSecureToken,
  createSecureToken,
  verifySecureToken,
  maskSensitiveData,
  maskEmail,
  maskPhoneNumber,
  maskCreditCard,
  secureCompare,
  checkPasswordStrength
};
