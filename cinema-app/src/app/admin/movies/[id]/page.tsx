import { redirect } from 'next/navigation';

interface MovieIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieIdPage({ params }: MovieIdPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  redirect(`/admin/movies/${id}/edit`);
}
