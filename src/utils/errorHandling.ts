// Error handling utilities for robust error management

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class AppErrorHandler {
  static create(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static handle(error: any, context: string): AppError {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      return this.create('GENERIC_ERROR', error.message, { context });
    }
    
    if (typeof error === 'string') {
      return this.create('STRING_ERROR', error, { context });
    }
    
    return this.create('UNKNOWN_ERROR', 'An unexpected error occurred', { context, error });
  }
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R | AppError> => {
    try {
      return await fn(...args);
    } catch (error) {
      return AppErrorHandler.handle(error, context);
    }
  };
}

export function showUserError(error: AppError): void {
  // In a real app, you'd show this in a toast/notification
  alert(`Error: ${error.message}`);
}

export function isAppError(value: any): value is AppError {
  return value && typeof value === 'object' && 'code' in value && 'message' in value;
}

// Device detection utilities
export function isDesktop(): boolean {
  return window.innerWidth >= 1024;
}

export function getEffectiveLayout(): 'mobile' | 'desktop' {
  return isDesktop() ? 'desktop' : 'mobile';
}
