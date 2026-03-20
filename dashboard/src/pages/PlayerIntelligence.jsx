import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const API = 'http://127.0.0.1:8000'

const TEAM_COLORS = {
  'Royal Challengers Bengaluru': '#c41e3a',
  'Mumbai Indians': '#004ba0',
  'Chennai Super Kings': '#f9cd05',
  'Kolkata Knight Riders': '#3a225d',
  'Delhi Capitals': '#004c93',
  'Sunrisers Hyderabad': '#f26522',
  'Punjab Kings': '#ed1f27',
  'Rajasthan Royals': '#254aa5',
  'Gujarat Titans': '#1c2951',
  'Lucknow Super Giants': '#a2d9f7',
  'Rising Pune Supergiant': '#e91e8c',
  'Deccan Chargers': '#E4A11B',
}

const TEAM_ABBR_COLORS = {
  RCB: '#c41e3a', MI: '#004ba0', CSK: '#f9cd05',
  KKR: '#3a225d', DC: '#004c93', SRH: '#f26522',
  PBKS: '#ed1f27', RR: '#254aa5', GT: '#1c2951',
  LSG: '#a2d9f7', RPS: '#e91e8c', DC2: '#E4A11B',
}

const CRICINFO_IDS = {
  'V Kohli': 253802, 'RG Sharma': 34102, 'MS Dhoni': 28081,
  'JJ Bumrah': 625383, 'RR Pant': 931581, 'YBK Jaiswal': 1272647,
  'Shubman Gill': 1089945, 'HH Pandya': 625371, 'RA Jadeja': 234675,
  'YS Chahal': 577028, 'KL Rahul': 422108, 'SV Samson': 478681,
  'DA Warner': 219889, 'AB de Villiers': 44828, 'CH Gayle': 51880,
  'SK Raina': 84877, 'S Dhawan': 28235, 'AM Rahane': 277916,
}

function StatCard({ label, value, color = 'var(--accent-gold)' }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '16px', textAlign: 'center',
      borderTop: `2px solid ${color}`
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color, fontFamily: 'Rajdhani, sans-serif' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '1px' }}>{label}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)',
      fontFamily: 'DM Mono, monospace', marginBottom: '12px',
      display: 'flex', alignItems: 'center', gap: '8px'
    }}>
      <div style={{ width: '16px', height: '1px', background: 'var(--border-light)' }} />
      {children}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '12px'
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent-gold)', fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

function PlayerSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/players/search/${query}`)
        const data = await res.json()
        setResults(data)
        setShow(true)
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div style={{ position: 'relative', width: '280px' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search any IPL player..."
        style={{
          width: '100%', padding: '9px 14px', borderRadius: '8px',
          border: '1px solid var(--border-light)', background: 'var(--bg-card)',
          color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
          fontFamily: 'DM Sans, sans-serif'
        }}
      />
      {show && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto'
        }}>
          {results.map(p => (
            <div key={p} onClick={() => { onSelect(p); setQuery(''); setShow(false) }}
              style={{
                padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >{p}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlayerIntelligence() {
  const [playerName, setPlayerName] = useState('V Kohli')
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [imgError, setImgError] = useState(false)

  const featured = ['V Kohli', 'JJ Bumrah', 'MS Dhoni', 'RR Pant', 'HH Pandya', 'YBK Jaiswal']

  const loadPlayer = useCallback(async (name) => {
    setLoading(true)
    setImgError(false)
    try {
      const res = await fetch(`${API}/player/${encodeURIComponent(name)}`)
      const data = await res.json()
      setPlayer(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPlayer(playerName) }, [playerName, loadPlayer])

  const teamColor = player ? (TEAM_COLORS[player.franchise] || 'var(--accent-gold)') : 'var(--accent-gold)'
  const cricInfoId = CRICINFO_IDS[playerName]
  const photoUrl = cricInfoId
    ? `https://img1.hscicdn.com/image/upload/f_auto,t_h_100/lsci/db/PICTURES/CMS/316700/${cricInfoId}.jpg`
    : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: `3px solid var(--accent-gold)`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading player data...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!player || player.error) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
      Player not found. Try searching for another player.
    </div>
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '3px', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>
            MODULE 1 — PLAYER INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
            Player Profile & Scouting
          </h1>
        </div>
        <PlayerSearch onSelect={(p) => { setPlayerName(p); setActiveTab('overview') }} />
      </div>

      {/* Featured Players */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {featured.map(p => (
          <button key={p} onClick={() => { setPlayerName(p); setActiveTab('overview') }}
            style={{
              padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.18s',
              fontFamily: 'DM Sans, sans-serif', border: `1px solid ${playerName === p ? teamColor : 'var(--border)'}`,
              background: playerName === p ? `${teamColor}22` : 'var(--bg-card)',
              color: playerName === p ? teamColor : 'var(--text-secondary)',
            }}>{p}</button>
        ))}
      </div>

      {/* Hero Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', marginBottom: '20px',
        borderTop: `3px solid ${teamColor}`,
        display: 'grid', gridTemplateColumns: '160px 1fr auto',
        gap: '24px', alignItems: 'start'
      }}>
        {/* Photo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '150px', height: '150px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${teamColor}33, ${teamColor}11)`,
            border: `2px solid ${teamColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', margin: '0 auto'
          }}>
            {photoUrl && !imgError ? (
              <img src={photoUrl} alt={player.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImgError(true)} />
            ) : (
              <div style={{ fontSize: '56px' }}>👤</div>
            )}
          </div>
          <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>FORM SCORE</div>
          <div style={{
            fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
            color: player.prediction?.formScore >= 40 ? 'var(--accent-green)'
              : player.prediction?.formScore >= 25 ? 'var(--accent-gold)' : 'var(--accent-red)'
          }}>
            {player.prediction?.formScore ?? '—'}
          </div>
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{player.name}</h2>
            {player.franchise && (
              <span style={{
                background: `${teamColor}22`, color: teamColor,
                border: `1px solid ${teamColor}55`, borderRadius: '6px',
                padding: '3px 10px', fontSize: '11px', fontWeight: 600,
                fontFamily: 'DM Mono, monospace'
              }}>
                {Object.entries(TEAM_COLORS).find(([k]) => k === player.franchise)?.[0]?.split(' ').map(w => w[0]).join('') || player.franchise?.slice(0, 4)}
              </span>
            )}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{player.role}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {player.battingHand}-hand bat &nbsp;|&nbsp; {player.bowlingStyle} {player.bowlingType}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[['IPL DEBUT', player.debut], ['SEASONS', player.seasons],
              ['INNINGS', player.batting?.innings || '—']].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px' }}>{l}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Franchise History */}
          {player.franchiseHistory?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>HISTORY:</span>
              {player.franchiseHistory.map((h, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>→</span>}
                  <span style={{
                    background: `${TEAM_ABBR_COLORS[h.team] || '#666'}22`,
                    color: TEAM_ABBR_COLORS[h.team] || '#888',
                    border: `1px solid ${TEAM_ABBR_COLORS[h.team] || '#666'}44`,
                    borderRadius: '5px', padding: '2px 8px',
                    fontSize: '11px', fontWeight: 600
                  }}>{h.years}: {h.team}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '4px' }}>MARKET VALUE</div>
          <div style={{ fontSize: '34px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif' }}>
            {player.price ? `₹${player.price} Cr` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>{player.acquisition}</div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>FRANCHISE</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: teamColor, marginTop: '2px' }}>{player.franchise || 'Released'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['overview', '📊 Overview'], ['venues', '🏟️ Venues'], ['prediction', '🎯 Prediction']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s',
            background: activeTab === id ? 'var(--accent-gold)' : 'transparent',
            color: activeTab === id ? '#000' : 'var(--text-muted)'
          }}>{label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {player.batting && (
            <>
              <SectionTitle>🏏 BATTING STATISTICS</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <StatCard label="RUNS" value={player.batting.runs?.toLocaleString()} />
                <StatCard label="AVERAGE" value={player.batting.avg} />
                <StatCard label="STRIKE RATE" value={player.batting.sr} />
                <StatCard label="HIGHEST" value={player.batting.hs} color="var(--accent-purple)" />
                <StatCard label="FOURS" value={player.batting.fours?.toLocaleString()} color="var(--accent-blue)" />
                <StatCard label="SIXES" value={player.batting.sixes} color="var(--accent-green)" />
              </div>
            </>
          )}

          {player.bowling && (
            <>
              <SectionTitle>🎳 BOWLING STATISTICS</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <StatCard label="WICKETS" value={player.bowling.wickets} color="var(--accent-red)" />
                <StatCard label="AVERAGE" value={player.bowling.avg} color="var(--accent-red)" />
                <StatCard label="ECONOMY" value={player.bowling.economy} color="var(--accent-red)" />
                <StatCard label="STRIKE RATE" value={player.bowling.sr} color="var(--accent-purple)" />
                <StatCard label="DOT BALL %" value={`${player.bowling.dotPct}%`} color="var(--accent-blue)" />
                <StatCard label="BEST" value={`${player.bowling.best}-fer`} color="var(--accent-green)" />
              </div>
            </>
          )}

          <SectionTitle>{player.isBowler ? '🎳 WICKETS PER SEASON' : '🏏 RUNS PER SEASON'}</SectionTitle>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={player.seasonStats} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="season" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={player.isBowler ? 'wickets' : 'runs'}
                  fill={teamColor} radius={[3, 3, 0, 0]} opacity={0.85}
                  name={player.isBowler ? 'Wickets' : 'Runs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>{player.isBowler ? '⚡ ECONOMY BY PHASE' : '⚡ STRIKE RATE BY PHASE'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {player.phaseStats?.map((p, i) => {
              const colors = ['var(--accent-gold)', 'var(--accent-blue)', 'var(--accent-red)']
              const val = player.isBowler ? p.economy : p.sr
              const sub = player.isBowler ? `${p.wickets} wickets` : `${p.runs} runs`
              return (
                <div key={i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '20px', textAlign: 'center',
                  borderTop: `2px solid ${colors[i]}`
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>{p.phase?.toUpperCase()}</div>
                  <div style={{ fontSize: '30px', fontWeight: 700, color: colors[i], fontFamily: 'Rajdhani, sans-serif' }}>{val}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{player.isBowler ? 'Economy Rate' : 'Strike Rate'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VENUES */}
      {activeTab === 'venues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionTitle>🏟️ VENUE PERFORMANCE</SectionTitle>
          {player.venueStats?.length > 0 ? player.venueStats.map((v, i) => {
            const typeColor = v.type === 'happy' ? 'var(--accent-green)'
              : v.type === 'bogey' ? 'var(--accent-red)' : 'var(--text-muted)'
            const typeLabel = v.type === 'happy' ? '⭐ Happy Ground'
              : v.type === 'bogey' ? '⚠️ Bogey Ground' : '• Neutral'
            return (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '16px 20px',
                display: 'grid', gridTemplateColumns: '200px 1fr auto',
                gap: '16px', alignItems: 'center',
                borderLeft: `3px solid ${typeColor}`
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{v.venue}</div>
                  <div style={{ fontSize: '11px', color: typeColor, marginTop: '3px' }}>{typeLabel}</div>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  {player.isBowler ? (
                    <>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MATCHES</div><div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Rajdhani' }}>{v.matches}</div></div>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WICKETS</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-red)', fontFamily: 'Rajdhani' }}>{v.wickets}</div></div>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ECONOMY</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-gold)', fontFamily: 'Rajdhani' }}>{v.economy}</div></div>
                    </>
                  ) : (
                    <>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>INNINGS</div><div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Rajdhani' }}>{v.innings}</div></div>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RUNS</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-gold)', fontFamily: 'Rajdhani' }}>{v.runs}</div></div>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AVG</div><div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Rajdhani' }}>{v.avg}</div></div>
                      <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SR</div><div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Rajdhani' }}>{v.sr}</div></div>
                    </>
                  )}
                </div>
                <div style={{ width: '70px' }}>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', background: typeColor,
                      width: `${Math.min(100, player.isBowler ? (10 - v.economy) / 5 * 100 : v.avg / 60 * 100)}%`
                    }} />
                  </div>
                </div>
              </div>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No venue data available</div>
          )}
        </div>
      )}

      {/* PREDICTION */}
      {activeTab === 'prediction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {player.prediction ? (
            <>
              <SectionTitle>🎯 NEXT MATCH PERFORMANCE PREDICTION</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '28px',
                  borderTop: '3px solid var(--accent-gold)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>PREDICTED RUNS</div>
                  <div style={{ fontSize: '64px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-gold)', lineHeight: 1 }}>
                    {player.prediction.predicted}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Range: {player.prediction.lower} – {player.prediction.upper} runs
                  </div>
                  <div style={{ marginTop: '16px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(to right, var(--accent-red), var(--accent-gold), var(--accent-green))',
                      width: `${Math.min(100, player.prediction.predicted / 80 * 100)}%`,
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['P(Duck)', `${player.prediction.probDuck}%`, 'var(--accent-red)'],
                    ['P(30+ runs)', `${player.prediction.prob30}%`, 'var(--accent-gold)'],
                    ['P(50+ runs)', `${player.prediction.prob50}%`, 'var(--accent-green)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '14px 18px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'Rajdhani, sans-serif' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{
                    background: player.prediction.prob30 > 50 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    border: `1px solid ${player.prediction.prob30 > 50 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    borderRadius: '10px', padding: '14px 18px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '4px' }}>RECOMMENDATION</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: player.prediction.prob30 > 50 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                      {player.prediction.prob30 > 50 ? '✅ PLAY' : player.prediction.prob30 > 35 ? '⚡ CONSIDER' : '⚠️ RISK'}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--accent-blue)' }}>Model:</strong> Gradient Boosting trained on 17,336 innings (IPL 2008–2025). Features: rolling form, venue history, opposition matchup. Test MAE: 14.45 runs.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎳</div>
              <div>Batting predictions not applicable for specialist bowlers</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}