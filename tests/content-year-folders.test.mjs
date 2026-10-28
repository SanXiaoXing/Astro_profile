import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';

for (const collection of ['blog', 'papers']) {
  test(`${collection} entries are stored in their year folder`, async () => {
    const root = path.join('src/content', collection);
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
    assert.ok(files.length > 0);
    for (const file of files) {
      const relative = path.relative(root, path.join(file.parentPath, file.name));
      assert.match(relative.replaceAll('\\', '/'), new RegExp(`^${file.name.slice(0, 4)}/`));
    }
  });
}

test('built blog pages retain their original URLs and RSS links', async () => {
  const years = await readdir('src/content/blog');
  const rss = await readFile('dist/rss.xml', 'utf8');
  for (const year of years) {
    for (const file of await readdir(path.join('src/content/blog', year))) {
      if (!file.endsWith('.md')) continue;
      const slug = file.slice(0, -3);
      await access(path.join('dist/blog', slug, 'index.html'));
      assert.ok(rss.includes(`/blog/${slug}/`), `RSS missing ${slug}`);
    }
  }
});

test('built papers page includes every published paper', async () => {
  const page = await readFile('dist/papers/index.html', 'utf8');
  for (const year of await readdir('src/content/papers')) {
    for (const file of await readdir(path.join('src/content/papers', year))) {
      if (!file.endsWith('.md')) continue;
      const source = await readFile(path.join('src/content/papers', year, file), 'utf8');
      if (/^draft:\s*true\s*$/m.test(source)) continue;
      const title = source.match(/^title:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, '');
      assert.ok(title && page.includes(title), `papers page missing ${file}`);
    }
  }
});
