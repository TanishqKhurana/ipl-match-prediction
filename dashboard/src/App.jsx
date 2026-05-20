import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import PlayerIntelligence from './pages/PlayerIntelligence'
import PlayerScouting from './pages/PlayerScouting'
import AuctionIntelligence from './pages/AuctionIntelligence'
import './App.css'

/* ── SVG Icons ────────────────────────────────
   Clean, consistent, and they inherit color from
   the parent (.nav-link), so they turn gold when 
   active automatically via CSS currentColor.
   ──────────────────────────────────────────── */

const Icons = {
  player: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  auction: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
}

/* ── Only working modules in the sidebar ──── */
const NAV_ITEMS = [
  { path: '/',         label: 'Player Intel',   icon: Icons.player },
  { path: '/scouting', label: 'Scouting',       icon: Icons.search },
  { path: '/auction',  label: 'Auction Intel',  icon: Icons.auction },
]


/* ── Sidebar Component ────────────────────── */
function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>IPL INTEL</h1>
        <span className="subtitle">FRANCHISE INTELLIGENCE</span>
      </div>

      {/* Section label */}
      <div className="sidebar-section">Modules</div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-label">Data Coverage</div>
        <div className="footer-value">IPL 2008–2025</div>
        <div className="footer-sub">278K+ deliveries · 2300+ players scouted</div>
      </div>
    </aside>
  )
}


/* ── Coming Soon placeholder ──────────────── */
function ComingSoon({ title }) {
  return (
    <div className="coming-soon page-enter">
      <div className="title">{title}</div>
      <div className="subtitle">This module is under development</div>
    </div>
  )
}


/* ── App Root ─────────────────────────────── */
export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<PlayerIntelligence />} />
            <Route path="/scouting" element={<PlayerScouting />} />
            <Route path="/auction" element={<AuctionIntelligence />} />
            {/* Routes preserved so direct URLs don't break */}
            <Route path="/team" element={<ComingSoon title="Team Builder" />} />
            <Route path="/match" element={<ComingSoon title="Match Advisor" />} />
            <Route path="/opponent" element={<ComingSoon title="Opponent Analysis" />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
