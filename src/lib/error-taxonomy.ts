// ERROR TAXONOMY & FALLBACK LADDER - OMNI-AGENT NEXUS
// Comprehensive error classification and recovery strategies

export type ErrorCategory = 'AUTH' | 'CONFIG' | 'NETWORK' | 'RATE_LIMIT' | 'DATA_CONTRACT' | 'LOGIC';

export interface ClassifiedError {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  likelyCause: string;
  quickFix: string;
  fallbackStrategy: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export class ErrorTaxonomy {
  private static instance: ErrorTaxonomy;

  static getInstance(): ErrorTaxonomy {
    if (!ErrorTaxonomy.instance) {
      ErrorTaxonomy.instance = new ErrorTaxonomy();
    }
    return ErrorTaxonomy.instance;
  }

  classifyError(error: any): ClassifiedError {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.status || 0;

    // AUTH ERRORS
    if (message.includes('invalid login') || message.includes('unauthorized') || status === 401) {
      return {
        category: 'AUTH',
        code: 'AUTH_001',
        message: error.message,
        userMessage: 'Authentication failed. Please check your credentials and try again.',
        likelyCause: 'Invalid credentials or expired session',
        quickFix: 'Re-enter credentials or refresh the page',
        fallbackStrategy: 'Redirect to login page with error context',
        retryable: true
      };
    }

    if (message.includes('refresh token') || message.includes('token expired')) {
      return {
        category: 'AUTH',
        code: 'AUTH_002',
        message: error.message,
        userMessage: 'Your session has expired. Please sign in again.',
        likelyCause: 'Session timeout or invalid refresh token',
        quickFix: 'Clear browser storage and re-login',
        fallbackStrategy: 'Auto-logout and redirect to login',
        retryable: false
      };
    }

    // CONFIG ERRORS
    if (message.includes('environment') || message.includes('not configured') || message.includes('missing')) {
      return {
        category: 'CONFIG',
        code: 'CONFIG_001',
        message: error.message,
        userMessage: 'System configuration error. Please contact support.',
        likelyCause: 'Missing environment variables or misconfiguration',
        quickFix: 'Check .env file and Supabase settings',
        fallbackStrategy: 'Use demo mode with local storage',
        retryable: false
      };
    }

    // NETWORK ERRORS
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout') || status === 0) {
      return {
        category: 'NETWORK',
        code: 'NETWORK_001',
        message: error.message,
        userMessage: 'Network connection issue. Please check your internet and try again.',
        likelyCause: 'Poor internet connection or server downtime',
        quickFix: 'Check internet connection and retry',
        fallbackStrategy: 'Queue operation for retry when connection improves',
        retryable: true,
        retryAfter: 5
      };
    }

    // RATE LIMIT ERRORS
    if (message.includes('rate limit') || message.includes('429') || status === 429) {
      return {
        category: 'RATE_LIMIT',
        code: 'RATE_LIMIT_001',
        message: error.message,
        userMessage: 'API rate limit reached. Please wait a moment and try again.',
        likelyCause: 'Too many requests in short time period',
        quickFix: 'Wait 30 seconds before retrying',
        fallbackStrategy: 'Implement exponential backoff and queue requests',
        retryable: true,
        retryAfter: 30
      };
    }

    // DATA CONTRACT ERRORS
    if (message.includes('uuid') || message.includes('validation') || message.includes('constraint') || status === 400) {
      return {
        category: 'DATA_CONTRACT',
        code: 'DATA_001',
        message: error.message,
        userMessage: 'Invalid data format. Please check your input and try again.',
        likelyCause: 'Data validation failed or schema mismatch',
        quickFix: 'Validate input format and retry',
        fallbackStrategy: 'Use sanitized fallback data structure',
        retryable: true
      };
    }

    // LOGIC ERRORS (fallback)
    return {
      category: 'LOGIC',
      code: 'LOGIC_001',
      message: error.message,
      userMessage: 'An unexpected error occurred. Our team has been notified.',
      likelyCause: 'Application logic error or unexpected condition',
      quickFix: 'Refresh the page and try again',
      fallbackStrategy: 'Log error and provide graceful degradation',
      retryable: true
    };
  }

  handleError(error: any, context: string): ClassifiedError {
    const classified = this.classifyError(error);
    
    // Log error with proper taxonomy
    console.error(`[${classified.category}:${classified.code}] ${context}:`, {
      message: classified.message,
      likelyCause: classified.likelyCause,
      timestamp: new Date().toISOString(),
      context
    });

    return classified;
  }

  createFallbackResponse(category: ErrorCategory, context: string): any {
    switch (category) {
      case 'AUTH':
        return { authenticated: false, user: null, redirectTo: '/login' };
      
      case 'NETWORK':
        return { cached: true, stale: true, retryAvailable: true };
      
      case 'RATE_LIMIT':
        return { queued: true, estimatedWait: 30, fallbackData: null };
      
      case 'DATA_CONTRACT':
        return { sanitized: true, partialData: true, validationErrors: [] };
      
      default:
        return { error: true, fallback: true, context };
    }
  }
}

export const errorTaxonomy = ErrorTaxonomy.getInstance();