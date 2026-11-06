import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleLabelled, trainAll, predict, parseLabelled, split } from '../src/services/train.js'

test('split is stratified and disjoint', () => {
  const rows = sampleLabelled(60); const { train, test: te } = split(rows)
  assert.equal(train.length + te.length, 60); assert.ok(te.length > 10)
})
test('logreg learns the sample data above chance on held-out set', () => {
  const r = trainAll(sampleLabelled(150))
  assert.ok(r.logreg.test.acc > 0.6, 'acc ' + r.logreg.test.acc)
  assert.ok(r.edges.test.acc > 0.5)
  assert.ok([0, 1, 2].includes(predict(r.logreg.model, { mb: 12, L: 39, a: 22, b: 11 })))
})
test('parseLabelled handles id,mb,L,a,b,label and mb,label', () => {
  const rows = parseLabelled('S1,3.2,40,20,11,0\n9.5,1\nbad')
  assert.equal(rows.length, 2); assert.equal(rows[0].y, 0); assert.ok(Number.isNaN(rows[1].L))
})
