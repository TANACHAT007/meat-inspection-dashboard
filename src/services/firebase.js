import { firebaseConfig } from '../config'
// One lazily created Firebase app (read-only database access for the web page).
export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL)
let dbPromise = null
export function fbDb() {
  if (!configured) return Promise.reject(new Error('firebase not configured'))
  if (!dbPromise) {
    dbPromise = Promise.all([import('firebase/app'), import('firebase/database')]).then(([a, m]) => ({
      db: m.getDatabase(a.initializeApp(firebaseConfig)), ref: m.ref, onValue: m.onValue,
    }))
  }
  return dbPromise
}
