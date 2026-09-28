import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface PricingItemResponse {
  id: number;
  ticket_type: string;
  ticketType: string;
  label: string;
  price_percentage: number;
  percentage: number;
  base_price: number;
  basePrice: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/pricing
 * 
 * Truy xuất toàn bộ danh sách các loại vé và tỷ lệ giá (price_percentage) từ bảng Pricing.
 * - Tuân thủ tuyệt đối CODE_STANDARDS_BEST_PRACTICES.md (Không dùng any, Centralized Error Handling).
 * - Trả về định dạng apiResponse chuẩn.
 */
export async function GET(_request: NextRequest) {
  try {
    const rawPricings = await prisma.pricing.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    const data: PricingItemResponse[] = rawPricings.map(item => {
      const numericBasePrice = typeof item.basePrice === 'number'
        ? item.basePrice
        : Number(item.basePrice);

      return {
        id: item.id,
        ticket_type: item.ticketType,
        ticketType: item.ticketType,
        label: item.label,
        price_percentage: item.percentage,
        percentage: item.percentage,
        base_price: isNaN(numericBasePrice) ? 0 : numericBasePrice,
        basePrice: isNaN(numericBasePrice) ? 0 : numericBasePrice,
        description: item.description,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString(),
      };
    });

    return apiResponse(
      true,
      data,
      `Truy xuất danh sách giá vé thành công (${data.length} loại vé)`
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
