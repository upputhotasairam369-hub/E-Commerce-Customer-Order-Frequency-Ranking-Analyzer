import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
function analyze(input, flags = []) {
 const run = spawnSync('./build/analyzer', ['--json', ...flags], { input, encoding: 'utf8' });
 assert.equal(run.status, 0, run.stderr);
 return JSON.parse(run.stdout);
}
test('normalizes whitespace and case, counts, alphabetizes and breaks ranking ties', () => {
 const r = analyze(' Shoes\nshoes \nWATCH\nwatch\n  laptop   stand  \n\n');
 assert.equal(r.total, 5); assert.equal(r.unique, 3);
 assert.deepEqual(r.alphabetical, [{term:'laptop stand',count:1},{term:'shoes',count:2},{term:'watch',count:2}]);
 assert.deepEqual(r.ranked.map(x=>x.term), ['shoes','watch','laptop stand']);
 assert.equal(r.benchmark.operations, 20000);
 assert.ok(r.benchmark.mapUs >= 0 && r.benchmark.vectorUs >= 0);
});
test('case sensitive option preserves distinct strings', () => {
 assert.equal(analyze('Shoes\nshoes', ['--case-sensitive']).unique, 2);
});
test('empty input is valid with no benchmark operations', () => {
 const r = analyze('\n \t\n'); assert.equal(r.total, 0); assert.deepEqual(r.ranked, []); assert.equal(r.benchmark.operations, 0);
});
test('JSON escaping and UTF-8 round trip', () => {
 const term = 'café "bag" \\ pouch'; assert.equal(analyze(term).ranked[0].term, term);
});
test('console displays both ordered tables', () => {
 const r = spawnSync('./build/analyzer', [], { input: 'b\na\nb', encoding: 'utf8' });
 assert.equal(r.status,0); assert.match(r.stdout,/ALPHABETICAL FREQUENCY TABLE/); assert.match(r.stdout,/1\. b — 2/);
});
test('rejects oversized queries and datasets', () => {
 for (const input of ['a'.repeat(501), 'a\n'.repeat(10001)]) {
   const r = spawnSync('./build/analyzer', ['--json'], {input, encoding:'utf8'}); assert.equal(r.status,1);
 }
});
