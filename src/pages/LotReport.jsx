import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useData } from '../contexts/DataContext'
import { useI18n } from '../contexts/I18nContext'
import { lotStats } from '../services/stats'
import { GRADES, MACHINE, STATUSES } from '../config'
import { Histogram } from '../components/Charts'
import { Logo } from '../components/Layout'

const Row = ({ k, v }) => (<div className="flex justify-between gap-4 border-b border-black/5 py-2 last:border-0 dark:border-white/10"><span className="muted">{k}</span><span className="num text-right font-medium">{v}</span></div>)

export default function LotReport() {
  const { id } = useParams(); const { lots, items, ready, demo, watchLot } = useData(); const { t, fmt, fmtTime, lang } = useI18n()
  const [copied, setCopied] = useState(false); const lot = lots[id]
  useEffect(() => { watchLot(id) }, [id, watchLot])
  const st = useMemo(() => lotStats(items[id]), [items, id]); const url = window.location.href
  if (!ready) return <div className="muted py-20 text-center">…</div>
  if (!lot) return <div className="card p-10 text-center"><p className="mb-4">{t('not_found')}</p><Link className="btn-primary" to="/lots">{t('back')}</Link></div>
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* blocked */ } }
  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2"><Link to="/lots" className="btn-ghost text-sm">← {t('back')}</Link>
        <div className="ml-auto flex gap-2"><button className="btn-ghost text-sm" onClick={copy}>{copied ? t('copied') : t('copy_link')}</button><button className="btn-primary text-sm" onClick={() => window.print()}>{t('print')}</button></div></div>
      <article className="card p-6 sm:p-8">
        <header className="flex items-start gap-4 border-b border-black/10 pb-5 dark:border-white/10">
          <Logo size={48} />
          <div className="min-w-0 flex-1"><h1 className="text-2xl">{t('report_title')}</h1><p className="muted text-sm">{t('report_sub')}</p><p className="muted mt-1 text-xs">{MACHINE.name[lang]}</p></div>
          <div className="text-center"><div className="rounded-lg bg-white p-1.5"><QRCodeSVG value={url} size={84} /></div><div className="muted mt-1 max-w-[100px] text-[10px] leading-tight">{t('scan_to_verify')}</div></div>
        </header>
        {demo && <p className="mt-4 rounded-lg bg-primary-100 px-3 py-2 text-sm text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">{t('demo_banner')}</p>}
        <div className="mt-5 grid gap-x-10 sm:grid-cols-2">
          <div><Row k={t('lot_id')} v={lot.id} /><Row k={t('lot_name')} v={lot.name || '—'} /><Row k={t('source')} v={lot.source || '—'} /><Row k={t('started')} v={fmtTime(lot.started || st.first)} /><Row k={t('ended')} v={lot.ended ? fmtTime(lot.ended) : t('lot_open')} /></div>
          <div><Row k={t('total_trays')} v={`${fmt(st.n)} ${t('trays')}`} /><Row k={t('avg_marbling')} v={`${fmt(st.mbMean, 1)} %`} /><Row k={t('min_max')} v={`${fmt(st.mbMin, 1)} – ${fmt(st.mbMax, 1)} %`} /><Row k={t('std_dev')} v={`${fmt(st.mbSd, 1)} %`} /><Row k={t('lean_color')} v={`${fmt(st.L, 1)} / ${fmt(st.a, 1)} / ${fmt(st.b, 1)}`} /><Row k={t('max_temp')} v={`${fmt(st.tpMax, 1)} °C`} /></div>
        </div>
        <h2 className="mb-2 mt-6 text-lg">{t('by_status')}</h2>
        <table className="num w-full text-sm"><thead className="muted text-left"><tr><th className="py-1.5 font-medium"></th><th className="font-medium">{t('total_trays')}</th><th className="text-right font-medium">{t('share')}</th></tr></thead>
          <tbody>{STATUSES.map((c) => (<tr key={c.key} className="border-t border-black/5 dark:border-white/10"><td className="py-2"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{t('status_' + c.key)}</td><td>{fmt(st.byStatus[c.key])}</td><td className="text-right">{fmt(st.n ? (st.byStatus[c.key] / st.n) * 100 : 0, 1)}%</td></tr>))}</tbody></table>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div><h2 className="mb-2 text-lg">{t('marbling_dist')}</h2><Histogram bins={st.bins} height={120} /></div>
          <div><h2 className="mb-2 text-lg">{t('by_grade')}</h2>{GRADES.map((g) => <Row key={g.key} k={t('grade_' + g.key)} v={`${fmt(st.byGrade[g.key])} ${t('trays')}`} />)}</div>
        </div>
        <footer className="muted mt-7 border-t border-black/10 pt-4 text-xs leading-relaxed dark:border-white/10">{t('disclaimer')}<div className="mt-1 break-all">{url}</div></footer>
      </article>
    </div>
  )
}
