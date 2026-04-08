export function formatViews(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 10_000) return `${(Math.floor(count / 100) / 10).toFixed(1)}K+`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}K+`;
  return `${(Math.floor(count / 100_000) / 10).toFixed(1)}M+`;
}
