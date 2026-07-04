import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

function sanitize(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (!k.startsWith('$') && !k.includes('.')) {
        clean[k] = sanitize(v);
      }
    }
    return clean;
  }
  return obj;
}

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body) req.body = sanitize(req.body);
    // req.query is a read-only getter in newer Express/Node — mutate each key
    // in place instead of replacing the whole object reference.
    if (req.query) {
      const clean = sanitize(req.query) as Record<string, unknown>;
      for (const key of Object.keys(req.query)) {
        if (key in clean) {
          (req.query as Record<string, unknown>)[key] = clean[key];
        } else {
          delete (req.query as Record<string, unknown>)[key];
        }
      }
    }
    next();
  }
}
