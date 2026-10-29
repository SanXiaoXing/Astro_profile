import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Build a temporary article to exercise the content schema and the rendered page.
test('article creation marks default to original and support AIGC', async () => {
  const directory = 'src/content/blog/2099';
  const fixture = `${directory}/2099-01-01.md`;
  const assistedFixture = `${directory}/2099-01-02.md`;
  await mkdir(directory, { recursive: true });
  await writeFile(fixture, '---\ntitle: Creation mark test\ndescription: Test fixture\npubDate: 2099-01-01\ncreation: aigc\n---\nTest.\n', { flag: 'wx' });
  await writeFile(assistedFixture, '---\ntitle: Assisted creation test\ndescription: Test fixture\npubDate: 2099-01-02\ncreation: ai-assisted\ntags: [成长]\n---\nTest.\n', { flag: 'wx' });
  const output = await mkdtemp(path.join(tmpdir(), 'astro-creation-test-'));
  try {
    const build = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build', '--outDir', output], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
    const original = await readFile(path.join(output, 'blog/2024-06-21/index.html'), 'utf8');
    const aigc = await readFile(path.join(output, 'blog/2099-01-01/index.html'), 'utf8');
    const assisted = await readFile(path.join(output, 'blog/2099-01-02/index.html'), 'utf8');
    const list = await readFile(path.join(output, 'blog/index.html'), 'utf8');
    const growth = await readFile(path.join(output, 'growth/index.html'), 'utf8');
    assert.ok(/data-creation="original"[^>]*>[\s\S]*?原创/.test(original));
    assert.ok(/data-creation="aigc"[^>]*>[\s\S]*?AIGC/.test(aigc));
    assert.ok(/data-creation="ai-assisted"[^>]*>[\s\S]*?AIGC 辅助/.test(assisted));
    assert.ok(!list.includes("post-creation-tag"));
    assert.ok(!/class="post-creation-tag"[^>]*>原创<\/span>/.test(list));
    assert.ok(!growth.includes("post-creation-tag"));
  } finally {
    await rm(fixture);
    await rm(assistedFixture);
    await rmdir(directory);
    await rm(output, { recursive: true, force: true });
  }
});

