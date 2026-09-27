import { useState } from 'react';
import { reviews } from '@/data/mockData';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ReviewModerationPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SortMode = 'latest' | 'highest' | 'lowest';

export default function ReviewModerationPage({ onShowToast }: ReviewModerationPageProps) {
  const [reviewList, setReviewList] = useState(reviews);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>('latest');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = reviewList
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating;
      if (sort === 'lowest') return a.rating - b.rating;
      return b.date.localeCompare(a.date);
    });

  const handleDelete = (id: string) => {
    setReviewList(prev => prev.filter(r => r.id !== id));
    setDeleteId(null);
    onShowToast('Đã xóa đánh giá.', 'info');
  };

  const avgRating = reviewList.length
    ? (reviewList.reduce((a, r) => a + r.rating, 0) / reviewList.length).toFixed(1)
    : '0';

  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviewList.filter(r => r.rating === n).length,
  }));

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Quản Lý Đánh Giá</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">{reviewList.length} đánh giá từ khách hàng</p>
        </div>

        {/* Stats */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <div className="text-5xl font-black text-[#FFB703]">{avgRating}</div>
              <StarRating value={Math.round(Number(avgRating))} readonly />
              <p className="text-[#B3B3B3] text-xs mt-1">{reviewList.length} đánh giá</p>
            </div>
            <div className="flex-1 space-y-2">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-[#B3B3B3] text-xs w-4">{star}★</span>
                  <div className="flex-1 bg-[#383838] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[#FFB703]"
                      style={{ width: reviewList.length ? `${(count / reviewList.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[#B3B3B3] text-xs w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-1">
            <button
              onClick={() => setFilterRating(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterRating === null ? 'bg-[#E63946] text-white' : 'bg-[#2D2D2D] text-[#B3B3B3] border border-[#404040]'}`}
              style={{ border: `1px solid ${filterRating === null ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                onClick={() => setFilterRating(filterRating === n ? null : n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterRating === n ? 'bg-[#FFB703] text-[#1A1A1A]' : 'bg-[#2D2D2D] text-[#B3B3B3] border border-[#404040]'}`}
                style={{ border: `1px solid ${filterRating === n ? '#FFB703' : '#404040'}`, cursor: 'pointer' }}
              >
                {n}★
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            {([['latest', 'Mới nhất'], ['highest', 'Cao nhất'], ['lowest', 'Thấp nhất']] as [SortMode, string][]).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sort === s ? 'bg-[#2D2D2D] text-white border-[#525252]' : 'bg-transparent text-[#B3B3B3] border-[#404040]'}`}
                style={{ border: '1px solid', borderColor: sort === s ? '#525252' : '#404040', cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 hover:border-[#525252] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#E63946] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {r.userName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{r.userName}</span>
                        <span className="text-[#525252] text-xs">→</span>
                        <span className="text-[#B3B3B3] text-xs">{r.movieTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating value={r.rating} readonly size="sm" />
                        <Badge variant={r.rating >= 4 ? 'green' : r.rating === 3 ? 'gold' : 'red'} size="sm">
                          {r.rating}/5
                        </Badge>
                        <span className="text-[#525252] text-xs">{r.date}</span>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
                      🗑️ Xóa
                    </Button>
                  </div>
                  <p className="text-[#B3B3B3] text-sm mt-2 leading-relaxed">{r.comment}</p>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-[#2D2D2D] border border-[#404040] rounded-xl">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-[#B3B3B3]">Không có đánh giá nào trong bộ lọc này.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa Đánh Giá">
        <div className="space-y-4">
          <p className="text-[#B3B3B3]">Bạn có chắc chắn muốn xóa đánh giá này? Hành động không thể hoàn tác.</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>Hủy bỏ</Button>
            <Button variant="danger" fullWidth onClick={() => deleteId && handleDelete(deleteId)}>Xóa đánh giá</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
