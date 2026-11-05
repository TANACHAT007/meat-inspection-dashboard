import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useI18n } from '../contexts/I18nContext'

const URL_GLB = import.meta.env.BASE_URL + 'model/machine.glb?v=' + __BUILD__
export default function Viewer3D() {
  const { t } = useI18n(); const box = useRef(null); const api = useRef(null)
  const [mods, setMods] = useState([]); const [vis, setVis] = useState({}); const [pct, setPct] = useState(0); const [err, setErr] = useState(false)
  const [xt, setXt] = useState(false); const [xc, setXc] = useState(false); const [xa, setXa] = useState(false)
  useEffect(() => { fetch(import.meta.env.BASE_URL + 'model/modules.json').then((r) => r.json()).then((m) => { setMods(m.filter((x) => x.tris)); setVis(Object.fromEntries(m.map((x) => [x.key, true]))) }).catch(() => {}) }, [])
  useEffect(() => {
    const el = box.current; const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(1.6, devicePixelRatio || 1))
    ren.outputColorSpace = THREE.SRGBColorSpace; ren.toneMapping = THREE.ACESFilmicToneMapping
    const sc = new THREE.Scene(); sc.environment = new THREE.PMREMGenerator(ren).fromScene(new RoomEnvironment(), 0.04).texture
    const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(2, 3, 2.5); sc.add(dl)
    const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 100); const ctl = new OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.autoRotate = true; ctl.maxPolarAngle = Math.PI * 0.52
    ctl.addEventListener('start', () => { ctl.autoRotate = false })
    const fit = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; ren.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix() }
    let alive = true; const orig = new Map()
    new GLTFLoader().load(URL_GLB, (g) => {
      if (!alive) return
      const root = g.scene; root.rotation.x = -Math.PI / 2; const holder = new THREE.Group(); holder.add(root); sc.add(holder); root.updateMatrixWorld(true)
      let bb = new THREE.Box3().setFromObject(root); const sz = bb.getSize(new THREE.Vector3()); holder.scale.setScalar(1.6 / Math.max(sz.x, sz.y, sz.z)); holder.updateMatrixWorld(true)
      bb = new THREE.Box3().setFromObject(holder); holder.position.sub(bb.getCenter(new THREE.Vector3()))
      root.traverse((e) => { if (e.isMesh) { e.material = e.material.clone(); e.material.side = THREE.DoubleSide; orig.set(e, { t: e.material.transparent, o: e.material.opacity, d: e.material.depthWrite }) } })
      cam.position.set(1.5, 1.0, 1.9); el.appendChild(ren.domElement); fit()
      api.current = {
        vis: (k, on) => root.traverse((n) => { if (n.name?.startsWith(k + '__')) n.visible = on }),
        op: (k, a) => root.traverse((n) => { if (n.name?.startsWith(k + '__')) n.traverse((e) => { if (!e.isMesh) return; const o = orig.get(e); if (a >= 1) { e.material.transparent = o.t; e.material.opacity = o.o; e.material.depthWrite = o.d } else { e.material.transparent = true; e.material.opacity = Math.min(o.o, a); e.material.depthWrite = false } }) }),
      }
      setPct(1)
    }, (p) => { if (p.total) setPct(p.loaded / p.total) }, () => setErr(true))
    const ro = new ResizeObserver(fit); ro.observe(el); let raf; const loop = () => { raf = requestAnimationFrame(loop); ctl.update(); ren.render(sc, cam) }; loop()
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); ren.dispose(); ren.domElement.remove() }
  }, [])
  const toggle = (k) => { const on = !vis[k]; setVis((v) => ({ ...v, [k]: on })); api.current?.vis(k, on) }
  const xr = (keys, on) => keys.forEach((k) => api.current?.op(k, on ? 0.14 : 1))
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="text-2xl">{t('model_title')}</h1><p className="muted text-sm">{t('model_sub')}</p></div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card p-3 text-sm">
          {mods.map((m) => <label key={m.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10"><input type="checkbox" className="h-4 w-4 accent-primary-500" checked={!!vis[m.key]} onChange={() => toggle(m.key)} />{m.th}</label>)}
          <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/10">
            {[[xt, setXt, t('xray_tunnel'), ['tunnel']], [xc, setXc, t('xray_ctrl'), ['control']]].map(([v, set, lab, keys]) => <label key={lab} className="flex cursor-pointer items-center gap-2 px-2 py-1.5"><input type="checkbox" className="h-4 w-4 accent-primary-500" checked={v} onChange={(e) => { set(e.target.checked); xr(keys, e.target.checked) }} />{lab}</label>)}
            <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5"><input type="checkbox" className="h-4 w-4 accent-primary-500" checked={xa} onChange={(e) => { setXa(e.target.checked); setXt(e.target.checked); setXc(e.target.checked); xr(['frame', 'conveyor', 'drive', 'tunnel', 'sensing', 'control'], e.target.checked) }} />{t('xray_all')}</label>
          </div>
        </div>
        <div ref={box} className="card relative aspect-[16/10] overflow-hidden">{pct < 1 && !err && <div className="muted absolute inset-0 grid place-items-center text-sm">{t('loading')} {Math.round(pct * 100)}%</div>}{err && <div className="muted absolute inset-0 grid place-items-center text-sm">⚠</div>}</div>
      </div>
    </div>
  )
}
