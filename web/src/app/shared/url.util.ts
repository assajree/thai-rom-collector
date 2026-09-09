export function removeFacebookReference(value: string): string {
  const urlValue = value.trim();
  if (!urlValue) return '';

  try {
    const url = new URL(urlValue);
    if (!url.searchParams.has('fbclid')) return urlValue;
    url.searchParams.delete('fbclid');
    return url.toString();
  } catch {
    return urlValue;
  }
}
