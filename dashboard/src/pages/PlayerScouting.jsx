import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000'

const PLAYSTYLE_COLORS = {
  'Aggressive': '#ef4444', 'Anchor': '#3b82f6', 'Finisher': '#f59e0b',
  'Impact': '#8b5cf6', 'Utility': '#6b7280',
  'Death Specialist': '#dc2626', 'Restrictive Bowler': '#0ea5e9',
  'Wicket-taker': '#10b981', 'Support Bowler': '#94a3b8',
  'Batting Allrounder': '#f97316', 'Bowling Allrounder': '#14b8a6',
  'Defensive (Run Stopper)': '#0ea5e9', 'Wicket-taker (Strike Bowler)': '#10b981',
  'Powerplay Specialist': '#f97316', 'Middle Over Specialist': '#8b5cf6',
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
      <span style={{ color: 'var(--text-muted)', width: '28px', textAlign: 'right', fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px' }}>{label}</span>
      <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: (value || 0) + '%', background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', width: '28px', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif', fontSize: '13px' }}>{value || 0}</span>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>{label}</label>
      <select value={value} onChange={function(e) { onChange(e.target.value) }} style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
        fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
        cursor: 'pointer', width: '100%', appearance: 'none',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}>
        {options.map(function(opt) {
          return <option key={opt.value} value={opt.value}>{opt.label}</option>
        })}
      </select>
    </div>
  )
}

