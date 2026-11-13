'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Toast, { ToastMessage } from '@/components/ui/Toast';

interface ComboItem {
  orderComboId: number;
  comboId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  isDelivered: boolean;
  deliveredAt: string | null;
}

interface ComboOrder {
  paymentId: number;
  transactionCode: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  movieInfo: {
    title: string;
    room: string;
    startTime: string;
    seats: string;
  } | null;
  combos: ComboItem[];
  deliveryStatus: 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'PENDING';
}

export default function StaffCombosPage() {
  const [orders, setOrders] = useState<ComboOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'delivered' | 'all'>('pending');
  const [deliveringId, setDeliveringId] = useState<number | null>(null);
  const [deliveringPaymentId, setDeliveringPaymentId] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setAlertMessage(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/staff/combos/orders?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      } else {
        setOrders([]);
        if (json.message) setAlertMessage({ type: 'error', text: json.message });
      }
    } catch (err) {
      console.error('Lỗi tải đơn bắp nước:', err);
      setAlertMessage({ type: 'error', text: 'Không thể kết nối máy chủ' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleDeliverSingle = async (orderComboId: number, comboName: string) => {
    if (!confirm(`Xác nhận khách đã nhận "${comboName}"? Sau khi nhận sẽ chặn phát lần 2 (BR-05).`)) {
      return;
    }

    setDeliveringId(orderComboId);
    try {
      const res = await fetch('/api/staff/combos/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderComboId }),
      });
      const json = await res.json();

      if (res.status === 409) {
        showToast(json.message || `CẢNH BÁO: "${comboName}" đã được nhận trước đó (BR-05)!`, 'warning');
        setAlertMessage({ type: 'error', text: json.message || `"${comboName}" đã được nhận trước đó!` });
        await fetchOrders();
        return;
      }

      if (json.success) {
        showToast(`Đã xác nhận bàn giao: ${comboName}!`, 'success');
        setAlertMessage({ type: 'success', text: `Đã xác nhận bàn giao: ${comboName}!` });
        await fetchOrders();
      } else {
        showToast(json.message || 'Lỗi khi giao combo', 'error');
        setAlertMessage({ type: 'error', text: json.message || 'Lỗi khi giao combo' });
      }
    } catch (err) {
      showToast('Lỗi đường truyền máy chủ', 'error');
      setAlertMessage({ type: 'error', text: 'Lỗi đường truyền máy chủ' });
    } finally {
      setDeliveringId(null);
    }
  };

  const handleDeliverAll = async (paymentId: number) => {
    if (!confirm(`Xác nhận khách đã nhận TẤT CẢ bắp nước của đơn hàng #${paymentId}?`)) {
      return;
    }

    setDeliveringPaymentId(paymentId);
    try {
      const res = await fetch('/api/staff/combos/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const json = await res.json();

      if (res.status === 409) {
        showToast(json.message || `CẢNH BÁO: Đơn hàng #${paymentId} đã được nhận trước đó (BR-05)!`, 'warning');
        setAlertMessage({ type: 'error', text: json.message || `Đơn hàng #${paymentId} đã được nhận trước đó!` });
        await fetchOrders();
        return;
      }

      if (json.success) {
        showToast(`Đã giao trọn bộ bắp nước cho đơn hàng #${paymentId}!`, 'success');
        setAlertMessage({ type: 'success', text: `Đã giao trọn bộ bắp nước cho đơn hàng #${paymentId}!` });
        await fetchOrders();
      } else {
        showToast(json.message || 'Lỗi khi giao bắp nước', 'error');
        setAlertMessage({ type: 'error', text: json.message || 'Lỗi khi giao bắp nước' });
      }
    } catch (err) {
      showToast('Lỗi đường truyền máy chủ', 'error');
      setAlertMessage({ type: 'error', text: 'Lỗi đường truyền máy chủ' });
    } finally {
      setDeliveringPaymentId(null);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 text-[#F8FAFC]">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* 1. Header Bar Kệ Bắp Nước */}
        <header className="bg-gradient-to-r from-[rgba(20,14,32,0.92)] to-[rgba(35,12,28,0.9)] backdrop-blur-2xl border border-[rgba(192,132,252,0.25)] rounded-2xl p-4 lg:px-6 lg:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(88,28,135,0.2)]">
          <div className="flex items-center gap-3.5">
            <span className="bg-gradient-to-br from-[#E11D48] to-[#881337] text-white font-black text-xs tracking-wider px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-[rgba(254,205,211,0.35)]">
              ✦ CONCESSION
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/staff" className="text-xs text-[#94A3B8] hover:text-white transition-colors">
                  Dashboard
                </Link>
                <span className="text-[#64748B] text-xs">/</span>
                <h1 className="text-sm lg:text-base font-extrabold text-[#F8FAFC] tracking-wide">
                  KỆ GIAO BẮP NƯỚC & ĐIỀU PHỐI ĐƠN HÀNG (CONCESSION QUEUE)
                </h1>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Kiểm tra đơn hàng, xác nhận bàn giao một chạm và chống gian lận nhận lần 2 (BR-05)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#F8FAFC] text-xs font-bold border border-[rgba(192,132,252,0.25)] transition-all flex items-center gap-2"
            >
              <span>{loading ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
            <Link
              href="/staff/pos"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:scale-105 transition-all no-underline"
            >
              Mở Quầy POS
            </Link>
          </div>
        </header>

        {/* Thông báo Alert */}
        {alertMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
              alertMessage.type === 'success'
                ? 'bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.4)] text-[#86EFAC]'
                : 'bg-[rgba(225,29,72,0.18)] border-[rgba(225,29,72,0.45)] text-[#FDA4AF]'
            }`}
          >
            <span>{alertMessage.text}</span>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="font-bold hover:opacity-75 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. Thanh Tìm Kiếm & Bộ Lọc Trạng Thái */}
        <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-4 lg:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85)] space-y-3.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="text"
              placeholder="Nhập số điện thoại khách, tên khách, mã giao dịch hoặc mã vé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.25)] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#E11D48] transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#581C87] to-[#7E22CE] text-white text-xs font-extrabold shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:scale-105 transition-all"
            >
              Tra Cứu Đơn
            </button>
          </form>

          {/* Bộ lọc trạng thái đơn */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(192,132,252,0.12)]">
            <span className="text-[11px] text-[#94A3B8]">Lọc theo tiến độ giao:</span>
            <div className="flex bg-[rgba(8,6,14,0.7)] p-1 rounded-xl border border-[rgba(192,132,252,0.18)]">
              {[
                { id: 'pending', label: 'Chờ Giao Cho Khách' },
                { id: 'delivered', label: 'Đã Bàn Giao' },
                { id: 'all', label: 'Tất Cả Đơn Bắp Nước' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-white shadow-[0_0_12px_rgba(225,29,72,0.5)]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Lưới Đơn Hàng Bắp Nước Thời Gian Thực */}
        <div>
          {loading ? (
            <div className="bg-[rgba(15,11,25,0.8)] border border-[rgba(192,132,252,0.2)] rounded-2xl py-20 text-center text-[#94A3B8]">
              <div className="hourglass-spin text-2xl mb-2">⏳</div>
              <p className="text-xs">Đang đồng bộ hàng đợi bắp nước...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[rgba(15,11,25,0.8)] border border-[rgba(192,132,252,0.2)] rounded-2xl py-20 text-center text-[#94A3B8]">
              <p className="text-sm font-bold text-white">Hiện không có đơn bắp nước nào cần xử lý</p>
              <p className="text-xs mt-1">Đơn hàng mới từ quầy POS và Mobile App sẽ tự động hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                const pendingCount = order.combos.filter((c) => !c.isDelivered).length;
                const isAllDelivered = pendingCount === 0;

                return (
                  <div
                    key={order.paymentId}
                    className={`rounded-2xl p-4 lg:p-5 transition-all flex flex-col justify-between border ${
                      isAllDelivered
                        ? 'bg-[radial-gradient(circle_at_0%_0%,rgba(88,28,135,0.15)_0%,transparent_60%),rgba(16,12,26,0.7)] border-[rgba(192,132,252,0.12)] opacity-70'
                        : 'bg-[radial-gradient(circle_at_0%_0%,rgba(88,28,135,0.3)_0%,transparent_60%),radial-gradient(circle_at_100%_100%,rgba(225,29,72,0.25)_0%,transparent_60%),rgba(16,12,26,0.92)] border-[rgba(225,29,72,0.6)] shadow-[0_0_25px_rgba(225,29,72,0.3)]'
                    }`}
                  >
                    <div>
                      {/* Header Đơn Hàng */}
                      <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3">
                        <div>
                          <div className="font-mono font-black text-sm text-[#F8FAFC]">
                            {order.transactionCode}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">
                            Đặt lúc: {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {order.paymentMethod}
                          </div>
                        </div>

                        {/* Huy hiệu trạng thái */}
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            isAllDelivered
                              ? 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.15)] text-[#94A3B8]'
                              : order.deliveryStatus === 'PARTIALLY_DELIVERED'
                              ? 'bg-[rgba(245,158,11,0.2)] border-[#F59E0B] text-[#FDE68A]'
                              : 'bg-[rgba(225,29,72,0.25)] border-[#E11D48] text-[#FDA4AF] shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                          }`}
                        >
                          {isAllDelivered
                            ? 'ĐÃ GIAO'
                            : order.deliveryStatus === 'PARTIALLY_DELIVERED'
                            ? `GIAO DỞ (${pendingCount} CHỜ)`
                            : `ĐANG CHUẨN BỊ (${pendingCount} MỤC)`}
                        </span>
                      </div>

                      {/* Khách hàng & Suất chiếu */}
                      <div className="bg-[rgba(8,6,14,0.6)] rounded-xl p-2.5 text-xs border border-[rgba(192,132,252,0.15)] mb-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">Khách:</span>
                          <strong className="text-white">{order.customer.name} ({order.customer.phone || 'N/A'})</strong>
                        </div>
                        {order.movieInfo && (
                          <div className="flex justify-between text-[#FDA4AF]">
                            <span>Phòng {order.movieInfo.room}:</span>
                            <span className="truncate max-w-[170px]">{order.movieInfo.title} · Ghế {order.movieInfo.seats}</span>
                          </div>
                        )}
                      </div>

                      {/* Danh sách các phần bắp nước trong đơn */}
                      <div className="space-y-2 mb-4">
                        {order.combos.map((combo) => (
                          <div
                            key={combo.orderComboId}
                            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-[#F8FAFC] truncate">
                                  {combo.name}
                                </span>
                                <span className="text-[10px] font-black bg-[rgba(255,255,255,0.08)] px-1.5 py-0.2 rounded text-[#FDA4AF]">
                                  x{combo.quantity}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                                {(combo.price * combo.quantity).toLocaleString('vi-VN')} đ
                              </div>
                            </div>

                            {/* Nút bấm giao lẻ từng món */}
                            <div>
                              {combo.isDelivered ? (
                                <span className="text-[10px] font-bold text-[#86EFAC] bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] px-2 py-1 rounded-md block text-center">
                                  ĐÃ NHẬN
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={deliveringId === combo.orderComboId}
                                  onClick={() => handleDeliverSingle(combo.orderComboId, combo.name)}
                                  className="px-2.5 py-1 rounded-lg bg-[rgba(225,29,72,0.2)] hover:bg-[#E11D48] text-[#FDA4AF] hover:text-white border border-[rgba(225,29,72,0.4)] text-[10px] font-extrabold transition-all cursor-pointer"
                                >
                                  {deliveringId === combo.orderComboId ? '...' : 'Giao Món'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nút hành động toàn đơn */}
                    <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                      {!isAllDelivered ? (
                        <button
                          type="button"
                          disabled={deliveringPaymentId === order.paymentId}
                          onClick={() => handleDeliverAll(order.paymentId)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] hover:scale-[1.02] transition-all cursor-pointer"
                        >
                          {deliveringPaymentId === order.paymentId
                            ? 'ĐANG XÁC NHẬN...'
                            : 'XÁC NHẬN ĐÃ GIAO XONG TOÀN ĐƠN'}
                        </button>
                      ) : (
                        <div className="text-center py-2 text-xs font-bold text-[#64748B]">
                          Đơn đã hoàn tất bàn giao (Khóa chặn BR-05)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
