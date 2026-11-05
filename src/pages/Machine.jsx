import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../contexts/I18nContext'
import { MACHINE } from '../config'

const SHOTS = ['iso', 'cu_meatpack', 'cu_tunnel_open', 'cu_drive', 'cu_controller', 'cu_mains', 'cu_blocks']
const img = (n) => `${import.meta.env.BASE_URL}img/${n}.jpg`
export default function Machine() {
  const { t, lang } = useI18n(); const [zoom, setZoom] = useState(null)
  const specs = [['spec_size', MACHINE.size], ['spec_belt', MACHINE.belt], ['spec_capacity', MACHINE.capacity], ['spec_vision', t('spec_vision_v')], ['spec_sense', t('spec_sense_v')], ['spec_ctrl', t('spec_ctrl_v')]]
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl">{t('machine_title')}</h1><p className="muted text-sm">{t('machine_sub')} · {MACHINE.name[lang]}</p></div>
      <section className="card p-5"><h2 className="mb-2 text-lg">{t('specs')}</h2>
        {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-black/5 py-2 last:border-0 dark:border-white/10"><span className="muted">{t(k)}</span><span className="text-right font-medium">{v}</span></div>)}</section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SHOTS.map((s) => <button key={s} onClick={() => setZoom(s)} className="card overflow-hidden text-left"><img src={img(s)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" /></button>)}</div>
      <div className="card p-4 text-sm"><b>{t('limits_t')}</b><p className="muted mt-1">{t('limits')}</p>
        <a className="btn-ghost mt-2 text-sm" href="https://tanachat007.github.io/meat-inspection-station/" target="_blank" rel="noopener noreferrer">{t('present_site')} →</a></div>
      <AnimatePresence>{zoom && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"><img src={img(zoom)} alt="" className="max-h-full max-w-full rounded-xl" /></motion.div>}</AnimatePresence>
    </div>
  )
}
