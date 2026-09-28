import { NextResponse } from 'next/server';

/**
 * Interface ApiResponsePayload chuẩn theo CODE_STANDARDS_BEST_PRACTICES.md
 * Tuyệt đối không sử dụng type 'any'.
 */
export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Helper function chuẩn hóa response cho toàn bộ API Routes trong Next.js App Router.
 * Định dạng trả về: { success: boolean, data?: T, message?: string, error?: string, code?: string }
 */
export function apiResponse<T = unknown>(
  success: boolean,
  data?: T,
  message?: string,
  status?: number,
  code?: string,
  error?: string
) {
  const statusCode = status ?? (success ? 200 : 400);

  const payload: ApiResponsePayload<T> = {
    success,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  if (message !== undefined) {
    payload.message = message;
  }

  if (error !== undefined) {
    payload.error = error;
  }

  if (code !== undefined) {
    payload.code = code;
  }

  return NextResponse.json(payload, { status: statusCode });
}

/**
 * Shortcut phản hồi thành công
 */
export function apiSuccess<T = unknown>(data?: T, message?: string, status: number = 200) {
  return apiResponse(true, data, message, status);
}

/**
 * Shortcut phản hồi lỗi
 */
export function apiError(
  message: string,
  status: number = 400,
  code: string = 'BAD_REQUEST',
  data?: unknown
) {
  return apiResponse(false, data, message, status, code, message);
}

export default apiResponse;
