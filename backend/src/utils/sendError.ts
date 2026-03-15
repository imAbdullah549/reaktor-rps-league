import type { Response } from "express";

/**
 * Send a consistent error response. Use for all API error responses.
 */
export function sendError(res: Response, status: number, message: string, code?: string): void {
  res.status(status).json({
    error: {
      message,
      ...(code && { code }),
    },
  });
}
