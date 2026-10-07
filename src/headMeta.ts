import { SITE_URL, type PageMeta } from './pageMeta.ts';

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Rewrites the per-page tags in an HTML document string. Each tag must already
// exist in index.html; a missing one throws so the build can't silently ship
// the wrong metadata.
export function withPageMeta(html: string, meta: PageMeta): string {
  const url = SITE_URL + meta.path;
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);

  const swaps: [RegExp, string][] = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`],
    [/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`],
    [/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`],
  ];

  return swaps.reduce((out, [pattern, replacement]) => {
    if (!pattern.test(out)) throw new Error(`index.html is missing the tag matched by ${pattern}`);
    return out.replace(pattern, replacement);
  }, html);
}

// Client-side counterpart for navigation between routes
export function applyPageMeta(meta: PageMeta): void {
  const url = SITE_URL + meta.path;
  document.title = meta.title;
  const set = (selector: string, attr: string, value: string) =>
    document.head.querySelector(selector)?.setAttribute(attr, value);

  set('link[rel="canonical"]', 'href', url);
  set('meta[name="description"]', 'content', meta.description);
  set('meta[property="og:title"]', 'content', meta.title);
  set('meta[property="og:description"]', 'content', meta.description);
  set('meta[property="og:url"]', 'content', url);
  set('meta[name="twitter:title"]', 'content', meta.title);
  set('meta[name="twitter:description"]', 'content', meta.description);
}
