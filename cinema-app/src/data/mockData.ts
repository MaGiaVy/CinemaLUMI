export type MovieStatus = 'showing' | 'coming_soon' | 'ended';
export type TicketStatus = 'valid' | 'used' | 'cancelled';
export type VoucherStatus = 'active' | 'expired';
export type UserRole = 'customer' | 'staff' | 'admin';

export interface Movie {
  id: string;
  title: string;
  genre: string[];
  duration: number; // minutes
  rating: number; // out of 5
  description: string;
  director: string;
  cast: string[];
  releaseDate: string;
  poster: string; // Unsplash URL
  banner: string;
  status: MovieStatus;
  ticketPrice: number;
}

export interface Screening {
  id: string;
  movieId: string;
  date: string;
  time: string;
  room: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
}

export interface Ticket {
  id: string;
  movieTitle: string;
  moviePoster: string;
  date: string;
  time: string;
  room: string;
  seats: string[];
  ticketType: string;
  totalPrice: number;
  status: TicketStatus;
  qrCode: string;
  purchaseDate: string;
  customerName: string;
  customerEmail: string;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  items: string[];
  price: number;
  originalPrice: number;
  stock: number;
  badge?: string;
  image: string;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUsage: number;
  usedCount: number;
  expiry: string;
  status: VoucherStatus;
  applicableMovies: string[];
}

export interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Transaction {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  movieTitle: string;
  seats: string[];
  total: number;
  method: string;
  time: string;
  status: string;
}

export interface RevenueDay {
  day: string;
  revenue: number;
  tickets: number;
}

export const movies: Movie[] = [
  {
    id: 'm1',
    title: 'Spider-Man: Beyond the Spider-Verse',
    genre: ['Hoạt hình', 'Hành động', 'Phiêu lưu'],
    duration: 140,
    rating: 4.8,
    description: 'Miles Morales du hành xuyên vũ trụ đa chiều, đối mặt với những người nhện từ các chiều không gian khác để bảo vệ số phận người thân yêu.',
    director: 'Joaquim Dos Santos, Kemp Powers',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
    releaseDate: '2026-06-02',
    poster: '/movies/spiderman-poster.jpg',
    banner: '/movies/spiderman-backdrop.jpg',
    status: 'showing',
    ticketPrice: 120000,
  },
  {
    id: 'm2',
    title: 'Lật Mặt 8: Vòng Tay Nhân Ái',
    genre: ['Hài', 'Gia đình', 'Tâm lý'],
    duration: 125,
    rating: 4.5,
    description: 'Tiếp nối thành công vang dội của các phần trước, Lật Mặt 8 mang đến câu chuyện cảm động về tình người và lòng nhân ái trong cuộc sống hiện đại.',
    director: 'Lý Hải',
    cast: ['Lý Hải', 'Minh Hà', 'Tuấn Trần'],
    releaseDate: '2026-04-30',
    poster: '/movies/lat-mat-poster.jpg',
    banner: '/movies/mai-backdrop.jpg',
    status: 'showing',
    ticketPrice: 100000,
  },
  {
    id: 'm3',
    title: 'Dune: Hành Tinh Cát - Phần Hai',
    genre: ['Khoa học viễn tưởng', 'Hành động', 'Phiêu lưu'],
    duration: 166,
    rating: 4.9,
    description: 'Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc anh, đối diện lựa chọn sinh tử của toàn vũ trụ.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    releaseDate: '2026-03-01',
    poster: '/movies/dune-2-poster.jpg',
    banner: '/movies/dune-2-backdrop.jpg',
    status: 'showing',
    ticketPrice: 120000,
  },
  {
    id: 'm4',
    title: 'Godzilla x Kong: Đế Chế Mới',
    genre: ['Hành động', 'Phiêu lưu', 'Quái thú'],
    duration: 115,
    rating: 4.6,
    description: 'Kong toàn năng và Godzilla đáng sợ hợp sức chống lại mối đe dọa sinh tử đang ẩn sâu trong Trái Đất Rỗng.',
    director: 'Adam Wingard',
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens'],
    releaseDate: '2026-03-29',
    poster: '/movies/godzilla-kong-poster.jpg',
    banner: '/movies/godzilla-kong-backdrop.jpg',
    status: 'showing',
    ticketPrice: 110000,
  },
  {
    id: 'm5',
    title: 'Kung Fu Panda 4',
    genre: ['Hoạt hình', 'Hài hước', 'Gia đình', 'Võ thuật'],
    duration: 94,
    rating: 4.4,
    description: 'Po được chọn làm Thủ lĩnh tinh thần, phải tìm kiếm truyền nhân Chiến Binh Rồng và đối đầu với mụ phù thủy biến hình Tắc Kè Bông.',
    director: 'Mike Mitchell',
    cast: ['Jack Black', 'Awkwafina', 'Viola Davis'],
    releaseDate: '2026-03-08',
    poster: '/movies/kungfu-panda-4-poster.jpg',
    banner: '/movies/kungfu-panda-4-backdrop.jpg',
    status: 'showing',
    ticketPrice: 100000,
  },
  {
    id: 'm6',
    title: 'Mai',
    genre: ['Tâm lý', 'Tình cảm', 'Gia đình'],
    duration: 131,
    rating: 4.7,
    description: 'Chuyện tình ngọt ngào nhưng đầy trắc trở giữa Mai - người phụ nữ massage trị liệu nhiều tổn thương và Dương - chàng nhạc công đào hoa khao khát yêu thương.',
    director: 'Trấn Thành',
    cast: ['Phương Anh Đào', 'Tuấn Trần', 'Trấn Thành', 'Hồng Đào'],
    releaseDate: '2026-02-10',
    poster: '/movies/mai-poster.jpg',
    banner: '/movies/mai-backdrop.jpg',
    status: 'showing',
    ticketPrice: 110000,
  },
  {
    id: 'm7',
    title: 'Deadpool & Wolverine',
    genre: ['Hành động', 'Siêu anh hùng', 'Hài hước'],
    duration: 128,
    rating: 4.9,
    description: 'TVA kéo Deadpool khỏi cuộc sống bình yên để giao trọng trách bảo vệ đa vũ trụ, buộc anh đồng hành cùng một Wolverine cay đắng và bất cần.',
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    releaseDate: '2026-11-01',
    poster: '/movies/deadpool-wolverine-poster.jpg',
    banner: '/movies/deadpool-wolverine-backdrop.jpg',
    status: 'coming_soon',
    ticketPrice: 120000,
  },
];

