import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROOMS = [
  { name: 'Cinema 01', num: 1 },
  { name: 'Cinema 02', num: 2 },
  { name: 'Cinema 03', num: 3 },
  { name: 'Cinema 04', num: 4 },
  { name: 'Cinema 05', num: 5 },
];

function build50Seats(screeningId, roomName) {
  const list = [];
  for (const row of ROWS) {
    for (const number of COLS) {
      list.push({
        screeningId,
        room: roomName,
        row,
        number,
        code: `${row}${number}`,
        type: 'STANDARD',
        status: 'EMPTY',
      });
    }
  }
  return list;
}

async function main() {
  console.log('=== BẮT ĐẦU SEED DỮ LIỆU DEMO PHONG PHÚ CHO LUMICINEMA ===');

  // 1. Thêm các bộ phim mới (dùng ảnh local trong public/movies/ để luôn hiển thị đẹp)
  const newMoviesData = [
    {
      title: 'Spider-Man: Beyond the Spider-Verse',
      slug: 'spider-man-beyond-the-spider-verse',
      description: 'Miles Morales tái xuất trong phần tiếp theo của siêu phẩm hoạt hình đa vũ trụ, đối mặt với những biến cố mới xuyên suốt các chiều không gian.',
      duration: 140,
      releaseDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-31'),
      ageRating: 'P',
      poster: '/movies/spiderman-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
      genre: 'Hoạt hình, Hành động, Phiêu lưu',
      director: 'Joaquim Dos Santos',
      cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
      rating: 4.8,
      status: 'SHOWING',
      ticketPrice: 110000,
    },
    {
      title: 'Lật Mặt 8: Vòng Tay Nhân Ái',
      slug: 'lat-mat-8-vong-tay-nhan-ai',
      description: 'Câu chuyện gia đình đầy cảm xúc về tình thân, sự hy sinh và nghị lực vượt qua biến cố cuộc sống miền Tây.',
      duration: 125,
      releaseDate: new Date('2026-11-10'),
      endDate: new Date('2026-12-31'),
      ageRating: 'C13',
      poster: '/movies/lat-mat-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: 'Gia đình, Tâm lý, Hài',
      director: 'Lý Hải',
      cast: 'Trương Minh Cường, Đinh Y Nhung, Quách Ngọc Tuyên',
      rating: 4.7,
      status: 'SHOWING',
      ticketPrice: 100000,
    },
    {
      title: 'Quật Mộ Trùng Ma (Exhuma)',
      slug: 'quat-mo-trung-ma-exhuma',
      description: 'Hai pháp sư, một thầy phong thủy và một chuyên gia tang lễ hợp sức khai quật ngôi mộ cổ bí ẩn, đánh thức thế lực hắc ám ngàn năm.',
      duration: 134,
      releaseDate: new Date('2026-11-05'),
      endDate: new Date('2026-12-31'),
      ageRating: 'T18',
      poster: '/movies/exhuma-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: 'Kinh dị, Bí ẩn, Giật gân',
      director: 'Jang Jae-hyun',
      cast: 'Choi Min-sik, Kim Go-eun, Yoo Hae-jin',
      rating: 4.6,
      status: 'SHOWING',
      ticketPrice: 120000,
    },
    {
      title: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
      slug: 'inside-out-2-cam-xuc',
      description: 'Riley bước vào tuổi thiếu niên với sự xuất hiện của các cảm xúc mới: Lo Âu, Ganh Tị, Xấu Hổ và Chán Nản.',
      duration: 100,
      releaseDate: new Date('2026-11-12'),
      endDate: new Date('2026-12-31'),
      ageRating: 'P',
      poster: '/movies/inside-out-2-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
      genre: 'Hoạt hình, Gia đình, Hài',
      director: 'Kelsey Mann',
      cast: 'Amy Poehler, Maya Hawke, Phyllis Smith',
      rating: 4.9,
      status: 'SHOWING',
      ticketPrice: 95000,
    },
    {
      title: 'John Wick: Ballerina',
      slug: 'john-wick-ballerina',
      description: 'Nữ sát thủ được đào tạo bởi tổ chức Ruska Roma lên đường truy tìm những kẻ đã sát hại gia đình mình.',
      duration: 128,
      releaseDate: new Date('2026-11-15'),
      endDate: new Date('2026-12-31'),
      ageRating: 'T18',
      poster: '/movies/ballerina-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: 'Hành động, Hình sự, Giật gân',
      director: 'Len Wiseman',
      cast: 'Ana de Armas, Keanu Reeves, Ian McShane',
      rating: 4.5,
      status: 'SHOWING',
      ticketPrice: 125000,
    },
    {
      title: 'Avatar: Lửa Và Tro Tàn',
      slug: 'avatar-lua-va-tro-tan',
      description: 'Gia đình Jake Sully tiếp tục hành trình khám phá vùng đất mới của hành tinh Pandora và đối mặt tộc Người Tro.',
      duration: 185,
      releaseDate: new Date('2026-12-18'),
      endDate: new Date('2027-02-28'),
      ageRating: 'C13',
      poster: '/movies/avatar-3-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: 'Khoa học viễn tưởng, Phiêu lưu',
      director: 'James Cameron',
      cast: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
      rating: 0.0,
      status: 'UPCOMING',
      ticketPrice: 130000,
    },
    {
      title: 'Avengers: Secret Wars',
      slug: 'avengers-secret-wars',
      description: 'Trận chiến tối thượng hợp nhất toàn bộ các siêu anh hùng đa vũ trụ để bảo vệ dòng thời gian thiêng liêng.',
      duration: 165,
      releaseDate: new Date('2026-12-25'),
      endDate: new Date('2027-03-15'),
      ageRating: 'C13',
      poster: '/movies/avengers-secret-wars-poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: 'Hành động, Siêu anh hùng, Viễn tưởng',
      director: 'Anthony Russo, Joe Russo',
      cast: 'Robert Downey Jr., Benedict Cumberbatch, Tom Holland',
      rating: 0.0,
      status: 'UPCOMING',
      ticketPrice: 135000,
    },
  ];

  const createdMovies = [];
  for (const m of newMoviesData) {
    let movie = await prisma.movie.findUnique({ where: { slug: m.slug } });
    if (!movie) {
      movie = await prisma.movie.create({ data: m });
      console.log(`+ Thêm phim: ${movie.title} (${movie.status}, ${movie.ageRating})`);
    } else {
      console.log(`= Đã có phim: ${movie.title}`);
    }
    createdMovies.push(movie);
  }

  // 2. Tạo lịch suất chiếu + 50 ghế (A1-E10) cho các phim SHOWING mới trong 8 ngày tới
  const showingNewMovies = createdMovies.filter((m) => m.status === 'SHOWING');
  const timeSlots = [9, 12, 15, 18, 21]; // giờ bắt đầu
  let addedScreenings = 0;

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + dayOffset);

    for (let mi = 0; mi < showingNewMovies.length; mi++) {
      const movie = showingNewMovies[mi];
      // Mỗi phim có 2-3 suất/ngày tại các phòng khác nhau, kiểm tra trùng lịch (+15p dọn phòng)
      for (const slotIdx of [mi % 5, (mi + 2) % 5]) {
        const room = ROOMS[(mi + dayOffset + slotIdx) % ROOMS.length];
        const hour = timeSlots[slotIdx];
        const startTime = new Date(baseDate);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);

        const bufStart = new Date(startTime.getTime() - 15 * 60 * 1000);
        const bufEnd = new Date(endTime.getTime() + 15 * 60 * 1000);

        const conflict = await prisma.screening.findFirst({
          where: {
            room: room.name,
            status: { not: 'CANCELLED' },
            startTime: { lt: bufEnd },
            endTime: { gt: bufStart },
          },
        });

        if (!conflict) {
          const sc = await prisma.screening.create({
            data: {
              movieId: movie.id,
              room: room.name,
              roomNumber: room.num,
              startTime,
              endTime,
              date: baseDate,
              price: movie.ticketPrice,
              status: 'UPCOMING',
            },
          });
          await prisma.seat.createMany({
            data: build50Seats(sc.id, room.name),
            skipDuplicates: true,
          });
          addedScreenings++;
        }
      }
    }
  }
  console.log(`+ Đã thêm ${addedScreenings} suất chiếu mới (kèm ${addedScreenings * 50} ghế A1-E10).`);

  // 3. Thêm các Combo bắp nước phong phú nếu chưa có
  const extraCombos = [
    {
      name: 'Combo Couple Lumi (1 Bắp Lớn + 2 Nước Lớn)',
      description: '1 Bắp rang bơ vị Caramel/Phô mai cỡ lớn + 2 Pepsi/Coca cỡ lớn.',
      price: 119000,
      image: '/combos/combo-doi.jpg',
      stock: 150,
      status: 'ACTIVE',
    },
    {
      name: 'Combo Solo Tiết Kiệm (1 Bắp Vừa + 1 Nước)',
      description: 'Combo gọn nhẹ dành cho 1 người xem phim.',
      price: 75000,
      image: '/combos/combo-solo.jpg',
      stock: 200,
      status: 'ACTIVE',
    },
    {
      name: 'Combo Gia Đình VIP (2 Bắp Lớn + 4 Nước)',
      description: 'Siêu tiết kiệm cho nhóm bạn hoặc gia đình 4 người.',
      price: 215000,
      image: '/combos/combo-vip-giadinh.jpg',
      stock: 80,
      status: 'ACTIVE',
    },
    {
      name: 'Bắp Caramel Thượng Hạng (Size L)',
      description: 'Bắp rang bơ phủ caramel giòn tan thơm lừng.',
      price: 65000,
      image: '/combos/bap-caramel.jpg',
      stock: 120,
      status: 'ACTIVE',
    },
  ];
  for (const c of extraCombos) {
    const exists = await prisma.combo.findFirst({ where: { name: c.name } });
    if (!exists) {
      await prisma.combo.create({ data: c });
      console.log(`+ Thêm combo: ${c.name}`);
    }
  }

  // 4. Thêm nhiều mã Voucher (Coupons) để demo áp dụng giảm giá
  const demoCoupons = [
    {
      code: 'LUMI20',
      discountType: 'Percentage',
      discountValue: 20,
      minAmount: 100000,
      maxUsage: 100,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'LUMI50K',
      discountType: 'FixedAmount',
      discountValue: 50000,
      minAmount: 150000,
      maxUsage: 100,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'GIAM30',
      discountType: 'Percentage',
      discountValue: 30,
      minAmount: 200000,
      maxUsage: 50,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'SINHVIEN15',
      discountType: 'Percentage',
      discountValue: 15,
      minAmount: 50000,
      maxUsage: 200,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'VIP100K',
      discountType: 'FixedAmount',
      discountValue: 100000,
      minAmount: 300000,
      maxUsage: 50,
      expiryDate: new Date('2027-12-31'),
    },
  ];
  for (const cp of demoCoupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: { maxUsage: cp.maxUsage, expiryDate: cp.expiryDate },
      create: cp,
    });
  }
  console.log('+ Đã cập nhật/thêm 5 mã Voucher demo: LUMI20, LUMI50K, GIAM30, SINHVIEN15, VIP100K.');

  // 5. Thêm đánh giá (Reviews) phong phú cho các phim đang chiếu
  const users = await prisma.user.findMany({ take: 6 });
  const allShowing = await prisma.movie.findMany({ where: { status: 'SHOWING', isDeleted: false } });
  const sampleComments = [
    'Phim quá xuất sắc, hình ảnh 4K và âm thanh Dolby Atmos rất đã tai!',
    'Cốt truyện lôi cuốn từ đầu đến cuối, rất đáng tiền vé.',
    'Rạp LumiCinema ghế ngồi thoải mái, đặt vé online cực kỳ nhanh gọn.',
    'Diễn xuất đỉnh cao, đoạn cao trào xem nổi da gà luôn.',
    'Combo bắp caramel ở đây rất ngon, xem phim cuối tuần quá tuyệt vời.',
  ];

  let addedReviews = 0;
  for (const movie of allShowing) {
    const existingCount = await prisma.review.count({ where: { movieId: movie.id } });
    if (existingCount < 2) {
      for (let i = 0; i < Math.min(3, users.length); i++) {
        const u = users[(movie.id + i) % users.length];
        const dup = await prisma.review.findFirst({ where: { userId: u.id, movieId: movie.id } });
        if (!dup) {
          const rating = i === 0 ? 5 : 4;
          await prisma.review.create({
            data: {
              userId: u.id,
              movieId: movie.id,
              rating,
              comment: sampleComments[(movie.id + i) % sampleComments.length],
            },
          });
          addedReviews++;
        }
      }
      const agg = await prisma.review.aggregate({
        where: { movieId: movie.id },
        _avg: { rating: true },
      });
      if (agg._avg.rating) {
        await prisma.movie.update({
          where: { id: movie.id },
          data: { rating: Number(agg._avg.rating.toFixed(1)) },
        });
      }
    }
  }
  console.log(`+ Đã thêm ${addedReviews} đánh giá (Reviews) mới.`);

  // 6. Đặt sẵn một vài ghế mẫu ở các suất chiếu sắp tới để sơ đồ ghế có ghế Đã bán trực quan
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } }) || users[0];
  if (customer && showingNewMovies.length > 0) {
    const targetScreening = await prisma.screening.findFirst({
      where: { movieId: showingNewMovies[0].id, startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
    });
    if (targetScreening) {
      const sampleSeats = await prisma.seat.findMany({
        where: { screeningId: targetScreening.id, code: { in: ['C5', 'C6', 'D5', 'D6'] }, status: 'EMPTY' },
      });
      if (sampleSeats.length > 0) {
        const pay = await prisma.payment.create({
          data: {
            userId: customer.id,
            screeningId: targetScreening.id,
            amount: sampleSeats.length * Number(targetScreening.price),
            paymentMethod: 'ZaloPay',
            transactionCode: `DEMO_SEED_${Date.now()}`,
            status: 'Success',
          },
        });
        for (const s of sampleSeats) {
          await prisma.seat.update({ where: { id: s.id }, data: { status: 'OCCUPIED' } });
          await prisma.ticket.create({
            data: {
              userId: customer.id,
              screeningId: targetScreening.id,
              seatId: s.id,
              paymentId: pay.id,
              ticketType: 'Thường',
              price: targetScreening.price,
              status: 'Valid',
            },
          });
        }
        console.log(`+ Đã tạo ${sampleSeats.length} vé mẫu (C5, C6, D5, D6) cho suất chiếu #${targetScreening.id}.`);
      }
    }
  }

  const finalCounts = await Promise.all([
    prisma.movie.count(),
    prisma.screening.count({ where: { startTime: { gte: new Date() } } }),
    prisma.combo.count(),
    prisma.coupon.count(),
    prisma.review.count(),
    prisma.ticket.count(),
  ]);
  console.log('=== TỔNG DỮ LIỆU DEMO HIỆN CÓ ===', {
    movies: finalCounts[0],
    futureScreenings: finalCounts[1],
    combos: finalCounts[2],
    coupons: finalCounts[3],
    reviews: finalCounts[4],
    tickets: finalCounts[5],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
