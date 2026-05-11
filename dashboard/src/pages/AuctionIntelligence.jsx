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
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Auction Intelligence</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>Full squad analysis · AI retention suggestions · Replacement scouting</p>
      </div>

      {/* Team selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TEAMS.map(t => (
          <button key={t.abbr} onClick={() => setSelectedTeam(t.abbr)} style={{
            padding: '10px 18px', borderRadius: 8,
            border: selectedTeam === t.abbr ? `2px solid ${TEAM_COLORS[t.name]}` : '2px solid #333',
            background: selectedTeam === t.abbr ? TEAM_COLORS[t.name] + '30' : '#1a1a2e',
            color: selectedTeam === t.abbr ? '#fff' : '#9ca3af',
            fontWeight: selectedTeam === t.abbr ? 700 : 500, cursor: 'pointer', fontSize: 13,
          }}>{t.abbr}</button>
        ))}
      </div>

      {loading && <div style={{ color: '#9ca3af', textAlign: 'center', padding: 60 }}>Loading...</div>}

      {!selectedTeam && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280', border: '1px dashed #333', borderRadius: 12, background: '#0d0d1a' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#9ca3af' }}>Select a team to begin</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>View full squad analysis, AI retention suggestions, and replacement scouting</div>
        </div>
      )}

      {squad && analysis && !loading && (<>
        {/* Team banner */}
        <div style={{
          background: `linear-gradient(135deg, ${teamColor}40, #0d0d1a)`,
          borderLeft: `4px solid ${teamColor}`, borderRadius: 10,
          padding: '16px 24px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{squad.team}</div>
            <div style={{ fontSize: 13, color: '#d1d5db', marginTop: 2 }}>
              {squad.squad_size} players · {squad.overseas_count} overseas · ₹{squad.total_spend} Cr total
            </div>
          </div>
          {purse?.hasDecisions && (
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: 20 }}>₹{purse.freedValue.toFixed(1)}</div>
                <div style={{ color: '#9ca3af' }}>Freed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: 20 }}>{purse.releaseCount}</div>
                <div style={{ color: '#9ca3af' }}>Released</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20 }}>{purse.slotsToFill}</div>
                <div style={{ color: '#9ca3af' }}>Slots to Fill</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
          {[['squad', 'Squad Roster'], ['analysis', 'Squad Intelligence']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === k ? '#1e1e3a' : 'transparent', color: tab === k ? '#fff' : '#6b7280',
              border: 'none', borderBottom: tab === k ? `2px solid ${teamColor}` : '2px solid transparent',
            }}>{l}</button>
          ))}
        </div>

        {/* ═══ SQUAD ROSTER ═══ */}
        {tab === 'squad' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={applyAI} style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: 'linear-gradient(135deg, #064e3b, #065f46)', color: '#34d399',
                border: '1px solid #10b981', cursor: 'pointer',
              }}>Apply AI Suggestions</button>
              <button onClick={resetAll} style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: '#1a1a2e', color: '#9ca3af', border: '1px solid #333', cursor: 'pointer',
              }}>Reset All</button>
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
                      }}>
                        {/* Status dropdown */}
                        <select value={st} onChange={e => setStatus(player.player, e.target.value)} style={{
                          width: 95, padding: '5px 4px', borderRadius: 4,
                          background: sty.bg, border: `1px solid ${sty.border}`,
                          color: sty.text, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        }}>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>

                        {/* Player info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <a href={`/?player=${encodeURIComponent(player.player)}`}
                              style={{ color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                              onMouseEnter={e => e.target.style.color = '#60a5fa'}
                              onMouseLeave={e => e.target.style.color = '#fff'}
                            >{player.player}</a>
                            {player.is_overseas && (
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: '#1e3a5f', color: '#60a5fa', fontWeight: 600 }}>OVS</span>
                            )}
                            <span style={{ fontSize: 10, color: '#9ca3af', padding: '2px 6px', background: '#111', borderRadius: 3 }}>{player.role}</span>
                            {rec && (
                              <span style={{ fontSize: 9, color: rec.color, fontWeight: 600, opacity: 0.7 }}>
                                AI: {player.recommendation}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                            {player.playstyle ? player.playstyle + ' · ' : ''}
                            {player.batting_role ? player.batting_role + ' · ' : ''}
                            {player.how_acquired}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
                          <div style={{ textAlign: 'center', minWidth: 48 }}>
                            <div style={{ color: '#fff', fontWeight: 700 }}>₹{player.price_cr}</div>
                            <div style={{ color: '#6b7280', fontSize: 10 }}>Price</div>
                          </div>
                          {player.career_avg != null && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: '#d1d5db', fontWeight: 600 }}>{player.career_avg}</div>
                              <div style={{ color: '#6b7280', fontSize: 10 }}>Avg</div>
                            </div>
                          )}
                          {player.career_sr != null && player.career_sr > 0 && player.role !== 'Bowler' && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: '#d1d5db', fontWeight: 600 }}>{player.career_sr}</div>
                              <div style={{ color: '#6b7280', fontSize: 10 }}>SR</div>
                            </div>
                          )}
                          {player.bowl_economy != null && (
                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                              <div style={{ color: '#d1d5db', fontWeight: 600 }}>{player.bowl_economy}</div>
                              <div style={{ color: '#6b7280', fontSize: 10 }}>Eco</div>
                            </div>
                          )}
                          <div style={{ textAlign: 'center', minWidth: 40 }}>
                            <div style={{
                              color: player.scouting_score > 50 ? '#34d399' : player.scouting_score > 30 ? '#fbbf24' : '#f87171',
                              fontWeight: 700,
                            }}>{player.scouting_score || '—'}</div>
                            <div style={{ color: '#6b7280', fontSize: 10 }}>Scout</div>
                          </div>
                        </div>

                        {st === 'RELEASE' && (
                          <button onClick={() => fetchReps(player.player)} style={{
                            padding: '6px 10px', fontSize: 10, fontWeight: 600,
                            background: showReps ? '#1e3a5f' : 'transparent',
                            color: '#60a5fa', border: '1px solid #1e3a5f',
                            borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>{showReps ? 'HIDE' : 'REPLACE'}</button>
                        )}
                      </div>

                      {/* Replacement panel */}
                      {showReps && reps.length > 0 && (
                        <div style={{
                          padding: '12px 16px 12px 108px', background: '#0d1b2a',
                          borderRadius: '0 0 8px 8px', border: '1px solid #1e3a5f', borderTop: 'none',
                        }}>
                          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>
                            REPLACEMENT CANDIDATES — {player.role} · {player.is_overseas ? 'Overseas' : 'Indian'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {reps.map((r, i) => (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '8px 12px', background: '#0f2942', borderRadius: 6, fontSize: 12,
                              }}>
                                <span style={{ color: '#34d399', fontWeight: 700, width: 20 }}>#{i + 1}</span>
                                <a href={`/?player=${encodeURIComponent(r.player)}`}
                                  style={{ color: '#fff', fontWeight: 600, flex: 1, textDecoration: 'none', borderBottom: '1px dashed #334155' }}
                                  onMouseEnter={e => e.target.style.color = '#60a5fa'}
                                  onMouseLeave={e => e.target.style.color = '#fff'}
                                >{r.player}</a>
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#1a1a2e', color: '#9ca3af' }}>
                                  {r.player_type || r.playstyle}
                                </span>
                                {r.bowling_category && (
                                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#1e1e3a', color: '#a78bfa' }}>
                                    {r.bowling_category}
                                  </span>
                                )}
                                {r.career_avg != null && <span style={{ color: '#d1d5db' }}>Avg: {r.career_avg}</span>}
                                {r.bowl_economy != null && <span style={{ color: '#d1d5db' }}>Eco: {r.bowl_economy}</span>}
                                {r.bowl_wickets != null && <span style={{ color: '#d1d5db' }}>W: {r.bowl_wickets}</span>}
                                <span style={{ color: '#10b981', fontWeight: 700 }}>{r.scouting_score}</span>
                                <span style={{
                                  fontSize: 9, padding: '2px 6px', borderRadius: 3,
                                  background: r.status === 'Unsold' ? '#7c2d12' : r.status === 'Active' ? '#064e3b' : '#1e3a5f',
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
            <div style={{ background: '#0d0d1a', borderRadius: 10, border: '1px solid #1e1e3a', padding: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Purse & Composition</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { l: 'Total Squad Spend', v: `₹${squad.total_spend} Cr`, c: '#fff' },
                  { l: 'Overseas Count', v: `${squad.overseas_count} / 8`, c: squad.overseas_count > 8 ? '#f87171' : '#34d399' },
                  { l: 'Squad Size', v: `${squad.squad_size} players`, c: '#d1d5db' },
                  { l: 'Salary Cap', v: `₹${PURSE_CAP} Cr`, c: '#9ca3af' },
                ].map(i => (
                  <div key={i.l} style={{ padding: 12, background: '#1a1a2e', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{i.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: i.c, marginTop: 4 }}>{i.v}</div>
                  </div>
                ))}
              </div>

              {purse?.hasDecisions && (
                <div style={{ marginTop: 16, padding: 16, background: '#111827', borderRadius: 8, border: '1px solid #1f2937' }}>
                  <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 10 }}>YOUR AUCTION PLAN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: '#6b7280' }}>Retain:</span> <span style={{ color: '#34d399', fontWeight: 700 }}>{purse.retainCount} (₹{purse.retainCost.toFixed(1)})</span></div>
                    <div><span style={{ color: '#6b7280' }}>RTM:</span> <span style={{ color: '#fbbf24', fontWeight: 700 }}>{purse.rtmCount} (₹{purse.rtmCost.toFixed(1)})</span></div>
                    <div><span style={{ color: '#6b7280' }}>Released:</span> <span style={{ color: '#f87171', fontWeight: 700 }}>{purse.releaseCount} (₹{purse.freedValue.toFixed(1)})</span></div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280' }}>
                    Kept: {Object.entries(purse.keptRoles).map(([r, c]) => `${c} ${r}`).join(' · ')}
                    {' · '}{purse.keptOverseas} overseas · {purse.slotsToFill} slots to fill
                  </div>
                </div>
              )}

              <h4 style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600, margin: '20px 0 10px' }}>Current Squad Composition</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(analysis.composition || {}).map(([r, c]) => (
                  <div key={r} style={{ padding: '6px 12px', background: '#1a1a2e', borderRadius: 6, fontSize: 12, color: '#d1d5db' }}>
                    <span style={{ fontWeight: 700 }}>{c}</span> {r}
                  </div>
                ))}
              </div>

              <h4 style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600, margin: '20px 0 10px' }}>Bowling Variety</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(analysis.bowling_variety || {}).map(([t, c]) => (
                  <div key={t} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12,
                    background: c > 0 ? '#064e3b' : '#1a1a2e',
                    color: c > 0 ? '#34d399' : '#4b5563',
                    border: c === 0 ? '1px dashed #333' : 'none',
                  }}>{t}: {c}</div>
                ))}
              </div>
            </div>

            {/* Right: Gaps & Strengths */}
            <div style={{ background: '#0d0d1a', borderRadius: 10, border: '1px solid #1e1e3a', padding: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Squad Analysis</h3>

              {analysis.strengths?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>STRENGTHS</div>
                  {analysis.strengths.map((s, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: '#064e3b30', borderRadius: 6, color: '#34d399', fontSize: 12, borderLeft: '3px solid #10b981' }}>✓ {s}</div>
                  ))}
                </div>
              )}

              {analysis.gaps?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>GAPS & WEAKNESSES</div>
                  {analysis.gaps.map((g, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: '#450a0a30', borderRadius: 6, color: '#fca5a5', fontSize: 12, borderLeft: '3px solid #dc2626' }}>✗ {g}</div>
                  ))}
                </div>
              )}

              {analysis.historical_notes?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>HISTORICAL TRENDS</div>
                  {analysis.historical_notes.map((h, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: '#1e3a5f30', borderRadius: 6, color: '#93c5fd', fontSize: 12, borderLeft: '3px solid #3b82f6' }}>📊 {h}</div>
                  ))}
                </div>
              )}

              {analysis.priority_buys?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>PRIORITY BUYS AT AUCTION</div>
                  {analysis.priority_buys.map((p, i) => {
                    const txt = typeof p === 'string' ? p : `${p.role} (${p.priority})`;
                    return <div key={i} style={{ padding: '8px 12px', marginBottom: 4, background: '#713f1230', borderRadius: 6, color: '#fbbf24', fontSize: 12, borderLeft: '3px solid #f59e0b' }}>→ {txt}</div>;
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
