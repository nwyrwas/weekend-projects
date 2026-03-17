import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env.js';
import { HEADERS } from '../config/constants.js';

const sensitiveHeaders = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
];

const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'accessToken'];

function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export const logger = pino({
  level: env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.url?.split('?')[0],
      query: req.query,
      params: req.params,
      headers: Object.fromEntries(
        Object.entries(req.headers as Record<string, string>).filter(
          ([key]) => !sensitiveHeaders.includes(key.toLowerCase())
        )
      ),
      requestId: req.headers?.[HEADERS.REQUEST_ID.toLowerCase()],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: (err) => ({
      type: err.constructor?.name,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    }),
  },
  customProps: (req) => ({
    requestId: req.headers[HEADERS.REQUEST_ID.toLowerCase()],
  }),
  redact: {
    paths: [
      'request.headers.authorization',
      'request.headers.cookie',
      'request.body.password',
      'request.body.passwordHash',
      'response.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
});

export { redactSensitiveData };
