import { useState } from 'react';
import { vouchers } from '@/data/mockData';
import { Voucher } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface VoucherManagementPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function VoucherManagementPage({ onShowToast }: VoucherManagementPageProps) {
  const [voucherList, setVoucherList] = useState(vouchers);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percent', discountValue: '', minPurchase: '', maxUsage: '', expiry: ''
  });

  const handleAdd = () => {
    const newV: Voucher = {
      id: `v${Date.now()}`,
      code: form.code.toUpperCase(),
      discountType: form.discountType as 'percent' | 'fixed',
      discountValue: Number(form.discountValue),
      minPurchase: Number(form.minPurchase),
      maxUsage: Number(form.maxUsage),
      usedCount: 0,
      expiry: form.expiry,
      status: 'active',
      applicableMovies: [],
    };
    setVoucherList(prev => [newV, ...prev]);
    setAddModal(false);
    onShowToast(`Đã tạo voucher ${newV.code}!`, 'success');
  };

  const handleExpire = (id: string) => {
    setVoucherList(prev => prev.map(v => v.id === id ? { ...v, status: 'expired' as const } : v));
    onShowToast('Voucher đã bị hết hạn.', 'info');
  };

  const handleDelete = (id: string) => {
    setVoucherList(prev => prev.filter(v => v.id !== id));
    onShowToast('Đã xóa voucher.', 'info');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Voucher</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">{voucherList.filter(v => v.status === 'active').length} voucher đang hoạt động</p>
          </div>
          <Button onClick={() => setAddModal(true)}>+ Tạo voucher</Button>
        </div>

        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Mã voucher</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Giảm giá</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase hidden md:table-cell">Lượt dùng</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase hidden lg:table-cell">Hết hạn</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Trạng thái</th>
                <th className="text-right px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {voucherList.map(v => (
                <tr key={v.id} className="hover:bg-[#383838] transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-white font-mono font-bold tracking-wide">{v.code}</span>
                    {v.minPurchase > 0 && (
                      <p className="text-[#525252] text-xs">Tối thiểu {v.minPurchase.toLocaleString('vi-VN')}đ</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#FFB703] font-bold">
                      {v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')}đ`}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-sm">
                      <span className="text-white">{v.usedCount}</span>
                      <span className="text-[#B3B3B3]">/{v.maxUsage}</span>
                    </div>
                    <div className="w-24 bg-[#383838] rounded-full h-1 mt-1">
                      <div
                        className="h-1 rounded-full bg-[#E63946]"
                        style={{ width: `${(v.usedCount / v.maxUsage) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#B3B3B3] text-sm hidden lg:table-cell">{v.expiry}</td>
                  <td className="px-4 py-3">
                    <Badge variant={v.status === 'active' ? 'green' : 'gray'}>
                      {v.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {v.status === 'active' && (
                        <Button variant="ghost" size="sm" onClick={() => handleExpire(v.id)}>Hết hạn</Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(v.id)}>Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Tạo Voucher Mới">
        <div className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Mã voucher</label>
            <input
              type="text"
              placeholder="VD: LUMI20"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Loại giảm giá</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
                Giá trị {form.discountType === 'percent' ? '(%)' : '(đ)'}
              </label>
              <input
                type="number"
                placeholder={form.discountType === 'percent' ? '20' : '50000'}
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Đơn hàng tối thiểu (đ)</label>
              <input type="number" placeholder="100000" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Số lượt dùng tối đa</label>
              <input type="number" placeholder="500" value={form.maxUsage} onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Ngày hết hạn</label>
              <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddModal(false)}>Hủy</Button>
            <Button fullWidth disabled={!form.code || !form.discountValue || !form.expiry} onClick={handleAdd}>Tạo voucher</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
