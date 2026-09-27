'use client';

import { useState } from 'react';
import { Combo } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ComboManagementClientProps {
  initialCombos: Combo[];
}

export default function ComboManagementClient({ initialCombos }: ComboManagementClientProps) {
  const [comboList, setComboList] = useState(initialCombos);
  const [addModal, setAddModal] = useState(false);
  const [stockEdit, setStockEdit] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
  });

  const handleAdd = () => {
    const newC: Combo = {
      id: `c${Date.now()}`,
      name: form.name,
      description: form.description,
      items: [form.description],
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || Number(form.price),
      stock: Number(form.stock) || 50,
      image:
        'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=300&h=200&fit=crop&auto=format',
    };
    setComboList(prev => [...prev, newC]);
    setAddModal(false);
    showToast('Đã thêm combo mới!');
  };

  const saveStock = (id: string) => {
    setComboList(prev => prev.map(c => (c.id === id ? { ...c, stock: Number(stockValue) } : c)));
    setStockEdit(null);
    showToast('Đã cập nhật tồn kho!');
  };

  const handleDelete = (id: string) => {
    setComboList(prev => prev.filter(c => c.id !== id));
    showToast('Đã xóa combo.');
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
            <h1 className="text-2xl font-black text-white">Quản Lý Combo Bắp Nước</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">{comboList.length} combo trong hệ thống</p>
          </div>
          <Button onClick={() => setAddModal(true)}>+ Thêm combo</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {comboList.map(combo => (
            <div key={combo.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden flex flex-col justify-between">
              <div className="p-4 flex gap-4">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base truncate">{combo.name}</h3>
                    {combo.badge && <Badge variant="gold">{combo.badge}</Badge>}
                  </div>
                  <p className="text-[#B3B3B3] text-xs mt-1 line-clamp-2">{combo.description}</p>
                  <p className="text-[#FFB703] font-bold text-base mt-2">{combo.price.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>

              <div className="px-4 py-3 bg-[#383838]/60 border-t border-[#404040] flex justify-between items-center text-xs">
                {stockEdit === combo.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[#B3B3B3]">Kho:</span>
                    <input
                      type="number"
                      value={stockValue}
                      onChange={e => setStockValue(e.target.value)}
                      className="w-16 bg-[#1A1A1A] border border-[#404040] rounded px-2 py-0.5 text-white"
                    />
                    <button onClick={() => saveStock(combo.id)} className="text-[#2ECC71] font-bold">Lưu</button>
                    <button onClick={() => setStockEdit(null)} className="text-[#B3B3B3]">Hủy</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#B3B3B3]">Tồn kho:</span>
                    <span className={`font-bold ${combo.stock > 10 ? 'text-white' : 'text-[#E63946]'}`}>
                      {combo.stock} phần
                    </span>
                    <button
                      onClick={() => {
                        setStockEdit(combo.id);
                        setStockValue(String(combo.stock));
                      }}
                      className="text-[#0088FF] ml-1 hover:underline"
                    >
                      Sửa
                    </button>
                  </div>
                )}

                <Button variant="danger" size="sm" onClick={() => handleDelete(combo.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal add */}
        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Thêm combo mới">
          <div className="space-y-4">
            <div>
              <label className="block text-[#B3B3B3] text-sm mb-1">Tên combo *</label>
              <input
                type="text"
                placeholder="VD: Combo Cặp Đôi"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm mb-1">Mô tả món ăn *</label>
              <input
                type="text"
                placeholder="1 Bắp lớn + 2 Nước ngọt 32oz"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  placeholder="95000"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Số lượng kho</label>
                <input
                  type="number"
                  placeholder="50"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setAddModal(false)}>Hủy</Button>
              <Button onClick={handleAdd}>Thêm combo</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
