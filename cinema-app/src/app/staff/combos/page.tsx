'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
    if (!confirm(`Xác nhận khách đã nhận "${comboName}"? Sau khi nhận sẽ chặn phát lần 2.`)) {
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

      if (json.success) {
        setAlertMessage({ type: 'success', text: `Đã xác nhận giao: ${comboName}!` });
        await fetchOrders();
      } else {
        setAlertMessage({ type: 'error', text: json.message || 'Lỗi khi giao combo' });
      }
    } catch (err) {
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

      if (json.success) {
        setAlertMessage({ type: 'success', text: `Đã giao trọn bộ bắp nước cho đơn hàng #${paymentId}!` });
        await fetchOrders();
      } else {
        setAlertMessage({ type: 'error', text: json.message || 'Lỗi khi giao bắp nước' });
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Lỗi đường truyền máy chủ' });
    } finally {
      setDeliveringPaymentId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#141414] p-6 lg:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Quầy Giao Nhận Combo & Bắp Nước
              </h1>
              <span className="bg-[#FFB703]/20 border border-[#FFB703]/40 text-[#FFB703] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                CONCESSION COUNTER
              </span>
            </div>
            <p className="text-[#A3A3A3] text-sm mt-1">
              Kiểm tra đơn hàng, xác nhận phát bắp nước và chống nhận lần hai
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              🔄 {loading ? 'Đang cập nhật...' : 'Làm mới'}
            </Button>
            <Link href="/staff/pos">
              <Button variant="primary" size="sm" className="bg-[#E63946] hover:bg-[#D90429]">
                🎟️ Bán tại quầy (POS)
              </Button>
            </Link>
          </div>
        </div>

        {/* Thông báo Alert */}
        {alertMessage && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-sm ${
              alertMessage.type === 'success'
                ? 'bg-[#2ECC71]/20 border border-[#2ECC71]/50 text-[#2ECC71]'
                : 'bg-[#E63946]/20 border border-[#E63946]/50 text-[#E63946]'
            }`}
          >
            <span>{alertMessage.type === 'success' ? '✅' : '⚠️'} {alertMessage.text}</span>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="text-white hover:opacity-75 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Thanh tìm kiếm & Bộ lọc */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 shadow-lg space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-base">
                🔍
              </span>
              <input
                type="text"
                placeholder="Nhập số điện thoại khách, tên khách, mã thanh toán hoặc mã vé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#404040] focus:border-[#FFB703] rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none transition-colors"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="bg-[#FFB703] hover:bg-[#FCA311] text-black font-bold">
              Tra cứu đơn
            </Button>
          </form>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#2D2D2D]">
            <span className="text-xs text-[#737373] mr-2">Trạng thái:</span>
            {[
              { id: 'pending', label: '🟡 Chờ giao cho khách' },
              { id: 'delivered', label: '🟢 Đã giao nhận' },
              { id: 'all', label: '📋 Tất cả đơn bắp nước' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[#FFB703] text-black shadow-md'
                    : 'bg-[#2D2D2D] text-[#A3A3A3] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách các đơn bắp nước */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-12 text-center text-[#737373]">
              <div className="inline-block animate-spin text-3xl mb-3">🔄</div>
              <p>Đang tìm kiếm dữ liệu bắp nước...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-12 text-center text-[#737373]">
              <div className="text-4xl mb-3">🍿</div>
              <p className="text-white font-medium">Không tìm thấy đơn bắp nước nào phù hợp</p>
              <p className="text-xs text-[#737373] mt-1">Thử thay đổi từ khóa hoặc chuyển sang tab trạng thái khác</p>
            </div>
          ) : (
            orders.map((order) => {
              const pendingCount = order.combos.filter((c) => !c.isDelivered).length;
              const isAllDelivered = pendingCount === 0;

              return (
                <div
                  key={order.paymentId}
                  className={`bg-[#1E1E1E] border rounded-2xl p-5 lg:p-6 transition-all shadow-md ${
                    isAllDelivered ? 'border-[#2D2D2D] opacity-80' : 'border-[#FFB703]/30 hover:border-[#FFB703]/60'
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D2D2D] pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-base">
                          {order.transactionCode}
                        </span>
                        {isAllDelivered ? (
                          <Badge variant="green">ĐÃ GIAO ĐỦ</Badge>
                        ) : order.deliveryStatus === 'PARTIALLY_DELIVERED' ? (
                          <Badge variant="gold">ĐANG GIAO DỞ</Badge>
                        ) : (
                          <span className="bg-[#FFB703]/20 border border-[#FFB703]/40 text-[#FFB703] text-xs font-semibold px-2 py-0.5 rounded-full">
                            CHỜ GIAO ({pendingCount} MỤC)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#737373] mt-1">
                        Đặt lúc: {new Date(order.createdAt).toLocaleTimeString('vi-VN')} {new Date(order.createdAt).toLocaleDateString('vi-VN')} • Thanh toán: {order.paymentMethod} • Tổng tiền: {order.totalAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isAllDelivered && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeliverAll(order.paymentId)}
                          disabled={deliveringPaymentId === order.paymentId}
                          className="bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold text-xs"
                        >
                          {deliveringPaymentId === order.paymentId ? 'Đang xác nhận...' : '✅ Giao toàn bộ combo'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Customer & Movie Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#141414] p-3.5 rounded-xl text-xs mb-4">
                    <div>
                      <span className="text-[#737373]">Khách hàng: </span>
                      <span className="text-white font-semibold">{order.customer.name}</span>
                      <span className="text-[#A3A3A3] ml-2">📞 {order.customer.phone}</span>
                    </div>
                    {order.movieInfo ? (
                      <div>
                        <span className="text-[#737373]">Suất chiếu: </span>
                        <span className="text-[#FFB703] font-semibold">{order.movieInfo.title}</span>
                        <span className="text-[#A3A3A3] ml-2">Phòng: {order.movieInfo.room} • Ghế: {order.movieInfo.seats}</span>
                      </div>
                    ) : (
                      <div className="text-[#737373]">
                        Đơn mua bắp nước độc lập tại quầy hoặc online
                      </div>
                    )}
                  </div>

                  {/* Combos list */}
                  <div className="divide-y divide-[#2D2D2D]">
                    {order.combos.map((combo) => (
                      <div
                        key={combo.orderComboId}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            🍿
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold text-sm">{combo.name}</p>
                              <span className="bg-[#333333] text-white text-xs px-2 py-0.5 rounded font-bold">
                                x{combo.quantity}
                              </span>
                            </div>
                            <p className="text-xs text-[#737373] mt-0.5">
                              Đơn giá: {combo.price.toLocaleString('vi-VN')}đ • Thành tiền: {(combo.price * combo.quantity).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {combo.isDelivered ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30 px-3 py-1 rounded-full font-semibold">
                                <span>🔒</span> ĐÃ NHẬN (CHẶN PHÁT LẦN 2)
                              </span>
                              {combo.deliveredAt && (
                                <p className="text-[10px] text-[#737373] mt-0.5">
                                  Lúc: {new Date(combo.deliveredAt).toLocaleTimeString('vi-VN')} {new Date(combo.deliveredAt).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeliverSingle(combo.orderComboId, combo.name)}
                              disabled={deliveringId === combo.orderComboId}
                              className="border-[#FFB703]/50 text-[#FFB703] hover:bg-[#FFB703] hover:text-black font-semibold text-xs"
                            >
                              {deliveringId === combo.orderComboId ? 'Đang xử lý...' : '🍿 Giao phần này'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
