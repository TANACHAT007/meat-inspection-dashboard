import test from 'node:test'
import assert from 'node:assert/strict'
import { lotStats } from '../src/services/stats.js'
import { buildDemo } from '../src/services/demoData.js'

test('lotStats on the demo lot is consistent', () => {
  const d = buildDemo(1700000000000); const items = d.items['LOT-DEMO-002']; const s = lotStats(items)
  assert.equal(s.n, Object.keys(items).length)
  assert.equal(s.byStatus.ok + s.byStatus.watch + s.byStatus.alarm, s.n)
  assert.equal(s.bins.reduce((a, b) => a + b.n, 0), s.n)
  assert.equal(s.byGrade.low + s.byGrade.medium + s.byGrade.high, s.n)
})
