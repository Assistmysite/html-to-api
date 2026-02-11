/**
 * Load more for blog list page.
 * Fetches data/blog-list-more.json. Loads 6 cards per click.
 */
(function () {
  var BATCH_SIZE = 6;
  var HREF_PREFIX = 'blog/';

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cardHtml(item) {
    var href = HREF_PREFIX + (item.slug || '') + '.html';
    var title = escapeHtml(item.title || 'Untitled');
    var excerpt = escapeHtml(item.excerpt || '');
    var imgSrc = item.img_src || 'https://via.placeholder.com/400x200?text=No+image';
    return '<article class="bg-white overflow-hidden ring-1 ring-img_gray-50 rounded-xl shadow-sm transition-all hover:ring-img_red-500 hover:shadow-md">' +
      '<a href="' + href + '" class="block group">' +
      '<div class="overflow-hidden"><img src="' + imgSrc + '" alt="" class="h-30 object-center object-cover w-full" loading="lazy"/></div>' +
      '<div class="p-4">' +
      '<h2 class="blog-card__title font-bold mb-2 text-img_red-500 text-xl group-hover:text-zinc-700">' + title + '</h2>' +
      '<p class="text-gray-600 text-sm line-clamp-3">' + excerpt + '</p>' +
      '<span class="inline-block mt-2 text-img_red-500 text-sm font-medium">Weiterlesen &rarr;</span>' +
      '</div></a></article>';
  }

  function init() {
    var container = document.getElementById('blog-list');
    if (!container) return;
    var jsonPath = container.getAttribute('data-blog-list-json');
    if (!jsonPath) return;
    var btn = document.getElementById('blog-load-more-btn');
    var wrap = document.getElementById('blog-load-more-wrap');
    var grid = document.getElementById('blog-list-grid');
    if (!btn || !wrap || !grid) return;

    var queue = null;

    function doFetch(attempt) {
      attempt = attempt || 0;
      var maxRetries = 3;
      var delayMs = 500;
      var timeoutMs = 8000;
      var timeoutId;

      function onError() {
        window.clearTimeout(timeoutId);
        if (attempt < maxRetries) {
          window.setTimeout(function () { doFetch(attempt + 1); }, delayMs);
        } else {
          btn.disabled = false;
          btn.textContent = 'Weitere Beiträge laden';
        }
      }

      timeoutId = window.setTimeout(onError, timeoutMs);

      fetch(jsonPath)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (items) {
          window.clearTimeout(timeoutId);
          queue = Array.isArray(items) ? items : [];
          showNextBatch();
        })
        .catch(onError);
    }

    function loadNextBatch() {
      if (!queue) {
        btn.disabled = true;
        btn.textContent = 'Lade…';
        doFetch(0);
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
