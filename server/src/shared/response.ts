import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Envía una respuesta HTTP de éxito estandarizada
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  res.status(statusCode).json(responseBody);
}

/**
 * Envía una respuesta HTTP de error estandarizada
 */
export function sendError(
  res: Response,
  message: string,
  error?: unknown,
  statusCode: number = 400
): void {
  const errorDetails = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;

  const responseBody: ApiResponse = {
    success: false,
    message,
    ...(errorDetails ? { error: errorDetails } : {}),
  };
  res.status(statusCode).json(responseBody);
}
