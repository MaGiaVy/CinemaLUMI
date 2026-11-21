import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { PaymentStatus } from '@prisma/client';
import { processZaloPayPaymentSuccess } from '../zalopay-ipn/route';
import { processVnpayIpnTransaction } from '../vnpay-ipn/route';
import {
  GatewayProvider,
  getThirdPartyAccounts,
  topupThirdPartyAccount,
  resetThirdPartyAccount,
  debitThirdPartyAccountIfSufficient,
  refundThirdPartyAccount,
} from '@/lib/third-party-accounts';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  action: z.enum(['topup', 'reset', 'pay']),
  provider: z.enum(['zalopay', 'vnpay']),
  paymentId: z.coerce.number().int().positive(),
  accountId: z.string().trim().min(1),
  amount: z.coerce.number().positive().max(50000000).optional(),
});

async function loadAuthorizedPayment(paymentId: number) {
  const session = await getServerSession(authOptions);
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, `Không tìm thấy đơn thanh toán #${paymentId}`, 'PAYMENT_NOT_FOUND');
  }

  const sessionUser = session?.user as { id?: string | number; role?: string } | undefined;
  if (
    sessionUser?.id &&
    Number(sessionUser.id) !== payment.userId &&
    sessionUser.role !== 'ADMIN'
  ) {
    throw new AppError(
      403,
      'Bạn không có quyền truy cập giao dịch thanh toán này',
      'FORBIDDEN'
    );
  }

  let movieTitle = 'Vé xem phim Lumi Cinema';
  let room = '';
  let seatCodes: string[] = [];
  let reservedUntil: Date | null = null;

  if (payment.screeningId) {
    const screening = await prisma.screening.findUnique({
      where: { id: payment.screeningId },
      include: { movie: { select: { title: true } } },
    });
    if (screening) {
      movieTitle = screening.movie?.title || movieTitle;
      room = screening.room;
    }
  }

  if (Array.isArray(payment.seatIds) && (payment.seatIds as number[]).length > 0) {
    const seats = await prisma.seat.findMany({
      where: { id: { in: payment.seatIds as number[] } },
      select: { code: true, reservedUntil: true },
    });
    seatCodes = seats.map((s) => s.code);
    const activeExpiry = seats.find((s) => s.reservedUntil)?.reservedUntil;
    if (activeExpiry) {
      reservedUntil = activeExpiry;
    }
  }

  if (!reservedUntil) {
    reservedUntil = new Date(payment.createdAt.getTime() + 10 * 60 * 1000);
  }

  return {
    payment,
    userInfo: payment.user || { id: payment.userId, name: 'Khách hàng LumiCinema', phone: '0901234567' },
    movieTitle,
    room,
    seatCodes,
    reservedUntil,
  };
}

