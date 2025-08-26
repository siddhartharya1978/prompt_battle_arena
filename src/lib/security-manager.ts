// SECURITY MANAGER - OMNI-AGENT NEXUS
// Enhanced security with secret rotation and audit logging

export interface SecurityConfig {
  secretRotationEnabled: boolean;
  auditLoggingEnabled: boolean;
  rateLimitingEnabled: boolean;
  inputValidationEnabled: boolean;
}

export interface AuditLog {
  timestamp: string;
  user_id?: string; // Hashed
  action: string;
  resource: string;
  success: boolean;
  ip_address?: string; // Hashed
  user_agent?: string; // Sanitized
  metadata: Record<string, any>;
}

class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.config = {
      secretRotationEnabled: true,
      auditLoggingEnabled: true,
      rateLimitingEnabled: true,
      inputValidationEnabled: true
    };
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // SECRET ROTATION SUPPORT
  checkSecretRotation(): { needsRotation: boolean; secrets: string[]; lastRotation?: string } {
    const secrets = ['GROQ_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
    const lastRotation = localStorage.getItem('last_secret_rotation');
    const rotationAge = lastRotation ? Date.now() - new Date(lastRotation).getTime() : Infinity;
    
    // Recommend rotation every 90 days
    const needsRotation = rotationAge > 90 * 24 * 60 * 60 * 1000;

    return {
      needsRotation,
      secrets,
      lastRotation
    };
  }

  recordSecretRotation(secretName: string) {
    localStorage.setItem('last_secret_rotation', new Date().toISOString());
    this.auditLog('secret_rotated', 'secrets', true, { secret_name: secretName });
  }

  // INPUT VALIDATION & SANITIZATION
  validateAndSanitizeInput(input: any, schema: any): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = [];
    let sanitized = { ...input };

    // Basic validation
    if (schema.required) {
      schema.required.forEach((field: string) => {
        if (!input[field]) {
          errors.push(`${field} is required`);
        }
      });
    }

    // Sanitize strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key]);
      }
    });

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  private sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 2000); // Limit length
  }

  // AUDIT LOGGING
  auditLog(action: string, resource: string, success: boolean, metadata: Record<string, any> = {}, userId?: string) {
    if (!this.config.auditLoggingEnabled) return;

    const log: AuditLog = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      user_id: userId ? this.hashString(userId) : undefined,
      action,
      resource,
      success,
      metadata: this.sanitizeMetadata(metadata)
    };

    this.auditLogs.push(log);
    
    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, this.auditLogs.length - 1000);
    }

    // Persist to localStorage (in production, send to audit service)
    try {
      localStorage.setItem('pba_audit_logs', JSON.stringify(this.auditLogs.slice(-100)));
    } catch (error) {
      console.warn('Failed to persist audit log:', error);
    }
  }

  // RATE LIMITING
  checkRateLimit(userId: string, action: string): { allowed: boolean; retryAfter?: number } {
    if (!this.config.rateLimitingEnabled) return { allowed: true };

    const key = `${userId}_${action}`;
    const now = Date.now();
    const stored = localStorage.getItem(`rate_limit_${key}`);
    
    if (!stored) {
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ count: 1, resetTime: now + 60000 }));
      return { allowed: true };
    }

    const { count, resetTime } = JSON.parse(stored);
    
    if (now > resetTime) {
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ count: 1, resetTime: now + 60000 }));
      return { allowed: true };
    }

    const limits: Record<string, number> = {
      battle_creation: 10, // 10 battles per minute
      login_attempt: 5, // 5 login attempts per minute
      profile_update: 3 // 3 profile updates per minute
    };

    const limit = limits[action] || 20;
    
    if (count >= limit) {
      return { allowed: false, retryAfter: Math.ceil((resetTime - now) / 1000) };
    }

    localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ count: count + 1, resetTime }));
    return { allowed: true };
  }

  // SECURITY HEADERS VALIDATION
  validateSecurityHeaders(): { valid: boolean; missing: string[]; recommendations: string[] } {
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];

    // In a real app, this would check actual response headers
    const missing = requiredHeaders; // Placeholder
    const recommendations = [
      'Add Content-Security-Policy header to prevent XSS',
      'Implement X-Frame-Options to prevent clickjacking',
      'Add security headers in deployment configuration'
    ];

    return {
      valid: missing.length === 0,
      missing,
      recommendations
    };
  }

  // PRIVACY HELPERS
  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}`;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(metadata).forEach(([key, value]) => {
      // Skip PII fields
      if (key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        return;
      }
      
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = `${value.substring(0, 200)}...`;
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  // GET AUDIT LOGS FOR ADMIN
  getAuditLogs(limit: number = 50): AuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  // SECURITY HEALTH CHECK
  getSecurityHealth(): {
    status: 'secure' | 'warning' | 'critical';
    checks: Array<{ name: string; passed: boolean; message: string }>;
  } {
    const checks = [
      {
        name: 'Environment Variables',
        passed: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        message: 'Required environment variables are configured'
      },
      {
        name: 'Input Validation',
        passed: this.config.inputValidationEnabled,
        message: 'Input validation is active'
      },
      {
        name: 'Rate Limiting',
        passed: this.config.rateLimitingEnabled,
        message: 'Rate limiting is enforced'
      },
      {
        name: 'Audit Logging',
        passed: this.config.auditLoggingEnabled,
        message: 'Security events are being logged'
      }
    ];

    const failedChecks = checks.filter(c => !c.passed).length;
    const status = failedChecks === 0 ? 'secure' : failedChecks <= 1 ? 'warning' : 'critical';

    return { status, checks };
  }
}

export const securityManager = SecurityManager.getInstance();

// CONVENIENCE FUNCTIONS
export const auditUserAction = (action: string, resource: string, success: boolean, userId?: string, metadata: Record<string, any> = {}) => {
  securityManager.auditLog(action, resource, success, metadata, userId);
};

export const validateInput = (input: any, schema: any) => {
  return securityManager.validateAndSanitizeInput(input, schema);
};

export const checkRateLimit = (userId: string, action: string) => {
  return securityManager.checkRateLimit(userId, action);
};