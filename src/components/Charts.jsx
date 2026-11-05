import { STATUSES, GRADES } from '../config'
import { useI18n } from '../contexts/I18nContext'

export function Stat({ label, value, unit, accent }) {
  return (
    <div className="card p-4">
      <div className="muted text-sm">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`num text-3xl font-semibold ${accent ? 'text-primary-600 dark:text-primary-300' : ''}`}>{value}</span>
        {unit && <span className="muted text-sm">{unit}</span>}
      </div>
    </div>
  )
}
export function StatusBadge({ s }) {
  const { t } = useI18n(); const c = STATUSES.find((x) => x.key === s)
  return <span className="chip" style={{ background: (c?.color || '#888') + '22', color: c?.color || '#888' }}><span className="h-2 w-2 rounded-full" style={{ background: c?.color || '#888' }} />{t('status_' + s)}</span>
}
function Bars({ rows, total, label }) {
  const { fmt } = useI18n()
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => {
        const pct = total ? (r.n / total) * 100 : 0
        return (
          <div key={r.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm"><span className="font-medium">{label(r.key)}</span><span className="num"><b>{fmt(r.n)}</b> · {fmt(pct, 1)}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"><div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: r.color }} /></div>
          </div>
        )
      })}
    </div>
  )
}
export function StatusBars({ byStatus, total }) { const { t } = useI18n(); return <Bars total={total} label={(k) => t('status_' + k)} rows={STATUSES.map((s) => ({ key: s.key, color: s.color, n: byStatus[s.key] || 0 }))} /> }
export function GradeBars({ byGrade, total }) { const { t } = useI18n(); return <Bars total={total} label={(k) => t('grade_' + k)} rows={GRADES.map((g) => ({ key: g.key, color: g.color, n: byGrade[g.key] || 0 }))} /> }

// marbling histogram (3 % bins) as plain SVG — prints crisply on the lot report
export function Histogram({ bins, height = 150 }) {
  const { t } = useI18n(); const max = Math.max(1, ...bins.map((b) => b.n)); const w = 100 / bins.length
  return (
    <div>
      <svg viewBox={`0 0 100 ${height / 3}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={t('marbling_dist')}>
        {bins.map((b, i) => { const h = (b.n / max) * (height / 3 - 2); return <rect key={b.from} x={i * w + 0.6} y={height / 3 - h} width={w - 1.2} height={h} rx="0.8" fill="#c2303f" opacity={b.n ? 0.88 : 0.15} /> })}
      </svg>
      <div className="muted mt-1 grid text-[11px]" style={{ gridTemplateColumns: `repeat(${bins.length}, 1fr)` }}>{bins.map((b) => <span key={b.from} className="text-center">{b.from}</span>)}</div>
      <div className="muted text-center text-[11px]">{t('unit_mb')}</div>
    </div>
  )
}
