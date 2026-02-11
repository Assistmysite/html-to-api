/**
 * Load more for related posts on single blog pages.
 * Fetches slug.related.json once, then loads 6 cards per click. SEO: main post is static; this is supplemental.
 */
(function () {
  var BATCH_SIZE = 6;

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cardHtml(item) {
    var href = (item.slug || '') + '.html';
    var title = escapeHtml(item.title || 'Untitled');
    var excerpt = escapeHtml(item.excerpt || '');
    var imgSrc = item.img_src || 'https://via.placeholder.com/400x200?text=No+image';
    return '<article class="bg-white overflow-hidden ring-1 ring-img_gray-50 rounded-xl shadow-sm transition-all hover:ring-img_red-500 hover:shadow-md">' +
      '<a href="' + href + '" class="block group">' +
      '<div class="overflow-hidden"><img src="' + imgSrc + '" alt="" class="h-48 w-full object-cover object-center" loading="lazy"/></div>' +
      '<div class="p-4">' +
      '<h3 class="blog-card__title font-bold text-xl text-zinc-700 group-hover:text-img_red-500 mb-2">' + title + '</h3>' +
      '<p class="text-gray-600 text-sm line-clamp-3">' + excerpt + '</p>' +
      '<span class="inline-block mt-2 text-img_red-500 text-sm font-medium">Weiterlesen &rarr;</span>' +
      '</div></a></article>';
  }

  function init() {
    var section = document.getElementById('related-posts');
    if (!section) return;
    var jsonPath = section.getAttribute('data-related-json');
    if (!jsonPath) return;
    var btn = document.getElementById('related-load-more-btn');
    var wrap = document.getElementById('related-load-more-wrap');
    var grid = document.getElementById('related-posts-grid');
    if (!btn || !wrap || !grid) return;

    var queue = null;

    function loadNextBatch() {
      if (!queue) {
        btn.disabled = true;
        btn.textContent = 'Lade…';
        fetch(jsonPath)
          .then(function (r) { return r.json(); })
          .then(function (items) {
            queue = Array.isArray(items) ? items : [];
            showNextBatch();
          })
          .catch(function () {
            btn.disabled = false;
            btn.textContent = 'Erneut versuchen';
          });
        return;
      }
      showNextBatch();
    }

    function showNextBatch() {
      var batch = queue.splice(0, BATCH_SIZE);
      batch.forEach(function (item) {
        var div = document.createElement('div');
        div.innerHTML = cardHtml(item);
        if (div.firstElementChild) grid.appendChild(div.firstElementChild);
      });
      if (queue.length === 0) {
        wrap.style.display = 'none';
      } else {
        btn.disabled = false;
        btn.textContent = 'Weitere Beiträge laden (' + queue.length + ')';
      }
    }

    btn.addEventListener('click', loadNextBatch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
