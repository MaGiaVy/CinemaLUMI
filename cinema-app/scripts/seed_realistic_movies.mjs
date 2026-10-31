import { PrismaClient, MovieStatus, ScreeningStatus, SeatType, SeatStatus } from '@prisma/client';

const prisma = new PrismaClient();

const MOVIES_TO_UPSERT = [
  {
    title: 'Dune: Hành Tinh Cát - Phần Hai',
    slug: 'dune-hanh-tinh-cat-phan-hai',
    description: 'Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc anh. Đứng trước sự lựa chọn giữa tình yêu của cuộc đời và số phận của vũ trụ, Paul phải ngăn chặn một tương lai tăm tối mà chỉ mình anh có thể thấy trước.',
    duration: 166,
    releaseDate: new Date('2026-03-01T00:00:00.000Z'),
    endDate: new Date('2026-11-30T00:00:00.000Z'),
    ageRating: 'C16',
    poster: '/movies/dune-2-poster.jpg',
    trailer: '/movies/dune-2-backdrop.jpg',
    rating: '8.8',
    genre: 'Khoa học viễn tưởng, Hành động, Phiêu lưu',
    director: 'Denis Villeneuve',
    cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler, Javier Bardem',
    status: MovieStatus.SHOWING,
    ticketPrice: 120000,
  },
  {
    title: 'Godzilla x Kong: Đế Chế Mới',
    slug: 'godzilla-x-kong-de-che-moi',
    description: 'Hai biểu tượng khổng lồ của điện ảnh - Kong toàn năng và Godzilla đáng sợ - cùng nhau hợp sức để đối đầu với mối hiểm họa khổng lồ chưa từng được khám phá đang ẩn sâu trong lòng Trái Đất, đe dọa trực tiếp sự tồn vong của nhân loại.',
    duration: 115,
    releaseDate: new Date('2026-03-29T00:00:00.000Z'),
    endDate: new Date('2026-11-30T00:00:00.000Z'),
    ageRating: 'C13',
    poster: '/movies/godzilla-kong-poster.jpg',
    trailer: '/movies/godzilla-kong-backdrop.jpg',
    rating: '8.3',
    genre: 'Hành động, Phiêu lưu, Quái thú',
    director: 'Adam Wingard',
    cast: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle',
    status: MovieStatus.SHOWING,
    ticketPrice: 110000,
  },
  {
    title: 'Kung Fu Panda 4',
    slug: 'kung-fu-panda-4',
    description: 'Sau khi đánh bại nhiều kẻ thù nguy hiểm, Gấu Po được chỉ định làm Thủ lĩnh tinh thần của Thung lũng Bình Yên. Po cần tìm kiếm và huấn luyện một Chiến Binh Rồng mới, đồng thời ngăn chặn mưu đồ chiếm đoạt quyền năng của mụ phù thủy Tắc Kè Bông hung ác.',
    duration: 94,
    releaseDate: new Date('2026-03-08T00:00:00.000Z'),
    endDate: new Date('2026-11-30T00:00:00.000Z'),
    ageRating: 'P',
    poster: '/movies/kungfu-panda-4-poster.jpg',
    trailer: '/movies/kungfu-panda-4-backdrop.jpg',
    rating: '7.9',
    genre: 'Hoạt hình, Hài hước, Gia đình, Võ thuật',
    director: 'Mike Mitchell',
    cast: 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman',
    status: MovieStatus.SHOWING,
    ticketPrice: 100000,
  },
  {
    title: 'Mai',
    slug: 'mai-tran-thanh',
    description: 'Mai - một phụ nữ làm nghề massage trị liệu với nhiều mặc cảm và quá khứ đau buồn. Mọi chuyện dần thay đổi khi Dương - một chàng trai đào hoa, khao khát tình yêu chân thành bước vào đời cô, mở ra một chuyện tình đầy ngọt ngào nhưng cũng lắm chông gai.',
    duration: 131,
    releaseDate: new Date('2026-02-10T00:00:00.000Z'),
    endDate: new Date('2026-11-30T00:00:00.000Z'),
    ageRating: 'C18',
    poster: '/movies/mai-poster.jpg',
    trailer: '/movies/mai-backdrop.jpg',
    rating: '8.6',
    genre: 'Tâm lý, Tình cảm, Gia đình',
    director: 'Trấn Thành',
    cast: 'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào, Uyển Ân',
    status: MovieStatus.SHOWING,
    ticketPrice: 110000,
  },
  {
    title: 'Deadpool & Wolverine',
    slug: 'deadpool-va-wolverine',
    description: 'Tổ chức Phương sai Thời gian (TVA) bất ngờ kéo Deadpool khỏi cuộc sống yên bình để giao cho anh trọng trách cứu lấy đa vũ trụ. Không còn cách nào khác, gã bựa nhân phải đi tìm và hợp tác cùng Wolverine - kẻ đang sống trong dằn vặt và thất vọng.',
    duration: 128,
    releaseDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T00:00:00.000Z'),
    ageRating: 'C18',
    poster: '/movies/deadpool-wolverine-poster.jpg',
    trailer: '/movies/deadpool-wolverine-backdrop.jpg',
    rating: '9.0',
    genre: 'Hành động, Siêu anh hùng, Hài hước',
    director: 'Shawn Levy',
    cast: 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen',
    status: MovieStatus.UPCOMING,
    ticketPrice: 120000,
  },
];

