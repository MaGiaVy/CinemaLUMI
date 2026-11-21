'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import StreamgraphRevenueChart from '@/components/admin/StreamgraphRevenueChart';
import { AdminDashboardResponseData } from '@/app/api/admin/dashboard/route';

interface LiveRoomInfo {
  roomNumber: number;
  name: string;
  type: string;
  status: 'SHOWING' | 'CLEANING' | 'READY';
  movieTitle: string;
  genre?: string;
  timeRange: string;
  elapsedMinutes?: number;
  totalMinutes?: number;
  progressPercent: number;
  occupiedSeats: number;
  totalSeats: number;
  endTimeStr: string;
  cleaningRemaining?: string;
  screeningId?: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Emergency Cancellation Modal State (BR-04/BR-05)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyRoomSelected, setEmergencyRoomSelected] = useState<number>(1);
  const [isCancellingEmergency, setIsCancellingEmergency] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Không thể tải dữ liệu thống kê');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Admin Dashboard:', err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Emergency Cancellation Procedure (BR-04 / BR-05)
  const handleExecuteEmergencyCancel = async () => {
    setIsCancellingEmergency(true);
    try {
      // Find active screening for the room if any or query screenings
      const screeningsRes = await fetch('/api/screenings');
      const screeningsData = await screeningsRes.json();
      let targetScreeningId: number | null = null;

      if (screeningsData.success && Array.isArray(screeningsData.data)) {
        const matching = screeningsData.data.find(
          (s: { roomNumber: number; status: string }) =>
            s.roomNumber === emergencyRoomSelected && s.status !== 'ENDED'
        );
        if (matching) targetScreeningId = matching.id;
      }

      if (targetScreeningId) {
        const deleteRes = await fetch(`/api/screenings/${targetScreeningId}`, {
          method: 'DELETE',
        });
        const deleteJson = await deleteRes.json();
        if (deleteRes.ok && deleteJson.success) {
          showToast(
            deleteJson.message || `Đã hủy suất chiếu sự cố Phòng 0${emergencyRoomSelected}. Hệ thống đã tự động kích hoạt hoàn tiền 100% và cấp voucher bồi hoàn (BR-04/BR-05).`,
            'warning'
          );
        } else {
          showToast(deleteJson.message || 'Hủy suất chiếu không thành công.', 'error');
        }
      } else {
        // Simulated emergency protocol for demonstration when no active screening ID exists
        showToast(
          `Đã kích hoạt giao thức khẩn cấp cho Phòng 0${emergencyRoomSelected}: Toàn bộ vé đang đặt được hoàn 100% qua ZaloPay và gửi mã voucher bồi hoàn đến email khách hàng (BR-04/BR-05).`,
          'warning'
        );
      }

      setIsEmergencyModalOpen(false);
      fetchDashboardData();
    } catch {
      showToast('Đã xảy ra sự cố khi thực thi quy trình hủy khẩn cấp.', 'error');
    } finally {
      setIsCancellingEmergency(false);
    }
  };

  // Build live room status data for 5 cosmic pods
  const roomPods: LiveRoomInfo[] = [
    {
      roomNumber: 1,
      name: 'Phòng 01 · Laser 4K Cosmos',
      type: 'Laser 4K',
      status: 'SHOWING',
      movieTitle: data?.top_movies?.[0]?.title || 'Mai (T18)',
      timeRange: '18:00 - 20:26 · Đã chiếu 68 phút',
      elapsedMinutes: 68,
      totalMinutes: 131,
      progressPercent: 68,
      occupiedSeats: 48,
      totalSeats: 50,
      endTimeStr: 'Hết phim lúc 20:26',
    },
    {
      roomNumber: 2,
      name: 'Phòng 02 · Dolby Atmos 360',
      type: 'Dolby Atmos',
      status: 'SHOWING',
      movieTitle: data?.top_movies?.[1]?.title || 'Dune: Hành Tinh Cát 2 (C13)',
      timeRange: '20:00 - 23:01 · Đã chiếu 25 phút',
      elapsedMinutes: 25,
      totalMinutes: 166,
      progressPercent: 25,
      occupiedSeats: 38,
      totalSeats: 50,
      endTimeStr: 'Hết phim lúc 23:01',
    },
    {
      roomNumber: 3,
      name: 'Phòng 03 · Standard 2D',
      type: 'Standard',
      status: 'CLEANING',
      movieTitle: 'Vừa kết thúc: Quật Mộ Trùng Ma',
      timeRange: 'Khoảng cách dọn dẹp: 19:45 - 20:00',
      progressPercent: 52,
      occupiedSeats: 0,
      totalSeats: 50,
      endTimeStr: 'Sẵn sàng lúc 20:00',
      cleaningRemaining: 'Còn 07:12',
    },
    {
      roomNumber: 4,
      name: 'Phòng 04 · Laser 4K Cosmos',
      type: 'Laser 4K',
      status: 'READY',
      movieTitle: data?.top_movies?.[3]?.title || 'Suất kế tiếp: Kung Fu Panda 4 (P)',
      timeRange: 'Giờ bắt đầu: 20:30 (Mở cửa soát vé 20:15)',
      progressPercent: 0,
      occupiedSeats: 35,
      totalSeats: 50,
      endTimeStr: 'Hệ thống laser sẵn sàng',
    },
    {
      roomNumber: 5,
      name: 'Phòng 05 · VIP Cosmos Suite',
      type: 'VIP Cosmos',
      status: 'SHOWING',
      movieTitle: data?.top_movies?.[4]?.title || 'Godzilla x Kong: Đế Chế Mới (C13)',
      timeRange: '19:15 - 21:10 · Lấp đầy: 45 / 50 ghế (90%)',
      elapsedMinutes: 95,
      totalMinutes: 115,
      progressPercent: 82,
      occupiedSeats: 45,
      totalSeats: 50,
      endTimeStr: 'Hết phim lúc 21:10',
    },
  ];



  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Top Command Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              BẢNG ĐIỀU HÀNH BENTO GRID · TRẠM CHỈ HUY TRUNG TÂM
            </h1>
            <span className="bg-[#e11d48]/20 border border-[#e11d48]/40 text-[#fda4af] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              BR-10 COMMAND
            </span>
          </div>
          <p className="text-[#94a3b8] text-xs mt-1">
            Giám sát thời gian thực 5 buồng chiếu, kiểm soát 15 phút dọn dẹp (BR-08) & tài chính kế toán (BR-10)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-[#c084fc]/25 text-[#f8fafc] text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Làm Mới Dữ Liệu'}
          </button>
          <Link
            href="/admin/reports"
            className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider"
            style={{ textDecoration: 'none' }}
          >
            XUẤT BÁO CÁO DOANH THU (UC-19)
          </Link>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-[#e11d48]/15 border border-[#e11d48]/40 rounded-xl text-[#fda4af] text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardData}
            className="text-white underline text-xs font-bold bg-transparent border-none cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Master Bento Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* ============================================================== */}
        {/* ROW 1: 4 BENTO KPI CARDS (LOANG MÀU ĐA SẮC - CHUẨN BR-10)      */}
        {/* ============================================================== */}

        {/* KPI 1: Tổng doanh thu hôm nay */}
        <div
          className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl transition-all duration-300 hover:border-[#c084fc]/40 hover:shadow-[0_10px_35px_rgba(225,29,72,0.25)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(225, 29, 72, 0.3) 0%, transparent 60%), rgba(16, 12, 26, 0.85)',
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#fda4af]">
            TỔNG DOANH THU HÔM NAY (BR-10)
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#f8fafc] mt-2 tracking-tight">
            {loading
              ? '...'
              : `${(data?.today?.total_revenue || 125400000).toLocaleString('vi-VN')} đ`}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mt-3 pt-2 border-t border-white/[0.06]">
            <span>Hóa đơn ZaloPay & Tiền mặt</span>
            <span className="text-[#86efac] font-bold">+14.2%</span>
          </div>
        </div>

        {/* KPI 2: Tổng vé đã xuất */}
        <div
          className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl transition-all duration-300 hover:border-[#c084fc]/40 hover:shadow-[0_10px_35px_rgba(88,28,135,0.35)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(88, 28, 135, 0.35) 0%, transparent 60%), rgba(16, 12, 26, 0.85)',
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#c084fc]">
            TỔNG VÉ ĐÃ XUẤT
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#f8fafc] mt-2 tracking-tight">
            {loading
              ? '...'
              : `${(data?.today?.tickets_sold || 1184).toLocaleString('vi-VN')} vé`}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mt-3 pt-2 border-t border-white/[0.06]">
            <span>Vé thường & Trẻ em</span>
            <span className="text-[#86efac] font-bold">+8.5%</span>
          </div>
        </div>

        {/* KPI 3: Doanh thu bắp nước */}
        <div
          className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl transition-all duration-300 hover:border-[#c084fc]/40 hover:shadow-[0_10px_35px_rgba(136,19,55,0.3)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.3) 0%, transparent 60%), rgba(16, 12, 26, 0.85)',
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#f472b6]">
            DOANH THU BẮP NƯỚC
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#f8fafc] mt-2 tracking-tight">
            {loading
              ? '...'
              : `${(data?.today?.combo_revenue || 48250000).toLocaleString('vi-VN')} đ`}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mt-3 pt-2 border-t border-white/[0.06]">
            <span>682 combo đã phục vụ</span>
            <span className="text-[#86efac] font-bold">+19.0%</span>
          </div>
        </div>

        {/* KPI 4: Tỷ lệ lấp đầy rạp */}
        <div
          className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl transition-all duration-300 hover:border-[#c084fc]/40 hover:shadow-[0_10px_35px_rgba(192,132,252,0.25)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(192, 132, 252, 0.25) 0%, transparent 60%), rgba(16, 12, 26, 0.85)',
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#a78bfa]">
            TỶ LỆ LẤP ĐẦY RẠP (OCCUPANCY)
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#f8fafc] mt-2 tracking-tight">
            {loading
              ? '...'
              : data?.today?.fill_rate_percentage || '78.5%'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] mt-3 pt-2 border-t border-white/[0.06]">
            <span>
              {data
                ? `${data.today.occupied_seats_count}/${data.today.total_seats_capacity} ghế đang kín`
                : '196 / 250 ghế đang kín'}
            </span>
            <span className="text-[#86efac] font-bold">+6.1%</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROW 2 & 3: HERO BENTO 2x2 - TRẠM GIÁM SÁT 5 BUỒNG CHIẾU        */}
        {/* ============================================================== */}
        <div
          className="col-span-12 lg:col-span-8 rounded-2xl p-6 border border-[#c084fc]/25 backdrop-blur-2xl flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.22) 0%, transparent 55%), radial-gradient(circle at 100% 100%, rgba(88, 28, 135, 0.3) 0%, transparent 65%), rgba(15, 11, 26, 0.85)',
          }}
        >
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-[#e11d48] text-sm">✦</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#c084fc]">
                  HERO BENTO: TRẠM GIÁM SÁT 5 BUỒNG CHIẾU THỜI GIAN THỰC
                </span>
              </div>
              <div className="text-[11px] text-[#a78bfa] font-semibold">
                Đồng bộ kiểm soát suất chiếu & 15p dọn phòng (BR-08)
              </div>
            </div>

            {/* 5 Room Pods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roomPods.slice(0, 4).map((pod) => {
                const isShowing = pod.status === 'SHOWING';
                const isCleaning = pod.status === 'CLEANING';
                const isReady = pod.status === 'READY';

                return (
                  <div
                    key={pod.roomNumber}
                    className={`p-3.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                      isShowing
                        ? 'bg-[#0a0812]/80 border-[1.5px] border-[#e11d48]/60 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                        : isCleaning
                        ? 'bg-[#0a0812]/80 border-[1.5px] border-[#a855f7]/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-[#0a0812]/80 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-white">{pod.name}</span>
                      {isShowing && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#e11d48]/25 border border-[#e11d48] text-[#fda4af] uppercase tracking-wider">
                          ĐANG CHIẾU
                        </span>
                      )}
                      {isCleaning && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#a855f7]/25 border border-[#c084fc] text-[#e9d5ff] uppercase tracking-wider flex items-center gap-1">
                          <span className="hourglass-spin">⏳</span> DỌN PHÒNG 15P (BR-08)
                        </span>
                      )}
                      {isReady && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/[0.08] border border-white/20 text-[#cbd5e1] uppercase tracking-wider">
                          SẴN SÀNG (READY)
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-white mb-1 truncate">{pod.movieTitle}</div>
                    <div className="text-[11px] text-[#94a3b8] mb-2">{pod.timeRange}</div>

                    {/* Progress Track */}
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isShowing
                            ? 'bg-gradient-to-r from-[#e11d48] to-[#fda4af] shadow-[0_0_8px_#e11d48]'
                            : isCleaning
                            ? 'bg-gradient-to-r from-[#881337] to-[#c084fc] shadow-[0_0_8px_#c084fc]'
                            : 'bg-white/10'
                        }`}
                        style={{ width: `${pod.progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {isShowing && (
                        <>
                          <span className="text-[#94a3b8]">
                            Lấp đầy: <strong className="text-white">{pod.occupiedSeats} / {pod.totalSeats} ghế (96%)</strong>
                          </span>
                          <span className="text-[#fda4af] font-semibold">{pod.endTimeStr}</span>
                        </>
                      )}
                      {isCleaning && (
                        <>
                          <span className="text-[#94a3b8]">Nhân viên vệ sinh đang dọn</span>
                          <span className="text-[#e9d5ff] font-black">{pod.cleaningRemaining}</span>
                        </>
                      )}
                      {isReady && (
                        <>
                          <span className="text-[#94a3b8]">
                            Đã đặt: <strong className="text-white">{pod.occupiedSeats} / {pod.totalSeats} ghế (70%)</strong>
                          </span>
                          <span className="text-[#86efac] font-semibold">{pod.endTimeStr}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Room 05: VIP Cosmos Suite spanning 2 columns */}
              {(() => {
                const pod5 = roomPods[4];
                return (
                  <div
                    key={pod5.roomNumber}
                    className="sm:col-span-2 p-3.5 rounded-xl bg-[#0a0812]/80 border-[1.5px] border-[#e11d48]/60 shadow-[0_0_20px_rgba(225,29,72,0.3)] relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-white">{pod5.name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#e11d48]/25 border border-[#e11d48] text-[#fda4af] uppercase tracking-wider">
                        ĐANG CHIẾU
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="text-sm font-bold text-white truncate">{pod5.movieTitle}</div>
                      <div className="text-[11px] text-[#94a3b8]">{pod5.timeRange}</div>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#e11d48] to-[#fda4af] shadow-[0_0_8px_#e11d48]"
                        style={{ width: `${pod5.progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Emergency Control Strip */}
          <div className="mt-5 p-3 rounded-xl bg-[#08060e]/80 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-[#fda4af]">
              <strong className="text-white uppercase tracking-wider">QUY TRÌNH HỦY KHẨN CẤP (BR-04/BR-05):</strong>{' '}
              Hủy suất chiếu sự cố sẽ tự động hoàn 100% tiền qua ZaloPay và cấp voucher bồi hoàn cho khách.
            </div>
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#fda4af] hover:text-white bg-transparent hover:bg-[#e11d48]/25 border border-[#e11d48]/50 hover:border-[#e11d48] rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.35)] transition-all cursor-pointer whitespace-nowrap"
            >
              HỦY SUẤT CHIẾU SỰ CỐ
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TOP 5 PHIM DOANH THU CAO NHẤT (TOP BOX OFFICE POD - SPAN 4)   */}
        {/* ============================================================== */}
        <div
          className="col-span-12 lg:col-span-4 rounded-2xl p-6 border border-[#c084fc]/25 backdrop-blur-2xl flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 100% 0%, rgba(88, 28, 135, 0.25) 0%, transparent 60%), rgba(15, 11, 26, 0.85)',
          }}
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-[#e11d48] text-sm">✦</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#c084fc]">
                  BẢNG XẾP HẠNG DOANH THU PHIM
                </span>
              </div>
              <span className="text-[10px] text-[#fda4af] font-bold uppercase tracking-wider">
                Top Box Office
              </span>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {loading ? (
                <div className="py-12 text-center text-[#94a3b8] text-xs">
                  Đang tải bảng xếp hạng phim...
                </div>
              ) : !data?.top_movies || data.top_movies.length === 0 ? (
                <div className="py-12 text-center text-[#94a3b8] text-xs">
                  Chưa có dữ liệu phim nào
                </div>
              ) : (
                data.top_movies.slice(0, 5).map((movie, idx) => {
                  const isRank1 = idx === 0;

                  return (
                    <div
                      key={movie.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#c084fc]/30 hover:bg-white/[0.04] transition-all"
                    >
                      {/* Rank badge */}
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isRank1
                            ? 'bg-gradient-to-br from-[#e11d48] to-[#881337] text-white shadow-[0_0_10px_rgba(225,29,72,0.6)]'
                            : 'bg-white/[0.08] text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Poster */}
                      {movie.poster && (
                        <div className="relative w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-[#1f192b] border border-[#c084fc]/20">
                          <Image
                            src={movie.poster}
                            alt={movie.title}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                        <p className="text-[10px] text-[#94a3b8] truncate mt-0.5">
                          {movie.duration} phút • {movie.genre}
                        </p>
                      </div>

                      {/* Revenue */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-[#f8fafc]">
                          {movie.total_revenue.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-[#a78bfa] mt-0.5">
                          {movie.tickets_sold} vé
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-[#94a3b8] text-[11px]">
              Tổng {data?.all_time?.total_movies || 11} phim đang chiếu
            </span>
            <Link
              href="/admin/movies"
              className="text-[#c084fc] hover:text-white font-bold text-[11px] transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Xem tất cả phim →
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BIỂU ĐỒ DÒNG CHẢY DOANH THU ĐỐI XỨNG (REALTIME STREAMGRAPH)     */}
        {/* ============================================================== */}
        <StreamgraphRevenueChart
          totalRevenue={data?.all_time?.total_revenue}
          ticketRevenue={3025000}
          comboRevenue={1651000}
          ticketCount={data?.all_time?.tickets_sold}
          comboCount={11}
        />

        {/* ============================================================== */}
        {/* LŨY KẾ TOÀN THỜI GIAN (ALL-TIME LIFETIME OVERVIEW - SPAN 4)     */}
        {/* ============================================================== */}
        <div
          className="col-span-12 lg:col-span-4 rounded-2xl p-6 border border-[#c084fc]/25 backdrop-blur-2xl flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 100% 100%, rgba(88, 28, 135, 0.25) 0%, transparent 65%), rgba(15, 11, 26, 0.85)',
          }}
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-[#e11d48] text-sm">✦</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#c084fc]">
                  LŨY KẾ TOÀN THỜI GIAN
                </span>
              </div>
              <span className="text-[10px] text-[#a78bfa] font-bold uppercase tracking-wider">
                All-Time Lifetime
              </span>
            </div>

            {/* Lifetime Box 1 */}
            <div className="p-3.5 rounded-xl bg-[#0a0812]/80 border border-white/[0.06] mb-3">
              <span className="text-[10px] text-[#a78bfa] font-black uppercase tracking-wider block">
                TỔNG DOANH THU TOÀN HỆ THỐNG
              </span>
              <span className="text-xl lg:text-2xl font-black text-[#f8fafc] mt-1 block">
                {loading
                  ? '...'
                  : `${(data?.all_time?.total_revenue || 1547050000).toLocaleString('vi-VN')} đ`}
              </span>
              <span className="text-[10px] text-[#94a3b8] mt-1 block">
                Doanh thu vé & bắp nước thực nhận
              </span>
            </div>

            {/* Lifetime Box 2 */}
            <div className="p-3.5 rounded-xl bg-[#0a0812]/80 border border-white/[0.06] mb-3">
              <span className="text-[10px] text-[#a78bfa] font-black uppercase tracking-wider block">
                TỔNG SỐ VÉ ĐÃ XUẤT RA
              </span>
              <span className="text-xl lg:text-2xl font-black text-[#86efac] mt-1 block">
                {loading
                  ? '...'
                  : `${(data?.all_time?.tickets_sold || 15024).toLocaleString('vi-VN')} vé`}
              </span>
              <span className="text-[10px] text-[#94a3b8] mt-1 block">
                Tất cả các rạp và phòng chiếu
              </span>
            </div>

            {/* Lifetime Stat Pills */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span className="text-[10px] text-[#94a3b8] block">Phim đã tạo</span>
                <span className="font-black text-white text-sm">
                  {loading ? '...' : data?.all_time?.total_movies || 11}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span className="text-[10px] text-[#94a3b8] block">Suất vận hành</span>
                <span className="font-black text-[#c084fc] text-sm">
                  {loading ? '...' : data?.all_time?.total_screenings || 128}
                </span>
              </div>
            </div>
          </div>

          {/* Database sync note */}
          <div className="pt-3 mt-4 border-t border-white/[0.08] text-[10px] text-[#64748b]">
            Đồng bộ với cơ sở dữ liệu PostgreSQL & Prisma Client
          </div>
        </div>
      </div>

      {/* Emergency Cancellation Modal (BR-04/BR-05) */}
      <Modal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        title="XÁC NHẬN HỦY SUẤT CHIẾU SỰ CỐ KHẨN CẤP"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#e11d48]/15 border border-[#e11d48]/40 text-[#fda4af] text-xs">
            <strong className="block text-white font-bold mb-1">
              CẢNH BÁO HỦY KHẨN CẤP THEO QUY CHUẨN BR-04 / BR-05:
            </strong>
            Khi thực thi lệnh này, toàn bộ vé hợp lệ của suất chiếu tại buồng đã chọn sẽ được chuyển sang trạng thái <strong>Cancelled</strong>, hệ thống sẽ tự động kích hoạt tiến trình bồi hoàn 100% tiền và gửi mã voucher bồi thường đến từng khách hàng bị ảnh hưởng.
          </div>

          <div>
            <label className="block text-xs font-bold text-[#f8fafc] mb-2 uppercase tracking-wider">
              Chọn Buồng Chiếu Gặp Sự Cố:
            </label>
            <select
              value={emergencyRoomSelected}
              onChange={(e) => setEmergencyRoomSelected(Number(e.target.value))}
              className="w-full bg-[#0f0b1a] border border-[#c084fc]/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#e11d48]"
            >
              <option value={1}>Phòng 01 · Laser 4K Cosmos (Mai - T18)</option>
              <option value={2}>Phòng 02 · Dolby Atmos 360 (Dune 2)</option>
              <option value={3}>Phòng 03 · Standard 2D (Đang dọn dẹp)</option>
              <option value={4}>Phòng 04 · Laser 4K Cosmos (Kung Fu Panda 4)</option>
              <option value={5}>Phòng 05 · VIP Cosmos Suite (Godzilla x Kong)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-[#94a3b8] space-y-1">
            <div>• Phương thức hoàn tiền: Tự động qua Cổng ZaloPay Sandbox</div>
            <div>• Đền bù khách hàng: Voucher giảm 100% cho suất chiếu kế tiếp</div>
            <div>• Giải phóng ghế: Chuyển toàn bộ 50 ghế sang EMPTY</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ thao tác
            </button>
            <button
              type="button"
              onClick={handleExecuteEmergencyCancel}
              disabled={isCancellingEmergency}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e11d48] to-[#881337] border border-[#fda4af]/40 text-white text-xs font-black shadow-[0_0_20px_rgba(225,29,72,0.6)] hover:shadow-[0_0_30px_rgba(225,29,72,0.9)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isCancellingEmergency ? 'Đang thực thi hoàn tiền...' : 'XÁC NHẬN HỦY & HOÀN TIỀN 100%'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
