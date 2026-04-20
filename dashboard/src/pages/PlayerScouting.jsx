import { useState, useEffect } from 'react'

const API = 'http://127.0.0.1:8000'

const TEAM_COLORS = {
  'Royal Challengers Bengaluru': '#9c2121', 'Mumbai Indians': '#004ba0',
  'Chennai Super Kings': '#f9cd05', 'Kolkata Knight Riders': '#521ca2',
  'Delhi Capitals': '#004c93', 'Sunrisers Hyderabad': '#f26522',
  'Punjab Kings': '#e40a44', 'Rajasthan Royals': '#e50ec5',
  'Gujarat Titans': '#1c2951', 'Lucknow Super Giants': '#a2d9f7',
}

const TEAM_LOGOS = {
  'Royal Challengers Bengaluru': '/logos/RCB_logo.svg',
  'Mumbai Indians': '/logos/MI_logo.svg',
  'Chennai Super Kings': '/logos/CSK_logo.svg',
  'Kolkata Knight Riders': '/logos/KKR_logo.svg',
  'Delhi Capitals': '/logos/DC_logo.svg',
  'Sunrisers Hyderabad': '/logos/SRH_logo.svg',
  'Punjab Kings': '/logos/PBKS_logo.svg',
  'Rajasthan Royals': '/logos/RR_logo.svg',
  'Gujarat Titans': '/logos/GT_logo.svg',
  'Lucknow Super Giants': '/logos/LSG_logo.svg',
}

const PLAYSTYLE_COLORS = {
  'Aggressive': '#ef4444', 'Anchor': '#3b82f6', 'Finisher': '#f59e0b',
  'Impact': '#8b5cf6', 'Utility': '#6b7280',
  'Death Specialist': '#dc2626', 'Restrictive Bowler': '#0ea5e9',
  'Wicket-taker': '#10b981', 'Support Bowler': '#94a3b8',
  'Batting Allrounder': '#f97316', 'Bowling Allrounder': '#14b8a6',
}

const PLAYSTYLE_ICONS = {
  'Aggressive': '⚡', 'Anchor': '🛡️', 'Finisher': '🎯', 'Impact': '💥', 'Utility': '🔧',
  'Death Specialist': '☠️', 'Restrictive Bowler': '🔒', 'Wicket-taker': '🏏', 'Support Bowler': '📋',
  'Batting Allrounder': '🌟', 'Bowling Allrounder': '🌀',
}

const BUDGET_MARKS = [0.5, 1, 2, 3, 5, 8, 10, 15, 20, 25]

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
      <span style={{ color: 'var(--text-muted)', width: '28px', textAlign: 'right', fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px' }}>{label}</span>
      <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: value + '%', background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', width: '28px', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif', fontSize: '13px' }}>{value}</span>
    </div>
  )
}

