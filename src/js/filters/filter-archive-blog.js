/**
 * Blog archive filter + Load more.
 * Fetches full JSON (deferred), populates filter dropdowns, filters in-memory, integrates Load more.
 * Config: data-blog-list-json, data-blog-list-offset, data-filter-taxonomy on #blog-list.
 * Reusable for future CPTs (listings, etc.) with taxonomy + numeric filters.
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
    var imgSrc = item.img_src || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23e5e7eb' width='400' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14' font-family='sans-serif'%3ENo image%3C/text%3E%3C/svg%3E";
    return '<article class="bg-white overflow-hidden ring-1 ring-img_gray-50 rounded-xl shadow-sm transition-all hover:ring-img_red-500 hover:shadow-md">' +
      '<a href="' + href + '" class="block group">' +
      '<div class="overflow-hidden"><img src="' + imgSrc + '" alt="" class="h-30 object-center object-cover w-full" loading="lazy"/></div>' +
      '<div class="p-4">' +
      '<h2 class="blog-card__title font-bold mb-2 text-img_red-500 text-xl group-hover:text-zinc-700">' + title + '</h2>' +
      '<p class="text-gray-600 text-sm line-clamp-3">' + excerpt + '</p>' +
      '<span class="inline-block mt-2 text-img_red-500 text-sm font-medium">Weiterlesen &rarr;</span>' +
      '</div></a></article>';
  }

  function parseJsonAttr(el, attr, fallback) {
    try {
      var v = el.getAttribute(attr);
      return v ? JSON.parse(v.replace(/'/g, '"')) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  var META_KEYS = { category: 'categories', tag: 'tags' };

  function itemMatchesFilters(item, filters) {
    var meta = item.meta || {};
    if (filters.search) {
      var q = String(filters.search).toLowerCase().trim();
      if (q) {
        var title = (item.title || '').toLowerCase();
        var excerpt = (item.excerpt || '').toLowerCase();
        if (title.indexOf(q) === -1 && excerpt.indexOf(q) === -1) return false;
      }
    }
    if (filters.category) {
      var cats = meta.categories || [];
      var found = cats.some(function (c) { return String(c.slug) === filters.category || String(c.id) === filters.category; });
      if (!found) return false;
    }
    if (filters.tag) {
      var tags = meta.tags || [];
      var foundTag = tags.some(function (t) { return String(t.slug) === filters.tag || String(t.id) === filters.tag; });
      if (!foundTag) return false;
    }
    return true;
  }

  function collectTerms(items, filterKey) {
    var metaKey = META_KEYS[filterKey] || filterKey;
    var seen = {};
    var out = [];
    items.forEach(function (item) {
      var arr = (item.meta && item.meta[metaKey]) || [];
      arr.forEach(function (t) {
        var id = t.id || t.slug;
        if (id && !seen[id]) {
          seen[id] = true;
          out.push({ id: t.id, slug: t.slug, name: t.name || t.slug });
        }
      });
    });
    out.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    return out;
  }

  function init() {
    var container = document.getElementById('blog-list');
    if (!container) return;
    var jsonPath = container.getAttribute('data-blog-list-json');
    var filterTaxonomy = parseJsonAttr(container, 'data-filter-taxonomy', []);
    var filterKeys = filterTaxonomy.length ? filterTaxonomy : ['category', 'tag'];
    if (!jsonPath) return;

    var grid = document.getElementById('blog-list-grid');
    var filterWrap = document.getElementById('blog-filters');
    var btn = document.getElementById('blog-load-more-btn');
    var wrap = document.getElementById('blog-load-more-wrap');
    if (!grid) return;

    var offset = parseInt(container.getAttribute('data-blog-list-offset') || '6', 10);
    var allData = null;
    var displayedCount = 0;
    var currentFiltered = [];
    var filterState = {};

    var labels = { category: 'Kategorien', tag: 'Schlagwörter' };
    try {
      var lbl = container.getAttribute('data-filter-labels');
      if (lbl) Object.assign(labels, JSON.parse(lbl.replace(/'/g, '"')));
    } catch (e) {}

    function getFilters() {
      var f = {};
      var searchEl = document.getElementById('filter-search');
      if (searchEl && searchEl.value) f.search = searchEl.value;
      filterKeys.forEach(function (key) {
        var sel = document.getElementById('filter-' + key);
        if (sel && sel.value) f[key] = sel.value;
      });
      return f;
    }

    function applyFilter() {
      if (!allData) return;
      filterState = getFilters();
      currentFiltered = allData.filter(function (item) { return itemMatchesFilters(item, filterState); });
      renderGrid(true);
      updateLoadMoreVisibility();
    }

    function renderGrid(clear) {
      if (clear) {
        grid.innerHTML = '';
        displayedCount = 0;
      }
      var batchSize = clear ? offset : BATCH_SIZE;
      var toShow = currentFiltered.slice(displayedCount, displayedCount + batchSize);
      toShow.forEach(function (item) {
        var div = document.createElement('div');
        div.innerHTML = cardHtml(item);
        if (div.firstElementChild) grid.appendChild(div.firstElementChild);
      });
      displayedCount += toShow.length;
    }

    function updateLoadMoreVisibility() {
      if (!wrap || !btn) return;
      var remaining = currentFiltered.length - displayedCount;
      if (remaining <= 0) {
        wrap.style.display = 'none';
      } else {
        wrap.style.display = '';
        btn.disabled = false;
        btn.textContent = 'Weitere Beiträge laden (' + remaining + ')';
      }
    }

    function onLoadMore() {
      renderGrid(false);
      updateLoadMoreVisibility();
    }

    function populateDropdowns() {
      filterKeys.forEach(function (key) {
        var sel = document.getElementById('filter-' + key);
        if (!sel) return;
        var terms = collectTerms(allData, key);
        var label = labels[key] || key;
        sel.innerHTML = '<option value="">Alle ' + label + '</option>';
        terms.forEach(function (t) {
          var opt = document.createElement('option');
          opt.value = t.slug || t.id;
          opt.textContent = t.name || t.slug;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', applyFilter);
      });
      var searchEl = document.getElementById('filter-search');
      if (searchEl) {
        var debounceId;
        searchEl.addEventListener('input', function () {
          window.clearTimeout(debounceId);
          debounceId = window.setTimeout(applyFilter, 200);
        });
        searchEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            window.clearTimeout(debounceId);
            applyFilter();
          }
        });
      }
    }

    function loadData() {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doFetch, { timeout: 2000 });
      } else {
        setTimeout(doFetch, 100);
      }
    }

    function doFetch() {
      var url = jsonPath;
      if (jsonPath && !/^[a-z][a-z0-9+.-]*:/i.test(jsonPath)) {
        url = new URL(jsonPath, window.location.href).href;
      }
      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (items) {
          allData = Array.isArray(items) ? items : [];
          currentFiltered = allData.slice();
          populateDropdowns();
          renderGrid(true);
          updateLoadMoreVisibility();
          if (btn) btn.addEventListener('click', onLoadMore);
        })
        .catch(function (err) {
          console.error('Blog filter: failed to load data', err);
          if (grid) grid.innerHTML = '<p class="text-gray-500 col-span-full">Beiträge konnten nicht geladen werden. Bitte die Seite neu laden.</p>';
          if (wrap) wrap.style.display = 'none';
        });
    }

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
