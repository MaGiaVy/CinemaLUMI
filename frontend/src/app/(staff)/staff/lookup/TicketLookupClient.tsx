'use client';

import { useState } from 'react';
import { Transaction, Ticket } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface TicketLookupClientProps {
  initialTransactions: Transaction[];
  initialTickets: Ticket[];
}

export default function TicketLookupClient({
  initialTransactions,
  initialTickets,
}: TicketLookupClientProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Transaction[]>(initialTransactions);
  const [searched, setSearched] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    setSearched(true);
    if (!query.trim()) {
      setResults(initialTransactions);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      initialTransactions.filter(
        t =>
          t.customerEmail.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.ticketId.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q)
      )
    );
  };

  const handleCancelAndVoucher = () => {
    setCancelModal(false);
    showToast(`Đã hủy vé ${selectedTx?.ticketId} và gửi voucher 50% bồi thường cho khách hàng!`);
    setSelectedTx(null);
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8">
      <div className="max-w-4xl mx-auto">
        {toast && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-[#2ECC71] rounded-lg text-white font-medium shadow-xl">
            {toast}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Tra Cứu & Xử Lý Vé</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Tìm kiếm theo email, số điện thoại hoặc mã vé khách hàng</p>
        </div>

        {/* Search */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nhập email, số điện thoại hoặc mã vé..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm"
            />
            <Button onClick={handleSearch}>Tìm kiếm</Button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040] text-xs text-[#B3B3B3]">
                <th className="text-left px-4 py-3">Mã Vé</th>
                <th className="text-left px-4 py-3">Khách hàng</th>
                <th className="text-left px-4 py-3">Phim & Ghế</th>
                <th className="text-left px-4 py-3">Tổng tiền</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-right px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040] text-sm">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#B3B3B3]">
                    Không tìm thấy vé nào phù hợp.
                  </td>
                </tr>
              ) : (
                results.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#383838]">
                    <td className="px-4 py-3 font-mono text-white text-xs">{tx.ticketId}</td>
                    <td className="px-4 py-3 text-white">
                      <div className="font-semibold">{tx.customerName}</div>
                      <div className="text-xs text-[#B3B3B3]">{tx.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-white text-xs">
                      <div>{tx.movieTitle}</div>
                      <div className="text-[#FFB703] font-bold">Ghế: {tx.seats.join(', ')}</div>
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-semibold">{tx.total.toLocaleString()}đ</td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.status === 'completed' ? 'green' : 'red'} size="sm">
                        {tx.status === 'completed' ? 'Hợp lệ' : 'Đã hủy'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status === 'completed' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedTx(tx);
                            setCancelModal(true);
                          }}
                        >
                          Hủy & Đền bù
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal cancel & issue compensation voucher */}
        <Modal
          isOpen={cancelModal}
          onClose={() => setCancelModal(false)}
          title={`Hủy vé sự cố - ${selectedTx?.ticketId}`}
        >
          <div className="space-y-4">
            <p className="text-[#B3B3B3] text-sm">
              Xác nhận hủy vé của khách hàng <strong className="text-white">{selectedTx?.customerName}</strong>.
              Hệ thống sẽ tự động phát hành 1 voucher giảm 50% gửi trực tiếp đến SĐT/Email của khách hàng để đền bù.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setCancelModal(false)}>Đóng</Button>
              <Button variant="danger" onClick={handleCancelAndVoucher}>Xác nhận phát voucher</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
