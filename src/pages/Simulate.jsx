import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { GRADES, STATUSES } from '../config'
import { makeTray } from '../services/demoData'
import { loadModel, predict, rng } from '../services/train'

// Browser simulation of the station: same state machine as the firmware (FEED → AT_CAM → TO_SEN → AT_SEN → CLEAR).
// Everything here is SIMULATED: pack values are invented, sensor noise is an assumption — not measurements.
const W = 640, X_CAM = 190, X_SEN = 400, X_END = 600, PW = 64, BELT_V = 90   // px, px/s
const MIX = { mixed: null, low: [1, 4], medium: [4, 10], high: [10, 20] }
const col = (a) => `rgb(${Math.round(95 + a * 2.2)},${Math.round(40 - a * 0.4)},${Math.round(48 - a * 0.4)})`

export default function Simulate() {
  const { t, fmt } = useI18n()
  const [run, setRun] = useState(true); const [estop, setEstop] = useState(false); const [speed, setSpeed] = useState(1); const [mix, setMix] = useState('mixed')
  const [useModel, setUseModel] = useState(true); const [noise, setNoise] = useState(1.2); const [spoil, setSpoil] = useState(8)
  const [, tick] = useState(0); const [log, setLog] = useState([]); const [phase, setPhase] = useState('FEED')
  const model = loadModel(); const sim = useRef({ packs: [], hold: 0, n: 0, r: rng(12345), last: 0 })
  const cfg = useRef({}); cfg.current = { run, estop, speed, mix, useModel, noise, spoil, model }

  useEffect(() => {
    let raf; let prev = performance.now()
    const loop = (now) => {
      const c = cfg.current; const s = sim.current; const dt = Math.min(1, (now - prev) / 1000) * c.speed; prev = now
      if (c.run && !c.estop) {
        const spawnGap = s.packs.length === 0 || Math.min(...s.packs.map((p) => p.x)) > 40 + PW + 90
        if (spawnGap && s.hold <= 0) {
          const tr = makeTray(s.r, Date.now()); const rg = MIX[c.mix]
          if (rg) tr.mb = +(rg[0] + s.r() * (rg[1] - rg[0])).toFixed(1)
          if (s.r() * 100 < c.spoil) { tr.tp = +(8 + s.r() * 6).toFixed(1); tr.a = +(10 + s.r() * 3).toFixed(1); tr.nh = Math.round(210 + s.r() * 120) }
          s.n++; s.packs.push({ id: s.n, x: -PW, truth: tr, camDone: false, senDone: false, res: null, wait: 0, flash: 0 })
        }
        let stopped = false
        for (const p of s.packs) {
          const cx = p.x + PW / 2
          if (!p.camDone && cx >= X_CAM) { stopped = true; p.wait += dt; p.flash = p.wait; if (p.wait > 1.4) { p.camDone = true; p.wait = 0; p.flash = 0; const meas = Math.max(0.3, p.truth.mb + (s.r() + s.r() + s.r() - 1.5) * 2 * c.noise); const f = { mb: +meas.toFixed(1), L: p.truth.L, a: p.truth.a, b: p.truth.b }
            const g = c.useModel && c.model ? predict(c.model, f) : (f.mb < 4 ? 0 : f.mb < 10 ? 1 : 2); p.res = { mb: f.mb, grade: g } } }
          else if (!p.senDone && cx >= X_SEN) { stopped = true; p.wait += dt; if (p.wait > 1.0) { p.senDone = true; p.wait = 0; const k = p.truth; p.res = { ...p.res, tp: k.tp, nh: k.nh, st: k.st }
            setLog((l) => [{ id: p.id, ...p.res, truth: k.mb }, ...l].slice(0, 14)) } }
        }
        if (!stopped) for (const p of s.packs) p.x += BELT_V * dt
        s.packs = s.packs.filter((p) => p.x < W + 10)
        const cur = s.packs.find((p) => !p.camDone && p.x + PW / 2 >= X_CAM) ? 'AT_CAM' : s.packs.find((p) => !p.senDone && p.x + PW / 2 >= X_SEN) ? 'AT_SEN' : s.packs.some((p) => p.camDone && !p.senDone) ? 'TO_SEN' : s.packs.some((p) => p.senDone) ? 'CLEAR' : 'FEED'
        setPhase((o) => (o === cur ? o : cur))
      }
      tick((n) => (n + 1) % 1e6); raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf)
  }, [])

  const s = sim.current; const done = log.length; const hit = log.filter((x) => (x.mb < 4 ? 0 : x.mb < 10 ? 1 : 2) === (x.truth < 4 ? 0 : x.truth < 10 ? 1 : 2)).length
  const cam = s.packs.find((p) => p.flash > 0)
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl">{t('sim_title')}</h1><p className="muted text-sm">{t('sim_sub')}</p></div>
      <div className="rounded-xl bg-primary-100 px-4 py-2 text-sm text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">{t('sim_note')}</div>
      <section className="card overflow-hidden p-3">
        <svg viewBox={`0 0 ${W} 230`} className="w-full" role="img" aria-label="simulation">
          <rect x="0" y="0" width={W} height="230" className="fill-stone-100 dark:fill-ink-900" />
          <rect x="10" y="96" width={W - 20} height="70" rx="8" fill="#3a3f46" /><rect x="10" y="96" width={W - 20} height="6" fill="#555b63" /><rect x="10" y="160" width={W - 20} height="6" fill="#2b2f35" />
          {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={i * 21 + 12} y="100" width="2" height="60" fill="#4a5058" />)}
          <circle cx="24" cy="131" r="18" fill="#666d76" /><circle cx={W - 24} cy="131" r="18" fill="#666d76" />
          {/* tunnel + camera */}
          <rect x={X_CAM - 62} y="40" width="124" height="136" rx="10" fill="#9fd4ff" opacity="0.18" stroke="#6fb1e8" /><rect x={X_CAM - 14} y="22" width="28" height="22" rx="4" fill="#222" /><circle cx={X_CAM} cy="33" r="6" fill={cam ? '#fff' : '#555'} />
          {cam && <><rect x={X_CAM - 62} y="40" width="124" height="136" rx="10" fill="#fff" opacity="0.28" /><text x={X_CAM} y="196" textAnchor="middle" className="fill-primary-600" fontSize="12">{t('sim_capture')}</text></>}
          {/* sensor station */}
          <rect x={X_SEN - 40} y="40" width="80" height="136" rx="10" fill="#ffd9a0" opacity="0.14" stroke="#e0a13a" /><rect x={X_SEN - 24} y="26" width="48" height="16" rx="3" fill="#2f5d8a" /><text x={X_SEN} y="196" textAnchor="middle" className="muted" fontSize="11">AS7341 · MLX · MQ-137</text>
          <rect x="560" y="70" width="64" height="26" rx="4" className="fill-stone-300 dark:fill-ink-700" /><text x="592" y="86" textAnchor="middle" className="muted" fontSize="10">{t('sim_tray')}</text>
          {s.packs.map((p) => (
            <g key={p.id} transform={`translate(${p.x},104)`}>
              <rect width={PW} height="54" rx="7" fill="#f4f1ea" stroke="#cfcabd" /><rect x="6" y="6" width={PW - 12} height="42" rx="5" fill={col(p.truth.a)} />
              {Array.from({ length: Math.round(p.truth.mb / 2.2) + 1 }).map((_, i) => <path key={i} d={`M${10 + ((i * 13) % 42)} ${10 + ((i * 7) % 30)} l ${10 + (i % 3) * 4} ${(i % 2 ? 1 : -1) * 3}`} stroke="#f5dcd0" strokeWidth="1.6" strokeLinecap="round" />)}
              {p.res && <g><rect x="2" y="-20" width="60" height="16" rx="8" fill={GRADES[p.res.grade].color} /><text x="32" y="-8" textAnchor="middle" fill="#fff" fontSize="10">{t('grade_' + GRADES[p.res.grade].key)} {fmt(p.res.mb, 1)}%</text></g>}
              {p.senDone && <circle cx={PW - 6} cy="6" r="5" fill={STATUSES.find((x) => x.key === p.res.st).color} />}
            </g>))}
        </svg>
      </section>
      <section className="card flex flex-wrap items-center gap-3 p-4 text-sm">
        <button className="btn-primary" onClick={() => { setEstop(false); setRun(true) }}>{t('sim_start')}</button>
        <button className="btn-ghost" onClick={() => setRun(false)}>{t('sim_pause')}</button>
        <button className={`rounded-xl px-4 py-2 font-semibold text-white ${estop ? 'bg-stone-500' : 'bg-red-600'}`} onClick={() => setEstop((v) => !v)}>{estop ? t('sim_release') : 'E-STOP'}</button>
        <span className="muted ml-2">{t('sim_phase')}: <b className="num text-ink-900 dark:text-white">{estop ? 'ESTOP' : phase}</b></span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1">{t('sim_speed')}<select value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900">{[1, 2, 4].map((v) => <option key={v} value={v}>×{v}</option>)}</select></label>
          <label className="flex items-center gap-1">{t('sim_mix')}<select value={mix} onChange={(e) => setMix(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900">{Object.keys(MIX).map((k) => <option key={k} value={k}>{t('sim_mix_' + k)}</option>)}</select></label>
          <label className="flex items-center gap-1">{t('sim_noise')} {fmt(noise, 1)}<input type="range" min="0" max="4" step="0.2" value={noise} onChange={(e) => setNoise(+e.target.value)} /></label>
          <label className="flex items-center gap-1">{t('sim_spoil')} {spoil}%<input type="range" min="0" max="40" step="2" value={spoil} onChange={(e) => setSpoil(+e.target.value)} /></label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={useModel && !!model} disabled={!model} onChange={(e) => setUseModel(e.target.checked)} />{model ? t('sim_use_model') : t('sim_no_model')}</label>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-5"><div className="muted text-sm">{t('sim_done')}</div><div className="num text-3xl font-semibold">{done}</div><div className="muted mt-3 text-sm">{t('sim_match')}</div><div className="num text-3xl font-semibold text-primary-600 dark:text-primary-300">{done ? fmt((hit / done) * 100, 0) + '%' : '—'}</div><div className="muted mt-1 text-xs">{t('sim_match_note')}</div></section>
        <section className="card p-5 lg:col-span-2"><h2 className="mb-2 text-lg">{t('recent')}</h2>
          <table className="num w-full text-sm"><thead className="muted text-left"><tr><th>#</th><th>{t('sim_truth')}</th><th>{t('sim_meas')}</th><th>{t('sim_grade')}</th><th>°C</th><th>NH₃</th><th /></tr></thead>
            <tbody>{log.map((x) => <tr key={x.id} className="border-t border-black/5 dark:border-white/10"><td>{x.id}</td><td>{fmt(x.truth, 1)}%</td><td>{fmt(x.mb, 1)}%</td><td>{t('grade_' + GRADES[x.grade].key)}</td><td>{fmt(x.tp, 1)}</td><td>{x.nh}</td><td><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUSES.find((q) => q.key === x.st)?.color }} /></td></tr>)}</tbody></table>
          {!log.length && <div className="muted py-6 text-center">…</div>}</section>
      </div>
    </div>
  )
}
