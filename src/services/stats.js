import { STATUSES, GRADES, gradeOf } from '../config.js'

// Everything on the dashboard / report is computed here from the raw per-tray records
// ({ t, mb %, L, a, b, tp °C, nh raw, st: ok|watch|alarm, conf }) so the page and the printed report never disagree.
export function lotStats(itemsObj) {
  const items = Object.values(itemsObj || {}).filter((i) => i && typeof i.mb === 'number').sort((a, b) => a.t - b.t)
  const n = items.length
  const mean = (k) => (n ? items.reduce((s, i) => s + (i[k] || 0), 0) / n : 0)
  const mbMean = mean('mb')
  const mbSd = n > 1 ? Math.sqrt(items.reduce((s, i) => s + (i.mb - mbMean) ** 2, 0) / (n - 1)) : 0
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.key, 0]))
  const byGrade = Object.fromEntries(GRADES.map((g) => [g.key, 0]))
  for (const i of items) { if (byStatus[i.st] !== undefined) byStatus[i.st]++; byGrade[gradeOf(i.mb)]++ }
  const bins = Array.from({ length: 10 }, (_, k) => ({ from: k * 3, n: 0 }))           // 3 % bins, 0 … 30 %
  for (const i of items) bins[Math.max(0, Math.min(9, Math.floor(i.mb / 3)))].n++
  const last = n ? items[n - 1].t : 0
  const recentN = items.filter((i) => i.t > last - 600000).length
  const span = n > 1 ? Math.min(600000, last - items[0].t) : 0
  const rate = span > 60000 ? recentN / (span / 60000) : 0
  return {
    n, mbMean, mbSd, mbMin: n ? Math.min(...items.map((i) => i.mb)) : 0, mbMax: n ? Math.max(...items.map((i) => i.mb)) : 0,
    L: mean('L'), a: mean('a'), b: mean('b'), tp: mean('tp'), tpMax: n ? Math.max(...items.map((i) => i.tp)) : 0,
    byStatus, byGrade, bins, rate, first: n ? items[0].t : 0, last, recent: items.slice(-12).reverse(),
  }
}
