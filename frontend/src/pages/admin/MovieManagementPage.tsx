import { useState } from "react";
import { movies } from "@/data/mockData";
import { Movie } from "@/data/mockData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/ui/StarRating";

interface MovieManagementPageProps {
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const GENRES = [
  "Hành động",
  "Hài",
  "Hoạt hình",
  "Tâm lý",
  "Âm nhạc",
  "Siêu anh hùng",
  "Gia đình",
  "Khoa học viễn tưởng",
  "Gián điệp",
  "Kỳ ảo",
  "Tội phạm",
];

export default function MovieManagementPage({
  onShowToast,
}: MovieManagementPageProps) {
  const [movieList, setMovieList] = useState(movies);
  const [addModal, setAddModal] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{
    title: string;
    genre: string;
    duration: string;
    description: string;
    director: string;
    releaseDate: string;
    status: Movie["status"];
  }>({
    title: "",
    genre: "",
    duration: "",
    description: "",
    director: "",
    releaseDate: "",
    status: "showing",
  });

  const filtered = movieList.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.genre.join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (m: Movie) => {
    setEditMovie(m);
    setForm({
      title: m.title,
      genre: m.genre[0],
      duration: String(m.duration),
      description: m.description,
      director: m.director,
      releaseDate: m.releaseDate,
      status: m.status,
    });
    setAddModal(true);
  };

  const handleSave = () => {
    if (editMovie) {
      setMovieList((prev) =>
        prev.map((m) =>
          m.id === editMovie.id
            ? {
                ...m,
                ...form,
                duration: Number(form.duration),
                genre: [form.genre],
                status: form.status,
              }
            : m
        )
      );
      onShowToast("Đã cập nhật thông tin phim!", "success");
    } else {
      const newMovie: Movie = {
        id: `m${Date.now()}`,
        title: form.title,
        genre: [form.genre],
        duration: Number(form.duration),
        rating: 0,
        description: form.description,
        director: form.director,
        cast: [],
        releaseDate: form.releaseDate,
        poster:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&auto=format",
        banner:
          "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=500&fit=crop&auto=format",
        status: form.status as Movie["status"],
        ticketPrice: 120000,
      };
      setMovieList((prev) => [newMovie, ...prev]);
      onShowToast("Đã thêm phim mới!", "success");
    }
    setAddModal(false);
    setEditMovie(null);
    setForm({
      title: "",
      genre: "",
      duration: "",
      description: "",
      director: "",
      releaseDate: "",
      status: "showing",
    });
  };

  const handleDelete = (id: string) => {
    setMovieList((prev) => prev.filter((m) => m.id !== id));
    setDeleteId(null);
    onShowToast("Đã xóa phim.", "info");
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Phim</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">
              {movieList.length} phim trong hệ thống
            </p>
          </div>
          <Button
            onClick={() => {
              setEditMovie(null);
              setForm({
                title: "",
                genre: "",
                duration: "",
                description: "",
                director: "",
                releaseDate: "",
                status: "showing",
              });
              setAddModal(true);
            }}
          >
            + Thêm phim
          </Button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Phim
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden md:table-cell">
                  Thể loại
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  Thời lượng
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  Đánh giá
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-right px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {filtered.map((movie) => (
                <tr
                  key={movie.id}
                  className="hover:bg-[#383838] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">
                          {movie.title}
                        </p>
                        <p className="text-[#B3B3B3] text-xs">
                          {movie.director}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {movie.genre.map((g) => (
                        <Badge key={g} variant="blue" size="sm">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#B3B3B3] text-sm hidden lg:table-cell">
                    {movie.duration} phút
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <StarRating
                        value={Math.round(movie.rating)}
                        readonly
                        size="sm"
                      />
                      <span className="text-[#FFB703] text-xs font-bold">
                        {movie.rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {movie.status === "showing" && (
                      <Badge variant="green">Đang chiếu</Badge>
                    )}
                    {movie.status === "coming_soon" && (
                      <Badge variant="gold">Sắp ra mắt</Badge>
                    )}
                    {movie.status === "ended" && (
                      <Badge variant="gray">Đã kết thúc</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(movie)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteId(movie.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal
        isOpen={addModal}
        onClose={() => {
          setAddModal(false);
          setEditMovie(null);
        }}
        title={editMovie ? "Chỉnh Sửa Phim" : "Thêm Phim Mới"}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Tên phim
            </label>
            <input
              type="text"
              placeholder="Avengers: Doomsday"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Thể loại
            </label>
            <select
              value={form.genre}
              onChange={(e) =>
                setForm((f) => ({ ...f, genre: e.target.value }))
              }
            >
              <option value="">Chọn thể loại</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Thời lượng (phút)
            </label>
            <input
              type="number"
              placeholder="120"
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Đạo diễn
            </label>
            <input
              type="text"
              placeholder="Tên đạo diễn"
              value={form.director}
              onChange={(e) =>
                setForm((f) => ({ ...f, director: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Ngày phát hành
            </label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, releaseDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as Movie["status"],
                }))
              }
            >
              <option value="showing">Đang chiếu</option>
              <option value="coming_soon">Sắp ra mắt</option>
              <option value="ended">Đã kết thúc</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Mô tả
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả phim..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2 flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setAddModal(false);
                setEditMovie(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editMovie ? "Lưu thay đổi" : "Thêm phim"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác Nhận Xóa Phim"
      >
        <div className="space-y-4">
          <p className="text-[#B3B3B3]">
            Bạn có chắc chắn muốn xóa phim này? Hành động không thể hoàn tác.
          </p>
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-3">
            <p className="text-[#E63946] text-xs">
              ⚠️ Hệ thống sẽ kiểm tra và hủy tất cả suất chiếu liên quan.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeleteId(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Xóa phim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
