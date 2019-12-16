const getContents = require('../')
const t = require('tap')

const {resolve} = require('path')
t.formatSnapshot = a => Array.isArray(a) ? a.sort() : a
// the \ in the paths in the strings in tcompare's output are escaped
// so we have to swap out 2 \ chars with 1, then turn into / for snapshot
// Also, drive letters are case-insensitive, and will randomly be uppercase
// sometimes and lowercase others, so we normalize that as well.
t.cleanSnapshot = s => s.toLowerCase().replace(/\\\\/g, '\\')
  .split(__dirname.toLowerCase()).join('{dir}')
  .replace(/\\+/g, '/')

const mkdirp = require('mkdirp').sync
const fixtures = resolve(__dirname, 'fixtures/node_modules')
// mkdirp these because we don't want to leave a .git-keep file in it,
// since the whole point is that the dirs are empty.
// no need to clean up, git will ignore it.
mkdirp(resolve(fixtures, 'empty'))
mkdirp(resolve(fixtures, 'no-deps/empty'))

const paths = [
  'bundle-all',
  'bundle-some',
  'bundle-none',
  'empty',
  'missing',
  'no-deps',
  'optional-only',
]

t.test('default depth', t => {
  t.plan(paths.length)
  paths.forEach(p => t.test(p, t =>
    t.resolveMatchSnapshot(getContents({ path: resolve(fixtures, p) }))))
})

t.test('depth:0', t => {
  t.plan(paths.length)
  paths.forEach(p => t.test(p, t =>
    t.resolveMatchSnapshot(getContents({
      path: resolve(fixtures, p),
      depth: 0,
    }))))
})

t.test('depth:1', t => {
  t.plan(paths.length)
  paths.forEach(p => t.test(p, t =>
    t.resolveMatchSnapshot(getContents({
      path: resolve(fixtures, p),
      depth: 1,
    }))))
})

t.test('depth:2', t => {
  t.plan(paths.length)
  paths.forEach(p => t.test(p, t =>
    t.resolveMatchSnapshot(getContents({
      path: resolve(fixtures, p),
      depth: 2,
    }))))
})

t.test('depth:Infinity', t => {
  t.plan(paths.length)
  paths.forEach(p => t.test(p, t =>
    t.resolveMatchSnapshot(getContents({
      path: resolve(fixtures, p),
      depth: Infinity,
    }))))
})

t.test('cache race condition coverage tests', t => {
  t.plan(2)
  const path = resolve(fixtures, 'bundle-all')

  const fs = require('fs')
  const normalizePackageBin = require('npm-normalize-package-bin')
  const {promisify} = require('util')

  t.test('full package json cache', t => {
    // cache always claims to have the content, so we always get it from there
    const cache = {}
    const packageJsonCache = {
      has: () => true,
      get: path => {
        const data = fs.readFileSync(path, 'utf8')
        return cache[data] || (cache[data] = normalizePackageBin(JSON.parse(data)))
      }
    }
    return t.resolveMatchSnapshot(getContents({path, packageJsonCache}))
  })

  t.test('empty package json cache', t => {
    const packageJsonCache = {
      has: () => false,
      set: () => {},
    }
    return t.resolveMatchSnapshot(getContents({path, packageJsonCache}))
  })
})