export const screenings: Screening[] = [
  { id: 's1', movieId: 'm1', date: '2026-10-19', time: '09:30', room: 'Cinema 01', totalSeats: 50, availableSeats: 50, price: 120000 },
  { id: 's2', movieId: 'm2', date: '2026-10-19', time: '13:30', room: 'Cinema 02', totalSeats: 50, availableSeats: 50, price: 100000 },
  { id: 's3', movieId: 'm3', date: '2026-10-19', time: '16:30', room: 'Cinema 01', totalSeats: 50, availableSeats: 50, price: 120000 },
  { id: 's4', movieId: 'm4', date: '2026-10-19', time: '19:30', room: 'Cinema 03', totalSeats: 50, availableSeats: 50, price: 110000 },
  { id: 's5', movieId: 'm5', date: '2026-10-19', time: '10:00', room: 'Cinema 04', totalSeats: 50, availableSeats: 50, price: 100000 },
  { id: 's6', movieId: 'm6', date: '2026-10-19', time: '14:00', room: 'Cinema 02', totalSeats: 50, availableSeats: 50, price: 110000 },
];

export const tickets: Ticket[] = [
  {
    id: 't1',
    movieTitle: 'Avengers: Doomsday',
    moviePoster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&auto=format',
    date: '2026-09-25',
    time: '19:30',
    room: 'Phòng 3',
    seats: ['E5', 'E6'],
    ticketType: 'Thường',
    totalPrice: 280000,
    status: 'valid',
    qrCode: 'LMC-2026-T001',
    purchaseDate: '2026-09-24',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
  {
    id: 't2',
    movieTitle: 'Lật Mặt 8',
    moviePoster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop&auto=format',
    date: '2026-09-20',
    time: '13:00',
    room: 'Phòng 4',
    seats: ['C3'],
    ticketType: 'Trẻ em',
    totalPrice: 50000,
    status: 'used',
    qrCode: 'LMC-2026-T002',
    purchaseDate: '2026-09-19',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
  {
    id: 't3',
    movieTitle: 'Mission: Impossible 9',
    moviePoster: 'https://images.unsplash.com/photo-1568111561564-08726a1563e1?w=400&h=600&fit=crop&auto=format',
    date: '2026-10-01',
    time: '20:00',
    room: 'Phòng 2',
    seats: ['F7', 'F8', 'F9'],
    ticketType: 'Thường',
    totalPrice: 390000,
    status: 'valid',
    qrCode: 'LMC-2026-T003',
    purchaseDate: '2026-09-23',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
  {
    id: 't4',
    movieTitle: 'Inside Out 3',
    moviePoster: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=600&fit=crop&auto=format',
    date: '2026-09-10',
    time: '09:30',
    room: 'Phòng 3',
    seats: ['B4', 'B5'],
    ticketType: 'Trẻ em',
    totalPrice: 110000,
    status: 'cancelled',
    qrCode: 'LMC-2026-T004',
    purchaseDate: '2026-09-08',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
  {
    id: 't5',
    movieTitle: 'Joker: Folie à Deux',
    moviePoster: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop&auto=format',
    date: '2026-09-15',
    time: '18:00',
    room: 'Phòng 4',
    seats: ['D9'],
    ticketType: 'Thường',
    totalPrice: 115000,
    status: 'used',
    qrCode: 'LMC-2026-T005',
    purchaseDate: '2026-09-14',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
  {
    id: 't6',
    movieTitle: 'Superman: Legacy',
    moviePoster: 'https://images.unsplash.com/photo-1604975999044-188783d54fb3?w=400&h=600&fit=crop&auto=format',
    date: '2026-10-05',
    time: '21:00',
    room: 'Phòng 1',
    seats: ['G3', 'G4'],
    ticketType: 'Thường',
    totalPrice: 250000,
    status: 'valid',
    qrCode: 'LMC-2026-T006',
    purchaseDate: '2026-09-25',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@email.com',
  },
];

export const combos: Combo[] = [
  {
    id: 'c1',
    name: 'Combo Lumi',
    description: 'Bắp rang bơ lớn + 1 nước ngọt lớn',
    items: ['Bắp rang bơ lớn', 'Nước ngọt lớn (Pepsi/7UP)'],
    price: 129000,
    originalPrice: 160000,
    stock: 45,
    badge: 'BÁN CHẠY',
    image: '/combos/combo-solo.jpg',
  },
  {
    id: 'c2',
    name: 'Combo Đôi',
    description: 'Bắp rang bơ lớn + 2 nước ngọt vừa',
    items: ['Bắp rang bơ lớn', 'Nước ngọt vừa x2'],
    price: 99000,
    originalPrice: 130000,
    stock: 30,
    image: '/combos/combo-doi.jpg',
  },
  {
    id: 'c3',
    name: 'Bắp Caramel',
    description: 'Bắp caramel vừa thơm ngon',
    items: ['Bắp rang caramel vừa'],
    price: 69000,
    originalPrice: 85000,
    stock: 20,
    image: '/combos/bap-caramel.jpg',
  },
  {
    id: 'c4',
    name: 'Combo VIP',
    description: 'Bắp rang bơ lớn + 2 nước lớn + Hotdog',
    items: ['Bắp rang bơ lớn', 'Nước ngọt lớn x2', 'Hotdog'],
    price: 189000,
    originalPrice: 240000,
    stock: 15,
    badge: 'MỚI',
    image: '/combos/combo-vip-giadinh.jpg',
  },
];

export const vouchers: Voucher[] = [
  {
    id: 'v1',
    code: 'LUMI20',
    discountType: 'percent',
    discountValue: 20,
    minPurchase: 100000,
    maxUsage: 500,
    usedCount: 312,
    expiry: '2026-12-31',
    status: 'active',
    applicableMovies: [],
  },
  {
    id: 'v2',
    code: 'WEEKEND50',
    discountType: 'fixed',
    discountValue: 50000,
    minPurchase: 200000,
    maxUsage: 200,
    usedCount: 187,
    expiry: '2026-10-31',
    status: 'active',
    applicableMovies: ['m1', 'm3'],
  },
  {
    id: 'v3',
    code: 'SUMMER30',
    discountType: 'percent',
    discountValue: 30,
    minPurchase: 150000,
    maxUsage: 1000,
    usedCount: 1000,
    expiry: '2026-08-31',
    status: 'expired',
    applicableMovies: [],
  },
  {
    id: 'v4',
    code: 'NEWUSER',
    discountType: 'fixed',
    discountValue: 30000,
    minPurchase: 50000,
    maxUsage: 100,
    usedCount: 67,
    expiry: '2026-11-30',
    status: 'active',
    applicableMovies: [],
  },
  {
    id: 'v5',
    code: 'CANCEL50',
    discountType: 'percent',
    discountValue: 50,
    minPurchase: 0,
    maxUsage: 50,
    usedCount: 12,
    expiry: '2026-10-15',
    status: 'active',
    applicableMovies: [],
  },
];

export const reviews: Review[] = [
  { id: 'r1', movieId: 'm1', movieTitle: 'Avengers: Doomsday', userName: 'Trần Minh Khoa', rating: 5, comment: 'Phim hay tuyệt vời! Kịch tính từ đầu đến cuối, không thể rời mắt khỏi màn hình. Nhất định phải xem IMAX!', date: '2026-09-20' },
  { id: 'r2', movieId: 'm1', movieTitle: 'Avengers: Doomsday', userName: 'Lê Thị Hoa', rating: 4, comment: 'Phim rất hay, đặc biệt là phần hành động. Hơi tiếc là phần kết hơi vội nhưng vẫn xứng đáng 4 sao.', date: '2026-09-22' },
  { id: 'r3', movieId: 'm2', movieTitle: 'Lật Mặt 8', userName: 'Phạm Văn Đức', rating: 5, comment: 'Lý Hải làm phim ngày càng chuyên nghiệp. Phần này cảm xúc hơn, ý nghĩa hơn. Cả nhà đi xem đều khóc.', date: '2026-09-18' },
  { id: 'r4', movieId: 'm3', movieTitle: 'Mission: Impossible 9', userName: 'Nguyễn Thị Lan', rating: 5, comment: 'Tom Cruise vẫn đỉnh! Những cảnh hành động thật đến nỗi tôi phải nín thở. Phải xem phim này trên màn hình lớn!', date: '2026-09-24' },
  { id: 'r5', movieId: 'm4', movieTitle: 'Inside Out 3', userName: 'Hoàng Mạnh Cường', rating: 5, comment: 'Pixar lại làm tôi khóc. Thông điệp rất sâu sắc về tuổi lớn và cảm xúc. Tuyệt vời cho cả trẻ em lẫn người lớn.', date: '2026-09-15' },
  { id: 'r6', movieId: 'm6', movieTitle: 'Joker: Folie à Deux', userName: 'Vũ Thành Long', rating: 3, comment: 'Phim không hay bằng phần đầu. Phần nhạc kịch hơi kỳ nhưng diễn xuất của Joaquin vẫn đỉnh.', date: '2026-09-10' },
  { id: 'r7', movieId: 'm7', movieTitle: 'Superman: Legacy', userName: 'Đặng Thị Mai', rating: 4, comment: 'Superman mới rất thuyết phục! James Gunn đã thổi hơi sống mới vào DC. Mong chờ phần tiếp theo!', date: '2026-09-21' },
  { id: 'r8', movieId: 'm1', movieTitle: 'Avengers: Doomsday', userName: 'Bùi Quang Hải', rating: 5, comment: 'ĐỈNH! Không còn gì để nói. Xứng đáng là bom tấn của năm 2026.', date: '2026-09-23' },
  { id: 'r9', movieId: 'm2', movieTitle: 'Lật Mặt 8', userName: 'Trịnh Thị Thu', rating: 4, comment: 'Xem xong vừa cười vừa khóc. Diễn viên diễn tự nhiên, kịch bản chặt chẽ hơn các phần trước.', date: '2026-09-19' },
  { id: 'r10', movieId: 'm4', movieTitle: 'Inside Out 3', userName: 'Cao Hữu Phúc', rating: 5, comment: 'Masterpiece! Pixar một lần nữa chứng minh tại sao họ là studio hoạt hình số 1 thế giới.', date: '2026-09-17' },
];

export const transactions: Transaction[] = [
  { id: 'tx1', ticketId: 't1', customerName: 'Nguyễn Văn An', customerEmail: 'an.nguyen@email.com', phone: '0901234567', movieTitle: 'Avengers: Doomsday', seats: ['E5', 'E6'], total: 280000, method: 'VNPay', time: '14:32', status: 'completed' },
  { id: 'tx2', ticketId: 't2', customerName: 'Lê Thị Bình', customerEmail: 'binh.le@email.com', phone: '0912345678', movieTitle: 'Lật Mặt 8', seats: ['A1'], total: 100000, method: 'Momo', time: '11:15', status: 'completed' },
  { id: 'tx3', ticketId: 't3', customerName: 'Trần Văn Cường', customerEmail: 'cuong.tran@email.com', phone: '0923456789', movieTitle: 'Mission: Impossible 9', seats: ['F7', 'F8'], total: 260000, method: 'VNPay', time: '16:45', status: 'completed' },
  { id: 'tx4', ticketId: 't4', customerName: 'Phạm Thị Dung', customerEmail: 'dung.pham@email.com', phone: '0934567890', movieTitle: 'Inside Out 3', seats: ['C3', 'C4', 'C5'], total: 330000, method: 'Momo', time: '09:20', status: 'completed' },
  { id: 'tx5', ticketId: 't5', customerName: 'Hoàng Văn Em', customerEmail: 'em.hoang@email.com', phone: '0945678901', movieTitle: 'Joker: Folie à Deux', seats: ['D9'], total: 115000, method: 'VNPay', time: '17:55', status: 'pending' },
  { id: 'tx6', ticketId: 't6', customerName: 'Vũ Thị Phương', customerEmail: 'phuong.vu@email.com', phone: '0956789012', movieTitle: 'Superman: Legacy', seats: ['G3', 'G4'], total: 250000, method: 'Momo', time: '13:10', status: 'completed' },
  { id: 'tx7', ticketId: 't1', customerName: 'Đỗ Văn Giang', customerEmail: 'giang.do@email.com', phone: '0967890123', movieTitle: 'Avengers: Doomsday', seats: ['B2'], total: 120000, method: 'VNPay', time: '10:30', status: 'completed' },
  { id: 'tx8', ticketId: 't2', customerName: 'Ngô Thị Hạnh', customerEmail: 'hanh.ngo@email.com', phone: '0978901234', movieTitle: 'Lật Mặt 8', seats: ['E1', 'E2'], total: 200000, method: 'Momo', time: '20:05', status: 'cancelled' },
];

export const revenueData: RevenueDay[] = [
  { day: 'T2', revenue: 12500000, tickets: 98 },
  { day: 'T3', revenue: 9800000, tickets: 76 },
  { day: 'T4', revenue: 15200000, tickets: 124 },
  { day: 'T5', revenue: 18700000, tickets: 152 },
  { day: 'T6', revenue: 24300000, tickets: 198 },
  { day: 'T7', revenue: 32100000, tickets: 267 },
  { day: 'CN', revenue: 28600000, tickets: 234 },
];

export const adminStats = {
  totalRevenue: 141200000,
  totalTickets: 1149,
  comboRevenue: 28400000,
  averageRating: 4.5,
};

export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const SEAT_COLS = 12;

export const OCCUPIED_SEATS = [
  'A3', 'A4', 'A5', 'A8', 'A9',
  'B1', 'B2', 'B6', 'B7', 'B11', 'B12',
  'C4', 'C5', 'C6', 'C9', 'C10',
  'D2', 'D3', 'D8', 'D9', 'D10',
  'E1', 'E2', 'E3', 'E7', 'E8',
  'F5', 'F6', 'F11', 'F12',
  'G3', 'G4', 'G9', 'G10', 'G11',
];
