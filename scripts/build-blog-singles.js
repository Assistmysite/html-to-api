#!/usr/bin/env node
/**
 * Sprint 4: Build-time blog single pages.
 * Uses blog-api.html as Pinegrow source of truth (same pattern as blog-list).
 * Fetches posts from WP API, fills #post-title, featured image, #post-content,
 * related-posts-generated block. All layout/templates come from blog-api.html.
 * Writes blog/<slug>.html. Fixes relative paths for output in blog/ subdir.
 * Run from html-to-api: node scripts/build-blog-singles.js
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    if (process.env.WP_API_BASE) return {};
    console.error('Missing config.json. Run from html-to-api: node scripts/build-blog-singles.js (or set WP_API_BASE)');
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

function getFeaturedImageUrl(post, apiBase) {
  const embedded = post._embedded;
  if (!embedded || !embedded['wp:featuredmedia'] || !Array.isArray(embedded['wp:featuredmedia']) || !embedded['wp:featuredmedia'][0]) return null;
  const media = embedded['wp:featuredmedia'][0];
  let url = media.source_url || media.guid?.rendered || null;
  if (url && apiBase && url.startsWith('/')) {
    const origin = apiBase.replace(/\/wp-json\/?$/, '');
    url = origin + url;
  }
  return url;
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

const RELATED_TEMPLATE_START = '<!-- related-post-card-template start -->';
const RELATED_TEMPLATE_END = '<!-- related-post-card-template end -->';
const RELATED_GRID_START = '<!-- related-posts-grid-template start -->';
const RELATED_GRID_END = '<!-- related-posts-grid-template end -->';
const RELATED_LOADMORE_START = '<!-- related-load-more-template start -->';
const RELATED_LOADMORE_END = '<!-- related-load-more-template end -->';
const RELATED_GENERATED_START = '<!-- related-posts-generated -->';
const RELATED_GENERATED_END = '<!-- /related-posts-generated -->';
const RELATED_CARDS_PLACEHOLDER = '<!-- cards -->';
const RELATED_INITIAL = 6;
const RELATED_TOTAL = 20;

function getRelatedPosts(currentPost, allPosts, limit = RELATED_TOTAL) {
  const excludeId = currentPost.id;
  const catIds = currentPost.categories || [];
  const shared = allPosts.filter((p) => {
    if (p.id === excludeId) return false;
    const pCats = p.categories || [];
    return catIds.some((c) => pCats.includes(c));
  });
  const byCategory = shared.slice(0, limit);
  if (byCategory.length) return byCategory;
  return allPosts.filter((p) => p.id !== excludeId).slice(0, limit);
}

function toRelatedJsonItem(post, apiBase, urlRewrites) {
  let imgSrc = getFeaturedImageUrl(post, apiBase) || 'https://via.placeholder.com/400x200?text=No+image';
  if (urlRewrites && imgSrc) imgSrc = applyUrlRewrites(imgSrc, urlRewrites);
  return {
    slug: post.slug || post.id,
    title: post.title?.rendered || post.title || 'Untitled',
    excerpt: stripHtml(post.excerpt?.rendered || post.excerpt || ''),
    img_src: imgSrc,
  };
}

function fillCardTemplate(templateHtml, post, apiBase, hrefPrefix = '', urlRewrites) {
  const title = post.title?.rendered || post.title || 'Untitled';
  const excerpt = stripHtml(post.excerpt?.rendered || post.excerpt || '');
  const slug = post.slug || post.id;
  const href = hrefPrefix + slug + '.html';
  let imgSrc = getFeaturedImageUrl(post, apiBase) || 'https://via.placeholder.com/400x200?text=No+image';
  if (urlRewrites && imgSrc) imgSrc = applyUrlRewrites(imgSrc, urlRewrites);
  return templateHtml
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
    .replace(/\{\{href\}\}/g, href)
    .replace(/\{\{img_src\}\}/g, imgSrc);
}

/** Add ../ to relative href and src so they work from blog/<slug>.html. Same-dir links (blog post slugs) stay as-is. */
function fixPathsForSubdir(html, blogSlugs = new Set()) {
  return html.replace(
    /\s(href|src)=["'](?!\.\.\/|https?:\/\/|#|data:)([^"']+)["']/g,
    (_, attr, val) => {
      if (attr === 'href' && val.endsWith('.html')) {
        const base = val.replace(/\.html$/, '');
        if (blogSlugs.has(base)) return ` ${attr}="${val}"`;
      }
      return ` ${attr}="../${val}"`;
    }
  );
}

