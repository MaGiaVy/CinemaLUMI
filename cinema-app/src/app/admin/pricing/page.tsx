'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
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

  const getBadgeVariant = (type: string) => {
    const upper = type.toUpperCase();
    if (upper.includes('CHILD') || upper.includes('TRẺ')) return 'blue';
    return 'gold';
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-6 sm:p-8 overflow-y-auto">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-4xl mx-auto">
        {/* Header trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>💰</span> Cấu Hình Giá Vé (Người Lớn & Trẻ Em)
            </h1>
            <p className="text-[#B3B3B3] text-sm mt-1">
              Quản lý giá vé và tỷ lệ phần trăm theo chuẩn SRS (Vé Người lớn: 100%, Vé Trẻ em: 50%)
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPricing}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>🔄</span> Làm mới
          </Button>
        </div>

        {/* Khối tham chiếu giá vé cơ bản */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>🎯</span> Giá Vé Cơ Bản Tham Chiếu
              </h3>
              <p className="text-[#808080] text-xs mt-1">
                Dùng để tính toán giá tiền minh họa tự động theo công thức: Giá = Giá gốc × Tỷ lệ%
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={baseRef}
                onChange={e => handleBaseChange(e.target.value)}
                step="10000"
                min="0"
                className="w-36 bg-[#1A1A1A] border border-[#525252] text-white px-3.5 py-2 rounded-xl text-right font-bold text-base focus:border-[#FFB703] focus:outline-none"
              />
              <span className="text-[#FFB703] font-bold text-sm">VNĐ</span>
            </div>
          </div>
        </div>

        {/* Bảng Danh Sách Loại Vé */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl overflow-hidden mb-8 shadow-xl">
          <div className="px-6 py-5 border-b border-[#404040] flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Bảng Danh Sách Loại Vé</h2>
              <p className="text-[#B3B3B3] text-xs mt-0.5">
                Các loại vé được áp dụng cho toàn bộ suất chiếu trong hệ thống
              </p>
            </div>
            <span className="text-xs text-[#808080] bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#404040]">
              Tổng: {pricingList.length} loại vé
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#FFB703] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-white font-semibold text-sm">Đang tải danh sách giá vé từ API...</p>
            </div>
          ) : pricingList.length === 0 ? (
            <div className="py-16 text-center text-[#808080]">
              <p className="text-3xl mb-2">🏷️</p>
              <p>Chưa có loại vé nào được cấu hình trong cơ sở dữ liệu.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#404040]">
              {pricingList.map(item => {
                const isEditing = editingId === item.id;
                const percentage = item.price_percentage || item.percentage;
                const currentBase = item.base_price || item.basePrice || baseRef;
                const estimatedPrice = Math.round((currentBase * percentage) / 100);

                return (
                  <div
                    key={item.id}
                    className={`px-6 py-4.5 transition-colors ${
                      isEditing ? 'bg-[#383838]' : 'hover:bg-[#333333]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Cột 1: Thông tin loại vé */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <h4 className="text-white font-bold text-base">{item.label}</h4>
                          <Badge variant={getBadgeVariant(item.ticket_type)}>
                            {item.ticket_type}
                          </Badge>
                        </div>
                        <p className="text-[#A0A0A0] text-xs">
                          {item.description || 'Chưa có mô tả chi tiết'}
                        </p>
                      </div>

                      {/* Cột 2: Chỉnh sửa hoặc Hiển thị */}
                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-[#A0A0A0]">Giá gốc:</span>
                              <input
                                type="number"
                                value={editBasePrice}
                                onChange={e => setEditBasePrice(e.target.value)}
                                min="0"
                                step="1000"
                                className="w-24 bg-[#1A1A1A] border border-[#FFB703] rounded-lg px-2 py-1 text-white font-bold text-sm text-right focus:outline-none"
                              />
                              <span className="text-xs text-[#FFB703]">đ</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-[#A0A0A0]">Tỷ lệ:</span>
                              <input
                                type="number"
                                autoFocus
                                value={editPct}
                                onChange={e => setEditPct(e.target.value)}
                                min="1"
                                max="1000"
                                className="w-16 bg-[#1A1A1A] border border-[#FFB703] rounded-lg px-2 py-1 text-white font-bold text-sm text-center focus:outline-none"
                              />
                              <span className="text-[#FFB703] font-bold text-sm">%</span>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item)}
                              disabled={isSaving}
                              className="px-3"
                            >
                              {isSaving ? 'Lưu...' : '✓ Lưu'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="px-2 text-[#808080] hover:text-white"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs text-[#808080]">Tỷ lệ:</span>
                                <span className="text-[#FFB703] font-black text-lg">
                                  {percentage}%
                                </span>
                              </div>
                              <p className="text-xs text-[#B3B3B3] font-medium mt-0.5">
                                Giá gốc: {currentBase.toLocaleString('vi-VN')}đ (≈ {estimatedPrice.toLocaleString('vi-VN')}đ)
                              </p>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartEdit(item)}
                              className="flex items-center gap-1 border border-[#525252] hover:border-[#FFB703]"
                            >
                              <span>✏️</span> Sửa
                            </Button>
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

        {/* Khối phụ thu (Surcharge config - Fully editable) */}
        {/* Khối quy định SRS: Chuẩn hóa 2 loại vé và ghế tiêu chuẩn */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="text-2xl p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              📋
            </span>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base mb-1">
                Quy Định Giá Vé & Cơ Cấu Ghế (Chuẩn SRS & Tech Spec)
              </h3>
              <p className="text-[#A0A0A0] text-sm leading-relaxed mb-3">
                Theo tài liệu đặc tả SRS hệ thống rạp chiếu Lumière Cinema:
              </p>
              <ul className="space-y-2 text-xs text-[#CCCCCC]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Vé Người lớn (Thường):</strong> Tính 100% giá vé gốc của suất chiếu.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span><strong>Vé Trẻ em:</strong> Giảm 50% so với vé người lớn (tương đương 50% giá gốc suất chiếu). Tự động khóa không cho chọn khi xem phim phân loại độ tuổi <strong>T18</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Cơ cấu phòng chiếu:</strong> Toàn bộ phòng chiếu gồm 50 ghế tiêu chuẩn (Standard, A1-E10). Hệ thống không áp dụng phụ thu ghế VIP, phụ thu ngày lễ hay suất chiếu muộn.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
