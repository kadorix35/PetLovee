// Input validation ve güvenlik yardımcı fonksiyonları
import { securityConfig } from '../config/security';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SanitizationResult {
  sanitized: string;
  hasChanges: boolean;
}

// XSS koruması için HTML sanitization
export const sanitizeHtml = (input: string): SanitizationResult => {
  if (typeof input !== 'string') {
    return { sanitized: '', hasChanges: true };
  }

  const original = input;
  
  // Tehlikeli HTML etiketlerini kaldır
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&lt;script/gi, '')
    .replace(/&lt;iframe/gi, '')
    .replace(/&lt;object/gi, '')
    .replace(/&lt;embed/gi, '')
    .replace(/&lt;link/gi, '')
    .replace(/&lt;meta/gi, '')
    .trim();

  return {
    sanitized,
    hasChanges: original !== sanitized
  };
};

// SQL Injection koruması
export const sanitizeSqlInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/['"]/g, '')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/union/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .replace(/create/gi, '')
    .replace(/alter/gi, '')
    .replace(/exec/gi, '')
    .replace(/execute/gi, '')
    .trim();
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('E-posta adresi gerekli');
    return { isValid: false, errors };
  }

  if (email.length > 254) {
    errors.push('E-posta adresi çok uzun');
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    errors.push('Geçersiz e-posta formatı');
  }

  // XSS koruması
  const sanitized = sanitizeHtml(email);
  if (sanitized.hasChanges) {
    errors.push('E-posta adresinde geçersiz karakterler');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Şifre gerekli');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalı');
  }

  if (password.length > 128) {
    errors.push('Şifre çok uzun');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermeli');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermeli');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermeli');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Şifre en az bir özel karakter içermeli');
  }

  // Yaygın şifreleri kontrol et
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Bu şifre çok yaygın kullanılıyor');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// String validation
export const validateString = (input: string, options: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowHtml?: boolean;
  pattern?: RegExp;
  fieldName?: string;
} = {}): ValidationResult => {
  const errors: string[] = [];
  const {
    required = true,
    minLength = 0,
    maxLength = securityConfig.validation.maxStringLength,
    allowHtml = false,
    pattern,
    fieldName = 'Metin'
  } = options;

  if (required && (!input || typeof input !== 'string')) {
    errors.push(`${fieldName} gerekli`);
    return { isValid: false, errors };
  }

  if (input && typeof input === 'string') {
    if (input.length < minLength) {
      errors.push(`${fieldName} en az ${minLength} karakter olmalı`);
    }

    if (input.length > maxLength) {
      errors.push(`${fieldName} en fazla ${maxLength} karakter olabilir`);
    }

    if (pattern && !pattern.test(input)) {
      errors.push(`${fieldName} geçersiz format`);
    }

    // XSS koruması
    if (!allowHtml) {
      const sanitized = sanitizeHtml(input);
      if (sanitized.hasChanges) {
        errors.push(`${fieldName} geçersiz karakterler içeriyor`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFile = (file: {
  name: string;
  size: number;
  type: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!file) {
    errors.push('Dosya gerekli');
    return { isValid: false, errors };
  }

  // Dosya boyutu kontrolü
  if (file.size > securityConfig.validation.maxFileSize) {
    errors.push(`Dosya boyutu ${securityConfig.validation.maxFileSize / (1024 * 1024)}MB'dan büyük olamaz`);
  }

  // Dosya tipi kontrolü
  if (!securityConfig.validation.allowedFileTypes.includes(file.type)) {
    errors.push('Desteklenmeyen dosya tipi');
  }

  // Dosya adı kontrolü
  const nameValidation = validateString(file.name, {
    required: true,
    minLength: 1,
    maxLength: 255,
    fieldName: 'Dosya adı'
  });

  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Tehlikeli dosya uzantıları
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
  const hasDangerousExtension = dangerousExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );

  if (hasDangerousExtension) {
    errors.push('Tehlikeli dosya tipi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// URL validation
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL gerekli');
    return { isValid: false, errors };
  }

  try {
    const urlObj = new URL(url);
    
    // Sadece güvenli protokollere izin ver
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('Sadece HTTP ve HTTPS protokolleri desteklenir');
    }

    // XSS koruması
    const sanitized = sanitizeHtml(url);
    if (sanitized.hasChanges) {
      errors.push('URL geçersiz karakterler içeriyor');
    }

  } catch (error) {
    errors.push('Geçersiz URL formatı');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    errors.push('Telefon numarası gerekli');
    return { isValid: false, errors };
  }

  // Sadece rakam, +, -, ( ve ) karakterlerine izin ver
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
  
  if (!phoneRegex.test(phone)) {
    errors.push('Geçersiz telefon numarası formatı');
  }

  // Minimum ve maksimum uzunluk kontrolü
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.length < 10) {
    errors.push('Telefon numarası çok kısa');
  }

  if (cleanPhone.length > 15) {
    errors.push('Telefon numarası çok uzun');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Pet data validation
export const validatePetData = (petData: {
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  bio: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  const nameValidation = validateString(petData.name, {
    required: true,
    minLength: 1,
    maxLength: 50,
    fieldName: 'Pet adı'
  });
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Species validation
  const speciesValidation = validateString(petData.species, {
    required: true,
    minLength: 1,
    maxLength: 30,
    fieldName: 'Tür'
  });
  if (!speciesValidation.isValid) {
    errors.push(...speciesValidation.errors);
  }

  // Breed validation
  const breedValidation = validateString(petData.breed, {
    required: true,
    minLength: 1,
    maxLength: 50,
    fieldName: 'Irk'
  });
  if (!breedValidation.isValid) {
    errors.push(...breedValidation.errors);
  }

  // Age validation
  const ageValidation = validateString(petData.age, {
    required: true,
    minLength: 1,
    maxLength: 20,
    fieldName: 'Yaş'
  });
  if (!ageValidation.isValid) {
    errors.push(...ageValidation.errors);
  }

  // Gender validation
  if (!['Erkek', 'Dişi'].includes(petData.gender)) {
    errors.push('Geçersiz cinsiyet seçimi');
  }

  // Bio validation
  const bioValidation = validateString(petData.bio, {
    required: false,
    minLength: 0,
    maxLength: 500,
    fieldName: 'Biyografi'
  });
  if (!bioValidation.isValid) {
    errors.push(...bioValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Post data validation
export const validatePostData = (postData: {
  caption: string;
  type: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Caption validation
  const captionValidation = validateString(postData.caption, {
    required: true,
    minLength: 1,
    maxLength: 1000,
    fieldName: 'Açıklama'
  });
  if (!captionValidation.isValid) {
    errors.push(...captionValidation.errors);
  }

  // Type validation
  if (!['photo', 'video'].includes(postData.type)) {
    errors.push('Geçersiz post tipi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comment validation
export const validateComment = (comment: string): ValidationResult => {
  return validateString(comment, {
    required: true,
    minLength: 1,
    maxLength: 500,
    fieldName: 'Yorum'
  });
};

// Rate limiting için IP validation
export const validateIpAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export default {
  sanitizeHtml,
  sanitizeSqlInput,
  validateEmail,
  validatePassword,
  validateString,
  validateFile,
  validateUrl,
  validatePhoneNumber,
  validatePetData,
  validatePostData,
  validateComment,
  validateIpAddress
};
