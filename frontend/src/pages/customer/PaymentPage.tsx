import { useState } from "react";
import { Movie, Screening } from "@/data/mockData";
import Button from "@/components/ui/Button";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Badge from "@/components/ui/Badge";

interface PaymentPageProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  total: number;
  onNavigate: (page: string, data?: unknown) => void;
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const STEPS = ["Chọn ghế", "Loại vé", "Combo & Thanh toán", "Xác nhận"];
const METHODS = [
  {
    id: "vnpay",
    label: "VNPay",
    icon: "💳",
    description: "Thanh toán qua ví VNPay",
  },
  { id: "momo", label: "Momo", icon: "📱", description: "Ví điện tử Momo" },
  {
    id: "banking",
    label: "Chuyển khoản",
    icon: "🏦",
    description: "Chuyển khoản ngân hàng",
  },
];

export default function PaymentPage({
  movie,
  screening,
  selectedSeats,
  total,
  onNavigate,
  onShowToast,
}: PaymentPageProps) {
  const [method, setMethod] = useState("vnpay");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const orderRef = `LMC-${Date.now().toString().slice(-8)}`;

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
      onShowToast(
        "Thanh toán thành công! Vé đã được gửi qua email.",
        "success"
      );
    }, 1500);
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#2ECC71]/20 border-2 border-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-[#2ECC71] text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Thanh Toán Thành Công!
          </h1>
          <p className="text-[#B3B3B3] mb-6">
            Vé đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
          </p>

          {/* QR code mock */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 mb-6">
            <div className="w-40 h-40 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }, (_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5"
                    style={{
                      background: Math.random() > 0.5 ? "#000" : "#fff",
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[#B3B3B3] text-sm mb-2">Mã đặt chỗ</p>
            <p className="text-white font-mono font-bold text-lg">{orderRef}</p>
          </div>

          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Phim</span>
              <span className="text-white font-medium">{movie.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Ngày chiếu</span>
              <span className="text-white">
                {screening.date} {screening.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Phòng</span>
              <span className="text-white">{screening.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Ghế</span>
              <span className="text-white">{selectedSeats.join(", ")}</span>
            </div>
            <div className="flex justify-between border-t border-[#404040] pt-2">
              <span className="text-white font-bold">Đã thanh toán</span>
              <span className="text-[#2ECC71] font-bold">
                {total.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onNavigate("my-tickets")}
            >
              Xem vé của tôi
            </Button>
            <Button
              fullWidth
              onClick={() => onNavigate("movie-rating", { movie })}
            >
              Đánh giá phim
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  i === 3
                    ? "step-active"
                    : i < 3
                    ? "step-done"
                    : "step-inactive"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  {i < 3 ? "✓" : i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-[#404040]">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment methods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Thanh Toán</h2>
              <CountdownTimer initialSeconds={600} label="Thời gian giữ" />
            </div>

            {/* QR mock */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 text-center mb-6">
              <p className="text-[#B3B3B3] text-sm mb-4">
                Quét mã QR để thanh toán
              </p>
              <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6"
                      style={{
                        background: Math.random() > 0.5 ? "#000" : "#fff",
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[#B3B3B3] text-xs mt-3">
                Mã đơn: <span className="text-white font-mono">{orderRef}</span>
              </p>
            </div>

            <h3 className="text-white font-semibold mb-3">
              Phương Thức Thanh Toán
            </h3>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    method === m.id
                      ? "border-[#E63946] bg-[#E63946]/10"
                      : "border-[#404040] bg-[#2D2D2D] hover:border-[#525252]"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      method === m.id ? "border-[#E63946]" : "border-[#404040]"
                    }`}
                  >
                    {method === m.id && (
                      <div className="w-2 h-2 bg-[#E63946] rounded-full" />
                    )}
                  </div>
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {m.label}
                    </p>
                    <p className="text-[#B3B3B3] text-xs">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <h3 className="text-white font-bold text-base mb-4">
              Chi Tiết Đơn Hàng
            </h3>
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
              <div className="flex gap-4 mb-4 border-b border-[#404040] pb-4">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div>
                  <h4 className="text-white font-bold">{movie.title}</h4>
                  <p className="text-[#B3B3B3] text-xs mt-1">
                    {screening.date} • {screening.time}
                  </p>
                  <p className="text-[#B3B3B3] text-xs">{screening.room}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {selectedSeats.map((s) => (
                      <Badge key={s} variant="gold" size="sm">
                        Ghế {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#B3B3B3]">Phương thức</span>
                  <span className="text-white">
                    {METHODS.find((m) => m.id === method)?.label}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#404040] pt-4 mt-4">
                <div className="flex justify-between mb-4">
                  <span className="text-white font-bold text-base">
                    Tổng thanh toán
                  </span>
                  <span className="text-[#FFB703] font-black text-2xl">
                    {total.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "✓ Xác nhận thanh toán"}
                </Button>
                <p className="text-[#525252] text-xs text-center mt-3">
                  Bằng cách thanh toán, bạn đồng ý với Điều khoản và Chính sách
                  của Lumi Cinema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
