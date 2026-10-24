import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import .* from 'motion';/, '');
class Element {
  constructor(parent = null, kind = '') { this.parent = parent; this.kind = kind; this.style = {}; }
  closest(selector) { return selector === 'a' || selector === 'summary' ? (this.kind === selector ? this : null) : this.parent; }
  setAttribute(name, value) { this[name] = value; }
}
const handlers = {};
const pending = [];
const media = { matches: false, addEventListener() {} };
const document = {
  activeElement: null,
  addEventListener(name, callback) { handlers[name] = callback; },
  querySelectorAll() { return menus; },
};
const menu = () => {
  const item = { open: false, dataset: {}, contains: (node) => node?.parent === item };
  item.summary = new Element(item, 'summary');
  item.summary.offsetWidth = 72;
  item.summary.offsetHeight = 40;
  item.summary.focus = () => { document.activeElement = item.summary; };
  item.panel = Object.assign(new Element(item), { offsetWidth: 160, offsetTop: 50, offsetHeight: 220 });
  item.surface = new Element(item);
  item.querySelector = (selector) => selector === 'summary' ? item.summary : selector === '.dropdown-panel' ? item.panel : item.surface;
  return item;
};
const menus = [menu(), menu()];
const animate = (element, values, options) => {
  Object.assign(element.style, values);
  return { finished: options.duration === 0 ? Promise.resolve() : new Promise(resolve => pending.push(resolve)) };
};
runInNewContext(ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText,
  { document, window: { matchMedia: () => media }, Element, Node: Element, animate, spring: value => value });
const click = (target, detail = 1) => handlers.click({ target, detail, preventDefault() {} });
const settle = async () => { pending.splice(0).forEach(resolve => resolve()); await Promise.resolve(); };
click(menus[0].summary);
assert.equal(menus[0].open, true);
assert.equal(menus[0].panel.inert, false);
click(menus[0].summary);
assert.equal(menus[0].open, true, 'Keep details mounted during exit');
assert.equal(menus[0].panel.inert, true, 'Closing links cannot receive focus');
click(menus[0].summary);
await settle();
assert.equal(menus[0].open, true, 'Interrupted exit must not close a reopened menu');
click(menus[1].summary);
await settle();
assert.equal(menus[0].open, false, 'Switching closes the previous menu');
assert.equal(menus[1].open, true);
click(new Element());
await settle();
assert.equal(menus[1].open, false, 'Outside click closes');
click(menus[0].summary, 0);
document.activeElement = new Element(menus[0], 'a');
handlers.keydown({ key: 'Escape' });
assert.equal(menus[0].open, false);
assert.equal(document.activeElement, menus[0].summary);
media.matches = true;
click(menus[0].summary);
click(new Element());
assert.equal(menus[0].open, false, 'Reduced motion closes immediately');
click(menus[0].summary);
handlers['astro:before-swap']();
assert.equal(menus[0].open, false);
console.log('Header navigation: interruption, focus, exit, reduced motion and navigation checks passed');
