import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { configured, fbDb } from '../services/firebase'
import { buildDemo, demoNextItem } from '../services/demoData'

// Realtime Database layout (written by the station's host program, read-only for the web):
//   machine/status        { state: 'running' | 'idle' | 'estop', updated: ms, lot: '<lot id>' }
//   lots/<lotId>          { id, name, source, started: ms, ended: ms | null }
//   items/<lotId>/<push>  { t, mb, L, a, b, tp, nh, st: 'ok'|'watch'|'alarm', conf }
const Ctx = createContext(null)

export function DataProvider({ children }) {
  const [lots, setLots] = useState({}); const [items, setItems] = useState({}); const [status, setStatus] = useState(null)
  const [demo, setDemo] = useState(!configured); const [ready, setReady] = useState(false)
  const watched = useRef(new Map()); const fb = useRef(null)

  useEffect(() => {
    if (!configured) return undefined
    const off = []; let cancelled = false
    ;(async () => {
      try {
        const { db, ref, onValue } = await fbDb(); fb.current = { db, ref, onValue }
        if (cancelled) return
        off.push(onValue(ref(db, 'lots'), (s) => { const v = s.val() || {}; setLots(v); setReady(true); setDemo(!Object.keys(v).length) }, () => { setDemo(true); setReady(true) }))
        off.push(onValue(ref(db, 'machine/status'), (s) => setStatus(s.val())))
      } catch { setDemo(true); setReady(true) }
    })()
    return () => { cancelled = true; off.forEach((f) => f()); watched.current.forEach((f) => f()); watched.current.clear() }
  }, [])

  useEffect(() => {
    if (!demo) return undefined
    const d = buildDemo(); setLots(d.lots); setItems(d.items); setStatus(d.machine.status); setReady(true)
    const open = Object.values(d.lots).find((l) => !l.ended); let k = 0
    const timer = setInterval(() => {
      k++; setItems((p) => ({ ...p, [open.id]: { ...p[open.id], ['live' + k]: demoNextItem(k) } })); setStatus((s) => ({ ...s, updated: Date.now() }))
    }, 4000)
    return () => clearInterval(timer)
  }, [demo])

  const watchLot = (lotId) => {
    if (demo || !lotId || !fb.current || watched.current.has(lotId)) return
    const { db, ref, onValue } = fb.current
    watched.current.set(lotId, onValue(ref(db, 'items/' + lotId), (s) => setItems((p) => ({ ...p, [lotId]: s.val() || {} }))))
  }
  const value = useMemo(() => {
    const list = Object.values(lots).filter(Boolean).sort((a, b) => (b.started || 0) - (a.started || 0))
    const current = list.find((l) => l.id === status?.lot) || list.find((l) => !l.ended) || list[0] || null
    return { lots, list, items, status, demo, ready, current, watchLot }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots, items, status, demo, ready])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useData = () => useContext(Ctx)