export default function PlayerScouting() {
  var navigate = useNavigate()
  var [filters, setFilters] = useState(null)
  var [teams, setTeams] = useState([])
  var [results, setResults] = useState([])
  var [loading, setLoading] = useState(false)
  var [searched, setSearched] = useState(false)
  var [showAll, setShowAll] = useState(false)
  var [sortBy, setSortBy] = useState('score')
  var [selectedTeam, setSelectedTeam] = useState('')
  var [teamProfile, setTeamProfile] = useState(null)
  var [nationality, setNationality] = useState('All')
  var [playerType, setPlayerType] = useState('All')
  var [battingRole, setBattingRole] = useState('All')
  var [battingHand, setBattingHand] = useState('All')
  var [bowlingCategory, setBowlingCategory] = useState('All')
  var [bowlingSpecialty, setBowlingSpecialty] = useState('All')
  var [budgetMax, setBudgetMax] = useState(25)

  useEffect(function() {
    fetch(API + '/scouting/teams').then(function(r) { return r.json() }).then(setTeams).catch(function() {})
    fetch(API + '/scouting/filters').then(function(r) { return r.json() }).then(setFilters).catch(function() {})
  }, [])

  useEffect(function() {
    setBattingRole('All')
    setBowlingCategory('All')
    setBowlingSpecialty('All')
  }, [playerType])

  function handleSearch() {
    setLoading(true)
    setSearched(true)
    setShowAll(false)
    fetch(API + '/scouting/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: selectedTeam || null,
        nationality: nationality === 'All' ? null : nationality,
        playerType: playerType === 'All' ? null : playerType,
        battingRole: battingRole === 'All' ? null : battingRole,
        battingHand: battingHand === 'All' ? null : battingHand,
        bowlingCategory: bowlingCategory === 'All' ? null : bowlingCategory,
        bowlingSpecialty: bowlingSpecialty === 'All' ? null : bowlingSpecialty,
        budgetMax: budgetMax < 25 ? budgetMax : null,
        topN: 50,
      })
    })
      .then(function(r) { return r.json() })
      .then(function(data) { setResults(data.players || []); setLoading(false) })
      .catch(function() { setResults([]); setLoading(false) })
  }

  function handleTeamChange(e) {
    var val = e.target.value
    setSelectedTeam(val)
    if (val) {
      fetch(API + '/scouting/team-profile/' + val)
        .then(function(r) { return r.json() })
        .then(setTeamProfile)
        .catch(function() { setTeamProfile(null) })
    } else {
      setTeamProfile(null)
    }
  }

  var showBattingFilters = playerType === 'All' || playerType === 'Batsman' || playerType === 'Wicket Keeper' || playerType === 'All-Rounder'
  var showBowlingFilters = playerType === 'All' || playerType === 'Bowler' || playerType === 'All-Rounder'

  function makeOptions(list) {
    if (!list) return [{ value: 'All', label: 'All' }]
    return [{ value: 'All', label: 'All' }].concat(
      list.map(function(item) { return { value: item.name, label: item.name } })
    )
  }

  // Sort results
  var sortedResults = results.slice()
  if (sortBy === 'value') {
    sortedResults.sort(function(a, b) { return (b.valueScore || 0) - (a.valueScore || 0) })
  }
  var visibleResults = showAll ? sortedResults : sortedResults.slice(0, 15)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        select option { background: var(--bg-secondary); color: var(--text-primary); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; background: var(--border); border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--accent-gold); border-radius: 50%; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: 'var(--accent-blue)', letterSpacing: '3px', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>MODULE 2</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#fff', lineHeight: 1.1 }}>
          Player Scouting Engine
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Find the right player for your franchise. Filter by type, role, bowling style, and budget.
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

        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>YOUR TEAM</label>
            <select value={selectedTeam} onChange={handleTeamChange} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
              fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
              cursor: 'pointer', width: '100%', appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}>
              <option value="">Any Team</option>
              {teams.map(function(t) {
                return <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>
              })}
            </select>
          </div>
          <FilterSelect label="NATIONALITY" value={nationality} onChange={setNationality}
            options={makeOptions(filters ? filters.nationalities : null)} />
          <FilterSelect label="PLAYER TYPE" value={playerType} onChange={setPlayerType}
            options={makeOptions(filters ? filters.playerTypes : null)} />
        </div>

        {/* Team banner */}
        {teamProfile && (
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600 }}>
              {teamProfile.team} STRATEGY:
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
              {teamProfile.description}
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {teamProfile.preferredPlaystyles && teamProfile.preferredPlaystyles.map(function(ps) {
                return (
                  <span key={ps} style={{
                    background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)',
                    borderRadius: '4px', padding: '2px 6px', fontSize: '9px', fontWeight: 600,
                  }}>
                    {ps}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <FilterSelect label="BATTING ROLE" value={battingRole} onChange={setBattingRole}
            options={makeOptions(filters ? filters.battingRoles : null)}
            disabled={!showBattingFilters} />
          <FilterSelect label="BATTING HAND" value={battingHand} onChange={setBattingHand}
            options={[{ value: 'All', label: 'All' }, { value: 'R', label: 'Right Hand' }, { value: 'L', label: 'Left Hand' }]}
            disabled={!showBattingFilters} />
          <FilterSelect label="BOWLING TYPE" value={bowlingCategory} onChange={setBowlingCategory}
            options={makeOptions(filters ? filters.bowlingCategories : null)}
            disabled={!showBowlingFilters} />
          <FilterSelect label="BOWLING SPECIALTY" value={bowlingSpecialty} onChange={setBowlingSpecialty}
            options={makeOptions(filters ? filters.bowlingSpecialties : null)}
            disabled={!showBowlingFilters} />
        </div>

        {/* Budget */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            MAX BUDGET: {budgetMax >= 25 ? 'No Limit' : '₹' + budgetMax + ' Cr'}
          </label>
          <input type="range" min="0.5" max="25" step="0.5" value={budgetMax}
            onChange={function(e) { setBudgetMax(parseFloat(e.target.value)) }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>₹0.5 Cr</span><span>₹25 Cr</span>
          </div>
        </div>

        <button onClick={handleSearch} style={{
          background: 'var(--accent-gold)', border: 'none', borderRadius: '10px',
          padding: '12px 32px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          fontFamily: 'Rajdhani, sans-serif', color: '#000', letterSpacing: '1px',
          width: '100%',
        }}>
          {loading ? 'SEARCHING...' : 'FIND PLAYERS'}
        </button>
      </div>

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

          {/* Sort toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['score', 'value'].map(function(mode) {
              var active = sortBy === mode
              return (
                <button key={mode} onClick={function() { setSortBy(mode) }} style={{
                  padding: '6px 16px', borderRadius: '6px', border: 'none',
                  cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                  fontFamily: 'DM Mono, monospace',
                  background: active ? 'var(--accent-gold)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#000' : 'var(--text-muted)',
                }}>
                  {mode === 'score' ? 'SORT BY SCOUT SCORE' : 'SORT BY VALUE'}
                </button>
              )
            })}
          </div>

          {results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
              {visibleResults.map(function(player, i) {
                var psColor = PLAYSTYLE_COLORS[player.playstyle] || PLAYSTYLE_COLORS[player.bowlingSpecialty] || '#6b7280'
                return (
                  <div key={player.name + i} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '20px',
                    borderLeft: '3px solid ' + psColor,
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: i < 3 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                          border: '1px solid ' + (i < 3 ? 'var(--accent-gold)' : 'var(--border)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700,
                          color: i < 3 ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          fontFamily: 'Rajdhani, sans-serif',
                        }}>
                          #{i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
                            {player.name}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                            {player.playerType && (
                              <span style={{
                                background: psColor + '22', color: psColor, border: '1px solid ' + psColor + '44',
                                borderRadius: '4px', padding: '1px 8px', fontSize: '10px', fontWeight: 600,
                              }}>
                                {player.playerType}
                              </span>
                            )}
                            {player.battingRole && (
                              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}>
                                {player.battingRole}
                              </span>
                            )}
                            {player.bowlingCategory && (
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}>
                                {player.bowlingCategory}
                              </span>
                            )}
                            {player.bowlingSpecialty && (
                              <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}>
                                {player.bowlingSpecialty}
                              </span>
                            )}
                            <span style={{
                              background: player.nationality === 'Indian' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                              color: player.nationality === 'Indian' ? '#f59e0b' : '#818cf8',
                              borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 600,
                            }}>
                              {player.nationality || 'Overseas'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
                          {player.scoutingScore || 0}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1.5px', fontFamily: 'DM Mono, monospace' }}>SCOUT</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      {player.careerAvg > 0 && (
                        <div style={{ textAlign: 'center', minWidth: '44px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AVG</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{(player.careerAvg || 0).toFixed(1)}</div>
                        </div>
                      )}
                      {player.careerSR > 0 && (
                        <div style={{ textAlign: 'center', minWidth: '44px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SR</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{(player.careerSR || 0).toFixed(1)}</div>
                        </div>
                      )}
                      {player.bowlWickets > 0 && (
                        <div style={{ textAlign: 'center', minWidth: '44px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WKTS</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'Rajdhani, sans-serif' }}>{player.bowlWickets}</div>
                        </div>
                      )}
                      {player.bowlEconomy > 0 && (
                        <div style={{ textAlign: 'center', minWidth: '44px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ECO</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif' }}>{(player.bowlEconomy || 0).toFixed(1)}</div>
                        </div>
                      )}
                      <div style={{ textAlign: 'center', minWidth: '44px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PRICE</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'Rajdhani, sans-serif' }}>
                          {player.price ? '₹' + player.price + 'Cr' : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                      <ScoreBar label="PERF" value={player.performanceRating} color="var(--accent-gold)" />
                      <ScoreBar label="FORM" value={player.formRating} color="var(--accent-green)" />
                      <ScoreBar label="IMPT" value={player.impactRating} color="var(--accent-blue)" />
                      <ScoreBar label="PRES" value={player.pressureRating} color="var(--accent-purple)" />
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {player.matchesPlayed ? player.matchesPlayed + ' matches' : ''}
                      </span>
                      <button
                        onClick={function() { navigate('/?player=' + encodeURIComponent(player.name)) }}
                        style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                          borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                          fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        VIEW PROFILE
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Show more */}
              {!showAll && sortedResults.length > 15 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px' }}>
                  <button onClick={function() { setShowAll(true) }} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '10px 32px', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    SHOW MORE ({sortedResults.length - 15} remaining)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No exact matches found</div>
              <div style={{ fontSize: '13px', marginBottom: '20px' }}>Try widening your filters</div>
              <button onClick={function() {
                setLoading(true)
                fetch(API + '/scouting/recommend', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topN: 15 })
                })
                  .then(function(r) { return r.json() })
                  .then(function(data) { setResults(data.players || []); setLoading(false) })
                  .catch(function() { setLoading(false) })
              }} style={{
                background: 'var(--accent-gold)', border: 'none', borderRadius: '8px',
                padding: '8px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                fontFamily: 'Rajdhani, sans-serif', color: '#000',
              }}>
                SHOW TOP PICKS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Configure your scouting requirements above</div>
          <div style={{ fontSize: '13px' }}>
            Select a player type, role, and bowling specialty to find the perfect addition to your squad
          </div>
        </div>
      )}
    </div>
  )
}