function PlayerCard({ player, rank, onSimilar }) {
  const psColor = PLAYSTYLE_COLORS[player.playstyle] || '#6b7280'
  const psIcon = PLAYSTYLE_ICONS[player.playstyle] || '•'

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px',
      borderLeft: '3px solid ' + psColor,
      animation: 'fadeUp 0.3s ease forwards',
      animationDelay: (rank * 40) + 'ms', opacity: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: rank < 3 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
            border: '1px solid ' + (rank < 3 ? 'var(--accent-gold)' : 'var(--border)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700,
            color: rank < 3 ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontFamily: 'Rajdhani, sans-serif',
          }}>
            #{rank + 1}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
              {player.name}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
              <span style={{
                background: psColor + '22', color: psColor, border: '1px solid ' + psColor + '44',
                borderRadius: '4px', padding: '1px 8px', fontSize: '10px', fontWeight: 600,
                fontFamily: 'DM Mono, monospace',
              }}>
                {psIcon} {player.playstyle}
              </span>
              {player.status === 'Unsold' && (
                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}>UNSOLD</span>
              )}
              {player.status === 'International' && (
                <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}>INTL</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
            {player.scoutingScore}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1.5px', fontFamily: 'DM Mono, monospace' }}>SCOUT</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {!player.isBowler && (
          <>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AVG</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{player.careerAvg?.toFixed(1) || '—'}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SR</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{player.careerSR?.toFixed(1) || '—'}</div>
            </div>
          </>
        )}
        {player.bowlWickets && (
          <>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>WKTS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-red)' }}>{player.bowlWickets}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ECO</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-gold)' }}>{player.bowlEconomy?.toFixed(1) || '—'}</div>
            </div>
          </>
        )}
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>PRICE</div>
          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-green)' }}>
            {player.price ? '₹' + player.price + 'Cr' : '—'}
          </div>
        </div>
        {player.valueScore && (
          <div style={{ textAlign: 'center', minWidth: '50px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>VALUE</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-purple)' }}>{player.valueScore.toFixed(1)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        <ScoreBar label="PERF" value={player.performanceRating} color="var(--accent-gold)" />
        <ScoreBar label="FORM" value={player.formRating} color="var(--accent-green)" />
        <ScoreBar label="IMPT" value={player.impactRating} color="var(--accent-blue)" />
        <ScoreBar label="PRES" value={player.pressureRating} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {player.franchise && player.franchise !== 'Retired' && player.franchise !== 'Unsold' && player.franchise !== 'International'
            ? player.franchise
            : player.matchesPlayed + ' matches'}
        </span>
        <button
          onClick={function() { onSimilar(player.name) }}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
            fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace',
            transition: 'all 0.15s',
          }}
          onMouseEnter={function(e) { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.color = 'var(--accent-gold)' }}
          onMouseLeave={function(e) { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
        >
          FIND SIMILAR
        </button>
      </div>
    </div>
  )
}

function SimilarPanel({ data, onClose }) {
  if (!data) return null
  const source = data.source
  const similar = data.similar

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '24px', marginBottom: '20px',
      borderTop: '3px solid var(--accent-blue)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', fontFamily: 'DM Mono, monospace' }}>PLAYERS SIMILAR TO</span>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: 'Rajdhani, sans-serif', marginTop: '2px' }}>
            {source.name}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {source.playstyle} · {source.isBowler ? 'Bowler' : source.isAllrounder ? 'All-rounder' : 'Batter'}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
        }}>
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {similar.map(function(p, i) {
          return (
            <div key={p.name} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '14px',
              border: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {p.playstyle} · {p.status}
                  {p.price ? ' · ₹' + p.price + 'Cr' : ''}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {p.careerAvg ? 'Avg ' + p.careerAvg.toFixed(1) : ''}
                  {p.careerSR ? ' · SR ' + p.careerSR.toFixed(1) : ''}
                  {p.bowlWickets ? ' · ' + p.bowlWickets + ' wkts' : ''}
                  {p.bowlEconomy ? ' · eco ' + p.bowlEconomy.toFixed(1) : ''}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{
                  fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                  color: p.similarity > 95 ? 'var(--accent-green)' : p.similarity > 85 ? 'var(--accent-gold)' : 'var(--text-secondary)',
                }}>
                  {p.similarity}%
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px' }}>MATCH</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PlayerScouting() {
  const [teams, setTeams] = useState([])
  const [playstyles, setPlaystyles] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('All')
  const [budgetMax, setBudgetMax] = useState(25)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [similarData, setSimilarData] = useState(null)
  const [similarLoading, setSimilarLoading] = useState(false)

  useEffect(function() {
    fetch(API + '/scouting/teams').then(function(r) { return r.json() }).then(setTeams).catch(function() {})
    fetch(API + '/scouting/playstyles').then(function(r) { return r.json() }).then(setPlaystyles).catch(function() {})
  }, [])

  function handleSearch() {
    setLoading(true)
    setSearched(true)
    setSimilarData(null)
    fetch(API + '/scouting/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: selectedTeam || null,
        playstyle: selectedPlaystyle === 'All' ? null : selectedPlaystyle,
        budgetMax: budgetMax < 25 ? budgetMax : null,
        topN: 15,
      })
    })
      .then(function(r) { return r.json() })
      .then(function(data) { setResults(data.players || []); setLoading(false) })
      .catch(function() { setResults([]); setLoading(false) })
  }

  function handleSimilar(playerName) {
    setSimilarLoading(true)
    fetch(API + '/scouting/similar/' + encodeURIComponent(playerName))
      .then(function(r) { return r.json() })
      .then(function(data) { setSimilarData(data); setSimilarLoading(false) })
      .catch(function() { setSimilarLoading(false) })
  }

  var selectStyle = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 16px', color: 'var(--text-primary)',
    fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
    cursor: 'pointer', width: '100%', appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        select option { background: var(--bg-secondary); color: var(--text-primary); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; background: var(--border); border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--accent-gold); border-radius: 50%; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: 'var(--accent-blue)', letterSpacing: '3px', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>
          MODULE 2
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#fff', lineHeight: 1.1 }}>
          Player Scouting Engine
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Find the right player for your franchise. Filter by playstyle, budget, and team needs.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '24px', marginBottom: '24px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', fontFamily: 'DM Mono, monospace', marginBottom: '16px' }}>
          SCOUT FILTERS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Team */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>YOUR TEAM</label>
            <select value={selectedTeam} onChange={function(e) { setSelectedTeam(e.target.value) }} style={selectStyle}>
              <option value="">Any Team</option>
              {teams.map(function(t) {
                return <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>
              })}
            </select>
          </div>

          {/* Playstyle */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>PLAYSTYLE</label>
            <select value={selectedPlaystyle} onChange={function(e) { setSelectedPlaystyle(e.target.value) }} style={selectStyle}>
              <option value="All">All Playstyles</option>
              {playstyles.map(function(ps) {
                var icon = PLAYSTYLE_ICONS[ps.name] || ''
                return <option key={ps.name} value={ps.name}>{icon} {ps.name} ({ps.count})</option>
              })}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              MAX BUDGET: {budgetMax >= 25 ? 'No Limit' : '₹' + budgetMax + ' Cr'}
            </label>
            <input
              type="range" min="0.5" max="25" step="0.5" value={budgetMax}
              onChange={function(e) { setBudgetMax(parseFloat(e.target.value)) }}
              style={{ marginTop: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>₹0.5 Cr</span><span>₹25 Cr</span>
            </div>
          </div>
        </div>

        <button onClick={handleSearch} style={{
          background: 'var(--accent-gold)', border: 'none', borderRadius: '10px',
          padding: '12px 32px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          fontFamily: 'Rajdhani, sans-serif', color: '#000', letterSpacing: '1px',
          transition: 'all 0.2s', width: '100%',
        }}>
          {loading ? 'SEARCHING...' : 'FIND PLAYERS'}
        </button>
      </div>

      {/* Similar panel */}
      {similarData && <SimilarPanel data={similarData} onClose={function() { setSimilarData(null) }} />}

      {/* Results */}
      {searched && !loading && (
        <div>
          <div style={{
            fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '16px', height: '1px', background: 'var(--border)' }} />
            {results.length} PLAYERS FOUND
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
              {results.map(function(p, i) {
                return <PlayerCard key={p.name} player={p} rank={i} onSimilar={handleSimilar} />
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No players match your criteria</div>
              <div style={{ fontSize: '13px' }}>Try adjusting your filters — wider budget or different playstyle</div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select your filters and hit Find Players</div>
          <div style={{ fontSize: '13px' }}>
            The scouting engine analyzes {playstyles.reduce(function(sum, p) { return sum + p.count }, 0) || '700+'} players across 37 performance dimensions
          </div>
        </div>
      )}
    </div>
  )
}
