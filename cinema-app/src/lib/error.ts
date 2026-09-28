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
  const errObj = error as { name?: string; message?: string; code?: string };
  const msg = (errObj.message || (error instanceof Error ? error.message : String(error))).toLowerCase();
  const name = (errObj.name || (error instanceof Error ? error.name : '')).toLowerCase();
  const code = (errObj.code || '').toLowerCase();

  return (
    msg.includes('database') ||
    msg.includes('prisma') ||
    msg.includes('econnrefused') ||
    msg.includes('connection refused') ||
    msg.includes('connection closed') ||
    msg.includes('connection terminated') ||
    msg.includes("can't reach database") ||
    msg.includes('timed out') ||
    name.includes('prisma') ||
    code === 'p1001' ||
    code === 'p1002' ||
    code === 'p1003' ||
    code === 'p1008' ||
    code === 'p1017' ||
    code === 'econnrefused' ||
    code === 'etimedout'
  );
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
