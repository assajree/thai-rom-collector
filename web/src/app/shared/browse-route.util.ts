export type BrowseRouteKind = 'system' | 'translator' | 'tag' | 'rom' | 'today' | 'week';

export function normalizeBrowseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function browseSlug(value: string): string {
  return encodeURIComponent(normalizeBrowseName(value));
}

export function browseRoute(kind: BrowseRouteKind, value: string): string {
  if (kind === 'system') return `/system?system=${encodeURIComponent(normalizeBrowseName(value))}`;
  if (kind === 'translator') return `/translator?translator=${encodeURIComponent(normalizeBrowseName(value))}`;
  return `/${kind}/${browseSlug(value)}`;
}
