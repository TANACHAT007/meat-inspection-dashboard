// Validation of the machine's marbling grade against an expert's grade (0 low · 1 medium · 2 high).
// Pure functions (tested in tests/validate.test.mjs). The machine's result is only trustworthy after this has been done on REAL packs.
export function parseCsv(text) {
  const rows = []
  for (const line of String(text).split(/\r?\n/)) {
    const p = line.split(/[,;\t]/).map((s) => s.trim())
    if (p.length < 2) continue
    const mb = parseFloat(p[p.length - 2]); const ex = parseInt(p[p.length - 1], 10)
    if (Number.isFinite(mb) && [0, 1, 2].includes(ex)) rows.push({ id: p.length > 2 ? p[0] : 'r' + (rows.length + 1), mb, expert: ex })
  }
  return rows
}
export const gradeBy = (mb, edges) => (mb < edges[0] ? 0 : mb < edges[1] ? 1 : 2)
export function confusion(rows, edges) {
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]                   // m[expert][machine]
  for (const r of rows) m[r.expert][gradeBy(r.mb, edges)]++
  return m
}
export function metrics(m) {
  const n = m.flat().reduce((a, b) => a + b, 0)
  const diag = m[0][0] + m[1][1] + m[2][2]
  const rowSum = m.map((r) => r[0] + r[1] + r[2]); const colSum = [0, 1, 2].map((j) => m[0][j] + m[1][j] + m[2][j])
  const pe = n ? [0, 1, 2].reduce((s, k) => s + rowSum[k] * colSum[k], 0) / (n * n) : 0
  const acc = n ? diag / n : 0
  return { n, acc, kappa: pe < 1 ? (acc - pe) / (1 - pe) : 0, recall: [0, 1, 2].map((k) => (rowSum[k] ? m[k][k] / rowSum[k] : null)) }
}
// brute-force the two thresholds that maximise accuracy on this data (suggestion only — needs a held-out set to confirm)
export function bestEdges(rows) {
  const v = [...new Set(rows.map((r) => r.mb))].sort((a, b) => a - b)
  if (v.length < 3) return null
  const cand = v.slice(1).map((x, i) => (x + v[i]) / 2)
  let best = null
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
    const e = [cand[i], cand[j]]; const a = metrics(confusion(rows, e)).acc
    if (!best || a > best.acc) best = { edges: e, acc: a }
  }
  return best
}
