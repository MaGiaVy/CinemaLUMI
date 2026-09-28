import { NextRequest } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

// Bắt buộc xử lý dynamic cho upload file
export const dynamic = 'force-dynamic';

/**
 * POST /api/movies/upload
 * 
 * Upload ảnh poster phim lên Cloudinary một cách bảo mật:
 * - Nhận FormData từ request phía client.
 * - Trích xuất file ảnh (field: 'file' hoặc 'poster' hoặc 'image').
 * - Kiểm tra định dạng (MIME type) và dung lượng file.
 * - Upload trực tiếp từ buffer lên Cloudinary thông qua SDK backend (không để lộ API Secret ra ngoài client).
 * - Trả về direct URL của ảnh thông qua hàm helper apiResponse chuẩn.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Kiểm tra cấu hình Cloudinary trong biến môi trường
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
      return apiResponse(
        false,
        undefined,
        'Chưa cấu hình đầy đủ thông tin Cloudinary (CLOUDINARY_*) trong file .env hoặc .env.local',
        500
      );
    }

    // 2. Trích xuất FormData từ request
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiResponse(
        false,
        undefined,
        'Dữ liệu gửi lên không đúng định dạng multipart/form-data',
        400
      );
    }

    // Lấy file từ formData (hỗ trợ các tên field phổ biến: 'file', 'poster', 'image')
    const file = (formData.get('file') ||
      formData.get('poster') ||
      formData.get('image')) as File | null;

    // 3. Bắt lỗi chặt chẽ nếu request không đính kèm file
    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      return apiResponse(
        false,
        undefined,
        'Vui lòng đính kèm file ảnh để tải lên (field: "file" hoặc "poster")',
        400
      );
    }

    // Kiểm tra định dạng file (chỉ chấp nhận ảnh)
    if (!file.type.startsWith('image/')) {
      return apiResponse(
        false,
        undefined,
        `Định dạng file (${file.type || 'không rõ'}) không hợp lệ. Vui lòng chọn file ảnh (JPG, PNG, WEBP, GIF, v.v.)`,
        400
      );
    }

    // Giới hạn dung lượng ảnh (tối đa 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return apiResponse(
        false,
        undefined,
        'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB)',
        400
      );
    }

    // 4. Chuyển đổi File sang Buffer để upload qua Cloudinary stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload lên Cloudinary qua upload_stream
    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'lumi-cinema/posters',
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }, // Tự động tối ưu dung lượng & định dạng
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload lên Cloudinary thất bại'));
          } else {
            resolve(result as any);
          }
        }
      );

      uploadStream.end(buffer);
    });

    // 6. Trả về kết quả thành công chứa direct URL của bức ảnh
    return apiResponse(
      true,
      {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      },
      'Upload ảnh poster thành công',
      200
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
