import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextImageIndex, imageTransform } from '../src/components/blog/image-viewer.mjs';

test('gallery navigation wraps at both ends', () => {
  assert.equal(nextImageIndex(0, -1, 4), 3);
  assert.equal(nextImageIndex(3, 1, 4), 0);
  assert.equal(nextImageIndex(0, 1, 1), 0);
});

test('maps the enlarged image back onto the source rectangle', () => {
  assert.equal(imageTransform({ left: 20, top: 30, width: 100, height: 50 }, { left: 100, top: 80, width: 400, height: 200 }), 'translate(-80px, -50px) scale(0.25, 0.25)');
  assert.equal(imageTransform({ left: 0, top: 0, width: 0, height: 0 }, { left: 0, top: 0, width: 400, height: 200 }), null);
});
