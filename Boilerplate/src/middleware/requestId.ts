import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HEADERS } from '../config/constants.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingRequestId = req.headers[HEADERS.REQUEST_ID.toLowerCase()];
  const requestId = typeof existingRequestId === 'string' ? existingRequestId : uuidv4();

  req.requestId = requestId;
  req.headers[HEADERS.REQUEST_ID.toLowerCase()] = requestId;
  res.setHeader(HEADERS.REQUEST_ID, requestId);

  next();
}