function buildResultRedirectUrl(
  provider: GatewayProvider,
  payment: { id: number; amount: unknown; transactionCode: string | null; screeningId: number | null }
) {
  const params = new URLSearchParams({
    status: 'success',
    code: '00',
    payment_id: String(payment.id),
    amount: String(Number(payment.amount)),
    method: provider === 'zalopay' ? 'ZaloPay' : 'VNPay',
  });
  if (payment.transactionCode) {
    params.set('txn_code', payment.transactionCode);
    if (provider === 'zalopay') {
      params.set('app_trans_id', payment.transactionCode);
    }
  }
  if (payment.screeningId) {
    params.set('screening_id', String(payment.screeningId));
  }
  return `/payment-result?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawProvider = (searchParams.get('provider') || 'zalopay').toLowerCase();
    const provider: GatewayProvider = rawProvider === 'vnpay' ? 'vnpay' : 'zalopay';
    const paymentId = Number(searchParams.get('payment_id') || searchParams.get('paymentId'));

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      throw new AppError(400, 'Thiếu hoặc sai mã đơn thanh toán (payment_id)', 'INVALID_PAYMENT_ID');
    }

    const { payment, userInfo, movieTitle, room, seatCodes, reservedUntil } =
      await loadAuthorizedPayment(paymentId);

    const accounts = getThirdPartyAccounts(provider, userInfo);

    return apiResponse(true, {
      provider,
      payment: {
        id: payment.id,
        amount: Number(payment.amount),
        status: payment.status,
        transactionCode: payment.transactionCode,
        createdAt: payment.createdAt.toISOString(),
        reservedUntil: reservedUntil.toISOString(),
        screeningId: payment.screeningId,
        movieTitle,
        room,
        seatCodes,
      },
      accounts,
    });
  } catch (error) {
    const errRes = handleError(error);
    return apiResponse(false, undefined, errRes.error, errRes.statusCode, errRes.code, errRes.error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
    }

    const { action, provider, paymentId, accountId, amount } = parsed.data;
    const { payment, userInfo, reservedUntil } = await loadAuthorizedPayment(paymentId);

    if (action === 'topup') {
      if (!amount || amount <= 0) {
        throw new AppError(400, 'Số tiền nạp phải lớn hơn 0', 'INVALID_TOPUP_AMOUNT');
      }
      const updated = topupThirdPartyAccount(provider, userInfo, accountId, amount);
      if (!updated) {
        throw new AppError(404, 'Không tìm thấy tài khoản bên thứ 3', 'ACCOUNT_NOT_FOUND');
      }
      return apiResponse(
        true,
        {
          account: updated,
          accounts: getThirdPartyAccounts(provider, userInfo),
        },
        `Đã nạp thêm ${amount.toLocaleString('vi-VN')} đ vào tài khoản ${updated.bankOrWalletName}`
      );
    }

    if (action === 'reset') {
      const reset = resetThirdPartyAccount(provider, userInfo, accountId);
      if (!reset) {
        throw new AppError(404, 'Không tìm thấy tài khoản bên thứ 3', 'ACCOUNT_NOT_FOUND');
      }
      return apiResponse(
        true,
        {
          account: reset,
          accounts: getThirdPartyAccounts(provider, userInfo),
        },
        `Đã khôi phục số dư mặc định (${reset.initialBalance.toLocaleString('vi-VN')} đ)`
      );
    }

    // action === 'pay'
    if (payment.status === PaymentStatus.Success) {
      return apiResponse(
        true,
        {
          alreadyProcessed: true,
          redirectUrl: buildResultRedirectUrl(provider, payment),
          accounts: getThirdPartyAccounts(provider, userInfo),
        },
        'Đơn hàng đã được thanh toán thành công trước đó'
      );
    }

    if (payment.status === PaymentStatus.Failed || payment.status === PaymentStatus.Refunded) {
      throw new AppError(
        400,
        'Giao dịch này đã bị hủy hoặc thất bại trước đó. Vui lòng quay lại đặt vé mới.',
        'PAYMENT_ALREADY_CLOSED'
      );
    }

    // Kiểm tra hết hạn giữ ghế (10 phút)
    if (Date.now() > reservedUntil.getTime()) {
      throw new AppError(
        400,
        'Đã hết thời gian giữ ghế (10 phút). Vui lòng quay lại chọn suất chiếu khác.',
        'HOLD_EXPIRED'
      );
    }

    const requiredAmount = Number(payment.amount);
    const debitResult = debitThirdPartyAccountIfSufficient(provider, userInfo, accountId, requiredAmount);

    if (!debitResult.ok) {
      if (debitResult.reason === 'ACCOUNT_NOT_FOUND') {
        throw new AppError(404, 'Tài khoản bên thứ 3 không tồn tại', 'ACCOUNT_NOT_FOUND');
      }
      throw new AppError(
        400,
        `Số dư tài khoản (${debitResult.balance.toLocaleString('vi-VN')} đ) không đủ để thanh toán ${requiredAmount.toLocaleString('vi-VN')} đ. Còn thiếu ${debitResult.missing.toLocaleString('vi-VN')} đ, vui lòng nạp thêm tiền!`,
        'INSUFFICIENT_BALANCE'
      );
    }

    // Đủ tiền -> tiến hành chốt thanh toán trong PostgreSQL
    try {
      if (provider === 'zalopay') {
        const res = await processZaloPayPaymentSuccess(
          payment.transactionCode || String(payment.id),
          requiredAmount
        );
        if (res.return_code !== 1) {
          refundThirdPartyAccount(provider, userInfo, accountId, requiredAmount);
          throw new AppError(409, res.return_message || 'Không thể hoàn tất thanh toán ZaloPay', 'SETTLEMENT_FAILED');
        }
      } else {
        const res = await processVnpayIpnTransaction(
          payment.id,
          true,
          payment.transactionCode,
          requiredAmount
        );
        if (res.RspCode !== '00' && res.RspCode !== '02') {
          refundThirdPartyAccount(provider, userInfo, accountId, requiredAmount);
          throw new AppError(409, res.Message || 'Không thể hoàn tất thanh toán VNPay', 'SETTLEMENT_FAILED');
        }
      }
    } catch (err) {
      // Nếu chưa refund (trong trường hợp throw exception DB), hoàn tiền lại vào ví bên thứ 3
      if (!(err instanceof AppError && err.code === 'SETTLEMENT_FAILED')) {
        refundThirdPartyAccount(provider, userInfo, accountId, requiredAmount);
      }
      throw err;
    }

    return apiResponse(
      true,
      {
        newBalance: debitResult.newBalance,
        account: debitResult.account,
        accounts: getThirdPartyAccounts(provider, userInfo),
        redirectUrl: buildResultRedirectUrl(provider, payment),
      },
      'Thanh toán thành công!'
    );
  } catch (error) {
    const errRes = handleError(error);
    return apiResponse(false, undefined, errRes.error, errRes.statusCode, errRes.code, errRes.error);
  }
}
