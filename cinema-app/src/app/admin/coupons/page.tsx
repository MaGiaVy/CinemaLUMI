'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export interface CouponItem {
  id: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discountType: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discountValue: number;
  min_amount: number;
  minAmount: number;
  max_usage: number;
  maxUsage: number;
  used_count: number;
  usedCount: number;
  expiry_date: string;
  expiryDate: string;
  is_expired: boolean;
  is_available: boolean;
  applicable_movie_id: number | null;
  applicableMovieId: number | null;
  movie?: {
    id: number;
    title: string;
    poster: string;
  } | null;
  created_at: string;
}

interface MovieOption {
  id: number;
  title: string;
}

interface NewCouponForm {
  code: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: string;
  minAmount: string;
  maxUsage: string;
  expiryDate: string;
  applicableMovieId: string;
}

const initialForm: NewCouponForm = {
  code: '',
  discountType: 'Percentage',
  discountValue: '',
  minAmount: '0',
  maxUsage: '100',
  expiryDate: '',
  applicableMovieId: '',
};

export default function CouponsManagementPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [form, setForm] = useState<NewCouponForm>(initialForm);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch danh sách mã giảm giá từ GET /api/coupons
  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/coupons', {
        headers: {
          'x-user-role': 'ADMIN',
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không thể tải danh sách mã giảm giá');
      }

      setCoupons(data.data || []);
    } catch (err) {
      console.error('Lỗi khi fetch coupons:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi khi tải danh sách mã giảm giá', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch danh sách phim để chọn trong modal
  const fetchMovies = useCallback(async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMovies(data.data.map((m: { id: number; title: string }) => ({ id: m.id, title: m.title })));
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách phim:', err);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchMovies();
  }, [fetchCoupons, fetchMovies]);

  // Thiết lập ngày hết hạn mặc định khi mở modal (+30 ngày)
  const handleOpenAddModal = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const dateStr = defaultDate.toISOString().split('T')[0];

    setForm({
      ...initialForm,
      expiryDate: dateStr,
    });
    setIsAddModalOpen(true);
  };

  // Tạo coupon mới
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      showToast('Vui lòng nhập mã khuyến mãi', 'warning');
      return;
    }
    const numVal = Number(form.discountValue);
    if (isNaN(numVal) || numVal <= 0) {
      showToast('Giá trị giảm giá phải lớn hơn 0', 'warning');
      return;
    }
    if (form.discountType === 'Percentage' && numVal > 100) {
      showToast('Mức giảm theo tỷ lệ phần trăm không được vượt quá 100%', 'warning');
      return;
    }
    if (!form.expiryDate) {
      showToast('Vui lòng chọn ngày hết hạn', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discountType,
        discount_value: numVal,
        min_amount: Number(form.minAmount) || 0,
        max_usage: Number(form.maxUsage) || 1,
        expiry_date: form.expiryDate,
        applicable_movie_id: form.applicableMovieId ? Number(form.applicableMovieId) : null,
      };

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Tạo mã khuyến mãi thất bại');
      }

      showToast(`Đã tạo thành công mã giảm giá ${payload.code}!`, 'success');
      setIsAddModalOpen(false);
      setForm(initialForm);
      await fetchCoupons();
    } catch (err) {
      console.error('Lỗi khi tạo coupon:', err);
      showToast(err instanceof Error ? err.message : 'Tạo mã khuyến mãi thất bại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đánh dấu hết hạn ngay lập tức
  const handleExpireNow = async (coupon: CouponItem) => {
    if (!confirm(`Bạn có chắc muốn hết hạn ngay lập tức mã '${coupon.code}'?`)) return;

    try {
      // Đặt ngày hết hạn về 1 ngày trước
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          expiry_date: dateStr,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Cập nhật trạng thái thất bại');
      }

      showToast(`Mã '${coupon.code}' đã được cập nhật thành hết hạn`, 'info');
      await fetchCoupons();
    } catch (err) {
      console.error('Lỗi khi đánh dấu hết hạn coupon:', err);
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại', 'error');
    }
  };

  // Xóa mã giảm giá
  const handleDeleteCoupon = async (coupon: CouponItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá '${coupon.code}'?`)) return;

    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN',
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Xóa mã giảm giá thất bại');
      }

      showToast(`Đã xóa mã giảm giá '${coupon.code}'!`, 'success');
      await fetchCoupons();
    } catch (err) {
      console.error('Lỗi khi xóa coupon:', err);
      showToast(err instanceof Error ? err.message : 'Xóa mã giảm giá thất bại', 'error');
    }
  };

  // Lọc danh sách coupons theo ô tìm kiếm và trạng thái
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.movie?.title && c.movie.title.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      const isActuallyExpired = c.is_expired || new Date(c.expiry_date) < new Date();

      if (statusFilter === 'ACTIVE') {
        return !isActuallyExpired && c.used_count < c.max_usage;
      }
      if (statusFilter === 'EXPIRED') {
        return isActuallyExpired || c.used_count >= c.max_usage;
      }
      return true;
    });
  }, [coupons, searchTerm, statusFilter]);

  const activeCount = useMemo(() => {
    const now = new Date();
    return coupons.filter(c => !c.is_expired && new Date(c.expiry_date) >= now && c.used_count < c.max_usage).length;
  }, [coupons]);

  return (
    <div className="flex-1 bg-[#1A1A1A] p-6 lg:p-8 overflow-y-auto min-h-screen text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Quản Lý Mã Giảm Giá & Voucher
              </h1>
              <Badge variant="green" size="md">
                {activeCount} đang hoạt động
              </Badge>
            </div>
            <p className="text-[#B3B3B3] text-sm mt-1">
              Tạo và quản lý các chương trình ưu đãi, voucher khuyến mãi dành cho khách hàng
            </p>
          </div>
          <Button onClick={handleOpenAddModal} variant="primary" className="shadow-lg shadow-[#E63946]/20">
            <span className="text-base leading-none mr-1">+</span> Tạo voucher mới
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="🔍 Tìm theo mã hoặc tên phim..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#E63946] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Tất cả ({coupons.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#2ECC71] text-[#1A1A1A]'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Đang hoạt động ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'EXPIRED'
                  ? 'bg-[#525252] text-white'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Đã hết hạn / Hết lượt ({coupons.length - activeCount})
            </button>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-[#B3B3B3]">
              <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang tải danh sách mã khuyến mãi...
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 text-center text-[#B3B3B3]">
              <span className="text-4xl block mb-2">🎟️</span>
              <p className="text-base font-semibold text-white">Không tìm thấy mã giảm giá nào</p>
              <p className="text-xs mt-1">Hãy bấm &ldquo;Tạo voucher mới&rdquo; để thêm chương trình khuyến mãi đầu tiên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#404040] bg-[#232323]">
                    <th className="px-5 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Mã Voucher
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Giảm Giá
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                      Áp Dụng Cho
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      Lượt Dùng
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      Hạn Sử Dụng
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Trạng Thái
                    </th>
                    <th className="px-5 py-3.5 text-right text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383838]">
                  {filteredCoupons.map(coupon => {
                    const isExpired = coupon.is_expired || new Date(coupon.expiry_date) < new Date();
                    const isLimitReached = coupon.used_count >= coupon.max_usage;
                    const isActive = !isExpired && !isLimitReached;
                    const percentUsed = Math.min(100, Math.round((coupon.used_count / coupon.max_usage) * 100));

                    return (
                      <tr key={coupon.id} className="hover:bg-[#383838]/50 transition-colors">
                        {/* Code */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-base tracking-wider bg-[#1E1E1E] px-2.5 py-1 rounded border border-[#404040]">
                              {coupon.code}
                            </span>
                          </div>
                          {coupon.min_amount > 0 ? (
                            <p className="text-[#888888] text-xs mt-1">
                              Đơn tối thiểu: {coupon.min_amount.toLocaleString('vi-VN')} đ
                            </p>
                          ) : (
                            <p className="text-[#666666] text-xs mt-1">Không yêu cầu tối thiểu</p>
                          )}
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-4">
                          <span className="text-[#FFB703] font-black text-base">
                            {coupon.discount_type === 'Percentage'
                              ? `${coupon.discount_value}%`
                              : `${coupon.discount_value.toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="block text-[11px] text-[#888888]">
                            {coupon.discount_type === 'Percentage' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt'}
                          </span>
                        </td>

                        {/* Applicable Movie */}
                        <td className="px-4 py-4 hidden sm:table-cell">
                          {coupon.movie ? (
                            <div className="max-w-[200px] truncate" title={coupon.movie.title}>
                              <span className="text-white text-xs font-medium block truncate">
                                🎬 {coupon.movie.title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#2ECC71] text-xs font-medium bg-[#2ECC71]/10 px-2 py-0.5 rounded border border-[#2ECC71]/20">
                              Mọi phim chiếu
                            </span>
                          )}
                        </td>

                        {/* Usage */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="text-xs">
                            <span className="text-white font-bold">{coupon.used_count}</span>
                            <span className="text-[#888888]"> / {coupon.max_usage}</span>
                          </div>
                          <div className="w-28 bg-[#1E1E1E] rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentUsed >= 90
                                  ? 'bg-[#E63946]'
                                  : percentUsed >= 50
                                  ? 'bg-[#FFB703]'
                                  : 'bg-[#2ECC71]'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </td>

                        {/* Expiry Date */}
                        <td className="px-4 py-4 text-xs text-[#CCCCCC] hidden lg:table-cell">
                          {new Date(coupon.expiry_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {isActive ? (
                            <Badge variant="green">Hoạt động</Badge>
                          ) : isLimitReached ? (
                            <Badge variant="red">Hết lượt</Badge>
                          ) : (
                            <Badge variant="gray">Hết hạn</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExpireNow(coupon)}
                                title="Đánh dấu hết hạn ngay"
                                className="text-xs text-[#FFB703] hover:text-white"
                              >
                                Hết hạn
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon)}
                              className="text-xs"
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Tạo Mã Giảm Giá Mới"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
              Mã Voucher <span className="text-[#E63946]">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: LUMI20, SUMMER50, TRIANVIP"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              maxLength={50}
              className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm font-mono font-bold text-white uppercase placeholder-[#666] focus:outline-none focus:border-[#E63946]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Kiểu Giảm Giá <span className="text-[#E63946]">*</span>
              </label>
              <select
                value={form.discountType}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    discountType: e.target.value as 'Percentage' | 'FixedAmount',
                  }))
                }
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
              >
                <option value="Percentage">Phần trăm (%)</option>
                <option value="FixedAmount">Số tiền cố định (đ)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Giá Trị Giảm {form.discountType === 'Percentage' ? '(%)' : '(đ)'}{' '}
                <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="number"
                placeholder={form.discountType === 'Percentage' ? 'VD: 20' : 'VD: 50000'}
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                min={1}
                max={form.discountType === 'Percentage' ? 100 : undefined}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Đơn Hàng Tối Thiểu (đ)
              </label>
              <input
                type="number"
                placeholder="VD: 150000 (0 nếu không áp dụng)"
                value={form.minAmount}
                onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))}
                min={0}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Số Lần Sử Dụng Tối Đa
              </label>
              <input
                type="number"
                placeholder="VD: 200"
                value={form.maxUsage}
                onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                min={1}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Ngày Hết Hạn <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Phim Áp Dụng
              </label>
              <select
                value={form.applicableMovieId}
                onChange={e => setForm(f => ({ ...f, applicableMovieId: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
              >
                <option value="">Tất cả các phim (Mặc định)</option>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#404040]">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo voucher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
