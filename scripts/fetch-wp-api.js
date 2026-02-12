/**
 * Fetch from WordPress REST API using https module.
 * Node's built-in fetch can return different results (fewer posts) on some WP setups
 * that filter by client. Using https with browser-like headers ensures full content.
 * @param {string} url - Full API URL
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
function fetchWpApi(url) {
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
        let data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          reject(new Error('Invalid JSON: ' + e.message));
          return;
        }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          data,
          headers: res.headers,
        });
      });
    });
    req.on('error', reject);
  });
}

module.exports = { fetchWpApi };