async function main() {
  console.log('=== BẮT ĐẦU CẬP NHẬT PHIM VÀ SUẤT CHIẾU THỰC TẾ ===\n');

  // 1. Cập nhật poster chuẩn cho 2 phim cũ (Spider-Man và Lật Mặt 8)
  console.log('1. Đồng bộ poster sắc nét cho Spider-Man và Lật Mặt 8...');
  await prisma.movie.updateMany({
    where: { title: { contains: 'Spider-Man' } },
    data: {
      poster: '/movies/spiderman-poster.jpg',
      trailer: '/movies/spiderman-backdrop.jpg',
      isDeleted: false,
      status: MovieStatus.SHOWING,
    },
  });

  await prisma.movie.updateMany({
    where: { title: { contains: 'Lật Mặt' } },
    data: {
      poster: '/movies/lat-mat-poster.jpg',
      trailer: '/movies/mai-backdrop.jpg',
      isDeleted: false,
      status: MovieStatus.SHOWING,
    },
  });
  console.log('✓ Hoàn tất cập nhật 2 phim có sẵn.\n');

  // 2. Thêm các phim mới vào Database
  console.log('2. Thêm danh sách phim bom tấn mới...');
  const createdMovies = [];
  for (const movieData of MOVIES_TO_UPSERT) {
    const existing = await prisma.movie.findFirst({
      where: {
        OR: [{ slug: movieData.slug }, { title: movieData.title }],
      },
    });

    let movie;
    if (existing) {
      movie = await prisma.movie.update({
        where: { id: existing.id },
        data: {
          ...movieData,
          isDeleted: false,
        },
      });
      console.log(`  -> Cập nhật phim: ${movie.title} (ID: ${movie.id})`);
    } else {
      movie = await prisma.movie.create({
        data: movieData,
      });
      console.log(`  -> Tạo mới phim: ${movie.title} (ID: ${movie.id})`);
    }
    createdMovies.push(movie);
  }
  console.log(`✓ Đã tạo/cập nhật xong ${createdMovies.length} bộ phim.\n`);

  // Lấy toàn bộ phim đang chiếu
  const showingMovies = await prisma.movie.findMany({
    where: {
      isDeleted: false,
      status: MovieStatus.SHOWING,
    },
  });
  console.log(`Tổng số phim Đang chiếu (SHOWING): ${showingMovies.length}`);
  showingMovies.forEach((m) => console.log(`  [ID: ${m.id}] ${m.title} - ${m.genre}`));

  // 3. Tạo các suất chiếu và ghế ngồi chi tiết cho các ngày tới
  console.log('\n3. Tạo lịch chiếu và ghế ngồi chi tiết từ 19/10/2026 đến 22/10/2026...');

  const dates = [
    new Date('2026-10-19T00:00:00.000Z'),
    new Date('2026-10-20T00:00:00.000Z'),
    new Date('2026-10-21T00:00:00.000Z'),
    new Date('2026-10-22T00:00:00.000Z'),
  ];

  // Lịch chiếu phân bố theo 4 phòng chiếu Cinema 01 -> Cinema 04
  const roomSchedules = [
    {
      room: 'Cinema 01',
      roomNum: 1,
      slots: [
        { startH: 9, startM: 30, endH: 11, endM: 30, movieIdx: 0 },
        { startH: 13, startM: 0, endH: 15, endM: 45, movieIdx: 1 },
        { startH: 16, startM: 30, endH: 18, endM: 45, movieIdx: 2 },
        { startH: 19, startM: 30, endH: 22, endM: 15, movieIdx: 1 },
      ],
    },
    {
      room: 'Cinema 02',
      roomNum: 2,
      slots: [
        { startH: 10, startM: 0, endH: 12, endM: 15, movieIdx: 3 },
        { startH: 13, startM: 30, endH: 15, endM: 45, movieIdx: 4 },
        { startH: 16, startM: 15, endH: 18, endM: 45, movieIdx: 0 },
        { startH: 19, startM: 15, endH: 21, endM: 30, movieIdx: 3 },
        { startH: 22, startM: 0, endH: 0, endM: 15, movieIdx: 4 },
      ],
    },
    {
      room: 'Cinema 03',
      roomNum: 3,
      slots: [
        { startH: 9, startM: 0, endH: 11, endM: 20, movieIdx: 5 % showingMovies.length },
        { startH: 12, startM: 0, endH: 14, endM: 0, movieIdx: 0 },
        { startH: 14, startM: 30, endH: 16, endM: 45, movieIdx: 2 },
        { startH: 17, startM: 30, endH: 20, endM: 15, movieIdx: 1 },
        { startH: 21, startM: 0, endH: 23, endM: 15, movieIdx: 2 },
      ],
    },
    {
      room: 'Cinema 04',
      roomNum: 4,
      slots: [
        { startH: 10, startM: 30, endH: 12, endM: 30, movieIdx: 0 },
        { startH: 13, startM: 30, endH: 15, endM: 45, movieIdx: 2 },
        { startH: 16, startM: 30, endH: 19, endM: 15, movieIdx: 1 },
        { startH: 20, startM: 0, endH: 22, endM: 30, movieIdx: 5 % showingMovies.length },
      ],
    },
  ];

  let totalScreeningsCreated = 0;
  let totalSeatsCreated = 0;

  for (const dateObj of dates) {
    for (const roomConfig of roomSchedules) {
      for (const slot of roomConfig.slots) {
        const targetMovie = showingMovies[slot.movieIdx % showingMovies.length];
        if (!targetMovie) continue;

        const startTime = new Date(dateObj);
        startTime.setUTCHours(slot.startH, slot.startM, 0, 0);

        const endTime = new Date(dateObj);
        if (slot.endH < slot.startH) {
          // Sang ngày hôm sau
          endTime.setDate(endTime.getDate() + 1);
        }
        endTime.setUTCHours(slot.endH, slot.endM, 0, 0);

        // Kiểm tra xem suất chiếu này đã tồn tại chưa để tránh trùng
        const existingScreening = await prisma.screening.findFirst({
          where: {
            room: roomConfig.room,
            startTime,
          },
        });

        if (existingScreening) {
          continue;
        }

        // Tạo suất chiếu
        const screening = await prisma.screening.create({
          data: {
            movieId: targetMovie.id,
            room: roomConfig.room,
            roomNumber: roomConfig.roomNum,
            startTime,
            endTime,
            date: dateObj,
            price: targetMovie.ticketPrice,
            status: ScreeningStatus.UPCOMING,
          },
        });
        totalScreeningsCreated++;

        // Tạo 50 ghế (A -> E, mỗi hàng 10 ghế)
        const seatData = [];
        const rows = ['A', 'B', 'C', 'D', 'E'];

        for (const row of rows) {
          for (let num = 1; num <= 10; num++) {
            let seatType = SeatType.STANDARD;
            if (row === 'C' || row === 'D') seatType = SeatType.VIP;
            if (row === 'E') seatType = SeatType.COUPLE;

            seatData.push({
              screeningId: screening.id,
              room: roomConfig.room,
              row,
              number: num,
              code: `${row}${num}`,
              type: seatType,
              status: SeatStatus.EMPTY,
            });
          }
        }

        await prisma.seat.createMany({
          data: seatData,
        });
        totalSeatsCreated += seatData.length;
      }
    }
  }

  console.log(`✓ Đã tạo thành công ${totalScreeningsCreated} suất chiếu mới.`);
  console.log(`✓ Đã khởi tạo thành công ${totalSeatsCreated} ghế trống (50 ghế/suất, phân bổ chuẩn STANDARD/VIP/COUPLE).\n`);

  // 4. Thêm một số bình luận thực tế cho phim
  console.log('4. Cập nhật đánh giá & bình luận chân thực cho các phim...');
  const sampleReviews = [
    {
      movieSlug: 'dune-hanh-tinh-cat-phan-hai',
      userId: 1,
      rating: 5,
      comment: 'Kỹ xảo và âm thanh đỉnh cao không tưởng! Trải nghiệm ở phòng IMAX thật sự chìm đắm, đáng từng đồng.',
    },
    {
      movieSlug: 'godzilla-kong-de-che-moi',
      userId: 7,
      rating: 5,
      comment: 'Phim giải trí cực đã, màn kết hợp của Godzilla và Kong mãn nhãn, các cảnh đánh nhau trong Trái Đất Rỗng rất hoành tráng.',
    },
    {
      movieSlug: 'kung-fu-panda-4',
      userId: 8,
      rating: 4,
      comment: 'Phim vui vẻ, đồ họa rực rỡ và hài hước, rất thích hợp dẫn cả gia đình và các bé đi xem cuối tuần.',
    },
    {
      movieSlug: 'mai-tran-thanh',
      userId: 9,
      rating: 5,
      comment: 'Phương Anh Đào diễn xuất thần, nhạc phim hay và câu chuyện rất xúc động, chạm đến cảm xúc người xem.',
    },
  ];

  for (const rev of sampleReviews) {
    const movie = await prisma.movie.findFirst({ where: { slug: rev.movieSlug } });
    if (movie) {
      const existingRev = await prisma.review.findFirst({
        where: { movieId: movie.id, userId: rev.userId },
      });
      if (!existingRev) {
        await prisma.review.create({
          data: {
            movieId: movie.id,
            userId: rev.userId,
            rating: rev.rating,
            comment: rev.comment,
          },
        });
      }
    }
  }
  console.log('✓ Đã cập nhật đánh giá phim thành công.\n');

  console.log('🎉 === HOÀN TẤT CẬP NHẬT TOÀN DIỆN DATABASE! ===');
}

main()
  .catch((err) => {
    console.error('Lỗi khi cập nhật DB:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
