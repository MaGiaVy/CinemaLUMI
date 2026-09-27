'use client';

import { useState } from 'react';
import { PricingItem } from '@/lib/api';
import Button from '@/components/ui/Button';

interface PricingConfigClientProps {
  initialPricing: PricingItem[];
}

export default function PricingConfigClient({ initialPricing }: PricingConfigClientProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [baseRef, setBaseRef] = useState(120000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (id: string, pct: number) => {
    setEditingId(id);
    setEditPct(String(pct));
  };

  const saveEdit = (id: string) => {
    const newPct = Number(editPct);
    if (newPct < 10 || newPct > 500) {
      showToast('Phần trăm phải từ 10% đến 500%');
      return;
    }
    setPricing(prev =>
      prev.map(p =>
        p.id === id ? { ...p, percentage: newPct, basePrice: Math.round((baseRef * newPct) / 100) } : p
      )
    );
    setEditingId(null);
    showToast('Đã lưu cấu hình giá!');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {toast && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-[#2ECC71] rounded-lg text-white font-medium shadow-xl">
            {toast}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Cấu Hình Giá Vé</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Thiết lập tỷ lệ giá theo từng loại vé</p>
        </div>

        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold mb-3">Giá Vé Cơ Bản (Tham Chiếu)</h3>
          <input
            type="number"
            value={baseRef}
            onChange={e => {
              const base = Number(e.target.value);
              setBaseRef(base);
              setPricing(prev => prev.map(p => ({ ...p, basePrice: Math.round((base * p.percentage) / 100) })));
            }}
            step="10000"
            className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white"
          />
        </div>

        <div className="space-y-4">
          {pricing.map(item => (
            <div key={item.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 flex justify-between items-center">
              <div>
                <h4 className="text-white font-bold">{item.label}</h4>
                <p className="text-[#B3B3B3] text-xs mt-1">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#FFB703] font-bold">{item.percentage}%</span>
                  <span className="text-[#525252]">•</span>
                  <span className="text-[#2ECC71] font-bold">{item.basePrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editPct}
                    onChange={e => setEditPct(e.target.value)}
                    className="w-20 bg-[#1A1A1A] border border-[#404040] rounded px-2 py-1 text-white text-sm"
                  />
                  <Button size="sm" onClick={() => saveEdit(item.id)}>Lưu</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Hủy</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => startEdit(item.id, item.percentage)}>
                  Chỉnh sửa
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
