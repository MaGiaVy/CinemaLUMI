'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export interface PricingItem {
  id: number;
  ticket_type: string;
  ticketType: string;
  label: string;
  price_percentage: number;
  percentage: number;
  base_price: number;
  basePrice: number;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SurchargeItem {
  id: string;
  label: string;
  value: number;
  active: boolean;
}

interface ApiResponsePricing {
  success: boolean;
  data?: PricingItem[];
  message?: string;
  error?: string;
  code?: string;
}

interface ApiResponseUpdate {
  success: boolean;
  data?: PricingItem;
  message?: string;
  error?: string;
  code?: string;
}

export default function PricingManagementPage() {
  // State danh sách loại vé
  const [pricingList, setPricingList] = useState<PricingItem[]>([]);
  const [baseRef, setBaseRef] = useState<number>(100000);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPct, setEditPct] = useState<string>('');
  const [editBasePrice, setEditBasePrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helpers
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch dữ liệu từ GET /api/pricing
  const fetchPricing = useCallback(async () => {
    setIsLoading(true);
    try {
      const resPricing = await fetch('/api/pricing');
      const jsonPricing: ApiResponsePricing = await resPricing.json();

      if (jsonPricing.success && jsonPricing.data) {
        // Chỉ hiển thị các loại vé chính (NORMAL / Vé Người lớn và CHILD / Vé Trẻ em) theo chuẩn SRS
        const validTicketTypes = ['NORMAL', 'CHILD'];
        const filteredPricings = jsonPricing.data.filter(p =>
          validTicketTypes.includes(p.ticket_type.toUpperCase()) ||
          p.ticket_type.toUpperCase().includes('CHILD') ||
          p.ticket_type.toUpperCase().includes('NORMAL')
        );
        setPricingList(filteredPricings.length > 0 ? filteredPricings : jsonPricing.data);
      } else {
        showToast(jsonPricing.error || jsonPricing.message || 'Không thể tải danh sách giá vé', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi fetch giá vé:', err);
      showToast('Lỗi mạng khi tải danh sách giá vé', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  // Bắt đầu chỉnh sửa loại vé
  const handleStartEdit = (item: PricingItem) => {
    setEditingId(item.id);
    setEditPct(String(item.price_percentage || item.percentage));
    setEditBasePrice(String(item.base_price || item.basePrice || 100000));
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPct('');
    setEditBasePrice('');
  };

  // Lưu chỉnh sửa tỷ lệ phần trăm và giá vé cơ bản
  const handleSaveEdit = async (item: PricingItem) => {
    const numPct = parseFloat(editPct);
    const numBase = parseFloat(editBasePrice);

    if (isNaN(numPct) || numPct <= 0) {
      showToast('Tỷ lệ phần trăm giá vé phải là số dương lớn hơn 0', 'error');
      return;
    }

    if (numPct > 1000) {
      showToast('Tỷ lệ phần trăm không được vượt quá 1000%', 'error');
      return;
    }

    if (isNaN(numBase) || numBase < 0) {
      showToast('Giá vé cơ bản phải là số không âm', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const targetType = encodeURIComponent(item.ticket_type || item.label);
      const res = await fetch(`/api/pricing/${targetType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          price_percentage: numPct,
          base_price: numBase,
        }),
      });

      const json: ApiResponseUpdate = await res.json();

      if (res.ok && json.success && json.data) {
        showToast(
          json.message || `Đã cập nhật giá vé '${item.label}' thành công!`,
          'success'
        );

        setPricingList(prev =>
          prev.map(p =>
            p.id === item.id
              ? {
                  ...p,
                  price_percentage: numPct,
                  percentage: numPct,
                  base_price: numBase,
                  basePrice: numBase,
                }
              : p
          )
        );

        setEditingId(null);
        setEditPct('');
        setEditBasePrice('');
      } else {
        showToast(json.error || json.message || 'Cập nhật giá vé thất bại', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật tỷ lệ giá vé:', err);
      showToast('Lỗi kết nối khi cập nhật tỷ lệ giá vé', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Thay đổi giá vé cơ bản tham chiếu
  const handleBaseChange = (value: string) => {
    const numeric = parseFloat(value);
    setBaseRef(isNaN(numeric) || numeric < 0 ? 0 : numeric);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              CẤU HÌNH BẢNG GIÁ VÉ HỆ THỐNG
            </h1>
          </div>
          <p className="text-[#94a3b8] text-xs mt-1">
            Quản lý tỷ lệ phần trăm giá vé theo chuẩn SRS (Vé Người lớn: 100%, Vé Trẻ em: 50%)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPricing}
          disabled={isLoading}
          className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-[#c084fc]/25 text-[#f8fafc] text-xs font-bold rounded-lg transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {isLoading ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}
        </button>
      </div>

      {/* Khối tham chiếu giá vé cơ bản */}
      <div
        className="rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.2) 0%, transparent 60%), rgba(15, 11, 26, 0.85)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e11d48] text-sm">✦</span>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                GIÁ VÉ CƠ BẢN THAM CHIẾU (SIMULATION)
              </h3>
            </div>
            <p className="text-[#94a3b8] text-xs mt-1">
              Dùng để tính toán giá tiền minh họa tự động theo công thức: Giá = Giá gốc × Tỷ lệ%
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="number"
              value={baseRef}
              onChange={e => handleBaseChange(e.target.value)}
              step="10000"
              min="0"
              className="w-32 bg-[#0a0812]/90 border border-[#c084fc]/30 text-white px-3 py-1.5 rounded-lg text-right font-black text-sm focus:border-[#e11d48] focus:outline-none"
            />
            <span className="text-[#fda4af] font-bold text-xs">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Loại Vé */}
      <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e11d48] text-sm">✦</span>
              <h2 className="text-white font-black text-sm uppercase tracking-wider">
                DANH SÁCH LOẠI VÉ CHÍNH THỨC
              </h2>
            </div>
            <p className="text-[#94a3b8] text-xs mt-0.5">
              Áp dụng cho toàn bộ các suất chiếu trong 5 buồng chiếu của hệ thống
            </p>
          </div>
          <span className="text-xs font-bold text-[#c084fc] bg-white/[0.04] px-3 py-1 rounded-full border border-white/10">
            Tổng: {pricingList.length} loại vé
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-[#94a3b8] text-xs">
            Đang tải danh sách giá vé từ API...
          </div>
        ) : pricingList.length === 0 ? (
          <div className="py-16 text-center text-[#94a3b8] text-xs">
            Chưa có loại vé nào được cấu hình trong cơ sở dữ liệu.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {pricingList.map(item => {
              const isEditing = editingId === item.id;
              const percentage = item.price_percentage || item.percentage;
              const currentBase = item.base_price || item.basePrice || baseRef;
              const estimatedPrice = Math.round((currentBase * percentage) / 100);

              return (
                <div
                  key={item.id}
                  className={`px-6 py-4.5 transition-colors ${
                    isEditing ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Cột 1: Thông tin loại vé */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <h4 className="text-white font-bold text-sm">{item.label}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#581c87]/30 border border-[#c084fc]/30 text-[#e9d5ff]">
                          {item.ticket_type}
                        </span>
                      </div>
                      <p className="text-[#94a3b8] text-xs">
                        {item.description || 'Chưa có mô tả chi tiết'}
                      </p>
                    </div>

                    {/* Cột 2: Chỉnh sửa hoặc Hiển thị */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#94a3b8]">Giá gốc:</span>
                            <input
                              type="number"
                              value={editBasePrice}
                              onChange={e => setEditBasePrice(e.target.value)}
                              min="0"
                              step="1000"
                              className="w-24 bg-[#0a0812] border border-[#e11d48] rounded px-2 py-1 text-white font-bold text-xs text-right focus:outline-none"
                            />
                            <span className="text-xs text-[#fda4af]">đ</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#94a3b8]">Tỷ lệ:</span>
                            <input
                              type="number"
                              autoFocus
                              value={editPct}
                              onChange={e => setEditPct(e.target.value)}
                              min="1"
                              max="1000"
                              className="w-16 bg-[#0a0812] border border-[#e11d48] rounded px-2 py-1 text-white font-bold text-xs text-center focus:outline-none"
                            />
                            <span className="text-xs text-[#fda4af] font-bold">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item)}
                            disabled={isSaving}
                            className="px-3 py-1 bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white text-xs font-bold rounded shadow-[0_0_10px_rgba(225,29,72,0.4)] cursor-pointer disabled:opacity-50"
                          >
                            {isSaving ? 'Lưu...' : 'Lưu'}
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-2 py-1 text-xs text-[#94a3b8] hover:text-white cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-xs text-[#94a3b8]">Tỷ lệ:</span>
                              <span className="text-[#fda4af] font-black text-base">
                                {percentage}%
                              </span>
                            </div>
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">
                              Giá gốc: {currentBase.toLocaleString('vi-VN')} đ (≈ {estimatedPrice.toLocaleString('vi-VN')} đ)
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold rounded border border-white/10 transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Khối quy định SRS: Chuẩn hóa 2 loại vé và ghế tiêu chuẩn */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              QUY ĐỊNH GIÁ VÉ & CƠ CẤU GHẾ (CHUẨN SRS & TECH SPEC)
            </h3>
          </div>
          <p className="text-[#94a3b8] text-xs leading-relaxed">
            Theo tài liệu đặc tả SRS hệ thống rạp chiếu Lumi Cinema:
          </p>
          <ul className="space-y-1.5 text-xs text-[#cbd5e1] pt-1">
            <li className="flex items-center gap-2">
              <span className="text-[#86efac] font-bold">✓</span>
              <span><strong>Vé Người lớn (Thường):</strong> Tính 100% giá vé gốc của suất chiếu.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#c084fc] font-bold">✓</span>
              <span><strong>Vé Trẻ em:</strong> Giảm 50% so với vé người lớn (tương đương 50% giá gốc suất chiếu). Tự động khóa không cho chọn khi xem phim phân loại độ tuổi <strong>T18</strong>.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#fda4af] font-bold">✓</span>
              <span><strong>Cơ cấu phòng chiếu:</strong> Toàn bộ phòng chiếu gồm 50 ghế tiêu chuẩn (Standard, A1-E10). Hệ thống không áp dụng phụ thu ghế VIP, phụ thu ngày lễ hay suất chiếu muộn.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
