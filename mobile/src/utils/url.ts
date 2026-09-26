export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function parseSourceUrl(url: string): { host: string; path: string } {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`.replace(/\/$/, '');
    return {
      host: parsed.hostname.replace(/^www\./, ''),
      path: path === '/' || path === '' ? '' : path,
    };
  } catch {
    return { host: url, path: '' };
  }
}