function fillTemplate(html, post, apiBase, relatedPostsHtml, blogSlugs, relatedMeta, urlRewrites) {
  const title = post.title?.rendered || post.title || 'Untitled';
  let content = post.content?.rendered || post.content || '';
  if (urlRewrites) content = applyUrlRewrites(content, urlRewrites);
  let imgUrl = getFeaturedImageUrl(post, apiBase);
  if (urlRewrites && imgUrl) imgUrl = applyUrlRewrites(imgUrl, urlRewrites);
  const imgSrc = imgUrl || 'https://pinegrow.com/placeholders/img13.jpg';

  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(title) + '</title>');
  // Preserve h1 attributes from template; only replace inner text (Pinegrow = source of truth)
  html = html.replace(
    /<h1 id="post-title"([^>]*)>[\s\S]*?<\/h1>/,
    '<h1 id="post-title"$1>' + escapeHtml(title) + '</h1>'
  );
  // Preserve #post-featured-image div and img class/etc.; only replace img src and alt (Pinegrow = source of truth)
  html = html.replace(
    /(<div id="post-featured-image"[^>]*>[\s\S]*?<img)([^>]*)(\/?>)/,
    (_, prefix, attrs, closing) => {
      const rest = attrs.replace(/\s+src=["'][^"']*["']/g, '').replace(/\s+alt=["'][^"']*["']/g, '').trim();
      return prefix + ' src="' + imgSrc + '" alt=""' + (rest ? ' ' + rest : '') + closing;
    }
  );
  // Replace comment AND placeholder content (everything until closing </div> of #post-content)
  html = html.replace(
    /<!-- WP post content injected here \(build-time or runtime\) -->[\s\S]*?(?=\s*<\/div>)/,
    content
  );
  // Replace related posts section (href prefix '' since output is in blog/ subdir)
  if (relatedPostsHtml !== undefined) {
    html = html.replace(
      new RegExp(RELATED_GENERATED_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + RELATED_GENERATED_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      RELATED_GENERATED_START + '\n' + relatedPostsHtml + '\n                    ' + RELATED_GENERATED_END
    );
  }
  // Add data-related-json and data-related-offset to #related-posts for Load more
  if (relatedMeta) {
    html = html.replace(
      /<section id="related-posts"([^>]*)>/,
      '<section id="related-posts"$1 data-related-json="' + (relatedMeta.jsonPath || '') + '" data-related-offset="' + (relatedMeta.offset || RELATED_INITIAL) + '">'
    );
  }

  html = fixPathsForSubdir(html, blogSlugs || new Set());
  return urlRewrites ? applyUrlRewrites(html, urlRewrites) : html;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isDevOnlyHost(urlStr) {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr.replace(/\/$/, ''));
    const h = (u.hostname || '').toLowerCase();
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    if (h.includes('.')) return false; // Has TLD = public (e.g. dev-rest-wp.assistmysite.com)
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

  const templatePath = path.join(process.cwd(), 'blog-api.html');
  const outDir = path.join(process.cwd(), 'blog');
  if (!fs.existsSync(templatePath)) {
    console.error('blog-api.html not found.');
    process.exit(1);
  }

  const url = base + '/wp/v2/posts?per_page=30&_embed';
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

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // Remove orphaned files from previous builds (posts no longer in API)
  for (const name of fs.readdirSync(outDir)) {
    if (name.endsWith('.html') || name.endsWith('.related.json')) {
      fs.unlinkSync(path.join(outDir, name));
    }
  }

  const blogSlugs = new Set(posts.map((p) => p.slug || String(p.id)));
  const template = fs.readFileSync(templatePath, 'utf8');
  const cardTemplateStart = template.indexOf(RELATED_TEMPLATE_START);
  const cardTemplateEnd = template.indexOf(RELATED_TEMPLATE_END);
  const cardTemplateHtml = (cardTemplateStart !== -1 && cardTemplateEnd > cardTemplateStart)
    ? template.slice(cardTemplateStart + RELATED_TEMPLATE_START.length, cardTemplateEnd).trim()
    : '';
  const gridTemplateStart = template.indexOf(RELATED_GRID_START);
  const gridTemplateEnd = template.indexOf(RELATED_GRID_END);
  const gridTemplateHtml = (gridTemplateStart !== -1 && gridTemplateEnd > gridTemplateStart)
    ? template.slice(gridTemplateStart + RELATED_GRID_START.length, gridTemplateEnd).trim()
    : '';
  const loadMoreTemplateStart = template.indexOf(RELATED_LOADMORE_START);
  const loadMoreTemplateEnd = template.indexOf(RELATED_LOADMORE_END);
  const loadMoreTemplateHtml = (loadMoreTemplateStart !== -1 && loadMoreTemplateEnd > loadMoreTemplateStart)
    ? template.slice(loadMoreTemplateStart + RELATED_LOADMORE_START.length, loadMoreTemplateEnd).trim()
    : '';

  let written = 0;
  for (const post of posts) {
    const slug = post.slug || String(post.id);
    const outPath = path.join(outDir, slug + '.html');

    let relatedPostsHtml = '';
    let relatedMeta = null;
    if (cardTemplateHtml) {
      const related = getRelatedPosts(post, posts, RELATED_TOTAL);
      if (related.length) {
        const initial = related.slice(0, RELATED_INITIAL);
        const cardsHtml = initial.map((p) => fillCardTemplate(cardTemplateHtml, p, base, '', config)).join('\n');
        if (gridTemplateHtml) {
          relatedPostsHtml = gridTemplateHtml.replace(RELATED_CARDS_PLACEHOLDER, cardsHtml);
        } else {
          relatedPostsHtml = '<div id="related-posts-grid" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">\n' + cardsHtml + '\n</div>';
        }
        if (related.length > RELATED_INITIAL) {
          const more = related.slice(RELATED_INITIAL);
          const jsonPath = slug + '.related.json';
          let jsonStr = JSON.stringify(more.map((p) => toRelatedJsonItem(p, base, config)));
          jsonStr = applyUrlRewrites(jsonStr, config);
          fs.writeFileSync(path.join(outDir, jsonPath), jsonStr, 'utf8');
          if (loadMoreTemplateHtml) {
            relatedPostsHtml += '\n                    ' + loadMoreTemplateHtml;
          } else {
            relatedPostsHtml += '\n                    <div id="related-load-more-wrap" class="mt-8 text-center"><button type="button" id="related-load-more-btn" class="bg-img_red-500 hover:bg-img_red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">Weitere Beiträge laden</button></div>';
          }
          relatedMeta = { jsonPath, offset: RELATED_INITIAL };
        }
      } else {
        relatedPostsHtml = '<p class="text-gray-500 italic">Keine ähnlichen Beiträge.</p>';
      }
    }

    let html = fillTemplate(template, post, base, relatedPostsHtml, blogSlugs, relatedMeta, config);
    html = applyUrlRewrites(html, config);
    fs.writeFileSync(outPath, html, 'utf8');
    written++;
  }

  console.log('OK — wrote', written, 'single post(s) to blog/');
}

main();
