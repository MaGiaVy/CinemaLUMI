import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BỔ SUNG DỮ LIỆU TOÀN DIỆN CHO TẤT CẢ CÁC BẢNG DEMO ===');

  // 1. Seed bảng Pricing (Cấu hình giá vé)
  const pricingRows = [
    {
      ticketType: 'Normal',
      label: 'Vé Thường (Người lớn)',
      percentage: 100,
      basePrice: 110000,
      description: 'Áp dụng cho khách hàng tiêu chuẩn (100% giá vé suất chiếu).',
    },
    {
      ticketType: 'Child',
      label: 'Vé Trẻ em',
      percentage: 50,
      basePrice: 55000,
      description: 'Giảm 50% giá vé cho trẻ em (tự động khóa đối với phim giới hạn T18).',
    },
  ];
  for (const p of pricingRows) {
    await prisma.pricing.upsert({
      where: { ticketType: p.ticketType },
      update: p,
      create: p,
    });
  }
  console.log('+ Đã seed bảng Pricing (Normal 100%, Child 50%).');

  // 2. Cập nhật số điện thoại cho các tài khoản khách hàng để demo tìm kiếm POS
  const phoneMap = {
    'khachhang@lumi.vn': '0901234567',
    'hung123@gmail.com': '0912345678',
    'huuthang123@gmail.com': '0987654321',
    'hung24760@gmail.com': '0933445566',
    'hung@gmail.com': '0944556677',
    'staff@lumi.vn': '0900000002',
    'admin@lumi.vn': '0900000001',
  };
  for (const [email, phone] of Object.entries(phoneMap)) {
    await prisma.user.updateMany({ where: { email }, data: { phone } });
  }
  console.log('+ Đã cập nhật SĐT cho các tài khoản để demo POS & tra cứu vé.');

  // 3. Tạo đơn hàng lịch sử 10 ngày gần đây + hôm nay (Payments + Tickets + OrderCombos)
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
  const combos = await prisma.combo.findMany({ where: { status: 'ACTIVE' } });
  const screenings = await prisma.screening.findMany({
    include: { seats: { where: { status: 'EMPTY' }, take: 6 } },
    orderBy: { startTime: 'desc' },
    take: 30,
  });

  const methods = ['ZaloPay', 'VNPay', 'Cash', 'BankCard'];
  let createdPayments = 0;
  let createdTickets = 0;
  let createdOrderCombos = 0;

  for (let i = 0; i < Math.min(20, screenings.length); i++) {
    const sc = screenings[i];
    if (!sc.seats || sc.seats.length < 2) continue;
    const cust = customers[i % customers.length];
    const method = methods[i % methods.length];

    // Rải ngày thanh toán từ 9 ngày trước đến hôm nay để Streamgraph hiển thị sóng đẹp
    const daysAgo = i % 10;
    const payDate = new Date();
    payDate.setDate(payDate.getDate() - daysAgo);
    payDate.setHours(10 + (i % 10), (i * 7) % 60, 0, 0);

    const chosenSeats = sc.seats.slice(0, 2);
    const ticketPrice = Number(sc.price);
    let totalAmount = chosenSeats.length * ticketPrice;

    // 60% đơn có kèm Combo bắp nước
    const hasCombo = combos.length > 0 && i % 5 !== 4;
    const comboItem = hasCombo ? combos[i % combos.length] : null;
    const comboQty = (i % 2) + 1;
    if (comboItem) {
      totalAmount += Number(comboItem.price) * comboQty;
    }

    // 1 giao dịch Refunded mẫu, còn lại Success
    const isRefundedSample = i === 18;
    const paymentStatus = isRefundedSample ? 'Refunded' : 'Success';
    const ticketStatus = isRefundedSample ? 'Cancelled' : (daysAgo >= 2 ? 'Used' : 'Valid');

    const pay = await prisma.payment.create({
      data: {
        userId: cust.id,
        screeningId: sc.id,
        amount: totalAmount,
        paymentMethod: method,
        transactionCode: `LUMI_HIST_${Date.now()}_${i}`,
        status: paymentStatus,
        createdAt: payDate,
        updatedAt: payDate,
      },
    });
    createdPayments++;

    for (let si = 0; si < chosenSeats.length; si++) {
      const seat = chosenSeats[si];
      if (!isRefundedSample) {
        await prisma.seat.update({ where: { id: seat.id }, data: { status: 'OCCUPIED' } });
      }
      await prisma.ticket.create({
        data: {
          userId: cust.id,
          screeningId: sc.id,
          seatId: seat.id,
          paymentId: pay.id,
          ticketType: si === 1 && i % 3 === 0 ? 'Trẻ em' : 'Thường',
          price: si === 1 && i % 3 === 0 ? ticketPrice * 0.5 : ticketPrice,
          purchaseDate: payDate,
          status: ticketStatus,
          cancellationReason: isRefundedSample ? 'Sự cố kỹ thuật phòng chiếu - Hoàn tiền 100%' : null,
          createdAt: payDate,
          updatedAt: payDate,
        },
      });
      createdTickets++;
    }

    if (comboItem && !isRefundedSample) {
      const delivered = method === 'Cash' || daysAgo >= 1;
      await prisma.orderCombo.create({
        data: {
          paymentId: pay.id,
          comboId: comboItem.id,
          quantity: comboQty,
          price: comboItem.price,
          isDelivered: delivered,
          deliveredAt: delivered ? payDate : null,
        },
      });
      createdOrderCombos++;
    }
  }

  console.log(`+ Đã tạo ${createdPayments} Payment lịch sử, ${createdTickets} Ticket (Valid/Used/Cancelled), ${createdOrderCombos} OrderCombo (Chưa giao & Đã giao).`);

  // 4. Đảm bảo có ít nhất 1 suất chiếu đang ở trạng thái SHOWING cho hôm nay để Dashboard giám sát 5 phòng sinh động
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayScreenings = await prisma.screening.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    take: 3,
  });
  if (todayScreenings.length > 0) {
    await prisma.screening.update({
      where: { id: todayScreenings[0].id },
      data: { status: 'SHOWING' },
    });
  }

  const summary = {
    pricing: await prisma.pricing.count(),
    usersWithPhone: await prisma.user.count({ where: { phone: { not: null } } }),
    payments: await prisma.payment.count(),
    ticketsValid: await prisma.ticket.count({ where: { status: 'Valid' } }),
    ticketsUsed: await prisma.ticket.count({ where: { status: 'Used' } }),
    ticketsCancelled: await prisma.ticket.count({ where: { status: 'Cancelled' } }),
    orderCombosPending: await prisma.orderCombo.count({ where: { isDelivered: false } }),
    orderCombosDelivered: await prisma.orderCombo.count({ where: { isDelivered: true } }),
  };
  console.log('=== TỔNG KẾT DỮ LIỆU SAU KHI BỔ SUNG ===', summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
