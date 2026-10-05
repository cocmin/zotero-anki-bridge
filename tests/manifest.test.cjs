const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../addon/manifest.json'), 'utf8'));
const required = fs.readFileSync(path.join(__dirname, 'fixtures/zotero10-required-manifest.js'), 'utf8');

function installerErrors(value) {
  const errors = [];
  const context = {type: 'extension', manifestError: error => errors.push(error)};
  new Function('manifest', required).call(context, value);
  return errors;
}

test('distributed manifest passes installed Zotero required-property checks', () => {
  assert.deepEqual(installerErrors(manifest), []);
  // XPIDatabase.providesUpdatesSecurely checks this same HTTPS prefix.
  assert.equal(manifest.applications.zotero.update_url.startsWith('https:'), true);
});

for (const field of ['id', 'update_url', 'strict_max_version']) {
  test(`installed Zotero rejects a missing ${field}`, () => {
    const broken = JSON.parse(JSON.stringify(manifest));
    delete broken.applications.zotero[field];
    assert.deepEqual(installerErrors(broken), [`applications.zotero.${field} not provided`]);
  });
}
