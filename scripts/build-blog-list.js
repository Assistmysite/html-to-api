#!/usr/bin/env node
/**
 * Sprint 3: Build-time blog list.
 * Uses templates from blog.html (Pinegrow = source of truth). Fetches posts,
 * first INITIAL in HTML, rest in blog-list-more.json. Load more button when more posts.
 * Run from html-to-api: node scripts/build-blog-list.js
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_START = '<!-- blog-card-template start -->';
const TEMPLATE_END = '<!-- blog-card-template end -->';
const LOADMORE_START = '<!-- blog-load-more-template start -->';
const LOADMORE_END = '<!-- blog-load-more-template end -->';
const FILTERBAR_START = '<!-- blog-filter-bar-template start -->';
const FILTERBAR_END = '<!-- blog-filter-bar-template end -->';
const GENERATED_START = '<!-- blog-list-generated -->';
const GENERATED_END = '<!-- /blog-list-generated -->';
const GRID_CLASS = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';
const BLOG_LIST_INITIAL = 9;
const BLOG_LIST_TOTAL = 30;
const BLOG_LIST_JSON = 'data/blog-list-more.json';

function loadConfig() {
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    if (process.env.WP_API_BASE) return {};
    console.error('Missing config.json. Run from html-to-api: node scripts/build-blog-list.js (or set WP_API_BASE)');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function applyUrlRewrites(str, config) {
  if (!str || typeof str !== 'string') return str;
  const rewrites = config?.urlRewrites;
  if (!Array.isArray(rewrites)) return str;
  let out = str;
  for (const [from, to] of rewrites) {
    if (from && to) out = out.split(from).join(to);
  }
  return out;
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

function getFeaturedImageUrl(post) {
  const embedded = post._embedded;
  if (!embedded || !embedded['wp:featuredmedia'] || !Array.isArray(embedded['wp:featuredmedia']) || !embedded['wp:featuredmedia'][0]) return null;
  const media = embedded['wp:featuredmedia'][0];
  return media.source_url || media.guid?.rendered || null;
}

function getTerms(post, taxonomy) {
  const terms = post._embedded && post._embedded['wp:term'] ? post._embedded['wp:term'] : [];
  const out = [];
  terms.forEach(function (arr) {
    if (!Array.isArray(arr)) return;
    arr.forEach(function (t) {
      if (t.taxonomy === taxonomy) {
        out.push({ id: t.id, slug: t.slug, name: t.name || t.slug });
      }
    });
  });
  return out;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toJsonItem(post, config) {
  let imgSrc = getFeaturedImageUrl(post) || 'https://via.placeholder.com/400x200?text=No+image';
  if (config && imgSrc) imgSrc = applyUrlRewrites(imgSrc, config);
  return {
    slug: post.slug || post.id,
    title: post.title?.rendered || post.title || 'Untitled',
    excerpt: stripHtml(post.excerpt?.rendered || post.excerpt || ''),
    img_src: imgSrc,
    meta: {
      categories: getTerms(post, 'category'),
      tags: getTerms(post, 'post_tag'),
      date: post.date ? post.date.slice(0, 10) : '',
    },
  };
}

function extractBlogFiltersDiv(html) {
  const start = html.indexOf('<div id="blog-filters"');
  if (start === -1) return null;
  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.slice(i).startsWith('<div')) {
      depth++;
      i += 4;
      continue;
    }
    if (html.slice(i).startsWith('</div>')) {
      depth--;
      if (depth === 0) return html.slice(start, i + 6).trim();
      i += 6;
      continue;
    }
    i++;
  }
  return null;
}

function fillTemplate(templateHtml, post, singlePath = 'blog', config) {
  const title = post.title?.rendered || post.title || 'Untitled';
  const excerpt = stripHtml(post.excerpt?.rendered || post.excerpt || '');
  const slug = post.slug || post.id;
  const href = singlePath + '/' + slug + '.html';
  let imgSrc = getFeaturedImageUrl(post) || 'https://via.placeholder.com/400x200?text=No+image';
  if (config && imgSrc) imgSrc = applyUrlRewrites(imgSrc, config);
  return templateHtml
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
    .replace(/\{\{href\}\}/g, href)
    .replace(/\{\{img_src\}\}/g, imgSrc);
}

function isDevOnlyHost(urlStr) {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr.replace(/\/$/, ''));
    const h = (u.hostname || '').toLowerCase();
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return h === 'localhost' || h === '127.0.0.1' || h.startsWith('dev-') || h.endsWith('.local') || port === '8890';
  } catch {
    return false;
  }
}

async function main() {
  const config = loadConfig();
  const base = (process.env.WP_API_BASE || config.apiBase || '').replace(/\/$/, '');
  if (!base) {
    console.error('No apiBase. Set in config.json or WP_API_BASE.');
    process.exit(1);
  }

  if ((process.env.NETLIFY === 'true' || process.env.CI === 'true') && !process.env.WP_API_BASE && isDevOnlyHost(base)) {
    console.error('');
    console.error('Deploy build cannot reach your local dev host.');
    console.error('config.json points to:', base);
    console.error('');
    console.error('Set WP_API_BASE in Cloudflare Pages / Netlify: Settings → Environment variables');
    console.error('Example: WP_API_BASE = https://your-production-site.com/wp-json');
    console.error('');
    process.exit(1);
  }

  const url = base + '/wp/v2/posts?per_page=' + BLOG_LIST_TOTAL + '&_embed';
  console.log('Fetching posts:', url);

  let posts;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('API error:', res.status, res.statusText);
      process.exit(1);
    }
    posts = await res.json();
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(posts)) {
    console.error('Unexpected response: not an array');
    process.exit(1);
  }

  const blogPath = path.join(process.cwd(), 'blog.html');
  if (!fs.existsSync(blogPath)) {
    console.error('blog.html not found in current directory.');
    process.exit(1);
  }

  let html = fs.readFileSync(blogPath, 'utf8');

  const templateStartIdx = html.indexOf(TEMPLATE_START);
  const templateEndIdx = html.indexOf(TEMPLATE_END);
  if (templateStartIdx === -1 || templateEndIdx === -1 || templateEndIdx <= templateStartIdx) {
    console.error('blog.html must contain "<!-- blog-card-template start -->" and "<!-- blog-card-template end -->" with one card in between (use {{title}}, {{excerpt}}, {{href}}, {{img_src}}).');
    process.exit(1);
  }
  const templateHtml = html.slice(templateStartIdx + TEMPLATE_START.length, templateEndIdx).trim();

  const loadMoreStartIdx = html.indexOf(LOADMORE_START);
  const loadMoreEndIdx = html.indexOf(LOADMORE_END);
  const loadMoreHtml = (loadMoreStartIdx !== -1 && loadMoreEndIdx > loadMoreStartIdx)
    ? html.slice(loadMoreStartIdx + LOADMORE_START.length, loadMoreEndIdx).trim()
    : '';

  const filterBarStartIdx = html.indexOf(FILTERBAR_START);
  const filterBarEndIdx = html.indexOf(FILTERBAR_END);
  const filterBarHtml = (filterBarStartIdx !== -1 && filterBarEndIdx > filterBarStartIdx)
    ? html.slice(filterBarStartIdx + FILTERBAR_START.length, filterBarEndIdx).trim()
    : '';

  const generatedStartIdx = html.indexOf(GENERATED_START);
  const generatedEndIdx = html.indexOf(GENERATED_END);
  if (generatedStartIdx === -1 || generatedEndIdx === -1 || generatedEndIdx <= generatedStartIdx) {
    console.error('blog.html must contain "<!-- blog-list-generated -->" and "<!-- /blog-list-generated -->".');
    process.exit(1);
  }

  const generatedBlock = html.slice(generatedStartIdx + GENERATED_START.length, generatedEndIdx);
  const preservedFilterBar = extractBlogFiltersDiv(generatedBlock);

  const initial = posts.slice(0, BLOG_LIST_INITIAL);
  const more = posts.slice(BLOG_LIST_INITIAL);
  const allItems = posts.map((p) => toJsonItem(p, config));

  let newContent;
  if (posts.length === 0) {
    newContent = '<p class="text-gray-500 italic">Keine Beiträge gefunden.</p>';
  } else {
    const defaultFilterBar = '<div id="blog-filters" class="blog-filters mb-8 rounded-xl bg-white p-5 ring-1 ring-img_gray-50 shadow-sm"><div class="flex items-center gap-2 mb-4 text-img_red-500"><span class="bg-img_red-500 h-[1px] w-8 shrink-0"></span><span class="font-bold text-xs tracking-[0.2em] uppercase">Filtern nach</span><span class="bg-img_red-500 h-[1px] w-8 shrink-0"></span></div><div class="flex flex-wrap gap-6"><div class="blog-filter-group"><label for="filter-search" class="mb-1.5 block text-sm font-medium text-gray-700">Suchen</label><input type="text" id="filter-search" placeholder="Titel, Text…" class="blog-filter-select min-w-[320px] rounded-lg border border-img_gray-100 bg-white px-4 py-2.5 text-sm text-gray-800 transition-colors focus:border-img_red-500 focus:outline-none focus:ring-2 focus:ring-img_red-500/20" autocomplete="off"/></div><div class="blog-filter-group"><label for="filter-category" class="mb-1.5 block text-sm font-medium text-gray-700">Kategorie</label><select id="filter-category" class="blog-filter-select min-w-[180px] rounded-lg border border-img_gray-100 bg-white px-4 py-2.5 text-sm text-gray-800 transition-colors focus:border-img_red-500 focus:outline-none focus:ring-2 focus:ring-img_red-500/20"><option value="">Alle Kategorien</option></select></div></div></div>';
    const filterBar = preservedFilterBar || filterBarHtml || defaultFilterBar;
    const gridHtml = '<div id="blog-list-grid" class="' + GRID_CLASS + '">\n' +
      initial.map((p) => fillTemplate(templateHtml, p, 'blog', config)).join('\n') + '\n</div>';
    newContent = filterBar + '\n' + gridHtml;
    if (posts.length > 0) {
      const jsonPathOut = path.join(process.cwd(), BLOG_LIST_JSON);
      fs.mkdirSync(path.dirname(jsonPathOut), { recursive: true });
      fs.writeFileSync(jsonPathOut, JSON.stringify(allItems), 'utf8');
    }
    if (more.length > 0) {
      let btnHtml = loadMoreHtml
        ? loadMoreHtml.replace(/<div /, '<div id="blog-load-more-wrap" ').replace(/<button type="button" /, '<button type="button" id="blog-load-more-btn" ')
        : '<div id="blog-load-more-wrap" class="mt-8 text-center"><button type="button" id="blog-load-more-btn" class="bg-img_red-500 hover:bg-img_red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">Weitere Beiträge laden</button></div>';
      newContent += '\n                        ' + btnHtml;
    }
  }

  const before = html.slice(0, generatedStartIdx + GENERATED_START.length);
  const after = html.slice(generatedEndIdx);
  html = before + '\n' + newContent + '\n                        ' + after;

  html = html.replace(/\s+data-blog-list-json="[^"]*"/g, '').replace(/\s+data-blog-list-offset="[^"]*"/g, '')
    .replace(/\s+data-filter-taxonomy=(?:"[^"]*"|'[^']*')/g, '').replace(/\s+data-filter-labels=(?:"[^"]*"|'[^']*')/g, '')
    .replace(/\s+data-wp-api-base="[^"]*"/g, '');
  if (posts.length > 0) {
    html = html.replace(
      /<div id="blog-list"([^>]*)>/,
      '<div id="blog-list"$1 data-wp-api-base="' + base + '" data-blog-list-json="' + BLOG_LIST_JSON + '" data-blog-list-offset="' + BLOG_LIST_INITIAL + '" data-filter-taxonomy=\'["category"]\' data-filter-labels=\'{"category":"Kategorien"}\'>'
    );
  }

  fs.writeFileSync(blogPath, html, 'utf8');
  console.log('OK — blog.html updated with', initial.length, 'posts' + (posts.length > 0 ? ' + filter + Load more (' + posts.length + ' in JSON)' : '') + ' (template from Pinegrow preserved).');
}

main();
