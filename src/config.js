// Firebase web config (public by design — access is controlled by the database rules: everyone may read,
// only the station's host program (service account) may write). Leave apiKey empty to run on built-in SAMPLE data.
// TODO(owner): create your own Firebase project, then fill these in. Never reuse another project's keys.
export const firebaseConfig = { apiKey: '', authDomain: '', databaseURL: '', projectId: '', appId: '' }

export const MACHINE = {
  name: { th: 'สถานีตรวจคุณภาพเนื้อวัวบนสายพาน', en: 'Beef quality inspection station on a conveyor' },
  size: '485 × 162 mm frame (COMPACT)',
  belt: 'PU 100 mm · stop-and-capture',
  capacity: '≈ 4–8 pack/min (estimate)',
}

// status of one tray = the host program's rule engine (placeholder rules, NOT validated, NOT a food-safety certificate)
export const STATUSES = [
  { key: 'ok', color: '#1a9a6b' },
  { key: 'watch', color: '#d98a0b' },
  { key: 'alarm', color: '#c2303f' },
]
// marbling grade names from config.json (marbling_grade_edges = [4, 10] %, USER_UNVALIDATED)
export const GRADES = [
  { key: 'low', max: 4, color: '#8aa0b5' },
  { key: 'medium', max: 10, color: '#e0a13a' },
  { key: 'high', max: Infinity, color: '#c2303f' },
]
export const gradeOf = (pct) => GRADES.find((g) => pct < g.max).key
