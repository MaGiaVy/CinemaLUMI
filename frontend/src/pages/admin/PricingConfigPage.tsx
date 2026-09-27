import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface PricingConfigPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const INITIAL_PRICING = [
  { id: 'normal', label: 'Vé Thường', percentage: 100, basePrice: 120000, description: 'Áp dụng cho khán giả từ 13 tuổi trở lên' },
  { id: 'child', label: 'Vé Trẻ em', percentage: 50, basePrice: 60000, description: 'Áp dụng cho trẻ em dưới 13 tuổi' },
  { id: 'vip', label: 'Vé Ghế đôi', percentage: 180, basePrice: 216000, description: 'Ghế đôi (Couple seat) — Cuối phòng' },
  { id: 'premiere', label: 'Suất Chiếu Ra Mắt', percentage: 150, basePrice: 180000, description: 'Suất chiếu đặc biệt, thảm đỏ' },
];

export default function PricingConfigPage({ onShowToast }: PricingConfigPageProps) {
  const [pricing, setPricing] = useState(INITIAL_PRICING);
  const [baseRef, setBaseRef] = useState(120000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState('');

  const startEdit = (id: string, pct: number) => {
    setEditingId(id);
    setEditPct(String(pct));
  };

  const saveEdit = (id: string) => {
    const newPct = Number(editPct);
    if (newPct < 10 || newPct > 500) { onShowToast('Phần trăm phải từ 10% đến 500%', 'error'); return; }
    setPricing(prev => prev.map(p => p.id === id ? { ...p, percentage: newPct, basePrice: Math.round(baseRef * newPct / 100) } : p));
    setEditingId(null);
    onShowToast('Đã lưu cấu hình giá!', 'success');
  };

  const handleBaseChange = (v: string) => {
    const base = Number(v);
    setBaseRef(base);
    setPricing(prev => prev.map(p => ({ ...p, basePrice: Math.round(base * p.percentage / 100) })));
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Cấu Hình Giá Vé</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Thiết lập tỷ lệ giá theo từng loại vé</p>
        </div>

        {/* Base price config */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold mb-3">Giá Vé Cơ Bản (Tham Chiếu)</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={baseRef}
                onChange={e => handleBaseChange(e.target.value)}
                step="10000"
              />
            </div>
            <span className="text-[#B3B3B3] text-sm">đồng / vé Thường</span>
          </div>
          <p className="text-[#525252] text-xs mt-2">
            ℹ️ Thay đổi giá cơ bản sẽ tự động cập nhật tất cả các loại vé theo tỷ lệ phần trăm.
          </p>
        </div>

        {/* Pricing table */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[#404040]">
            <h3 className="text-white font-bold">Bảng Giá Vé</h3>
            <p className="text-[#B3B3B3] text-xs mt-0.5">Áp dụng cho các suất chiếu mới. Suất chiếu hiện tại không bị ảnh hưởng.</p>
          </div>

          <div className="divide-y divide-[#404040]">
            {pricing.map(p => (
              <div key={p.id} className="px-5 py-4 hover:bg-[#383838] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{p.label}</p>
                    <p className="text-[#B3B3B3] text-xs">{p.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editPct}
                          onChange={e => setEditPct(e.target.value)}
                          className="w-20 text-center"
                          min="10"
                          max="500"
                        />
                        <span className="text-[#B3B3B3]">%</span>
                        <Button size="sm" onClick={() => saveEdit(p.id)}>Lưu</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[#FFB703] font-bold text-lg">{p.percentage}%</span>
                          <p className="text-white font-semibold text-sm">{p.basePrice.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(p.id, p.percentage)}>
                          ✏️ Sửa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekend surcharge */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">Phụ Thu Thêm</h3>
          <div className="space-y-3">
            {[
              { label: 'Phụ thu cuối tuần (T7, CN)', value: '+20.000đ', active: true },
              { label: 'Phụ thu suất chiếu tối (sau 20:00)', value: '+15.000đ', active: true },
              { label: 'Phụ thu ngày lễ', value: '+30.000đ', active: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-[#383838] rounded-xl">
                <span className="text-[#B3B3B3] text-sm">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#FFB703] font-semibold text-sm">{item.value}</span>
                  <Badge variant={item.active ? 'green' : 'gray'}>{item.active ? 'Bật' : 'Tắt'}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => onShowToast('Đã lưu cấu hình phụ thu!', 'success')}>
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
