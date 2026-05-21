import { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8000';

const TEAMS = [
  { abbr: 'MI', name: 'Mumbai Indians' },
  { abbr: 'CSK', name: 'Chennai Super Kings' },
  { abbr: 'RCB', name: 'Royal Challengers Bengaluru' },
  { abbr: 'KKR', name: 'Kolkata Knight Riders' },
  { abbr: 'DC', name: 'Delhi Capitals' },
  { abbr: 'SRH', name: 'Sunrisers Hyderabad' },
  { abbr: 'RR', name: 'Rajasthan Royals' },
  { abbr: 'PBKS', name: 'Punjab Kings' },
  { abbr: 'GT', name: 'Gujarat Titans' },
  { abbr: 'LSG', name: 'Lucknow Super Giants' },
];

const TEAM_COLORS = {
  'Mumbai Indians': '#004BA0', 'Chennai Super Kings': '#FFCB05',
  'Royal Challengers Bengaluru': '#EC1C24', 'Kolkata Knight Riders': '#3A225D',
  'Delhi Capitals': '#004C93', 'Sunrisers Hyderabad': '#FF822A',
  'Rajasthan Royals': '#EA1A85', 'Punjab Kings': '#DD1F2D',
  'Gujarat Titans': '#1C1C2B', 'Lucknow Super Giants': '#A72056',
};

const TEAM_LOGOS = {
  MI: '/logos/MI_logo.svg', CSK: '/logos/CSK_logo.svg',
  RCB: '/logos/RCB_logo.svg', KKR: '/logos/KKR_logo.svg',
  DC: '/logos/DC_logo.svg', SRH: '/logos/SRH_logo.svg',
  RR: '/logos/RR_logo.svg', PBKS: '/logos/PBKS_logo.svg',
  GT: '/logos/GT_logo.svg', LSG: '/logos/LSG_logo.svg',
};

const STATUS_OPTIONS = ['IN SQUAD', 'RETAIN', 'RTM', 'RELEASE'];
const STATUS_STYLE = {
  'IN SQUAD': { bg: '#1e1e3a', border: '#4b5563', text: '#d1d5db' },
  RETAIN:     { bg: '#064e3b', border: '#10b981', text: '#34d399' },
  RTM:        { bg: '#713f12', border: '#f59e0b', text: '#fbbf24' },
  RELEASE:    { bg: '#450a0a', border: '#dc2626', text: '#f87171' },
};
const REC_BADGE = {
  RETAIN:     { color: '#10b981' }, RTM: { color: '#f59e0b' },
  'BUY BACK': { color: '#f97316' }, RELEASE: { color: '#dc2626' },
};
const PURSE_CAP = 125.0;

export default function AuctionIntelligence() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [squad, setSquad] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [repPlayer, setRepPlayer] = useState(null);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('squad');

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true); setStatuses({}); setRepPlayer(null); setReps([]);
    Promise.all([
      fetch(`${API}/auction/squad/${selectedTeam}`).then(r => r.json()),
      fetch(`${API}/auction/squad-analysis/${selectedTeam}`).then(r => r.json()),
    ]).then(([s, a]) => { setSquad(s); setAnalysis(a); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedTeam]);

  const getStatus = (name) => statuses[name] || 'IN SQUAD';
  const setStatus = (name, s) => setStatuses(prev => ({ ...prev, [name]: s }));
  const applyAI = () => {
    if (!squad) return;
    const m = {};
    squad.players.forEach(p => { m[p.player] = p.recommendation; });
    setStatuses(m);
  };
  const resetAll = () => setStatuses({});

  const fetchReps = (name) => {
    if (repPlayer === name) { setRepPlayer(null); setReps([]); return; }
    setRepPlayer(name);
    fetch(`${API}/auction/replacements/${encodeURIComponent(name)}?team=${selectedTeam}`)
      .then(r => r.json()).then(d => setReps(d.replacements || []));
  };

  // ── Live purse from user decisions ──
  const purse = (() => {
    if (!squad) return null;
    const groups = { RETAIN: [], RTM: [], RELEASE: [], 'IN SQUAD': [] };
    squad.players.forEach(p => { const s = getStatus(p.player); (groups[s] || groups['IN SQUAD']).push(p); });
    const sum = arr => arr.reduce((t, p) => t + (p.price_cr || 0), 0);
    const kept = [...groups.RETAIN, ...groups.RTM, ...groups['IN SQUAD']];
    const roles = {}; kept.forEach(p => { roles[p.role] = (roles[p.role] || 0) + 1; });
    const hasDecisions = groups.RETAIN.length + groups.RTM.length + groups.RELEASE.length > 0;
    return {
      hasDecisions, retainCount: groups.RETAIN.length, rtmCount: groups.RTM.length,
      releaseCount: groups.RELEASE.length, inSquadCount: groups['IN SQUAD'].length,
      retainCost: sum(groups.RETAIN), rtmCost: sum(groups.RTM),
      freedValue: sum(groups.RELEASE), keptRoles: roles,
      keptOverseas: kept.filter(p => p.is_overseas).length,
      slotsToFill: Math.max(0, 22 - kept.length),
    };
  })();

  const teamColor = selectedTeam ? TEAM_COLORS[TEAMS.find(t => t.abbr === selectedTeam)?.name] || '#333' : '#333';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div className="pi-header">
        <h1>Auction Intelligence</h1>
        <p>Full squad analysis · AI retention suggestions · Replacement scouting</p>
      </div>

      {/* Team selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TEAMS.map(t => (
          <button key={t.abbr} onClick={() => setSelectedTeam(t.abbr)}
            className="ai-team-btn"
            style={selectedTeam === t.abbr ? {
              border: `2px solid ${TEAM_COLORS[t.name]}`,
              background: TEAM_COLORS[t.name] + '30',
              color: '#fff', fontWeight: 700,
            } : {}}>
            {t.abbr}
          </button>
        ))}
      </div>

      {loading && (
        <div className="pp-loading">
          <div className="pp-spinner" />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading squad data...</div>
        </div>
      )}

      {!selectedTeam && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Select a team to begin</div>
          <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>View full squad analysis, AI retention suggestions, and replacement scouting</div>
        </div>
      )}

      {squad && analysis && !loading && (<>
        {/* Team banner with logo watermark */}
        <div style={{
          background: `linear-gradient(135deg, ${teamColor}40, var(--bg-secondary))`,
          borderLeft: `4px solid ${teamColor}`, borderRadius: 10,
          padding: '16px 24px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Logo watermark */}
          {TEAM_LOGOS[selectedTeam] && (
            <img
              src={TEAM_LOGOS[selectedTeam]}
              alt=""
              style={{
                position: 'absolute', right: -10, top: '50%',
                transform: 'translateY(-50%)',
                height: '220%',
                opacity: 0.2, pointerEvents: 'none',
                objectFit: 'contain',
              }}
            />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{squad.team}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {squad.squad_size} players · {squad.overseas_count} overseas · ₹{squad.total_spend} Cr total
            </div>
          </div>
          {purse?.hasDecisions && (
            <div style={{ display: 'flex', gap: 20, fontSize: 13, position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>₹{purse.freedValue.toFixed(1)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Freed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>{purse.releaseCount}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Released</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>{purse.slotsToFill}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Slots to Fill</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="pp-tabs" style={{ marginBottom: 20 }}>
          {[['squad', 'Squad Roster'], ['analysis', 'Squad Intelligence']].map(([k, l]) => (
            <button key={k}
              className={'pp-tab' + (tab === k ? ' active' : '')}
              onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {/* ═══ SQUAD ROSTER ═══ */}
        {tab === 'squad' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="ai-btn-primary" onClick={applyAI}>Apply AI Suggestions</button>
              <button className="ai-btn-secondary" onClick={resetAll}>Reset All</button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12 }}>
                {STATUS_OPTIONS.map(s => {
                  const c = STATUS_STYLE[s];
                  const n = squad.players.filter(p => getStatus(p.player) === s).length;
                  return n > 0 ? (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.border }} />
                      <span style={{ color: c.text }}>{s}: {n}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {squad.players
                .sort((a, b) => (b.retention_value || 0) - (a.retention_value || 0))
                .map(player => {
                  const st = getStatus(player.player);
                  const sty = STATUS_STYLE[st];
                  const rec = REC_BADGE[player.recommendation];
                  const showReps = repPlayer === player.player;

                  return (
                    <div key={player.player}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: sty.bg + '90', border: `1px solid ${sty.border}30`,
                        borderRadius: showReps ? '8px 8px 0 0' : 8,
                        transition: 'background 0.2s',
                      }}>
                        {/* Status dropdown */}
                        <select value={st} onChange={e => setStatus(player.player, e.target.value)} style={{
                          width: 95, padding: '5px 4px', borderRadius: 4,
                          background: sty.bg, border: `1px solid ${sty.border}`,
                          color: sty.text, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>

                        {/* Player info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <a href={`/?player=${encodeURIComponent(player.player)}`}
                              style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-display)', transition: 'color 0.15s' }}
                              onMouseEnter={e => e.target.style.color = '#60a5fa'}
                              onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                            >{player.player}</a>
                            {player.is_overseas && (
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontWeight: 600 }}>OVS</span>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 3 }}>{player.role}</span>
                            {rec && (
                              <span style={{ fontSize: 9, color: rec.color, fontWeight: 600, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                                AI: {player.recommendation}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {player.playstyle ? player.playstyle + ' · ' : ''}
                            {player.batting_role ? player.batting_role + ' · ' : ''}
                            {player.how_acquired}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
                          <div style={{ textAlign: 'center', minWidth: 48 }}>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{player.price_cr}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Price</div>
                          </div>
                          {player.career_avg != null && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{player.career_avg}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Avg</div>
                            </div>
                          )}
                          {player.career_sr != null && player.career_sr > 0 && player.role !== 'Bowler' && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{player.career_sr}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>SR</div>
                            </div>
                          )}
                          {player.bowl_economy != null && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{player.bowl_economy}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Eco</div>
                            </div>
                          )}
                          <div style={{ textAlign: 'center', minWidth: 40 }}>
                            <div style={{
                              color: player.scouting_score > 50 ? '#34d399' : player.scouting_score > 30 ? '#fbbf24' : '#f87171',
                              fontWeight: 700, fontFamily: 'var(--font-display)',
                            }}>{player.scouting_score || '—'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Scout</div>
                          </div>
                        </div>

                        {st === 'RELEASE' && (
                          <button
                            className={'ai-replace-btn' + (showReps ? ' active' : '')}
                            onClick={() => fetchReps(player.player)}>
                            {showReps ? 'HIDE' : 'REPLACE'}
                          </button>
                        )}
                      </div>

                      {/* Replacement panel */}
                      {showReps && reps.length > 0 && (
                        <div style={{
                          padding: '12px 16px 12px 108px', background: 'var(--bg-secondary)',
                          borderRadius: '0 0 8px 8px', border: '1px solid rgba(96,165,250,0.2)', borderTop: 'none',
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                            REPLACEMENT CANDIDATES — {player.role} · {player.is_overseas ? 'Overseas' : 'Indian'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {reps.map((r, i) => (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '8px 12px', background: 'rgba(96,165,250,0.06)', borderRadius: 6, fontSize: 12,
                              }}>
                                <span style={{ color: '#34d399', fontWeight: 700, width: 20, fontFamily: 'var(--font-display)' }}>#{i + 1}</span>
                                <a href={`/?player=${encodeURIComponent(r.player)}`}
                                  style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1, textDecoration: 'none', borderBottom: '1px dashed var(--border-light)', transition: 'color 0.15s' }}
                                  onMouseEnter={e => e.target.style.color = '#60a5fa'}
                                  onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                                >{r.player}</a>
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                                  {r.player_type || r.playstyle}
                                </span>
                                {r.bowling_category && (
                                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                                    {r.bowling_category}
                                  </span>
                                )}
                                {r.career_avg != null && <span style={{ color: 'var(--text-secondary)' }}>Avg: {r.career_avg}</span>}
                                {r.bowl_economy != null && <span style={{ color: 'var(--text-secondary)' }}>Eco: {r.bowl_economy}</span>}
                                {r.bowl_wickets != null && <span style={{ color: 'var(--text-secondary)' }}>W: {r.bowl_wickets}</span>}
                                <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{r.scouting_score}</span>
                                <span style={{
                                  fontSize: 9, padding: '2px 6px', borderRadius: 3,
                                  background: r.status === 'Unsold' ? '#7c2d12' : r.status === 'Active' ? '#064e3b' : 'rgba(96,165,250,0.12)',
                                  color: r.status === 'Unsold' ? '#fb923c' : r.status === 'Active' ? '#34d399' : '#60a5fa',
                                }}>{r.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ═══ SQUAD INTELLIGENCE ═══ */}
        {tab === 'analysis' && analysis && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Purse & Composition */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>Purse & Composition</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { l: 'Total Squad Spend', v: `₹${squad.total_spend} Cr`, c: 'var(--text-primary)' },
                  { l: 'Overseas Count', v: `${squad.overseas_count} / 8`, c: squad.overseas_count > 8 ? '#f87171' : '#34d399' },
                  { l: 'Squad Size', v: `${squad.squad_size} players`, c: 'var(--text-secondary)' },
                  { l: 'Salary Cap', v: `₹${PURSE_CAP} Cr`, c: 'var(--text-muted)' },
                ].map(i => (
                  <div key={i.l} style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{i.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: i.c, marginTop: 4, fontFamily: 'var(--font-display)' }}>{i.v}</div>
                  </div>
                ))}
              </div>

              {purse?.hasDecisions && (
                <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 10, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>YOUR AUCTION PLAN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Retain:</span> <span style={{ color: '#34d399', fontWeight: 700 }}>{purse.retainCount} (₹{purse.retainCost.toFixed(1)})</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>RTM:</span> <span style={{ color: '#fbbf24', fontWeight: 700 }}>{purse.rtmCount} (₹{purse.rtmCost.toFixed(1)})</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Released:</span> <span style={{ color: '#f87171', fontWeight: 700 }}>{purse.releaseCount} (₹{purse.freedValue.toFixed(1)})</span></div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                    Kept: {Object.entries(purse.keptRoles).map(([r, c]) => `${c} ${r}`).join(' · ')}
                    {' · '}{purse.keptOverseas} overseas · {purse.slotsToFill} slots to fill
                  </div>
                </div>
              )}

              <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, margin: '20px 0 10px', fontFamily: 'var(--font-display)' }}>Current Squad Composition</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(analysis.composition || {}).map(([r, c]) => (
                  <div key={r} style={{ padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700 }}>{c}</span> {r}
                  </div>
                ))}
              </div>

              <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, margin: '20px 0 10px', fontFamily: 'var(--font-display)' }}>Bowling Variety</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(analysis.bowling_variety || {}).map(([t, c]) => (
                  <div key={t} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12,
                    background: c > 0 ? '#064e3b' : 'var(--bg-card)',
                    color: c > 0 ? '#34d399' : 'var(--text-muted)',
                    border: c === 0 ? '1px dashed var(--border)' : 'none',
                  }}>{t}: {c}</div>
                ))}
              </div>
            </div>

            {/* Right: Gaps & Strengths */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>Squad Analysis</h3>

              {analysis.strengths?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 8, letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>STRENGTHS</div>
                  {analysis.strengths.map((s, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: 'rgba(16,185,129,0.06)', borderRadius: 6, color: '#34d399', fontSize: 12, borderLeft: '3px solid #10b981' }}>✓ {s}</div>
                  ))}
                </div>
              )}

              {analysis.gaps?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 8, letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>GAPS & WEAKNESSES</div>
                  {analysis.gaps.map((g, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: 'rgba(220,38,38,0.06)', borderRadius: 6, color: '#fca5a5', fontSize: 12, borderLeft: '3px solid #dc2626' }}>✗ {g}</div>
                  ))}
                </div>
              )}

              {analysis.historical_notes?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 8, letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>HISTORICAL TRENDS</div>
                  {analysis.historical_notes.map((h, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: 'rgba(96,165,250,0.06)', borderRadius: 6, color: '#93c5fd', fontSize: 12, borderLeft: '3px solid #3b82f6' }}>📊 {h}</div>
                  ))}
                </div>
              )}

              {analysis.priority_buys?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 8, letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>PRIORITY BUYS AT AUCTION</div>
                  {analysis.priority_buys.map((p, i) => {
                    const txt = typeof p === 'string' ? p : `${p.role} (${p.priority})`;
                    return <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: 'rgba(245,158,11,0.06)', borderRadius: 6, color: '#fbbf24', fontSize: 12, borderLeft: '3px solid var(--accent-gold)' }}>→ {txt}</div>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
