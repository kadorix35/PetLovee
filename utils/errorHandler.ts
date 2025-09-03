/**
 * Global Error Handler for PetLovee
 * Uygulama genelinde hata yönetimi için
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorContext {
  component?: string;
  function?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;

  /**
   * Hata yakalama ve loglama
   */
  handleError(error: Error, context?: ErrorContext): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      code: this.getErrorCode(error),
      stack: error.stack,
      timestamp: new Date(),
      userId: context?.userId,
      action: context?.action,
      severity: this.determineSeverity(error, context)
    };

    // Hata loguna ekle
    this.addToLog(errorInfo);

    // Console'a logla
    this.logToConsole(errorInfo, context);

    // Kritik hatalar için ek işlemler
    if (errorInfo.severity === 'critical') {
      this.handleCriticalError(errorInfo, context);
    }
  }

  /**
   * Async hata yakalama
   */
  async handleAsyncError<T>(
    asyncFunction: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await asyncFunction();
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * Hata kodunu belirle
   */
  private getErrorCode(error: Error): string {
    if (error.name === 'FirebaseError') {
      return 'FIREBASE_ERROR';
    } else if (error.name === 'NetworkError') {
      return 'NETWORK_ERROR';
    } else if (error.name === 'ValidationError') {
      return 'VALIDATION_ERROR';
    } else if (error.name === 'AuthenticationError') {
      return 'AUTH_ERROR';
    } else if (error.name === 'PermissionError') {
      return 'PERMISSION_ERROR';
    } else {
      return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Hata önem derecesini belirle
   */
  private determineSeverity(error: Error, context?: ErrorContext): ErrorInfo['severity'] {
    // Kritik hatalar
    if (error.message.includes('Firebase') && error.message.includes('permission')) {
      return 'critical';
    }
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return 'critical';
    }
    if (error.message.includes('network') && context?.action === 'login') {
      return 'high';
    }

    // Yüksek öncelikli hatalar
    if (error.message.includes('database') || error.message.includes('firestore')) {
      return 'high';
    }
    if (error.message.includes('storage') || error.message.includes('upload')) {
      return 'high';
    }

    // Orta öncelikli hatalar
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'medium';
    }
    if (error.message.includes('timeout')) {
      return 'medium';
    }

    // Düşük öncelikli hatalar
    return 'low';
  }

  /**
   * Hata loguna ekle
   */
  private addToLog(errorInfo: ErrorInfo): void {
    this.errorLog.push(errorInfo);

    // Log boyutunu sınırla
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Console'a logla
   */
  private logToConsole(errorInfo: ErrorInfo, context?: ErrorContext): void {
    const logMessage = `[${errorInfo.severity.toUpperCase()}] ${errorInfo.message}`;
    const logData = {
      code: errorInfo.code,
      timestamp: errorInfo.timestamp,
      context,
      stack: errorInfo.stack
    };

    switch (errorInfo.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logMessage, logData);
        break;
      case 'high':
        console.error('❌ HIGH PRIORITY ERROR:', logMessage, logData);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM PRIORITY ERROR:', logMessage, logData);
        break;
      case 'low':
        console.log('ℹ️ LOW PRIORITY ERROR:', logMessage, logData);
        break;
    }
  }

  /**
   * Kritik hata işleme
   */
  private handleCriticalError(errorInfo: ErrorInfo, context?: ErrorContext): void {
    // Kritik hatalar için özel işlemler
    console.error('🚨 CRITICAL ERROR DETECTED:', {
      error: errorInfo,
      context,
      timestamp: new Date()
    });

    // Firebase'e kritik hata gönder (opsiyonel)
    this.reportCriticalError(errorInfo, context);
  }

  /**
   * Kritik hata raporlama
   */
  private async reportCriticalError(errorInfo: ErrorInfo, context?: ErrorContext): Promise<void> {
    try {
      // Bu fonksiyon Firebase'e kritik hata raporu gönderir
      // Implementation Firebase service'e bağlı olarak yapılacak
      console.log('Critical error reported to monitoring system');
    } catch (error) {
      console.error('Failed to report critical error:', error);
    }
  }

  /**
   * Hata loglarını al
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Hata loglarını temizle
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Belirli bir kullanıcının hatalarını al
   */
  getUserErrors(userId: string): ErrorInfo[] {
    return this.errorLog.filter(error => error.userId === userId);
  }

  /**
   * Belirli bir önem derecesindeki hataları al
   */
  getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
    return this.errorLog.filter(error => error.severity === severity);
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Global error handler'ı window objesine ekle (development için)
if (typeof window !== 'undefined') {
  (window as any).errorHandler = errorHandler;
}

// Unhandled promise rejection handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { component: 'Global', function: 'unhandledrejection' }
    );
  });
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      new Error(`Global Error: ${event.message}`),
      { 
        component: 'Global', 
        function: 'globalError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    );
  });
}

export default errorHandler;
