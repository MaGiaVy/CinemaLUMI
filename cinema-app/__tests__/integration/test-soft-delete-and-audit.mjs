// cinema-app/__tests__/integration/test-soft-delete-and-audit.mjs
import assert from 'assert';
import { PrismaClient, TicketStatus, SeatStatus } from '@prisma/client';
import { getAdminCookie } from '../helpers/auth-helper.mjs';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('========================================================================');
console.log('🗑️ TEST SUITE: SOFT DELETE SCREENINGS & MOVIES AUDIT TRAIL (REQ 2 & 6)');
console.log('========================================================================\n');

async function main() {
  let adminCookie = null;
  let testMovie = null;
  let movieWithScreenings = null;
  let testScreeningWithTicket = null;
  let createdTicket = null;

  try {
    adminCookie = await getAdminCookie();

    // =========================================================================
    // PART 1: TEST HỦY SUẤT CHIẾU BẢO TOÀN LỊCH SỬ GIAO DỊCH (Requirement 2)
    // =========================================================================
    console.log('--- TEST 1: Hủy suất chiếu đã phát sinh giao dịch/vé (Soft Cancel) ---');

    // 1.1 Tạo phim & suất chiếu test
    testMovie = await prisma.movie.create({
      data: {
        title: 'Test Movie For Soft Cancel ' + Date.now(),
        slug: 'test-movie-soft-cancel-' + Date.now(),
        duration: 120,
        releaseDate: new Date('2026-10-01'),
        poster: 'https://images.unsplash.com/photo-test',
        genre: 'Hành Động',
        status: 'SHOWING',
      },
    });

    const screeningDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    testScreeningWithTicket = await prisma.screening.create({
      data: {
        movieId: testMovie.id,
        room: 'Cinema 01',
        roomNumber: 1,
        date: screeningDate,
        startTime: screeningDate,
        endTime: new Date(screeningDate.getTime() + 2 * 60 * 60 * 1000),
        price: 100000,
        status: 'UPCOMING',
        seats: {
          create: [
            { room: 'Cinema 01', row: 'A', number: 1, code: 'A1', type: 'STANDARD', status: 'OCCUPIED' },
          ],
        },
      },
      include: { seats: true },
    });

    let payment = await prisma.payment.findFirst({ where: { userId: 1 } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: { userId: 1, amount: 100000, paymentMethod: 'Cash', status: 'Success' },
      });
    }

    // Tạo vé đã thanh toán
    createdTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: testScreeningWithTicket.id,
        seatId: testScreeningWithTicket.seats[0].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
    });

    console.log(`✓ Đã tạo suất chiếu #${testScreeningWithTicket.id} và vé #${createdTicket.id}`);

    // 1.2 Thực hiện DELETE /api/screenings/[id] với quyền ADMIN
    const deleteScreeningRes = await fetch(`${BASE_URL}/api/screenings/${testScreeningWithTicket.id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const deleteScreeningJson = await deleteScreeningRes.json();
    if (deleteScreeningRes.status !== 200) {
      console.error('Delete Screening Failed:', deleteScreeningRes.status, deleteScreeningJson);
    }

    assert.strictEqual(deleteScreeningRes.status, 200);
    assert.strictEqual(deleteScreeningJson.success, true);
    assert.strictEqual(deleteScreeningJson.data.status, 'CANCELLED');
    assert.strictEqual(deleteScreeningJson.data.is_soft_deleted, true);
    assert.strictEqual(deleteScreeningJson.data.cancelled_tickets_count, 1);
    assert.strictEqual(deleteScreeningJson.data.total_refund_amount, 100000);
    console.log('✓ API trả về kết quả hủy suất chiếu thành công với status CANCELLED');

    // 1.3 Kiểm tra trực tiếp cơ sở dữ liệu: Suất chiếu KHÔNG bị xóa cứng khỏi DB
    const checkScreeningInDb = await prisma.screening.findUnique({
      where: { id: testScreeningWithTicket.id },
    });
    assert.ok(checkScreeningInDb, 'Suất chiếu phải tồn tại trong DB, không được hard delete');
    assert.strictEqual(checkScreeningInDb.status, 'CANCELLED', 'Screening status phải là CANCELLED');

    // Kiểm tra vé vẫn còn nguyên trong DB để phục vụ hoàn tiền / audit
    const checkTicketInDb = await prisma.ticket.findUnique({
      where: { id: createdTicket.id },
    });
    assert.ok(checkTicketInDb, 'Bản ghi vé phải còn nguyên vẹn trong DB phục vụ đối soát');
    assert.strictEqual(checkTicketInDb.status, TicketStatus.Cancelled, 'Trạng thái vé phải chuyển sang Cancelled');

    // Kiểm tra ghế được giải phóng về EMPTY
    const checkSeatInDb = await prisma.seat.findUnique({
      where: { id: testScreeningWithTicket.seats[0].id },
    });
    assert.strictEqual(checkSeatInDb.status, SeatStatus.EMPTY, 'Ghế phải được giải phóng về EMPTY');
    console.log('✓ Xác thực DB: Dữ liệu suất chiếu và vé được bảo toàn 100% cho kiểm toán hoàn tiền');

    // =========================================================================
    // PART 2: TEST SOFT DELETE PHIM THEO FR-ADM-02 (Requirement 6)
    // =========================================================================
    console.log('\n--- TEST 2: Soft delete phim đã có suất chiếu/giao dịch theo FR-ADM-02 ---');

    // 2.1 Thử xóa testMovie (đã có testScreeningWithTicket ở trạng thái CANCELLED)
    const deleteMovieRes = await fetch(`${BASE_URL}/api/movies/${testMovie.id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const deleteMovieJson = await deleteMovieRes.json();

    assert.strictEqual(deleteMovieRes.status, 200);
    assert.strictEqual(deleteMovieJson.success, true);
    assert.strictEqual(deleteMovieJson.data.is_deleted, true);
    assert.strictEqual(deleteMovieJson.data.status, 'ENDED');
    console.log('✓ API trả về kết quả soft-delete phim thành công theo FR-ADM-02:', deleteMovieJson.message);

    // 2.2 Kiểm tra DB: Phim vẫn tồn tại trong DB, không bị hard delete làm mất dữ liệu lịch sử
    const checkMovieInDb = await prisma.movie.findUnique({
      where: { id: testMovie.id },
    });
    assert.ok(checkMovieInDb, 'Phim phải tồn tại trong DB để bảo toàn lịch sử');
    assert.strictEqual(checkMovieInDb.isDeleted, true);
    assert.strictEqual(checkMovieInDb.status, 'ENDED');
    console.log('✓ Xác thực DB: Phim được gắn cờ is_deleted = true, status = ENDED');

    // 2.3 Kiểm tra danh sách phim công khai (GET /api/movies) không hiển thị phim đã soft-delete
    const listMoviesRes = await fetch(`${BASE_URL}/api/movies`);
    const listMoviesJson = await listMoviesRes.json();
    assert.strictEqual(listMoviesRes.status, 200);
    const foundDeletedMovie = listMoviesJson.data.find((m) => m.id === testMovie.id);
    assert.strictEqual(foundDeletedMovie, undefined, 'Phim đã soft-delete không được xuất hiện trong danh mục công khai');
    console.log('✓ GET /api/movies đã ẩn hoàn toàn phim đã soft-delete');

    // 2.4 Kiểm tra phim chưa từng có suất chiếu nào -> Được phép hard delete
    console.log('\n--- TEST 3: Phim chưa từng có suất chiếu -> Hard delete thành công ---');
    const standaloneMovie = await prisma.movie.create({
      data: {
        title: 'Standalone Movie ' + Date.now(),
        slug: 'standalone-movie-' + Date.now(),
        duration: 90,
        releaseDate: new Date('2026-10-01'),
        poster: 'https://images.unsplash.com/standalone',
        genre: 'Hài',
        status: 'SHOWING',
      },
    });

    const deleteStandaloneRes = await fetch(`${BASE_URL}/api/movies/${standaloneMovie.id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const deleteStandaloneJson = await deleteStandaloneRes.json();
    assert.strictEqual(deleteStandaloneRes.status, 200);
    assert.strictEqual(deleteStandaloneJson.data.is_deleted, false);

    const checkStandaloneInDb = await prisma.movie.findUnique({
      where: { id: standaloneMovie.id },
    });
    assert.strictEqual(checkStandaloneInDb, null, 'Phim chưa có giao dịch phải được xóa sạch khỏi DB');
    console.log('✓ Phim không có suất chiếu được hard-delete an toàn khỏi hệ thống');

    console.log('\n========================================================================');
    console.log('🎉 TOÀN BỘ TEST CASES SOFT DELETE SUẤT CHIẾU VÀ PHIM ĐỀU PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    // Dọn dẹp dữ liệu test
    if (createdTicket) {
      await prisma.ticket.delete({ where: { id: createdTicket.id } }).catch(() => {});
    }
    if (testScreeningWithTicket) {
      await prisma.seat.deleteMany({ where: { screeningId: testScreeningWithTicket.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: testScreeningWithTicket.id } }).catch(() => {});
    }
    if (testMovie) {
      await prisma.movie.delete({ where: { id: testMovie.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Lỗi kiểm thử soft delete:', e);
  process.exit(1);
});
