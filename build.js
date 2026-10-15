// Builds public/index.html from src/content.js.
//   node build.js          write the page
//   node build.js --check  fail if public/index.html is out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { page } from './src/page.js';

const out = new URL('./public/index.html', import.meta.url);
const html = page();

if (process.argv.includes('--check')) {
  // Ignore the year in the footer and the durations, which depend on today's date.
  const strip = (s) => s.replace(/© \d{4}/, '').replace(/>\d+ yrs?( \d+ mos?)?<|>\d+ mos?</g, '><');
  if (strip(readFileSync(out, 'utf8')) !== strip(html)) {
    console.error('public/index.html is out of date. Run `npm run build` and commit the result.');
    process.exit(1);
  }
  console.log('public/index.html is up to date.');
} else {
  writeFileSync(out, html);
  console.log(`Wrote public/index.html (${(html.length / 1024).toFixed(1)} KB)`);
}
