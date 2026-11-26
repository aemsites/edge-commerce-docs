import assert from 'node:assert';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync, mkdtempSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  findLeakedRoutes,
  findPrivateRoutes,
  parsePrivateRoutes,
  privateRoutesRule,
  routePattern,
} from '../../scripts/docs/private-routes.mjs';

const descriptor = (routePath, visibility = 'private') => `{
  path: '${routePath}',
  tag: 'Indices',
  visibility: '${visibility}',
  summary: 'x',
}`;

const DESCRIPTORS = `
const indexCollection = {
  path: '/{org}/sites/{site}/index',
  tag: 'Indices',
  visibility: 'public',
};

const indexReindex = {
  path: '/{org}/sites/{site}/index/reindex',
  tag: 'Indices',
  visibility: 'private',
};

const cacheRoute = {
  path: '/{org}/sites/{site}/cache',
  tag: 'Cache',
  visibility: 'internal',
};

export default [
  {
    path: '/{org}/sites/{site}/auth/token',
    tag: 'Auth',
    visibility: "private",
  },
];
`;

test('parsePrivateRoutes returns only routes marked private', () => {
  assert.deepStrictEqual(parsePrivateRoutes(DESCRIPTORS), [
    '/{org}/sites/{site}/index/reindex',
    '/{org}/sites/{site}/auth/token',
  ]);
});

test('parsePrivateRoutes ignores public and internal routes', () => {
  const source = [descriptor('/a', 'public'), descriptor('/b', 'internal')].join('\n');
  assert.deepStrictEqual(parsePrivateRoutes(source), []);
});

test('parsePrivateRoutes de-duplicates a route marked more than once', () => {
  const source = [descriptor('/a'), descriptor('/a')].join('\n');
  assert.deepStrictEqual(parsePrivateRoutes(source), ['/a']);
});

test('parsePrivateRoutes ignores a marker that is only mentioned in a comment', () => {
  // Regression: a JSDoc line naming the marker must not pair with an earlier route.
  const source = `${descriptor('/public', 'public')}

/**
 * Superuser only: \`visibility: 'private'\` keeps it out of the public docs.
 */
${descriptor('/secret')}
`;
  assert.deepStrictEqual(parsePrivateRoutes(source), ['/secret']);
});

test('parsePrivateRoutes ignores path values inside example payloads', () => {
  const source = `{
  path: '/public',
  tag: 'Catalog',
  visibility: 'public',
  example: {
    path: '/us/en/products/blender',
  },
}
${descriptor('/secret')}`;
  assert.deepStrictEqual(parsePrivateRoutes(source), ['/secret']);
});

test('parsePrivateRoutes allows comment lines between tag and visibility', () => {
  const source = `{
  path: '/a',
  tag: 'Identity',
  // Internal and operational.
  visibility: 'private',
}`;
  assert.deepStrictEqual(parsePrivateRoutes(source), ['/a']);
});

test('parsePrivateRoutes throws when a marker cannot be paired with a path', () => {
  const source = `{
  tag: 'Indices',
  visibility: 'private',
  path: '/a',
}`;
  assert.throws(
    () => parsePrivateRoutes(source, 'src/routes/a/openapi.js'),
    /src\/routes\/a\/openapi\.js: 1 .*cannot tell which route is private/,
  );
});

test('parsePrivateRoutes throws when other fields separate path from visibility', () => {
  const source = `{
  path: '/a',
  description: 'Long description',
  visibility: 'private',
}`;
  assert.throws(() => parsePrivateRoutes(source), /cannot tell which route is private/);
});

test('routePattern matches placeholders, literal values, and URLs', () => {
  const re = routePattern('/{org}/sites/{site}/index/reindex');
  assert.ok(re.test('POST /{org}/sites/{site}/index/reindex'));
  assert.ok(re.test('https://api.adobecommerce.live/acme/sites/shop/index/reindex'));
  assert.ok(re.test('"/{org}/sites/{site}/index/reindex.json"'));
});

