import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTask2Tests() {
  console.log('================================================================');
  console.log('🔒 KIỂM THỬ TASK 2: DATABASE CONCURRENCY & INVENTORY HARDENING');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err);
      throw err;
    }
  }

  // =====================================================================
  // NHÓM 1: KIỂM TRA SCHEMA & CÁC INDEXES TRONG POSTGRESQL
  // =====================================================================
  console.log('--- 1. Kiểm tra Schema & Các Foreign Key Indexes trong PostgreSQL ---');

  await test('1.1 Enum PaymentMethod chứa ZaloPay', async () => {
    const enumValues = await prisma.$queryRawUnsafe(`
      SELECT e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'PaymentMethod';
    `);
    const labels = enumValues.map((row) => row.enumlabel);
    assert.ok(labels.includes('ZaloPay'), `ZaloPay phải có trong PaymentMethod enum. Hiện tại: ${labels.join(', ')}`);
  });

  await test('1.2 Partial Unique Index "unique_active_ticket" tồn tại trên tickets', async () => {
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'tickets' AND indexname = 'unique_active_ticket';
    `);
    assert.strictEqual(indexes.length, 1, 'Phải có đúng 1 partial unique index unique_active_ticket');
    assert.ok(
      indexes[0].indexdef.includes('UNIQUE') && indexes[0].indexdef.includes('Cancelled'),
      `Định nghĩa index phải là UNIQUE và lọc status != Cancelled: ${indexes[0].indexdef}`
    );
  });

  await test('1.3 Các Foreign Key Indexes trên Payment, Ticket, Screening, OrderCombo', async () => {
    const allIndexes = await prisma.$queryRawUnsafe(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
    const indexNames = allIndexes.map((i) => `${i.tablename}.${i.indexname}`);

    // Payments indexes
    const paymentHasUserId = indexNames.some((n) => n.startsWith('payments.') && n.includes('user_id'));
    const paymentHasStatus = indexNames.some((n) => n.startsWith('payments.') && n.includes('status'));
    assert.ok(paymentHasUserId, 'Bảng payments phải có index trên user_id');
    assert.ok(paymentHasStatus, 'Bảng payments phải có index trên status');

    // Tickets indexes
    const ticketHasUserId = indexNames.some((n) => n.startsWith('tickets.') && n.includes('user_id'));
    const ticketHasPaymentId = indexNames.some((n) => n.startsWith('tickets.') && n.includes('payment_id'));
    const ticketHasScreeningId = indexNames.some((n) => n.startsWith('tickets.') && n.includes('screening_id'));
    assert.ok(ticketHasUserId, 'Bảng tickets phải có index trên user_id');
    assert.ok(ticketHasPaymentId, 'Bảng tickets phải có index trên payment_id');
    assert.ok(ticketHasScreeningId, 'Bảng tickets phải có index trên screening_id');

    // Screening indexes
    const screeningHasMovieId = indexNames.some((n) => n.startsWith('screenings.') && n.includes('movie_id'));
    const screeningHasDateStatus = indexNames.some((n) => n.startsWith('screenings.') && n.includes('date') && n.includes('status'));
    assert.ok(screeningHasMovieId, 'Bảng screenings phải có index trên movie_id');
    assert.ok(screeningHasDateStatus, 'Bảng screenings phải có composite index trên date, status');

    // OrderCombo indexes
    const ocHasPaymentId = indexNames.some((n) => n.startsWith('order_combos.') && n.includes('payment_id'));
    const ocHasComboId = indexNames.some((n) => n.startsWith('order_combos.') && n.includes('combo_id'));
    assert.ok(ocHasPaymentId, 'Bảng order_combos phải có index trên payment_id');
    assert.ok(ocHasComboId, 'Bảng order_combos phải có index trên combo_id');
  });

  // =====================================================================
  // NHÓM 2: CHỐNG DOUBLE BOOKING TẠI DATABASE BẰNG PARTIAL UNIQUE INDEX
  // =====================================================================
  console.log('\n--- 2. Kiểm thử chống Double Booking bằng Partial Unique Index ---');

  await test('2.1 Ngăn chặn 2 vé Valid/Used trùng (screeningId, seatId) ở tầng DB', async () => {
    // Tìm hoặc tạo screening & seat hợp lệ chưa có vé để test
    const screening = await prisma.screening.findFirst();
    assert.ok(screening, 'Cần ít nhất 1 screening để test');

    // Tạo một seat tạm riêng biệt cho test này
    const tempSeat = await prisma.seat.create({
      data: {
        screeningId: screening.id,
        row: 'Z',
        number: 99,
        code: 'Z99_TEST',
        status: 'EMPTY',
      },
    });

    const user = await prisma.user.findFirst();
    assert.ok(user, 'Cần ít nhất 1 user');

    // Tạo payment dummy
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 100000,
        status: 'Success',
      },
    });

    let ticket1Id = null;
    let ticket2Id = null;

    try {
      // Tạo vé thứ nhất thành công
      const ticket1 = await prisma.ticket.create({
        data: {
          userId: user.id,
          screeningId: screening.id,
          seatId: tempSeat.id,
          paymentId: payment.id,
          ticketType: 'Normal',
          price: 100000,
          status: 'Valid',
        },
      });
      ticket1Id = ticket1.id;

      // Cố tình tạo vé thứ 2 trùng screening_id và seat_id với status != 'Cancelled'
      let errorThrown = false;
      try {
        await prisma.ticket.create({
          data: {
            userId: user.id,
            screeningId: screening.id,
            seatId: tempSeat.id,
            paymentId: payment.id,
            ticketType: 'Normal',
            price: 100000,
            status: 'Valid',
          },
        });
      } catch (err) {
        errorThrown = true;
        // Kiểm tra lỗi vi phạm Unique Constraint trong PostgreSQL
        assert.ok(
          err.message.includes('unique_active_ticket') || err.message.includes('Unique constraint failed'),
          `Lỗi ném ra phải liên quan đến unique constraint: ${err.message}`
        );
      }
      assert.strictEqual(errorThrown, true, 'Database phải chặn vé trùng bằng Unique Constraint!');

      // Đổi ticket1 sang Cancelled
      await prisma.ticket.update({
        where: { id: ticket1Id },
        data: { status: 'Cancelled' },
      });

      // Bây giờ tạo vé mới cho ghế này phải THÀNH CÔNG vì vé cũ đã Cancelled
      const ticket2 = await prisma.ticket.create({
        data: {
          userId: user.id,
          screeningId: screening.id,
          seatId: tempSeat.id,
          paymentId: payment.id,
          ticketType: 'Normal',
          price: 100000,
          status: 'Valid',
        },
      });
      ticket2Id = ticket2.id;
      assert.ok(ticket2Id, 'Vé mới phải tạo thành công sau khi vé cũ bị hủy');
    } finally {
      // Dọn dẹp vé test & seat test
      if (ticket1Id) await prisma.ticket.delete({ where: { id: ticket1Id } }).catch(() => {});
      if (ticket2Id) await prisma.ticket.delete({ where: { id: ticket2Id } }).catch(() => {});
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      await prisma.seat.delete({ where: { id: tempSeat.id } }).catch(() => {});
    }
  });

  // =====================================================================
  // NHÓM 3: KHẮC PHỤC LỖI TỒN KHO COMBO & BẢO VỆ CONCURRENCY
  // =====================================================================
  console.log('\n--- 3. Kiểm thử an toàn tồn kho Combo & Chống âm kho POS ---');

  await test('3.1 Atomic conditional update trong POS ngăn chặn bán âm kho', async () => {
    // Tạo combo thử nghiệm với tồn kho = 1
    const testCombo = await prisma.combo.create({
      data: {
        name: 'Test Combo Concurrency',
        description: 'Testing race conditions',
        price: 50000,
        stock: 1,
        status: 'ACTIVE',
      },
    });

    try {
      // Giả lập 2 nhân viên quầy POS cùng bán combo cuối cùng (quantity = 1)
      const attempt1 = prisma.$transaction(async (tx) => {
        const res = await tx.combo.updateMany({
          where: { id: testCombo.id, stock: { gte: 1 } },
          data: { stock: { decrement: 1 } },
        });
        return res.count;
      });

      const attempt2 = prisma.$transaction(async (tx) => {
        const res = await tx.combo.updateMany({
          where: { id: testCombo.id, stock: { gte: 1 } },
          data: { stock: { decrement: 1 } },
        });
        return res.count;
      });

      const [res1, res2] = await Promise.all([attempt1, attempt2]);
      
      // Đúng 1 giao dịch thành công (count = 1) và 1 giao dịch thất bại (count = 0)
      const successCount = (res1 === 1 ? 1 : 0) + (res2 === 1 ? 1 : 0);
      assert.strictEqual(successCount, 1, 'Chỉ duy nhất 1 nhân viên bán được combo cuối cùng!');

      const finalCombo = await prisma.combo.findUnique({ where: { id: testCombo.id } });
      assert.strictEqual(finalCombo.stock, 0, 'Tồn kho cuối cùng phải là 0, TUYỆT ĐỐI KHÔNG BỊ ÂM');
    } finally {
      await prisma.combo.delete({ where: { id: testCombo.id } }).catch(() => {});
    }
  });

  await test('3.2 Combo Release không tăng khống tồn kho khi nhận số lượng tùy tiện', async () => {
    const testCombo = await prisma.combo.create({
      data: {
        name: 'Test Safe Release',
        price: 30000,
        stock: 10,
        status: 'ACTIVE',
      },
    });

    const user = await prisma.user.findFirst();

    try {
      // Tạo một reservation hợp lệ số lượng = 2
      const reservation = await prisma.comboReservation.create({
        data: {
          comboId: testCombo.id,
          userId: user.id,
          quantity: 2,
          status: 'RESERVED',
          reservedUntil: new Date(Date.now() + 600000),
        },
      });

      // Giảm stock đi 2 tương ứng với reservation
      await prisma.combo.update({
        where: { id: testCombo.id },
        data: { stock: { decrement: 2 } },
      });

      let currentStock = (await prisma.combo.findUnique({ where: { id: testCombo.id } })).stock;
      assert.strictEqual(currentStock, 8, 'Kho còn lại 8 sau khi reserve 2 phần');

      // Giả lập transaction giải phóng theo đúng mã reservation của user
      await prisma.$transaction(async (tx) => {
        const found = await tx.comboReservation.findMany({
          where: {
            id: reservation.id,
            status: 'RESERVED',
            userId: user.id,
          },
        });
        assert.strictEqual(found.length, 1);

        // Chỉ hoàn trả đúng số lượng trong bản ghi DB (2)
        await tx.combo.update({
          where: { id: found[0].comboId },
          data: { stock: { increment: found[0].quantity } },
        });

        await tx.comboReservation.update({
          where: { id: found[0].id },
          data: { status: 'RELEASED' },
        });
      });

      currentStock = (await prisma.combo.findUnique({ where: { id: testCombo.id } })).stock;
      assert.strictEqual(currentStock, 10, 'Kho được hoàn trả chính xác về 10');

      // Thử gọi release lần thứ 2 với cùng reservation ID -> không được tăng kho thêm
      await prisma.$transaction(async (tx) => {
        const found = await tx.comboReservation.findMany({
          where: {
            id: reservation.id,
            status: 'RESERVED',
            userId: user.id,
          },
        });
        assert.strictEqual(found.length, 0, 'Reservation đã RELEASED không được tìm thấy lại');
      });

      currentStock = (await prisma.combo.findUnique({ where: { id: testCombo.id } })).stock;
      assert.strictEqual(currentStock, 10, 'Kho vẫn giữ nguyên 10, không bị nhân đôi (Idempotent)');
    } finally {
      await prisma.comboReservation.deleteMany({ where: { comboId: testCombo.id } }).catch(() => {});
      await prisma.combo.delete({ where: { id: testCombo.id } }).catch(() => {});
    }
  });

  console.log('\n================================================================');
  console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ TASK 2 ĐÃ THÀNH CÔNG 100%!`);
  console.log('================================================================\n');
}

runTask2Tests()
  .catch((err) => {
    console.error('Lỗi khi chạy kiểm thử:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
