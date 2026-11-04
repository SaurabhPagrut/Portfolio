// Builds public/index.html from src/content.js, and stamps the stylesheet and script links in
// every page with a hash of the file (/assets/app.js?v=1a2b3c4d). Browsers keep /assets/ for a
// week (see public/_headers), so the hash changing is what makes them fetch an edited file.
//   node build.js          write the pages
//   node build.js --check  fail if any page is out of date
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { page } from './src/page.js';

const file = (path) => new URL(`./public/${path}`, import.meta.url);

const VERSIONED = ['styles.css', 'app.js', 'bracel/shared.js', 'bracel/engine.js', 'bracel/spots.js', 'bracel/cat.js'];
const hashes = Object.fromEntries(
  VERSIONED.map((name) => [name, createHash('sha256').update(readFileSync(file(`assets/${name}`))).digest('hex').slice(0, 8)]),
);
const stamp = (html) =>
  html.replace(/\/assets\/([\w/.-]+\.(?:css|js))(\?v=[0-9a-f]*)?/g, (whole, name) =>
    name in hashes ? `/assets/${name}?v=${hashes[name]}` : whole,
  );

// index.html is generated; the other pages are hand-written and only get their links re-stamped.
const pages = [
  ['index.html', stamp(page())],
  ['404.html', stamp(readFileSync(file('404.html'), 'utf8'))],
  ['thanks/index.html', stamp(readFileSync(file('thanks/index.html'), 'utf8'))],
];

if (process.argv.includes('--check')) {
  // Ignore the year in the footer and the durations, which depend on today's date.
  const strip = (s) => s.replace(/© \d{4}/, '').replace(/>\d+ yrs?( \d+ mos?)?<|>\d+ mos?</g, '><');
  const stale = pages.filter(([path, html]) => strip(readFileSync(file(path), 'utf8')) !== strip(html)).map(([path]) => path);
  if (stale.length) {
    console.error(`Out of date: ${stale.join(', ')}. Run \`npm run build\` and commit the result.`);
    process.exit(1);
  }
  console.log('All pages are up to date.');
} else {
  for (const [path, html] of pages) writeFileSync(file(path), html);
  console.log(`Wrote ${pages.map(([path]) => path).join(', ')} (${Object.entries(hashes).map(([n, h]) => `${n} ${h}`).join(', ')})`);
}
