// Turns a value into the syntax-highlighted lines of a JSON view.
// Short arrays of plain values stay on one line, like ["HTML", "CSS", "JavaScript"].
import { esc } from './util.js';

const INLINE_MAX = 29;

const p = (s) => `<span class="j-p">${s}</span>`;
const key = (k) => `<span class="j-key">${esc(JSON.stringify(k))}</span>${p(': ')}`;

function scalar(v) {
  if (typeof v === 'string') return `<span class="j-str">${esc(JSON.stringify(v))}</span>`;
  if (typeof v === 'number') return `<span class="j-num">${v}</span>`;
  return `<span class="j-lit">${JSON.stringify(v)}</span>`;
}

const isScalar = (v) => v === null || typeof v !== 'object';

function inlineArray(arr) {
  if (!arr.every(isScalar)) return null;
  const plain = `[${arr.map((v) => JSON.stringify(v)).join(', ')}]`;
  if (plain.length > INLINE_MAX) return null;
  return p('[') + arr.map(scalar).join(p(', ')) + p(']');
}

// Returns an array of { depth, html } lines.
function lines(value, depth = 0, prefix = '', suffix = '') {
  if (isScalar(value)) return [{ depth, html: prefix + scalar(value) + suffix }];
  if (Array.isArray(value)) {
    const inline = inlineArray(value);
    if (inline) return [{ depth, html: prefix + inline + suffix }];
    return [
      { depth, html: prefix + p('[') },
      ...value.flatMap((v, i) => lines(v, depth + 1, '', i < value.length - 1 ? p(',') : '')),
      { depth, html: p(']') + suffix },
    ];
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return [
    { depth, html: prefix + p('{') },
    ...entries.flatMap(([k, v], i) => lines(v, depth + 1, key(k), i < entries.length - 1 ? p(',') : '')),
    { depth, html: p('}') + suffix },
  ];
}

// `start` offsets the line counter used by the reveal animation.
export function jsonLines(value, start = 0) {
  return lines(value)
    .map((l, i) => `<span class="line" style="--i:${start + i}">${'  '.repeat(l.depth)}${l.html}</span>`)
    .join('');
}
