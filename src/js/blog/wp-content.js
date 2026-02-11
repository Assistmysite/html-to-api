/**
 * Sprint 2: Proof-of-fetch for WP REST API.
 * Reads API base from #blog-list[data-wp-api-base], fetches GET /wp/v2/posts?per_page=3, logs result.
 * No DOM rendering yet. Optional: run on blog list page to verify API reachability from the browser.
 */
(function () {
  var el = document.getElementById('blog-list');
  if (!el) return;
  var apiBase = (el.dataset && el.dataset.wpApiBase) ? el.dataset.wpApiBase.replace(/\/$/, '') : '';
  if (!apiBase) {
    console.warn('wp-content.js: No data-wp-api-base on #blog-list.');
    return;
  }
  var url = apiBase + '/wp/v2/posts?per_page=3';
  fetch(url, { method: 'GET' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('WP posts (first 3):', Array.isArray(data) ? data : data);
    })
    .catch(function (err) {
      console.error('WP fetch failed:', err);
    });
})();
