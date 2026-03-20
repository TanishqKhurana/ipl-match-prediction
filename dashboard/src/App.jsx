import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import PlayerIntelligence from './pages/PlayerIntelligence'
import './App.css'

const NAV_ITEMS = [
  { path: '/', label: 'Player Intel', icon: '👤' },
  { path: '/scouting', label: 'Scouting', icon: '🔍' },
  { path: '/team', label: 'Team Builder', icon: '🧩' },
  { path: '/match', label: 'Match Advisor', icon: '⚡' },
  { path: '/opponent', label: 'Opponent', icon: '🎯' },
]

function Sidebar() {
  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', padding: '24px 12px', gap: '4px',
      position: 'fixed', left: 0, top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '0 8px 24px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px' }}>
          IPL INTEL
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '2px' }}>
          FRANCHISE INTELLIGENCE
        </div>
      </div>

      {/* Nav Items */}
      {NAV_ITEMS.map(item => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
            fontSize: '13px', fontWeight: 500, transition: 'all 0.18s',
            background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
          })}>
          <span style={{ fontSize: '16px' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      {/* Bottom info */}
      <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>DATA COVERAGE</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>IPL 2008–2025</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>278K+ deliveries</div>
      </div>
    </div>
  )
}

function ComingSoon({ title, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Coming soon — module under construction</div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', padding: '32px' }}>
          <Routes>
            <Route path="/" element={<PlayerIntelligence />} />
            <Route path="/scouting" element={<ComingSoon title="Player Scouting" icon="🔍" />} />
            <Route path="/team" element={<ComingSoon title="Team Builder" icon="🧩" />} />
            <Route path="/match" element={<ComingSoon title="Match Advisor" icon="⚡" />} />
            <Route path="/opponent" element={<ComingSoon title="Opponent Analysis" icon="🎯" />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}