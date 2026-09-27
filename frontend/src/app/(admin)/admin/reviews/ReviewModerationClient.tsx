'use client';

import { useState } from 'react';
import { Review } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ReviewModerationClientProps {
  initialReviews: Review[];
}

export default function ReviewModerationClient({ initialReviews }: ReviewModerationClientProps) {
  const [reviewList, setReviewList] = useState(initialReviews);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    setReviewList(prev => prev.filter(r => r.id !== id));
    setDeleteId(null);
    showToast('Đã xóa đánh giá vi phạm.');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {toast && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-[#2ECC71] rounded-lg text-white font-medium shadow-xl">
            {toast}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Kiểm Duyệt Đánh Giá Phim</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">{reviewList.length} lượt đánh giá từ người xem</p>
        </div>

        <div className="space-y-4">
          {reviewList.map(r => (
            <div key={r.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-white text-base">{r.userName}</span>
                  <span className="text-[#525252]">•</span>
                  <span className="text-[#FFB703] font-semibold text-sm">Phim: {r.movieTitle}</span>
                  <span className="text-[#525252]">•</span>
                  <span className="text-[#B3B3B3] text-xs">{r.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <StarRating value={r.rating} readonly size="sm" />
                  <span className="text-[#FFB703] text-xs font-bold">{r.rating}/5</span>
                </div>
                <p className="text-[#B3B3B3] text-sm leading-relaxed">{r.comment}</p>
              </div>

              <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
                Gỡ bỏ
              </Button>
            </div>
          ))}
        </div>

        {/* Modal delete */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận gỡ bỏ bình luận">
          <p className="text-[#B3B3B3] text-sm mb-4">Bạn có chắc chắn muốn xóa đánh giá này không?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Xác nhận xóa</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
