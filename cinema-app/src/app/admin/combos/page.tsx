'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
  image: '/combos/combo-solo.jpg',
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
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              QUẢN LÝ COMBO BẮP NƯỚC
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#86efac]/15 border border-[#86efac]/30 text-[#86efac] uppercase tracking-wider">
              {activeCount} đang kinh doanh
            </span>
          </div>
          <p className="text-[#94a3b8] text-xs mt-1">
            Quản lý danh sách thực đơn, điều chỉnh giá bán và kiểm soát số lượng tồn kho bắp nước
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider"
        >
          + THÊM COMBO MỚI
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#c084fc]/20 bg-[#0a0812]/80 backdrop-blur-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm combo theo tên hoặc mô tả..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0812]/90 border border-[#c084fc]/20 rounded-xl px-3.5 py-2 text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#e11d48] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Tất cả ({combos.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#86efac]/20 border border-[#86efac]/40 text-[#86efac]'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Đang bán ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-[#e11d48]/20 border border-[#e11d48]/40 text-[#fda4af]'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Hết hàng ({combos.filter(c => c.stock === 0).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
            }`}
          >
            Ngừng bán ({combos.filter(c => c.status === 'INACTIVE').length})
          </button>
        </div>
      </div>

      {/* Combo Cards Grid */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#c084fc]/20 bg-[#0a0812]/80 backdrop-blur-2xl p-16 text-center text-[#94a3b8] text-xs">
          Đang tải thực đơn bắp nước...
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="rounded-2xl border border-[#c084fc]/20 bg-[#0a0812]/80 backdrop-blur-2xl p-16 text-center text-[#94a3b8]">
          <p className="text-sm font-bold text-white">Không tìm thấy combo nào</p>
          <p className="text-xs mt-1">Hãy bấm &ldquo;+ THÊM COMBO MỚI&rdquo; để tạo sản phẩm bắp nước vào hệ thống.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCombos.map(combo => {
            const isOutOfStock = combo.stock === 0;
            const isLowStock = combo.stock > 0 && combo.stock < 10;
            const isEditingThisStock = stockEditId === combo.id;

            return (
              <div
                key={combo.id}
                className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-[#c084fc]/50 transition-all group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-44 w-full bg-[#151022]">
                    {combo.image ? (
                      <Image
                        src={combo.image}
                        alt={combo.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#94a3b8]">
                        NO IMAGE
                      </div>
                    )}

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-[#fda4af] font-black text-sm tracking-wider border border-[#e11d48] px-4 py-1.5 rounded-lg bg-black/70 shadow-[0_0_15px_rgba(225,29,72,0.5)]">
                          HẾT HÀNG
                        </span>
                      </div>
                    )}

                    {/* Status & Stock Badges */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      {combo.status === 'INACTIVE' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 border border-white/20 text-[#94a3b8]">
                          Ngừng kinh doanh
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#881337]/80 border border-[#fda4af]/40 text-[#fda4af]">
                          Sắp hết hàng
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0a0812]/80 border border-[#86efac]/40 text-[#86efac]">
                          Đang kinh doanh
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-1" title={combo.name}>
                        {combo.name}
                      </h3>
                      <span className="text-[#fda4af] font-black text-base whitespace-nowrap">
                        {combo.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <p className="text-[#94a3b8] text-xs line-clamp-2 min-h-[32px]">
                      {combo.description || 'Chưa có mô tả chi tiết cho combo này.'}
                    </p>

                    {/* Tồn kho & Quản lý tồn kho (Inline Edit) */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8] font-medium">Tồn kho hiện tại:</span>

                      {isEditingThisStock ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={stockInputValue}
                            onChange={e => setStockInputValue(e.target.value)}
                            className="w-20 bg-[#0a0812] border border-[#e11d48] rounded px-2 py-1 text-xs font-bold text-white text-center focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveStock(combo.id)}
                            disabled={isSavingStock}
                            className="bg-[#86efac] text-black text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setStockEditId(null)}
                            className="text-[#94a3b8] hover:text-white text-xs px-1 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              isOutOfStock
                                ? 'text-[#f43f5e]'
                                : isLowStock
                                ? 'text-[#fda4af]'
                                : 'text-[#86efac]'
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
                            className="text-[#c084fc] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(combo)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      combo.status === 'ACTIVE'
                        ? 'bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white border border-white/[0.08]'
                        : 'bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white'
                    }`}
                  >
                    {combo.status === 'ACTIVE' ? 'Tạm ẩn' : 'Bật bán'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(combo)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCombo(combo)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-[#e11d48]/15 hover:bg-[#e11d48]/30 text-[#fda4af] border border-[#e11d48]/30 transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa Combo */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={editingCombo ? `CHỈNH SỬA COMBO: ${editingCombo.name}` : 'THÊM COMBO BẮP NƯỚC MỚI'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
              Tên Combo <span className="text-[#e11d48]">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Combo Solo, Combo Đôi Bắp Nước, Combo VIP"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={100}
              className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e11d48]"
              required
            />
          </div>

          <div>
            <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
              Mô Tả Combo
            </label>
            <textarea
              rows={2}
              placeholder="VD: 1 Bắp rang bơ lớn + 2 nước ngọt lớn (Pepsi/7UP)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e11d48]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Giá Bán (VNĐ) <span className="text-[#e11d48]">*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 129000"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                min={1000}
                step={1000}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                required
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Số Lượng Tồn Kho <span className="text-[#e11d48]">*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 50"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                min={0}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                required
              />
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
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
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e11d48]"
              >
                <option value="ACTIVE">Kinh doanh (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#c084fc] text-xs font-bold uppercase tracking-wider mb-1.5">
                Link Ảnh Combo (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                className="w-full bg-[#0a0812]/90 border border-[#c084fc]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e11d48]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : editingCombo ? 'Cập nhật combo' : 'Thêm combo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
