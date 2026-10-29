import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paperLink, relatedPapers } from '../src/lib/paper-links.mjs';

test('paper links target the selected paper and exclude drafts', () => {
  const papers = [
    { slug: '2026/hello', data: { article: '2026-06-02', draft: false } },
    { slug: '2026/draft', data: { article: '2026-06-02', draft: true } },
    { slug: '2026/other', data: { article: 'other', draft: false } },
  ];
  assert.deepEqual(relatedPapers(papers, '2026-06-02'), [papers[0]]);
  assert.equal(paperLink(papers[0]), '/papers?paper=2026%2Fhello');
});
