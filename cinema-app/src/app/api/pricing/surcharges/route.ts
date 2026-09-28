import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

export interface SurchargeItem {
  id: string;
  label: string;
  value: number;
  active: boolean;
}

const DEFAULT_SURCHARGES: SurchargeItem[] = [
  { id: 'weekend', label: 'Phụ thu cuối tuần (Thứ 7, Chủ Nhật)', value: 20000, active: true },
  { id: 'late', label: 'Phụ thu suất chiếu muộn (sau 20:00)', value: 15000, active: true },
  { id: 'holiday', label: 'Phụ thu ngày Lễ / Tết', value: 30000, active: false },
];

export async function GET() {
  try {
    // Tìm các bản ghi phụ thu trong bảng pricing có ticketType dạng SURCHARGE_*
    const records = await prisma.pricing.findMany({
      where: {
        ticketType: {
          startsWith: 'SURCHARGE_',
        },
      },
    });

    if (records.length === 0) {
      return apiResponse(true, DEFAULT_SURCHARGES, 'Lấy danh sách phụ thu mặc định', 200);
    }

    const surcharges: SurchargeItem[] = records.map(r => {
      const id = r.ticketType.replace('SURCHARGE_', '').toLowerCase();
      const active = r.description ? r.description.includes('active:true') : true;
      return {
        id,
        label: r.label,
        value: Number(r.basePrice || 0),
        active,
      };
    });

    return apiResponse(true, surcharges, 'Lấy danh sách phụ thu thành công', 200);
  } catch (error) {
    const err = handleError(error);
    return apiResponse(false, undefined, err.error, err.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surcharges } = body as { surcharges: SurchargeItem[] };

    if (!Array.isArray(surcharges)) {
      return apiResponse(false, undefined, 'Dữ liệu phụ thu không hợp lệ', 400);
    }

    // Upsert từng khoản phụ thu vào bảng pricing
    for (const sc of surcharges) {
      const ticketType = `SURCHARGE_${sc.id.toUpperCase()}`;
      await prisma.pricing.upsert({
        where: { ticketType },
        update: {
          label: sc.label,
          basePrice: sc.value,
          description: `active:${sc.active}`,
          percentage: 100,
        },
        create: {
          ticketType,
          label: sc.label,
          basePrice: sc.value,
          description: `active:${sc.active}`,
          percentage: 100,
        },
      });
    }

    return apiResponse(true, surcharges, 'Đã lưu cấu hình phụ thu thành công!', 200);
  } catch (error) {
    const err = handleError(error);
    return apiResponse(false, undefined, err.error, err.statusCode);
  }
}
