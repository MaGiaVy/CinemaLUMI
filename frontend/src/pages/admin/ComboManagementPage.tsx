import { useState } from 'react';
import { combos } from '@/data/mockData';
import { Combo } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ComboManagementPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ComboManagementPage({ onShowToast }: ComboManagementPageProps) {
  const [comboList, setComboList] = useState(combos);
  const [addModal, setAddModal] = useState(false);
  const [stockEdit, setStockEdit] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', originalPrice: '', stock: '' });

  const handleAdd = () => {
    const newC: Combo = {
      id: `c${Date.now()}`,
      name: form.name,
      description: form.description,
      items: [form.description],
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      stock: Number(form.stock),
      image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=300&h=200&fit=crop&auto=format',
    };
    setComboList(prev => [...prev, newC]);
    setAddModal(false);
    onShowToast('Đã thêm combo mới!', 'success');
  };

  const saveStock = (id: string) => {
    setComboList(prev => prev.map(c => c.id === id ? { ...c, stock: Number(stockValue) } : c));
    setStockEdit(null);
    onShowToast('Đã cập nhật tồn kho!', 'success');
  };

  const handleDelete = (id: string) => {
    setComboList(prev => prev.filter(c => c.id !== id));
    onShowToast('Đã xóa combo.', 'info');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Combo</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">{comboList.length} combo trong hệ thống</p>
          </div>
          <Button onClick={() => setAddModal(true)}>+ Thêm combo</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {comboList.map(combo => (
            <div key={combo.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
              <div className="relative">
                <img src={combo.image} alt={combo.name} className="w-full h-40 object-cover" />
                {combo.badge && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="red" size="md">{combo.badge}</Badge>
                  </div>
                )}
                {combo.stock === 0 && (
                  <div className="absolute inset-0 bg-[#1A1A1A]/80 flex items-center justify-center">
                    <span className="text-[#E63946] font-bold text-lg">HẾT HÀNG</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold">{combo.name}</h3>
                  <div className="text-right">
                    <p className="text-[#FFB703] font-bold">{combo.price.toLocaleString('vi-VN')}đ</p>
                    <p className="text-[#525252] text-xs line-through">{combo.originalPrice.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
                <p className="text-[#B3B3B3] text-xs mb-3">{combo.description}</p>

                {/* Stock */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[#B3B3B3] text-sm">Tồn kho:</span>
                  {stockEdit === combo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={stockValue}
                        onChange={e => setStockValue(e.target.value)}
                        className="w-20"
                        min="0"
                      />
                      <Button size="sm" onClick={() => saveStock(combo.id)}>Lưu</Button>
                      <Button variant="ghost" size="sm" onClick={() => setStockEdit(null)}>✕</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${combo.stock < 10 ? 'text-[#E63946]' : combo.stock < 20 ? 'text-[#FFB703]' : 'text-[#2ECC71]'}`}>
                        {combo.stock}
                      </span>
                      {combo.stock < 10 && <Badge variant="red" size="sm">Sắp hết</Badge>}
                      <button
                        onClick={() => { setStockEdit(combo.id); setStockValue(String(combo.stock)); }}
                        className="text-[#0088FF] text-xs hover:underline"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        ✏️ Sửa
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    {combo.stock === 0 ? '🔇 Đã ẩn' : '👁️ Đang hiện'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(combo.id)}>Xóa</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Thêm Combo Mới">
        <div className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Tên combo</label>
            <input type="text" placeholder="Combo Lumi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Mô tả</label>
            <input type="text" placeholder="Bắp rang bơ lớn + nước ngọt lớn" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Giá bán (đ)</label>
              <input type="number" placeholder="129000" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Giá gốc (đ)</label>
              <input type="number" placeholder="160000" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Tồn kho</label>
              <input type="number" placeholder="50" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddModal(false)}>Hủy</Button>
            <Button fullWidth disabled={!form.name || !form.price || !form.stock} onClick={handleAdd}>Thêm combo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
