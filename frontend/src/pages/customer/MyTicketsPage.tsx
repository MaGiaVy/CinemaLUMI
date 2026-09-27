import { useState } from "react";
import { tickets, movies } from "@/data/mockData";
import { Ticket } from "@/data/mockData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface MyTicketsPageProps {
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
  onNavigate: (page: string, data?: unknown) => void;
}

function statusBadge(status: string) {
  if (status === "valid") return <Badge variant="green">Còn hiệu lực</Badge>;
  if (status === "used") return <Badge variant="gray">Đã sử dụng</Badge>;
  return <Badge variant="red">Đã hủy</Badge>;
}

export default function MyTicketsPage({
  onShowToast,
  onNavigate,
}: MyTicketsPageProps) {
  const [filter, setFilter] = useState<"all" | "valid" | "used" | "cancelled">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [ticketList, setTicketList] = useState(tickets);

  const filtered = ticketList.filter(
    (t) => filter === "all" || t.status === filter
  );

  const handleCancel = (id: string) => {
    setTicketList((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "cancelled" as const } : t
      )
    );
    setCancelId(null);
    onShowToast("Vé đã được hủy thành công.", "info");
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Vé Của Tôi</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">
              {ticketList.length} vé tổng cộng
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "valid", label: "Còn hiệu lực" },
              { key: "used", label: "Đã sử dụng" },
              { key: "cancelled", label: "Đã hủy" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key
                  ? "bg-[#E63946] text-white"
                  : "bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]"
              }`}
              style={{
                border: `1px solid ${filter === f.key ? "#E63946" : "#404040"}`,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="space-y-4">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden hover:border-[#525252] transition-colors"
            >
              <div
                className="flex gap-4 p-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === ticket.id ? null : ticket.id)
                }
              >
                <img
                  src={ticket.moviePoster}
                  alt={ticket.movieTitle}
                  className="w-16 h-22 object-cover rounded-lg flex-shrink-0"
                  style={{ height: "88px" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-base line-clamp-1">
                      {ticket.movieTitle}
                    </h3>
                    {statusBadge(ticket.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-[#B3B3B3]">
                    <span>📅 {ticket.date}</span>
                    <span>🕐 {ticket.time}</span>
                    <span>🎭 {ticket.room}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1 flex-wrap">
                      {ticket.seats.map((s) => (
                        <Badge key={s} variant="gold" size="sm">
                          Ghế {s}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-[#FFB703] font-bold">
                      {ticket.totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
                <span className="text-[#B3B3B3] text-lg self-center">
                  {expandedId === ticket.id ? "▲" : "▼"}
                </span>
              </div>

              {expandedId === ticket.id && (
                <div className="border-t border-[#404040] p-4 bg-[#383838]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Mã vé</span>
                        <span className="text-white font-mono font-bold">
                          {ticket.qrCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Loại vé</span>
                        <span className="text-white">{ticket.ticketType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Ngày mua</span>
                        <span className="text-white">
                          {ticket.purchaseDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Khách hàng</span>
                        <span className="text-white">
                          {ticket.customerName}
                        </span>
                      </div>

                      {ticket.status === "valid" && (
                        <div className="pt-3 flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancelId(ticket.id)}
                          >
                            Hủy vé
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const found = movies.find(
                                (m) => m.title === ticket.movieTitle
                              );
                              onNavigate("movie-rating", {
                                movie: found || movies[0],
                              });
                            }}
                          >
                            Đánh giá phim
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* QR */}
                    <div className="flex flex-col items-center">
                      <p className="text-[#B3B3B3] text-xs mb-3">
                        Mã QR kiểm tra vé
                      </p>
                      <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center">
                        <div className="grid grid-cols-4 gap-0.5">
                          {Array.from({ length: 16 }, (_, i) => (
                            <div
                              key={i}
                              className="w-6 h-6"
                              style={{
                                background:
                                  (i * 7 + 3) % 3 === 0 ? "#000" : "#fff",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-white font-mono text-xs mt-2">
                        {ticket.qrCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎟️</p>
              <p className="text-[#B3B3B3]">Không có vé nào trong mục này.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      <Modal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        title="Xác Nhận Hủy Vé"
      >
        <div className="space-y-4">
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4">
            <p className="text-[#E63946] font-semibold text-sm mb-1">
              ⚠️ Lưu ý trước khi hủy
            </p>
            <ul className="text-[#B3B3B3] text-xs space-y-1">
              <li>• Chỉ được hủy vé trước suất chiếu ít nhất 2 giờ</li>
              <li>• Sau khi hủy, vé sẽ không thể khôi phục</li>
              <li>• Tiền hoàn lại (nếu có) sẽ được xử lý trong 3-5 ngày</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setCancelId(null)}
            >
              Giữ vé
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => cancelId && handleCancel(cancelId)}
            >
              Hủy vé
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
