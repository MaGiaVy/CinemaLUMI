/**
 * Centralized Error Handling Module for Lumi Cinema
 * Follows CODE_STANDARDS_BEST_PRACTICES.md
 */

export class AppError extends Error {
  statusCode: number;
  message: string;
  code: string;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'APP_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.message = message;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
}

/**
 * Kiểm tra xem lỗi có phải do sập Database, mất kết nối cơ sở dữ liệu hoặc lỗi kết nối mạng nghiêm trọng (Quy tắc E-04)
 */
export function isDatabaseOrConnectionError(error: unknown): boolean {
  if (!error) return false;

  const errObj = error as { name?: string; message?: string; code?: string; meta?: { code?: string } };
  const msg = (errObj.message || (error instanceof Error ? error.message : String(error))).toLowerCase();
  const name = (errObj.name || (error instanceof Error ? error.name : '')).toLowerCase();
  const code = (errObj.code || errObj.meta?.code || '').toLowerCase();

  const isKnownConnectionCode = [
    'p1001',
    'p1002',
    'p1003',
    'p1008',
    'p1017',
    'econnrefused',
    'etimedout',
    'eai_again',
  ].includes(code);

  const isConnectionMessage = [
    'database',
    'db connection',
    'connection refused',
    'econnrefused',
    "can't reach database",
    'connection terminated',
    'connection pool',
    'timed out',
    'timeout while connecting',
    'could not connect to',
    'database unavailable',
    'database not reachable',
    'connection is closed',
    'server closed connection',
  ].some(keyword => msg.includes(keyword));

  const isPrismaOnlyNoise = [
    'record not found',
    'not found',
    'p2025',
    'p2015',
    'invalid value for argument',
    'unknown argument',
    'missing required value',
    'relation does not exist',
  ].some(keyword => msg.includes(keyword));

  if (isPrismaOnlyNoise && !isKnownConnectionCode && !isConnectionMessage) {
    return false;
  }

  return isKnownConnectionCode || isConnectionMessage || name.includes('prisma');
}

export const handleError = (error: unknown): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Quy tắc E-04: Bắt các lỗi sập Database hoặc mất kết nối nghiêm trọng
  if (isDatabaseOrConnectionError(error)) {
    console.error('[CentralizedErrorHandler:DatabaseMaintenance]', error);
    return {
      success: false,
      error: 'Hệ thống đang bảo trì hoặc mất kết nối cơ sở dữ liệu. Vui lòng thử lại sau ít phút.',
      code: 'SYSTEM_MAINTENANCE',
      statusCode: 503,
    };
  }

  if (error instanceof Error) {
    console.error('[CentralizedErrorHandler]', error.message, error.stack);
    return {
      success: false,
      error: error.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    };
  }

  console.error('[CentralizedErrorHandler] Unknown error:', error);
  return {
    success: false,
    error: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
};

export default handleError;
