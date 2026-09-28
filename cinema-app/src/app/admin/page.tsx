import { redirect } from 'next/navigation';

/**
 * /admin → Tự động chuyển hướng về /admin/dashboard
 */
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
