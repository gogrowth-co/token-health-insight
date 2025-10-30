/**
 * Secure error handling utilities for edge functions
 * Prevents sensitive information leakage while maintaining good logging
 */

export interface ErrorResponse {
  error: string;
  code?: string;
  requestId?: string;
}

/**
 * Sanitize error messages to prevent sensitive information leakage
 * @param error - The error object
 * @returns Sanitized error message safe for client
 */
export const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for sensitive patterns and return generic messages
    if (message.includes('key') || message.includes('secret') || message.includes('token')) {
      return 'Configuration error. Please contact support.';
    }

    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return 'Database operation failed. Please try again.';
    }

    if (message.includes('stripe')) {
      return 'Payment processing error. Please try again or contact support.';
    }

    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'Authentication failed. Please log in again.';
    }

    // For generic errors, return a safe version
    return 'An error occurred while processing your request.';
  }

  return 'An unexpected error occurred.';
};

/**
 * Log detailed error information server-side
 * @param context - Context identifier (function name, operation, etc.)
 * @param error - The error object
 * @param metadata - Additional metadata to log
 */
export const logError = (
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Remove any potential PII from metadata before logging
  const sanitizedMetadata = metadata ? sanitizePII(metadata) : {};

  console.error(`[ERROR:${context}]`, {
    message: errorMessage,
    stack: errorStack,
    metadata: sanitizedMetadata,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Remove PII (Personally Identifiable Information) from objects before logging
 * @param data - Object that may contain PII
 * @returns Sanitized object
 */
const sanitizePII = (data: Record<string, any>): Record<string, any> => {
  const piiFields = ['email', 'password', 'ssn', 'phone', 'address', 'credit_card'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (piiFields.some(field => key.toLowerCase().includes(field))) {
      // Redact PII fields
      if (key.toLowerCase().includes('email') && typeof value === 'string') {
        // Show only domain for emails
        const parts = value.split('@');
        sanitized[key] = parts.length === 2 ? `***@${parts[1]}` : '***';
      } else {
        sanitized[key] = '***REDACTED***';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizePII(value as Record<string, any>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Create a standardized error response
 * @param error - The error object
 * @param context - Context for logging
 * @param statusCode - HTTP status code (default: 500)
 * @returns Response object with sanitized error
 */
export const createErrorResponse = (
  error: unknown,
  context: string,
  statusCode: number = 500,
  corsHeaders: Record<string, string> = {}
): Response => {
  // Log the full error server-side
  logError(context, error);

  // Return sanitized error to client
  const errorResponse: ErrorResponse = {
    error: sanitizeError(error),
    code: statusCode === 401 ? 'UNAUTHORIZED' :
          statusCode === 403 ? 'FORBIDDEN' :
          statusCode === 404 ? 'NOT_FOUND' :
          statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
          'INTERNAL_ERROR'
  };

  return new Response(
    JSON.stringify(errorResponse),
    {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
};

/**
 * Wrap an async function with error handling
 * @param fn - Function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(context, error, { args: sanitizePII(args as any) });
      throw error;
    }
  }) as T;
};

/**
 * Check if error is a known type that shouldn't be logged as error
 * (e.g., validation errors, expected auth failures)
 */
export const isExpectedError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('validation') ||
      message.includes('invalid input') ||
      message.includes('not found') ||
      message.includes('already exists')
    );
  }
  return false;
};

/**
 * Log info message (non-error) with PII sanitization
 */
export const logInfo = (context: string, message: string, data?: Record<string, any>): void => {
  const sanitizedData = data ? sanitizePII(data) : {};
  console.log(`[INFO:${context}] ${message}`, {
    data: sanitizedData,
    timestamp: new Date().toISOString(),
  });
};
