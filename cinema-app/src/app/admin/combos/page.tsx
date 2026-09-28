'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export interface ComboItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  stock_quantity: number;
  status: 'ACTIVE' | 'INACTIVE';
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NewComboForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  status: 'ACTIVE' | 'INACTIVE';
  image: string;
}

const initialForm: NewComboForm = {
  name: '',
  description: '',
  price: '',
  stock: '50',
  status: 'ACTIVE',
  image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&h=300&fit=crop&auto=format',
};

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCombo, setEditingCombo] = useState<ComboItem | null>(null);

  // Form states
  const [form, setForm] = useState<NewComboForm>(initialForm);

  // Inline stock edit states
  const [stockEditId, setStockEditId] = useState<number | null>(null);
  const [stockInputValue, setStockInputValue] = useState<string>('');
  const [isSavingStock, setIsSavingStock] = useState<boolean>(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'>('ALL');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch danh sách combos từ GET /api/combos (Admin mode)
  const fetchCombos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/combos', {
        headers: {
          'x-user-role': 'ADMIN',
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không thể tải danh sách combo');
      }

      setCombos(data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải combo:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi tải danh sách combo', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingCombo(null);
    setForm(initialForm);
    setIsAddModalOpen(true);
  };

  // Mở modal chỉnh sửa combo
  const handleOpenEditModal = (combo: ComboItem) => {
    setEditingCombo(combo);
    setForm({
      name: combo.name,
      description: combo.description || '',
      price: String(combo.price),
      stock: String(combo.stock),
      status: combo.status,
      image: combo.image || initialForm.image,
    });
    setIsAddModalOpen(true);
  };

  // Submit Form Tạo hoặc Sửa combo
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast('Tên combo không được để trống', 'warning');
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Giá combo phải là số dương lớn hơn 0', 'warning');
      return;
    }
    const stockNum = Number(form.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast('Số lượng tồn kho không được là số âm', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: priceNum,
        stock_quantity: stockNum,
        status: form.status,
        image: form.image.trim() || null,
      };

      const url = editingCombo ? `/api/combos/${editingCombo.id}` : '/api/combos';
      const method = editingCombo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Thao tác thất bại');
      }

      showToast(
        editingCombo
          ? `Đã cập nhật combo '${payload.name}' thành công!`
          : `Đã thêm combo mới '${payload.name}'!`,
        'success'
      );

      setIsAddModalOpen(false);
      setEditingCombo(null);
      setForm(initialForm);
      await fetchCombos();
    } catch (err) {
      console.error('Lỗi khi lưu combo:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu combo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật nhanh số lượng tồn kho (Inline Edit)
  const handleSaveStock = async (comboId: number) => {
    const newStock = parseInt(stockInputValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      showToast('Tồn kho phải là số nguyên không âm', 'warning');
      return;
    }

    try {
      setIsSavingStock(true);
      const res = await fetch(`/api/combos/${comboId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          stock_quantity: newStock,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Cập nhật tồn kho thất bại');
      }

      showToast('Đã cập nhật số lượng tồn kho thành công!', 'success');
      setStockEditId(null);
      await fetchCombos();
    } catch (err) {
      console.error('Lỗi khi cập nhật tồn kho:', err);
      showToast(err instanceof Error ? err.message : 'Cập nhật tồn kho thất bại', 'error');
    } finally {
      setIsSavingStock(false);
    }
  };

  // Đổi trạng thái hiển thị (BẬT / TẮT kinh doanh)
  const handleToggleStatus = async (combo: ComboItem) => {
    const newStatus = combo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/combos/${combo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Cập nhật trạng thái thất bại');
      }

      showToast(
        newStatus === 'ACTIVE'
          ? `Đã kích hoạt kinh doanh combo '${combo.name}'`
          : `Đã tạm ngừng kinh doanh combo '${combo.name}'`,
        'info'
      );
      await fetchCombos();
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái combo:', err);
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại', 'error');
    }
  };

  // Xóa combo
  const handleDeleteCombo = async (combo: ComboItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa combo '${combo.name}'?`)) return;

    try {
      const res = await fetch(`/api/combos/${combo.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN',
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || 'Xóa combo thất bại');
      }

      showToast(`Đã xóa combo '${combo.name}' thành công!`, 'success');
      await fetchCombos();
    } catch (err) {
      console.error('Lỗi khi xóa combo:', err);
      showToast(err instanceof Error ? err.message : 'Xóa combo thất bại', 'error');
    }
  };

  // Lọc và tìm kiếm combo
  const filteredCombos = useMemo(() => {
    return combos.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return c.status === 'ACTIVE' && c.stock > 0;
      if (statusFilter === 'OUT_OF_STOCK') return c.stock === 0;
      if (statusFilter === 'INACTIVE') return c.status === 'INACTIVE';
      return true;
    });
  }, [combos, searchTerm, statusFilter]);

  const activeCount = useMemo(() => combos.filter(c => c.status === 'ACTIVE' && c.stock > 0).length, [combos]);

  return (
    <div className="flex-1 bg-[#1A1A1A] p-6 lg:p-8 overflow-y-auto min-h-screen text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Quản Lý Combo Bắp Nước
              </h1>
              <Badge variant="green" size="md">
                {activeCount} đang bán
              </Badge>
            </div>
            <p className="text-[#B3B3B3] text-sm mt-1">
              Quản lý danh sách thực đơn, điều chỉnh giá bán và kiểm soát số lượng tồn kho bắp nước
            </p>
          </div>
          <Button onClick={handleOpenAddModal} variant="primary" className="shadow-lg shadow-[#E63946]/20">
            <span className="text-base leading-none mr-1">+</span> Thêm combo mới
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="🔍 Tìm combo theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#E63946] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Tất cả ({combos.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#2ECC71] text-[#1A1A1A]'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Đang bán ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'OUT_OF_STOCK'
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Hết hàng ({combos.filter(c => c.stock === 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-[#525252] text-white'
                  : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
              }`}
            >
              Ngừng bán ({combos.filter(c => c.status === 'INACTIVE').length})
            </button>
          </div>
        </div>

        {/* Combo Cards Grid */}
        {isLoading ? (
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-16 text-center text-[#B3B3B3]">
            <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải thực đơn bắp nước...
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-16 text-center text-[#B3B3B3]">
            <span className="text-4xl block mb-2">🍿</span>
            <p className="text-base font-semibold text-white">Không tìm thấy combo nào</p>
            <p className="text-xs mt-1">Hãy bấm &ldquo;Thêm combo mới&rdquo; để tạo sản phẩm bắp nước vào hệ thống.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map(combo => {
              const isOutOfStock = combo.stock === 0;
              const isLowStock = combo.stock > 0 && combo.stock < 10;
              const isEditingThisStock = stockEditId === combo.id;

              return (
                <div
                  key={combo.id}
                  className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-[#666] transition-colors"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-44 w-full bg-[#1E1E1E]">
                      {combo.image ? (
                        <Image
                          src={combo.image}
                          alt={combo.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍿
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-[#E63946] font-black text-lg tracking-wider border-2 border-[#E63946] px-4 py-1.5 rounded-lg bg-black/60">
                            HẾT HÀNG
                          </span>
                        </div>
                      )}

                      {/* Status & Stock Badges */}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {combo.status === 'INACTIVE' ? (
                          <Badge variant="gray">Ngừng kinh doanh</Badge>
                        ) : isLowStock ? (
                          <Badge variant="gold">Sắp hết hàng</Badge>
                        ) : (
                          <Badge variant="green">Đang kinh doanh</Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-bold text-lg leading-snug line-clamp-1" title={combo.name}>
                          {combo.name}
                        </h3>
                        <span className="text-[#FFB703] font-black text-lg whitespace-nowrap">
                          {combo.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <p className="text-[#B3B3B3] text-xs line-clamp-2 min-h-[32px]">
                        {combo.description || 'Chưa có mô tả chi tiết cho combo này.'}
                      </p>

                      {/* Tồn kho & Quản lý tồn kho (Inline Edit) */}
                      <div className="bg-[#1E1E1E] border border-[#404040] rounded-lg p-3 flex items-center justify-between">
                        <span className="text-[#888888] text-xs font-medium">Tồn kho hiện tại:</span>

                        {isEditingThisStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={stockInputValue}
                              onChange={e => setStockInputValue(e.target.value)}
                              className="w-20 bg-[#2D2D2D] border border-[#E63946] rounded px-2 py-1 text-sm font-bold text-white text-center focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStock(combo.id)}
                              disabled={isSavingStock}
                              className="bg-[#2ECC71] hover:bg-[#27ae60] text-black text-xs font-bold px-2 py-1 rounded transition-colors"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setStockEditId(null)}
                              className="text-[#888] hover:text-white text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black text-base ${
                                isOutOfStock
                                  ? 'text-[#E63946]'
                                  : isLowStock
                                  ? 'text-[#FFB703]'
                                  : 'text-[#2ECC71]'
                              }`}
                            >
                              {combo.stock} phần
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setStockEditId(combo.id);
                                setStockInputValue(String(combo.stock));
                              }}
                              className="text-[#0088FF] hover:underline text-xs font-semibold"
                            >
                              ✏️ Chỉnh
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-[#383838]">
                    <Button
                      variant={combo.status === 'ACTIVE' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(combo)}
                      className="flex-1 text-xs"
                    >
                      {combo.status === 'ACTIVE' ? 'Tạm ẩn' : 'Bật bán'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(combo)}
                      className="text-xs hover:bg-[#383838]"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteCombo(combo)}
                      className="text-xs"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Combo */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={editingCombo ? `Chỉnh Sửa Combo: ${editingCombo.name}` : 'Thêm Combo Bắp Nước Mới'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
              Tên Combo <span className="text-[#E63946]">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Combo Solo, Combo Đôi Bắp Nước, Combo VIP"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={100}
              className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white placeholder-[#666] focus:outline-none focus:border-[#E63946]"
              required
            />
          </div>

          <div>
            <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
              Mô Tả Combo
            </label>
            <textarea
              rows={2}
              placeholder="VD: 1 Bắp rang bơ lớn + 2 nước ngọt lớn (Pepsi/7UP)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#E63946]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Giá Bán (đ) <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 129000"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                min={1000}
                step={1000}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Số Lượng Tồn Kho <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 50"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                min={0}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Trạng Thái Kinh Doanh
              </label>
              <select
                value={form.status}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  }))
                }
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
              >
                <option value="ACTIVE">Kinh doanh (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-xs font-semibold uppercase mb-1.5">
                Link Ảnh Combo (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E63946]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#404040]">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : editingCombo ? 'Cập nhật combo' : 'Thêm combo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
