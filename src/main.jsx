import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { I18nProvider } from './contexts/I18nContext'
import { DataProvider } from './contexts/DataContext'

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_u, reg) { if (reg) setInterval(() => reg.update().catch(() => {}), 60000) },
  onNeedRefresh() { updateSW(true) },
})
// HashRouter: GitHub Pages has no SPA rewrite, so deep links (…/#/lot/LOT-001 from a QR code) must not 404
createRoot(document.getElementById('root')).render(
  <StrictMode><HashRouter><ThemeProvider><I18nProvider><DataProvider><App /></DataProvider></I18nProvider></ThemeProvider></HashRouter></StrictMode>,
)
