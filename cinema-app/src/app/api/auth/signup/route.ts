import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

/**
 * POST /api/auth/signup
 *
 * Đăng ký tài khoản mới cho hệ thống Lumi Cinema.
 *
 * Payload: { email, password, full_name, phone? }
 * Ràng buộc:
 * - email: bắt buộc, định dạng hợp lệ, chưa tồn tại trong DB
 * - password: bắt buộc, tối thiểu 6 ký tự
 * - full_name: bắt buộc
 * - phone: tùy chọn
 *
 * Trả về: apiResponse chuẩn { success, data, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone } = body;

    // -------------------------------------------------------
    // 1. Validate đầu vào
    // -------------------------------------------------------
    if (!email || !password || !full_name) {
      return apiResponse(
        false,
        undefined,
        'Vui lòng nhập đầy đủ email, mật khẩu và họ tên',
        400
      );
    }

    // Validate định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiResponse(
        false,
        undefined,
        'Định dạng email không hợp lệ',
        400
      );
    }

    // Validate độ dài mật khẩu >= 6 ký tự
    if (password.length < 6) {
      return apiResponse(
        false,
        undefined,
        'Mật khẩu phải có tối thiểu 6 ký tự',
        400
      );
    }

    // -------------------------------------------------------
    // 2. Kiểm tra email đã tồn tại trong DB chưa
    // -------------------------------------------------------
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiResponse(
        false,
        undefined,
        'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
        409
      );
    }

    // -------------------------------------------------------
    // 3. Mã hóa mật khẩu bằng bcryptjs (salt rounds = 12)
    // -------------------------------------------------------
    const hashedPassword = await bcrypt.hash(password, 12);

    // -------------------------------------------------------
    // 4. Tạo user mới trong DB qua Prisma
    // -------------------------------------------------------
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: full_name.trim(),
        phone: phone?.trim() || null,
        role: 'CUSTOMER', // Mặc định là CUSTOMER
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // -------------------------------------------------------
    // 5. Trả về kết quả thành công
    // -------------------------------------------------------
    return apiResponse(
      true,
      {
        user: newUser,
      },
      'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.',
      201
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return apiResponse(
      false,
      undefined,
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}
