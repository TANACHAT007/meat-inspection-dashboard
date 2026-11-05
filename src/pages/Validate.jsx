import { useMemo, useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { GRADES } from '../config'
import { demoValidation } from '../services/demoData'
import { bestEdges, confusion, metrics, parseCsv } from '../services/validate'

export default function Validate() {
  const { t, fmt } = useI18n()
  const [text, setText] = useState(''); const [rows, setRows] = useState([]); const [demo, setDemo] = useState(false); const [edges, setEdges] = useState([4, 10])
  const m = useMemo(() => confusion(rows, edges), [rows, edges]); const mt = useMemo(() => metrics(m), [m]); const best = useMemo(() => bestEdges(rows), [rows])
  const run = () => { setRows(parseCsv(text)); setDemo(false) }
  const sample = () => { const r = demoValidation(); setRows(r); setDemo(true); setText(r.map((x) => `${x.id},${x.mb},${x.expert}`).join('\n')) }
  const name = (k) => t('grade_' + GRADES[k].key)
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl">{t('val_title')}</h1><p className="muted text-sm">{t('val_sub')}</p></div>
      <section className="card p-5">
        <label className="mb-2 block text-sm font-medium">{t('val_input')}</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={'S01,3.2,0\nS02,9.5,1\nS03,14.1,2'} className="w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-sm dark:border-white/15 dark:bg-ink-900" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-primary text-sm" onClick={run}>{t('val_run')}</button><button className="btn-ghost text-sm" onClick={sample}>{t('val_sample')}</button>
          <div className="ml-auto flex items-center gap-2 text-sm"><span className="muted">{t('val_edges')}</span>
            {[0, 1].map((i) => <input key={i} type="number" step="0.1" value={edges[i]} onChange={(e) => setEdges((p) => p.map((v, j) => (j === i ? parseFloat(e.target.value) || 0 : v)))} className="num w-20 rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900" />)}</div>
        </div>
      </section>
      {demo && <div className="rounded-xl bg-primary-100 px-4 py-2 text-sm text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">{t('val_demo')}</div>}
      {!rows.length ? <div className="card muted p-10 text-center">{t('val_none')}</div> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card p-5">
            <div className="grid grid-cols-3 gap-3"><div><div className="muted text-sm">N</div><div className="num text-2xl font-semibold">{fmt(mt.n)}</div></div>
              <div><div className="muted text-sm">{t('val_acc')}</div><div className="num text-2xl font-semibold text-primary-600 dark:text-primary-300">{fmt(mt.acc * 100, 1)}%</div></div>
              <div><div className="muted text-sm">{t('val_kappa')}</div><div className="num text-2xl font-semibold">{fmt(mt.kappa, 2)}</div></div></div>
            <h2 className="mb-2 mt-5 text-lg">{t('val_recall')}</h2>
            {[0, 1, 2].map((k) => <div key={k} className="flex justify-between border-b border-black/5 py-1.5 last:border-0 dark:border-white/10"><span>{name(k)}</span><span className="num">{mt.recall[k] === null ? '—' : fmt(mt.recall[k] * 100, 1) + '%'}</span></div>)}
          </section>
          <section className="card p-5">
            <h2 className="mb-2 text-lg">{t('val_matrix')}</h2>
            <table className="num w-full text-center text-sm"><thead><tr><th></th>{[0, 1, 2].map((j) => <th key={j} className="muted py-1 font-medium">{name(j)}</th>)}</tr></thead>
              <tbody>{[0, 1, 2].map((i) => <tr key={i}><td className="muted py-1 text-left font-medium">{name(i)}</td>{[0, 1, 2].map((j) => <td key={j} className="py-1"><span className={`inline-block min-w-10 rounded-lg px-2 py-1 ${i === j ? 'bg-leaf-500/20 font-semibold' : m[i][j] ? 'bg-primary-500/15' : ''}`}>{m[i][j]}</span></td>)}</tr>)}</tbody></table>
            {best && <div className="mt-5 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/10"><b>{t('val_best')}</b>: {fmt(best.edges[0], 1)} / {fmt(best.edges[1], 1)} % ({fmt(best.acc * 100, 1)}%)
              <div className="muted mt-1 text-xs">{t('val_best_note')}</div><button className="btn-ghost mt-2 text-sm" onClick={() => setEdges(best.edges.map((v) => Math.round(v * 10) / 10))}>{t('val_apply')}</button></div>}
          </section>
        </div>)}
    </div>
  )
}
