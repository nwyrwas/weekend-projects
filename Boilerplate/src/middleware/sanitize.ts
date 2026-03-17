import type { Request, Response, NextFunction } from 'express';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[$.]|(\$)/g, '');
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as Record<string, unknown>) as typeof req.query;
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params as Record<string, unknown>) as typeof req.params;
  }

  next();
}
