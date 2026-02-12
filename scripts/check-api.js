#!/usr/bin/env node
/**
 * Sprint 1: Check that the WordPress REST API is reachable.
 * Reads apiBase from config.json (or env WP_API_BASE) and GETs /wp/v2.
 *
 * Run from project root (html-to-api):  node scripts/check-api.js
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    if (process.env.WP_API_BASE) return {};
    console.error('Missing config.json in current directory. Run from html-to-api: node scripts/check-api.js (or set WP_API_BASE)');
    process.exit(1);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

async function checkApi() {
  const config = loadConfig();
  const base = process.env.WP_API_BASE || config.apiBase;
  if (!base) {
    console.error('No apiBase in config.json and no WP_API_BASE env set.');
    process.exit(1);
  }

  const url = base.replace(/\/$/, '') + '/wp/v2';
  console.log('Checking WP REST API:', url);

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.error('API check failed:', res.status, res.statusText);
      const text = await res.text();
      if (text) console.error(text.slice(0, 200));
      process.exit(1);
    }
    const data = await res.json();
    console.log('OK — API reachable. Namespaces or routes:', Array.isArray(data) ? data.slice(0, 5) : Object.keys(data).slice(0, 8));
    console.log('Try posts: GET', base + '/wp/v2/posts?per_page=1');
  } catch (err) {
    console.error('Request failed:', err.message);
    if (err.cause) console.error('Cause:', err.cause.message);
    process.exit(1);
  }
}

checkApi();
