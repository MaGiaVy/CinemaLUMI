'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Fetch danh sách phim để đổ vào dropdown
  const fetchMovies = useCallback(async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setMovies(data.data.map((m: { id: number; title: string }) => ({ id: m.id, title: m.title })));
      }
    } catch (err) {
      console.error('Lỗi fetch movies cho coupon:', err);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchMovies();
  }, [fetchCoupons, fetchMovies]);

  // Mở modal tạo mới
  const handleOpenAddModal = () => {
    setForm(initialForm);
    setIsAddModalOpen(true);
  };

  // Tạo coupon mới
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      showToast('Vui lòng nhập mã giảm giá', 'warning');
      return;
    }
    const discountVal = Number(form.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Giá trị giảm phải là số dương lớn hơn 0', 'warning');
      return;
    }
    if (form.discountType === 'Percentage' && discountVal > 100) {
      showToast('Giảm theo phần trăm không được vượt quá 100%', 'warning');
      return;
    }
    if (!form.expiryDate) {
      showToast('Vui lòng chọn ngày hết hạn cho voucher', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discountType,
        discount_value: discountVal,
        min_amount: Number(form.minAmount) || 0,
        max_usage: Number(form.maxUsage) || 100,
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

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Tạo mã giảm giá thất bại');
      }

      showToast(`Đã tạo mã giảm giá '${payload.code}' thành công!`, 'success');
      setIsAddModalOpen(false);
      setForm(initialForm);
      await fetchCoupons();
    } catch (err) {
      console.error('Lỗi khi tạo coupon:', err);
      showToast(err instanceof Error ? err.message : 'Tạo mã giảm giá thất bại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đánh dấu hết hạn ngay
  const handleExpireNow = async (coupon: CouponItem) => {
    if (!confirm(`Bạn có chắc chắn muốn hết hạn ngay voucher '${coupon.code}'?`)) return;

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          expiry_date: yesterday.toISOString().split('T')[0],
          is_expired: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Cập nhật thất bại');
      }

      showToast(`Đã khóa hết hạn voucher '${coupon.code}'!`, 'info');
      await fetchCoupons();
    } catch (err) {
      console.error('Lỗi khi khóa coupon:', err);
      showToast(err instanceof Error ? err.message : 'Khóa voucher thất bại', 'error');
    }
  };

  // Xóa coupon
  const handleDeleteCoupon = async (coupon: CouponItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã giảm giá '${coupon.code}' khỏi hệ thống?`)) return;

    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Xóa mã giảm giá thất bại');
      }

      showToast(`Đã xóa mã giảm giá '${coupon.code}' thành công!`, 'success');
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
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#86efac]/15 border border-[#86efac]/30 text-[#86efac] uppercase tracking-wider">
              {activeCount} đang hoạt động
            </span>
          </div>
          <p className="text-[#94a3b8] text-xs mt-1">
            Tạo và quản lý các chương trình ưu đãi, voucher khuyến mãi dành cho khách hàng
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider"
        >
          + TẠO VOUCHER MỚI
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#c084fc]/20 bg-[#0a0812]/80 backdrop-blur-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên phim..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0812]/90 border border-[#c084fc]/20 rounded-xl px-3.5 py-2 text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#e11d48] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Tất cả ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#86efac]/20 border border-[#86efac]/40 text-[#86efac]'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Đang hoạt động ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'EXPIRED'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Đã hết hạn / Hết lượt ({coupons.length - activeCount})
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {isLoading ? (
          <div className="p-16 text-center text-[#94a3b8] text-xs">
            Đang tải danh sách mã khuyến mãi...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-16 text-center text-[#94a3b8]">
            <p className="text-sm font-bold text-white">Không tìm thấy mã giảm giá nào</p>
            <p className="text-xs mt-1">Hãy bấm &ldquo;+ TẠO VOUCHER MỚI&rdquo; để thêm chương trình khuyến mãi đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold text-[#c084fc] uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-5 py-3.5">Mã Voucher</th>
                  <th className="px-4 py-3.5">Giảm Giá</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Áp Dụng Cho</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Lượt Dùng</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Hạn Sử Dụng</th>
                  <th className="px-4 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredCoupons.map(coupon => {
                  const isExpired = coupon.is_expired || new Date(coupon.expiry_date) < new Date();
                  const isLimitReached = coupon.used_count >= coupon.max_usage;
                  const isActive = !isExpired && !isLimitReached;
                  const percentUsed = Math.min(100, Math.round((coupon.used_count / coupon.max_usage) * 100));

                  return (
                    <tr key={coupon.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs tracking-wider bg-white/[0.06] px-2.5 py-1 rounded border border-white/10">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.min_amount > 0 ? (
                          <p className="text-[#94a3b8] text-[10px] mt-1">
                            Đơn tối thiểu: {coupon.min_amount.toLocaleString('vi-VN')} đ
                          </p>
                        ) : (
                          <p className="text-[#64748b] text-[10px] mt-1">Không yêu cầu tối thiểu</p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4">
                        <span className="text-[#fda4af] font-black text-sm">
                          {coupon.discount_type === 'Percentage'
                            ? `${coupon.discount_value}%`
                            : `${coupon.discount_value.toLocaleString('vi-VN')} đ`}
                        </span>
                        <span className="block text-[10px] text-[#94a3b8]">
                          {coupon.discount_type === 'Percentage' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt'}
                        </span>
                      </td>

                      {/* Applicable Movie */}
                      <td className="px-4 py-4 hidden sm:table-cell">
                        {coupon.movie ? (
                          <div className="max-w-[200px] truncate" title={coupon.movie.title}>
                            <span className="text-white text-xs font-medium block truncate">
                              {coupon.movie.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#86efac] text-[11px] font-bold bg-[#86efac]/10 px-2 py-0.5 rounded border border-[#86efac]/20">
                            Mọi phim chiếu
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="text-xs">
                          <span className="text-white font-bold">{coupon.used_count}</span>
                          <span className="text-[#94a3b8]"> / {coupon.max_usage}</span>
                        </div>
                        <div className="w-28 bg-white/[0.08] rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percentUsed >= 90
                                ? 'bg-gradient-to-r from-[#881337] to-[#e11d48]'
                                : percentUsed >= 50
                                ? 'bg-gradient-to-r from-purple-800 to-[#c084fc]'
                                : 'bg-[#86efac]'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-4 text-xs text-[#cbd5e1] hidden lg:table-cell">
                        {new Date(coupon.expiry_date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#86efac]/15 border border-[#86efac]/30 text-[#86efac] uppercase tracking-wider">
                            Hoạt động
                          </span>
                        ) : isLimitReached ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e11d48]/20 border border-[#e11d48]/40 text-[#fda4af] uppercase tracking-wider">
                            Hết lượt
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.08] border border-white/20 text-[#94a3b8] uppercase tracking-wider">
                            Hết hạn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleExpireNow(coupon)}
                              title="Đánh dấu hết hạn ngay"
                              className="px-2.5 py-1 text-[11px] font-bold text-[#fda4af] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded transition-colors cursor-pointer"
                            >
                              Hết hạn
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#fda4af] hover:text-white bg-[#e11d48]/15 hover:bg-[#e11d48]/30 border border-[#e11d48]/30 rounded transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
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

      {/* Modal Tạo Voucher Mới */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="TẠO MÃ GIẢM GIÁ MỚI"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
              Mã Voucher <span className="text-[#e11d48]">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: LUMI20, SUMMER50, TRIANVIP"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              maxLength={50}
              className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white uppercase placeholder-[#64748b] focus:outline-none focus:border-[#e11d48]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Kiểu Giảm Giá <span className="text-[#e11d48]">*</span>
              </label>
              <select
                value={form.discountType}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    discountType: e.target.value as 'Percentage' | 'FixedAmount',
                  }))
                }
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
              >
                <option value="Percentage">Phần trăm (%)</option>
                <option value="FixedAmount">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Giá Trị Giảm {form.discountType === 'Percentage' ? '(%)' : '(VNĐ)'}{' '}
                <span className="text-[#e11d48]">*</span>
              </label>
              <input
                type="number"
                placeholder={form.discountType === 'Percentage' ? 'VD: 20' : 'VD: 50000'}
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                min={1}
                max={form.discountType === 'Percentage' ? 100 : undefined}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                required
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Đơn Hàng Tối Thiểu (VNĐ)
              </label>
              <input
                type="number"
                placeholder="VD: 150000 (0 nếu không áp dụng)"
                value={form.minAmount}
                onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))}
                min={0}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Số Lần Sử Dụng Tối Đa
              </label>
              <input
                type="number"
                placeholder="VD: 200"
                value={form.maxUsage}
                onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                min={1}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                required
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Ngày Hết Hạn <span className="text-[#e11d48]">*</span>
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                required
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Phim Áp Dụng
              </label>
              <select
                value={form.applicableMovieId}
                onChange={e => setForm(f => ({ ...f, applicableMovieId: e.target.value }))}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo voucher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
