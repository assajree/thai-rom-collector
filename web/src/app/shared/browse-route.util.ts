export type BrowseRouteKind = 'system' | 'translator' | 'tag' | 'rom';

export function normalizeBrowseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function browseSlug(value: string): string {
  return encodeURIComponent(normalizeBrowseName(value));
}

export function browseRoute(kind: BrowseRouteKind, value: string): string {
  return `/${kind}/${browseSlug(value)}`;
}
