// Input validation utilities for security and robustness

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed'
    };
  }

  return { isValid: true };
}

export function validatePin(pin: string): ValidationResult {
  if (!pin || pin.length !== 4) {
    return {
      isValid: false,
      error: 'PIN must be exactly 4 digits'
    };
  }

  if (!/^\d{4}$/.test(pin)) {
    return {
      isValid: false,
      error: 'PIN must contain only numbers'
    };
  }

  return { isValid: true };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateDriverName(name: string): ValidationResult {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < 2) {
    return {
      isValid: false,
      error: 'Driver name must be at least 2 characters'
    };
  }

  if (sanitized.length > 50) {
    return {
      isValid: false,
      error: 'Driver name must be less than 50 characters'
    };
  }

  return { isValid: true };
}
