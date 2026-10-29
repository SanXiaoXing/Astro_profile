import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { directive } from 'micromark-extension-directive';
import { directiveFromMarkdown } from 'mdast-util-directive';
import remarkImageGrid from '../src/components/mdrenders/remark-image-grid.mjs';

test('image-grid directive renders a container for two rows of Markdown images', () => {
  const tree = fromMarkdown(':::image-grid\n![一](/1.jpg)\n\n![二](/2.jpg)\n\n![三](/3.jpg)\n\n![四](/4.jpg)\n:::', {
    extensions: [directive()],
    mdastExtensions: [directiveFromMarkdown()],
  });
  remarkImageGrid()(tree);
  const grid = tree.children[0];
  assert.equal(grid.data.hName, 'div');
  assert.deepEqual(grid.data.hProperties.className, ['image-grid']);
  assert.deepEqual(grid.children.map((child) => child.children[0].url), ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg']);
});