test('routePattern respects path boundaries', () => {
  const re = routePattern('/{org}/sites/{site}/index/reindex');
  assert.ok(!re.test('/{org}/sites/{site}/index/reindex-all'));
  assert.ok(!re.test('/{org}/sites/{site}/index/reindex/status'));
  assert.ok(!re.test('/{org}/sites/{site}/index'));
});

test('routePattern escapes regex metacharacters in the path', () => {
  const re = routePattern('/v1.0/a+b');
  assert.ok(re.test('/v1.0/a+b'));
  assert.ok(!re.test('/v1x0/aab'));
});

test('findLeakedRoutes reports private routes newly introduced by the LLM', () => {
  const routes = [{ path: '/{org}/sites/{site}/index/reindex' }];
  const before = 'POST /{org}/sites/{site}/index\n';
  const after = `${before}\nPOST /{org}/sites/{site}/index/reindex\n`;
  assert.deepStrictEqual(
    findLeakedRoutes(before, after, routes),
    ['/{org}/sites/{site}/index/reindex'],
  );
});

test('findLeakedRoutes ignores routes already in the document or absent from the output', () => {
  const routes = [{ path: '/{org}/sites/{site}/index/reindex' }];
  const text = 'POST /{org}/sites/{site}/index/reindex';
  assert.deepStrictEqual(findLeakedRoutes(text, text, routes), []);
  assert.deepStrictEqual(findLeakedRoutes('', 'POST /{org}/sites/{site}/index', routes), []);
  assert.deepStrictEqual(findLeakedRoutes('', text, []), []);
});

test('privateRoutesRule lists private routes when there are any', () => {
  const rule = privateRoutesRule([
    { path: '/{org}/sites/{site}/index/reindex', file: 'src/routes/indices/openapi.js' },
  ]);
  assert.match(rule, /never document/i);
  assert.match(rule, /visibility: 'private'/);
  assert.ok(rule.includes('- /{org}/sites/{site}/index/reindex (src/routes/indices/openapi.js)'));
});

test('privateRoutesRule keeps the generic rule when there are no private routes', () => {
  const rule = privateRoutesRule([]);
  assert.match(rule, /superuser-only/);
  assert.doesNotMatch(rule, /Private routes at this commit/);
});

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim();
}

function makeRepo(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'private-routes-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'commit.gpgsign', 'false');
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'init');
  return { dir, ref: git(dir, 'rev-parse', 'HEAD') };
}

test('findPrivateRoutes reads private routes from the source repo at a commit', () => {
  const { dir, ref } = makeRepo({
    'src/routes/indices/openapi.js': DESCRIPTORS,
    // Outside src/**/openapi.js, so it must not be scanned.
    'tools/openapi.js': descriptor('/ignored'),
  });
  try {
    assert.deepStrictEqual(findPrivateRoutes(dir, ref), [
      { path: '/{org}/sites/{site}/index/reindex', file: 'src/routes/indices/openapi.js' },
      { path: '/{org}/sites/{site}/auth/token', file: 'src/routes/indices/openapi.js' },
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findPrivateRoutes returns an empty list when nothing is private', () => {
  const { dir, ref } = makeRepo({
    'src/routes/indices/openapi.js': descriptor('/a', 'public'),
  });
  try {
    assert.deepStrictEqual(findPrivateRoutes(dir, ref), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findPrivateRoutes de-duplicates a route declared in several files', () => {
  const { dir, ref } = makeRepo({
    'src/routes/one/openapi.js': descriptor('/a'),
    'src/routes/two/openapi.js': descriptor('/a'),
  });
  try {
    assert.deepStrictEqual(findPrivateRoutes(dir, ref), [
      { path: '/a', file: 'src/routes/one/openapi.js' },
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findPrivateRoutes fails closed on a marker it cannot pair with a path', () => {
  const { dir, ref } = makeRepo({
    'src/routes/a/openapi.js': "{\n  visibility: 'private',\n  path: '/a',\n}",
  });
  try {
    assert.throws(() => findPrivateRoutes(dir, ref), /src\/routes\/a\/openapi\.js/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findPrivateRoutes surfaces git failures other than "no match"', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'private-routes-notrepo-'));
  try {
    assert.throws(() => findPrivateRoutes(dir, 'HEAD'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
