// In-browser training of the grade classifier (0 low · 1 medium · 2 high) from labelled packs.
// Pure functions (tests/train.test.mjs). A model trained on SAMPLE data is only a demo — train on real, expert-labelled packs.
import { confusion, metrics, bestEdges } from './validate.js'

export const FEATS = ['mb', 'L', 'a', 'b']
export function parseLabelled(text) {            // lines: id?, mb, L, a, b, label   (label 0/1/2) — or just: mb,label
  const rows = []
  for (const line of String(text).split(/\r?\n/)) {
    const p = line.split(/[,;\t]/).map((s) => s.trim()).filter((s, i, a) => s !== '' || i < a.length)
    const nums = p.map(parseFloat)
    const label = parseInt(p[p.length - 1], 10)
    if (![0, 1, 2].includes(label)) continue
    const v = nums.slice(0, -1).filter((x) => Number.isFinite(x))
    if (v.length >= 4) { const f = v.slice(-4); rows.push({ mb: f[0], L: f[1], a: f[2], b: f[3], y: label }) }
    else if (v.length >= 1 && Number.isFinite(nums[p.length - 2])) rows.push({ mb: nums[p.length - 2], L: NaN, a: NaN, b: NaN, y: label })
  }
  return rows
}
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }
export function split(rows, frac = 0.7, seed = 7) {      // stratified shuffle split
  const r = rng(seed); const tr = []; const te = []
  for (const k of [0, 1, 2]) {
    const g = rows.filter((x) => x.y === k).map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1])
    const c = Math.max(g.length > 1 ? 1 : 0, Math.round(g.length * frac)); tr.push(...g.slice(0, c)); te.push(...g.slice(c))
  }
  return { train: tr, test: te }
}
const vec = (r, feats) => feats.map((f) => r[f])
export function fitScaler(rows, feats) {
  const mu = feats.map((f) => rows.reduce((s, r) => s + r[f], 0) / rows.length)
  const sd = feats.map((f, i) => Math.sqrt(rows.reduce((s, r) => s + (r[f] - mu[i]) ** 2, 0) / rows.length) || 1)
  return { mu, sd }
}
function softmax(z) { const m = Math.max(...z); const e = z.map((x) => Math.exp(x - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s) }
// multinomial logistic regression, batch gradient descent, L2
export function trainLogReg(rows, feats = FEATS, { epochs = 600, lr = 0.3, l2 = 0.01 } = {}) {
  const sc = fitScaler(rows, feats); const d = feats.length
  const X = rows.map((r) => vec(r, feats).map((x, i) => (x - sc.mu[i]) / sc.sd[i]))
  const W = [0, 1, 2].map(() => new Array(d + 1).fill(0))
  for (let ep = 0; ep < epochs; ep++) {
    const G = [0, 1, 2].map(() => new Array(d + 1).fill(0))
    X.forEach((x, n) => {
      const p = softmax(W.map((w) => w[d] + w.slice(0, d).reduce((s, wi, i) => s + wi * x[i], 0)))
      for (let k = 0; k < 3; k++) { const e = p[k] - (rows[n].y === k ? 1 : 0); for (let i = 0; i < d; i++) G[k][i] += e * x[i]; G[k][d] += e }
    })
    for (let k = 0; k < 3; k++) for (let i = 0; i <= d; i++) W[k][i] -= lr * (G[k][i] / X.length + (i < d ? l2 * W[k][i] : 0))
  }
  return { kind: 'logreg', feats, ...sc, W }
}
export function predict(model, r) {
  if (!model) return null
  if (model.kind === 'edges') return r.mb < model.edges[0] ? 0 : r.mb < model.edges[1] ? 1 : 2
  const x = model.feats.map((f, i) => ((r[f] ?? 0) - model.mu[i]) / model.sd[i]); const d = x.length
  const p = softmax(model.W.map((w) => w[d] + w.slice(0, d).reduce((s, wi, i) => s + wi * x[i], 0)))
  return p.indexOf(Math.max(...p))
}
export function evaluate(model, rows) {
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (const r of rows) m[r.y][predict(model, r)]++
  return { m, ...metrics(m) }
}
// train both: threshold-only (marbling %) and logistic regression; report on the held-out test set
export function trainAll(rows, seed = 7) {
  const { train, test } = split(rows, 0.7, seed)
  const hasColour = rows.every((r) => [r.L, r.a, r.b].every(Number.isFinite))
  const be = bestEdges(train.map((r) => ({ mb: r.mb, expert: r.y })))
  const edgesModel = { kind: 'edges', edges: be ? be.edges.map((v) => Math.round(v * 10) / 10) : [4, 10] }
  const out = { train: train.length, test: test.length, edges: { model: edgesModel, test: evaluate(edgesModel, test), train: evaluate(edgesModel, train) } }
  if (hasColour && train.length >= 9) { const lr = trainLogReg(train); out.logreg = { model: lr, test: evaluate(lr, test), train: evaluate(lr, train) } }
  return out
}
// SAMPLE labelled packs (INVENTED — shows the page working; carries the same colour/marbling relation as demoData)
export function sampleLabelled(n = 150, seed = 99) {
  const r = rng(seed); const g = () => (r() + r() + r() + r() - 2) / 0.58; const rows = []
  for (let i = 0; i < n; i++) {
    const y = i % 3; const mb = Math.max(0.5, [2.8, 7, 13.5][y] + g() * 2.6)
    rows.push({ mb: +mb.toFixed(1), L: +(40 + g() * 3 - y * 0.8).toFixed(1), a: +(21 + g() * 2.5 + y * 0.9).toFixed(1), b: +(11 + g() * 1.4).toFixed(1), y })
  }
  return rows
}
export const MODEL_KEY = 'mq_model_v1'
export const saveModel = (m) => { try { localStorage.setItem(MODEL_KEY, JSON.stringify(m)) } catch { /* private mode */ } }
export const loadModel = () => { try { return JSON.parse(localStorage.getItem(MODEL_KEY) || 'null') } catch { return null } }
export const clearModel = () => { try { localStorage.removeItem(MODEL_KEY) } catch { /* ignore */ } }
