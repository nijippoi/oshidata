import { registerAll } from '../components/mod.ts';
import '../index.css';
import { init, ns } from '../utils.ts';

/** `?id=` または `#` から人物 ID を解決する（query を優先）。 */
function personIdFromUrl(): string | null {
  const { location: loc } = globalThis;
  const fromQuery = new URLSearchParams(loc.search).get('id');
  if (fromQuery) {
    const t = fromQuery.trim();
    if (t) return t;
  }
  const h = loc.hash;
  if (h && h.length > 1) {
    const t = decodeURIComponent(h.replace(/^#\/?/, '')).trim();
    if (t) return t;
  }
  return null;
}

addEventListener('DOMContentLoaded', () => {
  init();
  registerAll();
  const el = document.querySelector(ns('person-card'));
  const id = personIdFromUrl();
  if (id && el) {
    el.setAttribute('person-id', id);
  }
  addEventListener('hashchange', () => {
    const id2 = personIdFromUrl();
    const node = document.querySelector(ns('person-card'));
    if (node) {
      if (id2) {
        node.setAttribute('person-id', id2);
      } else {
        node.removeAttribute('person-id');
      }
    }
  });
});
