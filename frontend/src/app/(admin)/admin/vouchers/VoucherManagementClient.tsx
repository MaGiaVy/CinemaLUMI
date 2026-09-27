'use client';

import { useState } from 'react';
import { Voucher } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface VoucherManagementClientProps {
  initialVouchers: Voucher[];
}

export default function VoucherManagementClient({ initialVouchers }: VoucherManagementClientProps) {
  const [voucherList, setVoucherList] = useState(initialVouchers);
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    minPurchase: '',
    maxUsage: '',
    expiry: '2026-12-31',
  });

  const handleAdd = () => {
    const newV: Voucher = {
      id: `v${Date.now()}`,
      code: form.code.toUpperCase(),
      discountType: form.discountType as 'percent' | 'fixed',
      discountValue: Number(form.discountValue),
      minPurchase: Number(form.minPurchase) || 0,
      maxUsage: Number(form.maxUsage) || 100,
      usedCount: 0,
      expiry: form.expiry,
      status: 'active',
      applicableMovies: [],
    };
    setVoucherList(prev => [newV, ...prev]);
    setAddModal(false);
    showToast(`Đã tạo voucher ${newV.code}!`);
  };

  const handleExpire = (id: string) => {
    setVoucherList(prev => prev.map(v => (v.id === id ? { ...v, status: 'expired' as const } : v)));
    showToast('Voucher đã chuyển sang hết hạn.');
  };

  const handleDelete = (id: string) => {
    setVoucherList(prev => prev.filter(v => v.id !== id));
    showToast('Đã xóa voucher.');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {toast && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-[#2ECC71] rounded-lg text-white font-medium shadow-xl">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Voucher Khuyến Mãi</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">
              {voucherList.filter(v => v.status === 'active').length} voucher đang hoạt động
            </p>
          </div>
          <Button onClick={() => setAddModal(true)}>+ Tạo voucher</Button>
        </div>

        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Mã</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Giảm giá</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Lượt dùng</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Hết hạn</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Trạng thái</th>
                <th className="text-right px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {voucherList.map(v => (
                <tr key={v.id} className="hover:bg-[#383838] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono font-bold text-white bg-[#1A1A1A] px-2.5 py-1 rounded border border-[#404040]">
                      {v.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#2ECC71] font-bold">
                    {v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="px-4 py-3 text-[#B3B3B3] text-sm">
                    {v.usedCount} / {v.maxUsage}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{v.expiry}</td>
                  <td className="px-4 py-3">
                    <Badge variant={v.status === 'active' ? 'green' : 'gray'}>
                      {v.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {v.status === 'active' && (
                        <Button variant="ghost" size="sm" onClick={() => handleExpire(v.id)}>
                          Ngưng
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(v.id)}>
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal add */}
        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Tạo mã voucher mới">
          <div className="space-y-4">
            <div>
              <label className="block text-[#B3B3B3] text-sm mb-1">Mã voucher (In hoa) *</label>
              <input
                type="text"
                placeholder="VD: LUMI50"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Loại giảm giá</label>
                <select
                  value={form.discountType}
                  onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Giá trị giảm *</label>
                <input
                  type="number"
                  placeholder="20"
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Lượt dùng tối đa</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.maxUsage}
                  onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Hạn sử dụng</label>
                <input
                  type="date"
                  value={form.expiry}
                  onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setAddModal(false)}>Hủy</Button>
              <Button onClick={handleAdd}>Tạo voucher</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
