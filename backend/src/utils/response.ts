/**
 * Standardized API Response wrappers.
 * All endpoints must return { data, error } exactly.
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const response: ApiResponse<T> = { data, error: null };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 400) {
  const response: ApiResponse<null> = { data: null, error: { message } };
  return res.status(statusCode).json(response);
}
