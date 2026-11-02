/**
 * Tiện ích xử lý ngày giờ chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh)
 */

const vnDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Định dạng ngày thành chuỗi YYYY-MM-DD theo chuẩn giờ Việt Nam (Asia/Ho_Chi_Minh)
 * Giúp hiển thị và phân loại suất chiếu chính xác, không bị lệch lùi 1 ngày do múi giờ UTC.
 */
export function getLocalDateString(dateInput: string | Date): string {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  return vnDateFormatter.format(dateObj);
}
