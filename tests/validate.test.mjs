import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, confusion, metrics, bestEdges, gradeBy } from '../src/services/validate.js'

test('parseCsv reads id,mb,expert and skips bad lines', () => {
  const r = parseCsv('id,mb,expert\nA1,3.2,0\nA2,9.5,1\nbad,line\nA3,14,2')
  assert.equal(r.length, 3); assert.equal(r[1].expert, 1)
})
test('perfect agreement gives accuracy 1 and kappa 1', () => {
  const rows = [{ mb: 2, expert: 0 }, { mb: 3, expert: 0 }, { mb: 7, expert: 1 }, { mb: 8, expert: 1 }, { mb: 13, expert: 2 }, { mb: 15, expert: 2 }]
  const m = metrics(confusion(rows, [4, 10]))
  assert.equal(m.acc, 1); assert.ok(Math.abs(m.kappa - 1) < 1e-9)
})
test('bestEdges finds thresholds separating the classes', () => {
  const rows = [{ mb: 2, expert: 0 }, { mb: 3, expert: 0 }, { mb: 7, expert: 1 }, { mb: 8, expert: 1 }, { mb: 13, expert: 2 }, { mb: 15, expert: 2 }]
  const b = bestEdges(rows); assert.equal(b.acc, 1); assert.equal(gradeBy(3, b.edges), 0); assert.equal(gradeBy(14, b.edges), 2)
})
