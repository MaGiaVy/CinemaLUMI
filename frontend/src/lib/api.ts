import {
  Movie,
  Screening,
  Ticket,
  Combo,
  Voucher,
  Review,
  Transaction,
  RevenueDay,
  movies as mockMovies,
  screenings as mockScreenings,
  tickets as mockTickets,
  combos as mockCombos,
  vouchers as mockVouchers,
  reviews as mockReviews,
  transactions as mockTransactions,
  revenueData as mockRevenueData,
  adminStats as mockAdminStats,
} from '@/data/mockData';

export type {
  Movie,
  Screening,
  Ticket,
  Combo,
  Voucher,
  Review,
  Transaction,
  RevenueDay,
};

export interface PricingItem {
  id: string;
  label: string;
  percentage: number;
  basePrice: number;
  description: string;
}

const mockPricing: PricingItem[] = [
  { id: 'normal', label: 'Vé Thường', percentage: 100, basePrice: 120000, description: 'Áp dụng cho khán giả từ 13 tuổi trở lên' },
  { id: 'child', label: 'Vé Trẻ em', percentage: 50, basePrice: 60000, description: 'Áp dụng cho trẻ em dưới 13 tuổi' },
  { id: 'vip', label: 'Vé Ghế đôi', percentage: 180, basePrice: 216000, description: 'Ghế đôi (Couple seat) — Cuối phòng' },
  { id: 'premiere', label: 'Suất Chiếu Ra Mắt', percentage: 150, basePrice: 180000, description: 'Suất chiếu đặc biệt, thảm đỏ' },
];

/**
 * Async API: Lấy danh sách tất cả các phim
 */
export async function fetchMovies(): Promise<Movie[]> {
  // Giả lập network call bất đồng bộ
  await new Promise(resolve => setTimeout(resolve, 30));
  return [...mockMovies];
}

/**
 * Async API: Lấy thông tin chi tiết một bộ phim theo ID
 */
export async function fetchMovieById(id: string): Promise<Movie | null> {
  await new Promise(resolve => setTimeout(resolve, 20));
  const found = mockMovies.find(m => m.id === id);
  return found ? { ...found } : null;
}

/**
 * Async API: Lấy danh sách suất chiếu (có thể lọc theo ngày)
 */
export async function fetchScreenings(date?: string): Promise<Screening[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  if (date) {
    return mockScreenings.filter(s => s.date === date);
  }
  return [...mockScreenings];
}

/**
 * Async API: Lấy suất chiếu theo ID
 */
export async function fetchScreeningById(id: string): Promise<Screening | null> {
  await new Promise(resolve => setTimeout(resolve, 20));
  const found = mockScreenings.find(s => s.id === id);
  return found ? { ...found } : null;
}

/**
 * Async API: Lấy suất chiếu theo Movie ID
 */
export async function fetchScreeningsByMovieId(movieId: string, date?: string): Promise<Screening[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return mockScreenings.filter(s => s.movieId === movieId && (!date || s.date === date));
}

export async function fetchReviews(movieId?: string): Promise<Review[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  if (movieId) {
    return mockReviews.filter(r => r.movieId === movieId);
  }
  return [...mockReviews];
}

/**
 * Async API: Lấy danh sách đánh giá theo Movie ID
 */
export async function fetchReviewsByMovieId(movieId: string): Promise<Review[]> {
  return fetchReviews(movieId);
}

/**
 * Async API: Lấy danh sách vé đã đặt
 */
export async function fetchTickets(): Promise<Ticket[]> {
  await new Promise(resolve => setTimeout(resolve, 25));
  return [...mockTickets];
}

/**
 * Async API: Lấy danh sách combo bắp nước
 */
export async function fetchCombos(): Promise<Combo[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return [...mockCombos];
}

/**
 * Async API: Lấy danh sách mã giảm giá Voucher
 */
export async function fetchVouchers(): Promise<Voucher[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return [...mockVouchers];
}

/**
 * Async API: Lấy danh sách giao dịch cho nhân viên
 */
export async function fetchTransactions(query?: string): Promise<Transaction[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  if (query) {
    const q = query.toLowerCase();
    return mockTransactions.filter(t =>
      t.customerEmail.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      t.ticketId.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
    );
  }
  return [...mockTransactions];
}

/**
 * Async API: Thống kê tổng quan cho Admin
 */
export async function fetchAdminStats() {
  await new Promise(resolve => setTimeout(resolve, 25));
  return { ...mockAdminStats };
}

/**
 * Async API: Doanh thu theo tuần cho biểu đồ
 */
export async function fetchRevenueData(): Promise<RevenueDay[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return [...mockRevenueData];
}

/**
 * Async API: Lấy cấu hình bảng giá vé
 */
export async function fetchPricingConfig(): Promise<PricingItem[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return [...mockPricing];
}
