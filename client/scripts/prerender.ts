/**
 * Runs after `vite build`. Writes a static HTML file for every public page in every
 * language, each with its own title, description, canonical, hreflang, Open Graph and
 * JSON-LD, so crawlers and link previews get the right page without running JS. The
 * React app then boots on top as usual. Also writes the sitemap and the app shell.
 *
 * Output (served by public/.htaccess):
 *   dist/index.html            English home
 *   dist/_p/<path>.html        every other public page, e.g. _p/blog.html, _p/ru/blog/pomodoro-focus.html
 *   dist/app.html              shell for app routes and unknown URLs
 *   dist/sitemap.xml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogArticles } from '../src/content/blog/articles';
import { absoluteUrl, localizePath, PUBLIC_PATHS, SEO_LANGUAGES, SITE_URL, type SeoLanguage } from '../src/seo/locale';
import {
  alternates,
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALES,
  pageSeo,
  type Translate,
} from '../src/seo/meta';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const START = /<!-- seo:start[^>]*-->[\s\S]*?<!-- seo:end -->/;

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!START.test(template)) throw new Error('dist/index.html has no seo:start/seo:end block');

type Dict = Record<string, unknown>;
const locales = Object.fromEntries(
  SEO_LANGUAGES.map((lang) => [
    lang,
    JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales', `${lang}.json`), 'utf8')) as Dict,
  ]),
) as Record<SeoLanguage, Dict>;

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) node = (node as Dict | undefined)?.[part];
  return typeof node === 'string' ? node : undefined;
}

/** A missing string fails the build instead of shipping an empty title. */
function translator(lang: SeoLanguage): Translate {
  return (key) => {
    const value = lookup(locales[lang], key) ?? lookup(locales.en, key);
    if (!value) throw new Error(`Missing translation ${lang}:${key}`);
    return value;
  };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonForScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

function headFor(pagePath: string, lang: SeoLanguage): string {
  const seo = pageSeo(pagePath, lang, translator(lang));
  if (!seo) throw new Error(`No SEO data for ${pagePath}`);
  const url = absoluteUrl(pagePath, lang);
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    ...alternates(pagePath).map(
      (alternate) => `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`,
    ),
    `<meta property="og:type" content="${seo.ogType}" />`,
    `<meta property="og:site_name" content="Mindkeep" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta property="og:image:alt" content="Mindkeep" />`,
    `<meta property="og:locale" content="${OG_LOCALES[lang]}" />`,
    ...SEO_LANGUAGES.filter((other) => other !== lang).map(
      (other) => `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}" />`,
    ),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...seo.jsonLd.map((data) => `<script type="application/ld+json" data-seo>${jsonForScript(data)}</script>`),
  ];
  return tags.join('\n    ');
}

function render(head: string, lang: string): string {
  return template.replace(START, () => head).replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
}

function write(relative: string, html: string) {
  const file = path.join(dist, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// App shell first: it is the untouched template, before index.html is overwritten.
write(
  'app.html',
  render(
    [
      '<title>Mindkeep</title>',
      '<meta name="description" content="Mindkeep — daily tasks, spaced repetition, notes, habits, a calorie tracker and a budget in one place." />',
    ].join('\n    '),
    'en',
  ),
);

let pages = 0;
for (const pagePath of PUBLIC_PATHS) {
  for (const lang of SEO_LANGUAGES) {
    const localized = localizePath(pagePath, lang);
    const html = render(headFor(pagePath, lang), lang);
    write(localized === '/' ? 'index.html' : `_p${localized}.html`, html);
    pages += 1;
  }
}

const published = new Map(blogArticles.map((article) => [`/blog/${article.slug}`, article.publishedAt]));
const urls = PUBLIC_PATHS.flatMap((pagePath) =>
  SEO_LANGUAGES.map((lang) => {
    const links = alternates(pagePath)
      .map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`)
      .join('\n');
    const lastmod = published.get(pagePath);
    return [
      '  <url>',
      `    <loc>${absoluteUrl(pagePath, lang)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      links,
      '  </url>',
    ].join('\n');
  }),
);
write(
  'sitemap.xml',
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'),
);

console.log(`prerender: ${pages} pages, sitemap with ${urls.length} URLs for ${SITE_URL}`);
