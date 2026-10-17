export function resolveMovieId(param: string | null | undefined): number | null {
  if (!param) return null;
  const digits = param.replace(/\D/g, '');
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}
