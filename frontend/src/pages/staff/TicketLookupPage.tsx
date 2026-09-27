import { useState } from 'react';
import { transactions, tickets } from '@/data/mockData';
import { Transaction } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface TicketLookupPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const REASONS = [
  'Mất điện',
  'Lỗi kỹ thuật máy chiếu',
  'Hủy suất chiếu',
  'Khác',
];

export default function TicketLookupPage({ onShowToast }: TicketLookupPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Transaction[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  const handleSearch = () => {
    setSearched(true);
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(transactions.filter(t =>
      t.customerEmail.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      t.ticketId.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
    ));
  };

  const handleCancel = () => {
    setCancelModal(false);
    setVoucherModal(true);
  };

  const handleIssueVoucher = () => {
    setVoucherModal(false);
    onShowToast('Vé đã hủy và voucher 50% đã gửi cho khách hàng!', 'success');
    setSelectedTx(null);
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Tra Cứu Vé</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Tìm kiếm theo email, số điện thoại hoặc mã vé</p>
        </div>

        {/* Search */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nhập email / SĐT / mã vé..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>🔍 Tìm kiếm</Button>
          </div>
          <div className="flex gap-2 mt-3">
            {['0901234567', 'an.nguyen@email.com', 'LMC-2026-T001'].map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-xs text-[#0088FF] hover:underline bg-[#0088FF]/10 px-2 py-1 rounded"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
            <span className="text-[#525252] text-xs self-center">← Thử các mẫu</span>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12 bg-[#2D2D2D] border border-[#404040] rounded-xl">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white font-semibold">Không tìm thấy kết quả</p>
                <p className="text-[#B3B3B3] text-sm mt-1">Thử tìm kiếm với thông tin khác</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#B3B3B3] text-sm">Tìm thấy {results.length} kết quả</p>
                {results.map(tx => (
                  <div
                    key={tx.id}
                    className={`bg-[#2D2D2D] border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedTx?.id === tx.id ? 'border-[#E63946]' : 'border-[#404040] hover:border-[#525252]'
                    }`}
                    onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{tx.customerName}</p>
                          <span className="text-[#525252] text-xs">•</span>
                          <p className="text-[#B3B3B3] text-xs">{tx.phone}</p>
                          <span className="text-[#525252] text-xs">•</span>
                          <p className="text-[#B3B3B3] text-xs">{tx.customerEmail}</p>
                        </div>
                        <p className="text-[#B3B3B3] text-sm mt-1">
                          {tx.movieTitle} • Ghế {tx.seats.join(', ')} • {tx.method}
                        </p>
                        <p className="text-[#525252] text-xs mt-0.5">Mã vé: {tx.ticketId} • {tx.time}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#FFB703] font-bold">{tx.total.toLocaleString('vi-VN')}đ</p>
                        {tx.status === 'completed' && <Badge variant="green">Hoàn thành</Badge>}
                        {tx.status === 'pending' && <Badge variant="gold">Chờ xử lý</Badge>}
                        {tx.status === 'cancelled' && <Badge variant="red">Đã hủy</Badge>}
                      </div>
                    </div>

                    {selectedTx?.id === tx.id && (
                      <div className="mt-4 pt-4 border-t border-[#404040]">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <span className="text-[#B3B3B3]">Mã giao dịch: </span>
                            <span className="text-white font-mono">{tx.id}</span>
                          </div>
                          <div>
                            <span className="text-[#B3B3B3]">Phương thức: </span>
                            <span className="text-white">{tx.method}</span>
                          </div>
                        </div>
                        {tx.status !== 'cancelled' && (
                          <div className="flex gap-3">
                            <Button variant="ghost" size="sm">
                              🔍 Xem QR
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
                              Hủy vé & cấp voucher
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Hủy Vé — Lỗi Rạp">
        <div className="space-y-4">
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-3">
            <p className="text-[#E63946] text-sm font-semibold">⚠️ Hủy vé do lỗi của rạp</p>
            <p className="text-[#B3B3B3] text-xs mt-1">Khách hàng sẽ nhận voucher giảm 50% cho lần mua tiếp theo.</p>
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Lý do hủy</label>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setCancelModal(false)}>Hủy bỏ</Button>
            <Button variant="danger" fullWidth onClick={handleCancel}>Xác nhận hủy vé</Button>
          </div>
        </div>
      </Modal>

      {/* Voucher modal */}
      <Modal isOpen={voucherModal} onClose={() => setVoucherModal(false)} title="Cấp Voucher Cho Khách Hàng">
        <div className="space-y-4">
          <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-xl p-4 text-center">
            <p className="text-[#2ECC71] text-xs font-semibold mb-2">MÃ VOUCHER ĐÃ TẠO</p>
            <p className="text-white font-mono font-black text-2xl tracking-widest">CANCEL50</p>
            <p className="text-[#B3B3B3] text-xs mt-1">Giảm 50% cho lần mua tiếp theo</p>
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Gửi qua</label>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth>📧 Email</Button>
              <Button variant="secondary" fullWidth>📱 SMS</Button>
            </div>
          </div>
          <Button fullWidth onClick={handleIssueVoucher}>Xác nhận & gửi voucher</Button>
        </div>
      </Modal>
    </div>
  );
}
