// SAMPLE data so the site works before the station is connected (clearly labelled in the UI). Deterministic pseudo-random.
// These numbers are INVENTED for the demo — they are not measurements.
function rng(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }

export function makeTray(r, t) {
  const gauss = () => (r() + r() + r() + r() - 2) / 0.58
  const mb = Math.max(0.5, Math.min(26, 8.5 + gauss() * 4.2))
  const tp = Math.max(0.5, 3.2 + gauss() * 1.6 + (r() < 0.08 ? 5 : 0))             // surface °C
  const nh = Math.round(Math.max(40, 120 + gauss() * 40 + (r() < 0.06 ? 160 : 0)))  // MQ-137 raw (relative)
  const L = Math.round((40 + gauss() * 3.4) * 10) / 10
  const a = Math.round((21 + gauss() * 3 - (tp > 7 ? 5 : 0)) * 10) / 10
  const b = Math.round((11 + gauss() * 1.6) * 10) / 10
  const st = tp > 10 || a < 12 || nh > 260 ? 'alarm' : tp > 7 || a < 14 || nh > 200 ? 'watch' : 'ok'
  return { t, mb: Math.round(mb * 10) / 10, L, a, b, tp: Math.round(tp * 10) / 10, nh, st, conf: Math.round((0.8 + r() * 0.19) * 100) / 100 }
}

function makeLot(id, name, started, n, seed, open = false) {
  const r = rng(seed); const items = {}; let t = started
  for (let i = 0; i < n; i++) { t += 9000 + Math.floor(r() * 9000); items['d' + String(i).padStart(4, '0')] = makeTray(r, t) }
  return { meta: { id, name, source: 'เนื้อสันนอก (ตัวอย่าง)', started, ended: open ? null : t }, items }
}

export function buildDemo(now = Date.now()) {
  const day = 86400000
  const lots = [
    makeLot('LOT-DEMO-003', 'ล็อตตัวอย่าง เช้า', now - 12 * 60000, 58, 31, true),
    makeLot('LOT-DEMO-002', 'ล็อตตัวอย่าง เมื่อวาน', now - day - 3 * 3600000, 140, 22),
    makeLot('LOT-DEMO-001', 'ชุดทดสอบเครื่อง', now - 3 * day, 36, 13),
  ]
  const out = { lots: {}, items: {}, machine: { status: { state: 'running', updated: now, lot: lots[0].meta.id } } }
  for (const l of lots) { out.lots[l.meta.id] = l.meta; out.items[l.meta.id] = l.items }
  return out
}
export function demoNextItem(k) { return makeTray(rng(977 + k * 7919), Date.now()) }

// sample validation set (expert grade vs measured marbling) — INVENTED, only to show the page working
export function demoValidation() {
  const r = rng(4242); const rows = []
  for (let i = 0; i < 60; i++) {
    const truth = i % 3                                    // 0 low, 1 medium, 2 high (expert)
    const centre = [2.8, 7, 13.5][truth]
    const mb = Math.max(0.5, centre + ((r() + r() + r() - 1.5) * 4.2))
    rows.push({ id: 'S' + String(i + 1).padStart(2, '0'), mb: Math.round(mb * 10) / 10, expert: truth })
  }
  return rows
}
