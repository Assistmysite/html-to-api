/**
 * Fetch from WordPress REST API.
 * Prefers curl (returns full content on WP setups that filter by client); falls back to https.
 * Retries once if result is an array - CDN/cache sometimes returns inconsistent counts.
 * @param {string} url - Full API URL
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
function fetchWpApi(url) {
  const { execFileSync } = require('child_process');

  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const curlArgs = (targetUrl) => [
    '-sL', '-H', 'User-Agent: ' + UA, '-H', 'Accept: application/json',
    '-H', 'Cache-Control: no-cache', '-H', 'Pragma: no-cache',
    targetUrl,
  ];

  function doCurl(targetUrl) {
    const out = execFileSync('curl', curlArgs(targetUrl), {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const data = JSON.parse(out);
    return Array.isArray(data) ? data : [data];
  }

  try {
    const sep = url.includes('?') ? '&' : '?';
    const url1 = url + sep + '_=' + Date.now();
    const url2 = url + sep + '_=' + (Date.now() + 1);

    let data = doCurl(url1);
    if (Array.isArray(data)) {
      const data2 = doCurl(url2);
      if (Array.isArray(data2) && data2.length > data.length) data = data2;
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      data,
      headers: {},
    });
  } catch (curlErr) {
    // curl not available or failed → fall back to https
  }

  return new Promise((resolve, reject) => {
    const https = require('https');
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    };
    const req = https.get(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: Array.isArray(data) ? data : data,
            headers: res.headers,
          });
        } catch (e) {
          reject(new Error('Invalid JSON: ' + e.message));
        }
      });
    });
    req.on('error', reject);
  });
}

module.exports = { fetchWpApi };
