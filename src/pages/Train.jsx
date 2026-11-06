import { useMemo, useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { GRADES } from '../config'
import { clearModel, loadModel, parseLabelled, sampleLabelled, saveModel, trainAll } from '../services/train'

const Matrix = ({ m, name }) => (
  <table className="num w-full text-center text-sm"><thead><tr><th></th>{[0, 1, 2].map((j) => <th key={j} className="muted py-1 font-medium">{name(j)}</th>)}</tr></thead>
    <tbody>{[0, 1, 2].map((i) => <tr key={i}><td className="muted py-1 text-left font-medium">{name(i)}</td>{[0, 1, 2].map((j) => <td key={j} className="py-1"><span className={`inline-block min-w-10 rounded-lg px-2 py-1 ${i === j ? 'bg-leaf-500/20 font-semibold' : m[i][j] ? 'bg-primary-500/15' : ''}`}>{m[i][j]}</span></td>)}</tr>)}</tbody></table>
)

export default function Train() {
  const { t, fmt } = useI18n()
  const [text, setText] = useState(''); const [rows, setRows] = useState([]); const [isSample, setIsSample] = useState(false)
  const [res, setRes] = useState(null); const [saved, setSaved] = useState(loadModel()); const [seed, setSeed] = useState(7)
  const [f, setF] = useState({ mb: '', L: '', a: '', b: '', y: 1 })
  const name = (k) => t('grade_' + GRADES[k].key)
  const counts = useMemo(() => [0, 1, 2].map((k) => rows.filter((r) => r.y === k).length), [rows])
  const load = () => { setRows(parseLabelled(text)); setIsSample(false); setRes(null) }
  const sample = () => { const r = sampleLabelled(150); setRows(r); setIsSample(true); setRes(null); setText(r.map((x, i) => `S${i + 1},${x.mb},${x.L},${x.a},${x.b},${x.y}`).join('\n')) }
  const add = () => { const r = { mb: parseFloat(f.mb), L: parseFloat(f.L), a: parseFloat(f.a), b: parseFloat(f.b), y: +f.y }; if (!Number.isFinite(r.mb)) return
    setRows((p) => [...p, r]); setText((p) => (p ? p + '\n' : '') + `M${rows.length + 1},${f.mb},${f.L || ''},${f.a || ''},${f.b || ''},${f.y}`); setF({ ...f, mb: '', L: '', a: '', b: '' }); setRes(null) }
  const train = () => setRes(trainAll(rows, seed))
  const use = (model, tr) => { const m = { ...model, trainedAt: Date.now(), n: rows.length, testAcc: tr.test.acc, sample: isSample }; saveModel(m); setSaved(m) }
  const dl = (obj, fn) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })); a.download = fn; a.click() }
  const enough = counts.every((c) => c >= 100)
  const Card = ({ title, r, model }) => (
    <section className="card p-5">
      <h2 className="mb-3 text-lg">{title}</h2>
      <div className="grid grid-cols-3 gap-3"><div><div className="muted text-sm">{t('tr_train_acc')}</div><div className="num text-xl font-semibold">{fmt(r.train.acc * 100, 1)}%</div></div>
        <div><div className="muted text-sm">{t('tr_test_acc')}</div><div className="num text-xl font-semibold text-primary-600 dark:text-primary-300">{fmt(r.test.acc * 100, 1)}%</div></div>
        <div><div className="muted text-sm">{t('val_kappa')}</div><div className="num text-xl font-semibold">{fmt(r.test.kappa, 2)}</div></div></div>
      <div className="muted mb-1 mt-4 text-xs">{t('tr_matrix_test')}</div><Matrix m={r.test.m} name={name} />
      {model.kind === 'edges' && <div className="mt-3 text-sm">{t('val_best')}: <b className="num">{model.edges[0]} / {model.edges[1]} %</b></div>}
      <div className="mt-4 flex flex-wrap gap-2"><button className="btn-primary text-sm" onClick={() => use(model, { test: r.test })}>{t('tr_use')}</button><button className="btn-ghost text-sm" onClick={() => dl(model, model.kind === 'edges' ? 'marbling_edges.json' : 'grade_model.json')}>{t('tr_export')}</button></div>
    </section>)
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl">{t('tr_title')}</h1><p className="muted text-sm">{t('tr_sub')}</p></div>
      <section className="card p-5">
        <label className="mb-2 block text-sm font-medium">{t('tr_input')}</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={'S01,3.2,40.1,20.5,11.2,0\nS02,9.5,39.0,21.8,10.9,1\nS03,14.1,38.2,22.4,11.0,2'} className="w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-sm dark:border-white/15 dark:bg-ink-900" />
        <div className="mt-3 flex flex-wrap items-center gap-2"><button className="btn-primary text-sm" onClick={load}>{t('tr_load')}</button><button className="btn-ghost text-sm" onClick={sample}>{t('val_sample')}</button>
          <div className="ml-auto flex flex-wrap items-center gap-1 text-sm">
            {['mb', 'L', 'a', 'b'].map((k) => <input key={k} placeholder={k === 'mb' ? 'mb %' : k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="num w-16 rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900" />)}
            <select value={f.y} onChange={(e) => setF({ ...f, y: e.target.value })} className="rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900">{[0, 1, 2].map((k) => <option key={k} value={k}>{name(k)}</option>)}</select><button className="btn-ghost text-sm" onClick={add}>＋</button></div></div>
        <div className="muted mt-3 text-xs">{t('tr_format')}</div>
      </section>
      {isSample && <div className="rounded-xl bg-primary-100 px-4 py-2 text-sm text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">{t('tr_demo')}</div>}
      {rows.length > 0 && <section className="card flex flex-wrap items-center gap-4 p-4 text-sm"><span>N <b className="num">{rows.length}</b></span>{[0, 1, 2].map((k) => <span key={k}>{name(k)} <b className="num">{counts[k]}</b></span>)}
        <label className="ml-auto flex items-center gap-1">{t('tr_seed')}<input type="number" value={seed} onChange={(e) => setSeed(+e.target.value || 1)} className="num w-16 rounded-lg border border-black/10 bg-white px-2 py-1 dark:border-white/15 dark:bg-ink-900" /></label>
        <button className="btn-primary" disabled={rows.length < 9} onClick={train}>{t('tr_train')}</button>
        {!enough && <div className="w-full text-xs text-amber-700 dark:text-amber-300">{t('tr_few')}</div>}</section>}
      {res && <div className="grid gap-5 lg:grid-cols-2"><Card title={t('tr_m_edges')} r={res.edges} model={res.edges.model} />{res.logreg ? <Card title={t('tr_m_logreg')} r={res.logreg} model={res.logreg.model} /> : <section className="card muted p-5 text-sm">{t('tr_need_colour')}</section>}</div>}
      <section className="card p-5"><h2 className="mb-1 text-lg">{t('tr_active')}</h2>
        {saved ? <div className="text-sm"><div>{saved.kind === 'edges' ? `${t('tr_m_edges')}: ${saved.edges.join(' / ')} %` : t('tr_m_logreg')} · N {saved.n} · {t('tr_test_acc')} <b className="num">{fmt(saved.testAcc * 100, 1)}%</b>{saved.sample && <span className="ml-2 rounded bg-primary-100 px-2 py-0.5 text-xs text-primary-800">SAMPLE</span>}</div>
          <div className="mt-3 flex gap-2"><button className="btn-ghost text-sm" onClick={() => dl(saved, 'grade_model.json')}>{t('tr_export')}</button><button className="btn-ghost text-sm" onClick={() => { clearModel(); setSaved(null) }}>{t('tr_clear')}</button></div>
          <div className="muted mt-3 text-xs">{t('tr_apply_note')}</div></div> : <div className="muted text-sm">{t('tr_none')}</div>}</section>
    </div>
  )
}
