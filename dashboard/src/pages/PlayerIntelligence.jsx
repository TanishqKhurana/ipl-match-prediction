import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts'

const API = 'http://127.0.0.1:8000'

const TEAM_COLORS = {
  'Royal Challengers Bengaluru': '#9c2121',
  'Mumbai Indians': '#004ba0',
  'Chennai Super Kings': '#f9cd05',
  'Kolkata Knight Riders': '#521ca2',
  'Delhi Capitals': '#004c93',
  'Sunrisers Hyderabad': '#f26522',
  'Punjab Kings': '#e40a44',
  'Rajasthan Royals': '#e50ec5',
  'Gujarat Titans': '#1c2951',
  'Lucknow Super Giants': '#a2d9f7',
  'Rising Pune Supergiant': '#7e1e5d',
  'Deccan Chargers': '#E4A11B',
  'Retired': '#6b7280',
  'Unsold': '#ff0000',
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
  'Retired': '/logos/Retired.svg',
  'Unsold': '/logos/Unsold.svg',
}
const TEAM_ABBR = {
  'Royal Challengers Bengaluru': 'RCB',
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Kolkata Knight Riders': 'KKR',
  'Delhi Capitals': 'DC',
  'Sunrisers Hyderabad': 'SRH',
  'Punjab Kings': 'PBKS',
  'Rajasthan Royals': 'RR',
  'Gujarat Titans': 'GT',
  'Lucknow Super Giants': 'LSG',
  'Retired': 'RET',
  'Unsold': 'UNSL',
}

const TEAM_ABBR_COLORS = {
  RCB: '#c41e3a', MI: '#004ba0', CSK: '#f9cd05',
  KKR: '#3a225d', DC: '#004c93', SRH: '#f26522',
  PBKS: '#ed1f27', RR: '#ea14bb', GT: '#435489',
  LSG: '#a2d9f7', RPS: '#743458', DC2: '#191670',
  PWI: '#6b3fa0', GL: '#e87722', KTK: '#fc6f04',
  
}

const PLAYER_PHOTOS = {
  'AB de Villiers': '/players/AB_de_Villiers.jpg',
  'AD Russell': '/players/AD_Russell.jpg',
  'AT Rayudu': '/players/AT_Rayudu.jpg',
  'Arshdeep Singh': '/players/Arshdeep_Singh.jpg',
  'Axar Patel': '/players/Axar_Patel.jpg',
  'BA Stokes': '/players/BA_Stokes.jpg',
  'B Kumar': '/players/B_Kumar.jpg',
  'CH Gayle': '/players/CH_Gayle.jpg',
  'DA Miller': '/players/DA_Miller.jpg',
  'DA Warner': '/players/DA_Warner.jpg',
  'DJ Bravo': '/players/DJ_Bravo.jpg',
  'DP Conway': '/players/DP_Conway.jpg',
  'GJ Maxwell': '/players/GJ_Maxwell.jpg',
  'G Gambhir': '/players/G_Gambhir.jpg',
  'HH Pandya': '/players/HH_Pandya.jpg',
  'Harbhajan Singh': '/players/Harbhajan_Singh.jpg',
  'IK Pathan': '/players/IK_Pathan.jpg',
  'Ishan Kishan': '/players/Ishan_Kishan.jpg',
  'JC Buttler': '/players/JC_Buttler.jpg',
  'JJ Bumrah': '/players/JJ_Bumrah.jpg',
  'JM Bairstow': '/players/JM_Bairstow.jpg',
  'KA Pollard': '/players/KA_Pollard.jpg',
  'KD Karthik': '/players/KD_Karthik.jpg',
  'KL Rahul': '/players/KL_Rahul.jpg',
  'KS Williamson': '/players/KS_Williamson.jpg',
  'K Rabada': '/players/K_Rabada.jpg',
  'Kuldeep Yadav': '/players/Kuldeep_Yadav.jpg',
  'MS Dhoni': '/players/MS_Dhoni.jpg',
  'Mohammed Shami': '/players/Mohammed_Shami.jpg',
  'Mohammed Siraj': '/players/Mohammed_Siraj.jpg',
  'PP Chawla': '/players/PP_Chawla.jpg',
  'PP Shaw': '/players/PP_Shaw.png',
  'Q de Kock': '/players/Q_de_Kock.jpg',
  'RA Jadeja': '/players/RA_Jadeja.jpg',
  'RA Tripathi': '/players/RA_Tripathi.jpg',
  'RD Gaikwad': '/players/RD_Gaikwad.jpeg',
  'RG Sharma': '/players/RG_Sharma.jpg',
  'RR Pant': '/players/RR_Pant.jpg',
  'RV Uthappa': '/players/RV_Uthappa.jpg',
  'R Ashwin': '/players/R_Ashwin.jpg',
  'Rashid Khan': '/players/Rashid_Khan.jpg',
  'Ravi Bishnoi': '/players/Ravi_Bishnoi.jpg',
  'SC Ganguly': '/players/SC_Ganguly.jpg',
  'SK Raina': '/players/SK_Raina.jpg',
  'SM Stoinis': '/players/SM_Stoinis.jpg',
  'SP Narine': '/players/SP_Narine.jpg',
  'SR Tendulkar': '/players/SR_Tendulkar.jpg',
  'SR Watson': '/players/SR_Watson.jpg',
  'SS Iyer': '/players/SS_Iyer.jpg',
  'SV Samson': '/players/SV_Samson.jpg',
  'S Dhawan': '/players/S_Dhawan.jpg',
  'Shubman Gill': '/players/Shubman_Gill.jpg',
  'TA Boult': '/players/TA_Boult.jpg',
  'UT Yadav': '/players/UT_Yadav.jpg',
  'V Kohli': '/players/V_Kohli.jpg',
  'V Sehwag': '/players/V_Sehwag.jpg',
  'Varun Chakravarthy': '/players/Varun_Chakravarthy.jpg',
  'WP Saha': '/players/WP_Saha.jpg',
  'Washington Sundar': '/players/Washington_Sundar.jpg',
  'YBK Jaiswal': '/players/YBK_Jaiswal.jpg',
  'YS Chahal': '/players/YS_Chahal.jpg',
  'Yusuf Pathan': '/players/Yusuf_Pathan.jpg',
  'Yuvraj Singh': '/players/Yuvraj_Singh.jpeg',
}
const SUGGESTED = [
  'V Kohli', 'MS Dhoni', 'JJ Bumrah', 'RR Pant',
  'RG Sharma', 'YBK Jaiswal', 'HH Pandya', 'RA Jadeja', 'KL Rahul'
]

function StatCard({ label, value, color }) {
  const c = color || 'var(--accent-gold)'
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '16px', textAlign: 'center',
      borderTop: '2px solid ' + c
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: c, fontFamily: 'Rajdhani, sans-serif' }}>
        {value !== undefined && value !== null ? value : '—'}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '1px' }}>
        {label}
      </div>
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '12px'
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      {payload.map(function(p, i) {
        return (
          <div key={i} style={{ color: p.color || 'var(--accent-gold)', fontWeight: 600 }}>
            {p.name}: {p.value}
          </div>
        )
      })}
    </div>
  )
}



const QUERY_SUGGESTIONS = [
  'Kohli runs per season',
  'Bumrah wickets per season',
  'Dhoni strike rate by phase',
  'compare Kohli and Rohit runs by phase',
  'top 10 run scorers in 2024',
  'Kohli career stats',
  'Kohli DNA',
  'Bumrah radar',
  'Kohli runs breakdown',
  'Rohit sixes per season',
  'SR vs average scatter plot in 2024',
  'Dhoni runs trend',
  'Bumrah last 5 matches',
  'Kohli venue stats',
]

const METRIC_KEYWORDS = [
  'runs', 'run', 'wickets', 'wicket', 'economy', 'eco', 'strike rate', 'sr',
  'average', 'avg', 'sixes', 'fours', 'boundaries', 'top', 'compare',
  'career', 'last', 'per season', 'by phase', 'dot', 'highest',
  'dna', 'radar', 'breakdown', 'trend', 'scatter', 'venue stats',
  'partnerships', 'vs',
]

function isAnalyticsQuery(text) {
  const lower = text.toLowerCase()
  return METRIC_KEYWORDS.some(function(k) { return lower.includes(k) })
}

const CHART_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6']
const PIE_COLORS = ['#f59e0b', '#6366f1', '#10b981']

function QueryChart({ result, onPlayerClick }) {
  if (!result || result.chart_type === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 16, marginBottom: 8, color: '#f87171' }}>Could not process that query</div>
        <div style={{ fontSize: 13 }}>{result && result.message ? result.message : 'Try "Kohli runs per season" or "top 10 wickets in 2024"'}</div>
      </div>
    )
  }

  var chart_type = result.chart_type
  var title = result.title
  var data = result.data
  var x_key = result.x_key
  var y_key = result.y_key
  var y_label = result.y_label
  var parsed = result.parsed

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {title}
        </div>
        {parsed && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px' }}>
            {parsed.template.replace(/_/g, ' ').toUpperCase()}
            {parsed.players && parsed.players.length > 0 ? ' · ' + parsed.players.join(', ') : ''}
          </div>
        )}
      </div>

      {/* Bar Chart */}
      {chart_type === 'bar' && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={x_key} tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                   angle={data.length > 12 ? -45 : 0} textAnchor={data.length > 12 ? 'end' : 'middle'}
                   height={data.length > 12 ? 55 : 30} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey={y_key} name={y_label} radius={[4, 4, 0, 0]}>
              {data.map(function(entry, i) {
                return <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Line Chart */}
      {chart_type === 'line' && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={x_key} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={CustomTooltip} />
            <Line type="monotone" dataKey={y_key} stroke="#f59e0b" strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }} name={y_label} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Grouped Bar (compare) */}
      {chart_type === 'grouped_bar' && (function() {
        var players = []
        data.forEach(function(d) { if (players.indexOf(d.player) === -1) players.push(d.player) })
        var categories = []
        data.forEach(function(d) { if (categories.indexOf(d.category) === -1) categories.push(d.category) })
        var grouped = categories.map(function(cat) {
          var row = { category: cat }
          players.forEach(function(p) {
            var match = data.find(function(d) { return d.category === cat && d.player === p })
            row[p] = match ? match.value : 0
          })
          return row
        })
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={grouped} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={CustomTooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              {players.map(function(p, i) {
                return <Bar key={p} dataKey={p} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />
              })}
            </BarChart>
          </ResponsiveContainer>
        )
      })()}

      {/* Horizontal Bar (leaderboard / venue) */}
      {chart_type === 'horizontal_bar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map(function(item, i) {
            var maxVal = Math.max.apply(null, data.map(function(d) { return d.value }))
            var pct = (item.value / maxVal) * 100
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 24, fontSize: 12, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>
                  #{i + 1}
                </span>
                <span
                  style={{ width: 140, fontSize: 13, color: 'var(--text-primary)', cursor: onPlayerClick ? 'pointer' : 'default', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={function() { if (onPlayerClick) onPlayerClick(item.player) }}
                >
                  {item.player}
                </span>
                <div style={{ flex: 1, height: 24, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: pct + '%', height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, ' + CHART_COLORS[i % CHART_COLORS.length] + 'cc, ' + CHART_COLORS[i % CHART_COLORS.length] + '55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                    fontSize: 11, color: '#fff', fontWeight: 700, minWidth: 40,
                  }}>
                    {item.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stat Card */}
      {chart_type === 'stat_card' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {data.map(function(item, i) {
            return (
              <div key={i} style={{
                background: 'var(--bg-secondary)', borderRadius: 10, padding: 14,
                textAlign: 'center', borderTop: '2px solid ' + CHART_COLORS[i % CHART_COLORS.length]
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length], fontFamily: 'Rajdhani, sans-serif' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 4 }}>{item.metric}</div>
                {item.sub && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Radar Chart */}
      {chart_type === 'radar' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
              <Radar name="Player DNA" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie Chart */}
      {chart_type === 'pie' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
          <ResponsiveContainer width="50%" height={260}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
                   innerRadius={55} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                {data.map(function(entry, i) {
                  return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map(function(item, i) {
              var total = data.reduce(function(s, d) { return s + d.value }, 0)
              var pct = total > 0 ? Math.round(item.value / total * 100) : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, minWidth: 80 }}>{item.name}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>{item.value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scatter Plot */}
      {chart_type === 'scatter' && (
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="average" name="Average" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                   label={{ value: 'Average', position: 'bottom', fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis dataKey="strike_rate" name="Strike Rate" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                   label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
            <ZAxis dataKey="runs" range={[40, 400]} name="Runs" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              content={function(props) {
                if (!props.active || !props.payload || !props.payload.length) return null
                var d = props.payload[0].payload
                return (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{d.player}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Avg: {d.average} · SR: {d.strike_rate} · Runs: {d.runs}</div>
                  </div>
                )
              }}
            />
            <Scatter data={data} fill="#f59e0b" fillOpacity={0.7}>
              {data.map(function(entry, i) {
                return <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ChatInterface({ onSelectPlayer }) {
  var messagesEndRef = useRef(null)
  var inputRef = useRef(null)
  var _s1 = useState(''); var query = _s1[0]; var setQuery = _s1[1]
  var _s2 = useState([]); var messages = _s2[0]; var setMessages = _s2[1]
  var _s3 = useState(false); var loading = _s3[0]; var setLoading = _s3[1]
  var _s4 = useState([]); var searchResults = _s4[0]; var setSearchResults = _s4[1]
  var _s5 = useState(false); var focused = _s5[0]; var setFocused = _s5[1]

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(function() { scrollToBottom() }, [messages, loading])

  // Search for players (debounced)
  useEffect(function() {
    if (query.length < 2 || isAnalyticsQuery(query)) { setSearchResults([]); return }
    var timer = setTimeout(function() {
      fetch(API + '/players/search/' + query)
        .then(function(r) { return r.json() })
        .then(function(data) { setSearchResults(data) })
        .catch(function() { setSearchResults([]) })
    }, 250)
    return function() { clearTimeout(timer) }
  }, [query])

  function handleSubmit() {
    if (!query.trim()) return
    var q = query.trim()
    setQuery('')
    setSearchResults([])

    if (isAnalyticsQuery(q)) {
      // Analytics query
      setMessages(function(prev) { return prev.concat([{ type: 'query', text: q }]) })
      setLoading(true)
      fetch(API + '/query?prompt=' + encodeURIComponent(q))
        .then(function(r) { return r.json() })
        .then(function(data) {
          setMessages(function(prev) { return prev.concat([{ type: 'chart', data: data }]) })
          setLoading(false)
        })
        .catch(function() {
          setMessages(function(prev) { return prev.concat([{ type: 'chart', data: { chart_type: 'error', message: 'Failed to fetch data' } }]) })
          setLoading(false)
        })
    } else {
      // Player search — navigate to profile
      onSelectPlayer(q)
    }
  }

  function handleSuggestion(q) {
    setQuery('')
    setMessages(function(prev) { return prev.concat([{ type: 'query', text: q }]) })
    setLoading(true)
    fetch(API + '/query?prompt=' + encodeURIComponent(q))
      .then(function(r) { return r.json() })
      .then(function(data) {
        setMessages(function(prev) { return prev.concat([{ type: 'chart', data: data }]) })
        setLoading(false)
      })
      .catch(function() { setLoading(false) })
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      if (searchResults.length > 0 && !isAnalyticsQuery(query)) {
        onSelectPlayer(searchResults[0])
        setQuery('')
      } else {
        handleSubmit()
      }
    }
  }

  var isEmpty = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', position: 'relative' }}>
      <style>{[
        '@keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }',
        '.chat-suggest:hover { background: rgba(245,158,11,0.15) !important; color: var(--accent-gold) !important; border-color: var(--accent-gold) !important; }',
        '.chat-iq:hover { background: rgba(99,102,241,0.15) !important; color: #818cf8 !important; border-color: #6366f1 !important; }',
        '.result-item:hover { background: rgba(255,255,255,0.06) !important; }',
      ].join('\n')}</style>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-gold)', letterSpacing: 4, lineHeight: 1 }}>
              IPL INTEL
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 5, marginTop: 8, fontFamily: 'DM Mono, monospace' }}>
              FRANCHISE INTELLIGENCE SYSTEM
            </div>

            <div style={{ marginTop: 36, maxWidth: 600 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12, fontFamily: 'DM Mono, monospace' }}>POPULAR PLAYERS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SUGGESTED.map(function(p) {
                  return (
                    <button key={p} className="chat-suggest" onClick={function() { onSelectPlayer(p) }}
                      style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, transition: 'all 0.18s', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop: 24, maxWidth: 600 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12, fontFamily: 'DM Mono, monospace' }}>ASK INTEL</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {QUERY_SUGGESTIONS.slice(0, 8).map(function(q) {
                  return (
                    <button key={q} className="chat-iq" onClick={function() { handleSuggestion(q) }}
                      style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 12, transition: 'all 0.18s', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
                      {q}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop: 48, display: 'flex', gap: 48 }}>
              {[['761', 'PLAYERS'], ['278K+', 'DELIVERIES'], ['18', 'SEASONS'], ['2008-2025', 'COVERAGE']].map(function(item) {
                return (
                  <div key={item[1]} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{item[0]}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 3, fontFamily: 'DM Mono, monospace' }}>{item[1]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map(function(msg, i) {
          if (msg.type === 'query') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, animation: 'fadeIn 0.3s ease' }}>
                <div style={{
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: '16px 16px 4px 16px', padding: '10px 18px', maxWidth: '70%',
                  fontSize: 14, color: 'var(--accent-gold)', fontWeight: 500
                }}>
                  {msg.text}
                </div>
              </div>
            )
          }
          if (msg.type === 'chart') {
            return (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 24, marginBottom: 16, maxWidth: '95%',
                animation: 'fadeIn 0.4s ease',
                borderTop: '2px solid var(--accent-gold)'
              }}>
                <QueryChart result={msg.data} onPlayerClick={onSelectPlayer} />
              </div>
            )
          }
          return null
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 6, padding: '12px 0', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gold)', opacity: 0.4, animation: 'pulse 1s infinite' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gold)', opacity: 0.4, animation: 'pulse 1s infinite 0.2s' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gold)', opacity: 0.4, animation: 'pulse 1s infinite 0.4s' }} />
            <style>{'@keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }'}</style>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar - fixed at bottom */}
      <div style={{ position: 'relative', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        {/* Search results dropdown (above input) */}
        {searchResults.length > 0 && focused && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 12, overflow: 'hidden', zIndex: 100, boxShadow: '0 -10px 30px rgba(0,0,0,0.4)'
          }}>
            {searchResults.slice(0, 6).map(function(p, i) {
              return (
                <div key={p} className="result-item"
                  onClick={function() { onSelectPlayer(p); setQuery('') }}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)', transition: 'background 0.15s'
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  {p}
                </div>
              )
            })}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-card)', border: '1px solid ' + (focused ? 'var(--accent-gold)' : 'var(--border-light)'),
          borderRadius: 14, padding: '12px 16px', transition: 'border 0.2s, box-shadow 0.2s',
          boxShadow: focused ? '0 0 20px rgba(245,158,11,0.1)' : 'none'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={function(e) { setQuery(e.target.value) }}
            onFocus={function() { setFocused(true) }}
            onBlur={function() { setTimeout(function() { setFocused(false) }, 200) }}
            onKeyDown={handleKey}
            placeholder="Search a player or ask a question..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif'
            }}
          />
          {query && (
            <button onClick={function() { setQuery('') }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
          )}
          <button onClick={handleSubmit}
            style={{
              background: query.trim() ? 'var(--accent-gold)' : 'var(--bg-secondary)',
              border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              color: query.trim() ? '#000' : 'var(--text-muted)', fontWeight: 700, fontSize: 12,
              transition: 'all 0.2s', letterSpacing: 0.5
            }}>
            ASK
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          Search any player by name · Ask analytics like "Kohli runs per season" · Try "compare" or "top 10"
        </div>
      </div>
    </div>
  )
}


function PlayerProfile({ playerName, onBack }) {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [imgError, setImgError] = useState(false)

  useEffect(function() {
    setLoading(true)
    setImgError(false)
    setActiveTab('overview')
    fetch(API + '/player/' + encodeURIComponent(playerName))
      .then(function(r) { return r.json() })
      .then(function(data) { setPlayer(data); setLoading(false) })
      .catch(function() { setLoading(false) })
  }, [playerName])

  const teamColor = player ? (TEAM_COLORS[player.franchise] || 'var(--accent-gold)') : 'var(--accent-gold)'
  // const cricInfoId = CRICINFO_IDS[playerName]
  const photoUrl = PLAYER_PHOTOS[playerName] || null
  console.log('playerName:', playerName, 'photoUrl:', photoUrl)
  const franchiseAbbr = player && player.franchise ? (TEAM_ABBR[player.franchise] || player.franchise.slice(0, 4)) : ''

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading {playerName}...</div>
      </div>
    )
  }

  if (!player || player.error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-muted)' }}>Player not found</div>
        <button onClick={onBack} style={{ padding: '10px 24px', background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
          Back to Search
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fadeUp 0.3s ease forwards; }
        .back-btn:hover { background: var(--bg-secondary) !important; color: var(--text-primary) !important; }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>

      <button className="back-btn" onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px',
        background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '7px 14px', cursor: 'pointer', color: 'var(--text-secondary)',
        fontSize: '13px', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s'
      }}>
        &larr; Back to Search
      </button>

      {/* Hero Card */}
      <div className="fu" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', marginBottom: '20px',
        borderTop: '3px solid ' + teamColor, overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, ' + teamColor + '18, transparent)',
          padding: '28px', display: 'grid',
          gridTemplateColumns: '140px 1fr 210px', gap: '24px', alignItems: 'start'
        }}>

          {/* Photo */}
          <div style={{
            width: '130px', height: '155px', borderRadius: '12px',
            background: 'linear-gradient(135deg, ' + teamColor + '44, ' + teamColor + '11)',
            border: '2px solid ' + teamColor + '55',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {photoUrl && !imgError ? (
              <img src={photoUrl} alt={player.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                onError={function() { setImgError(true) }} />
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: teamColor, opacity: 0.5 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
           
          {/* Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '34px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#fff', lineHeight: 1 }}>
                {player.name}
              </h2>
              {franchiseAbbr && (
                <span style={{
                  background: teamColor + '33', color: teamColor,
                  border: '1px solid ' + teamColor + '66',
                  borderRadius: '6px', padding: '4px 12px',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace'
                }}>
                  {franchiseAbbr}
                </span>
              )}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{player.role}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {player.battingHand}-hand bat &nbsp;&middot;&nbsp; {player.bowlingStyle} {player.bowlingType}
            </div>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                ['IPL DEBUT', player.debut],
                ['SEASONS', player.seasons],
                ['INNINGS', player.batting ? player.batting.innings : '—']
              ].map(function(item) {
                return (
                  <div key={item[0]}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '2px' }}>{item[0]}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#fff' }}>{item[1]}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Franchise + Price */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
            padding: '18px', border: '1px solid ' + teamColor + '33',
            display: 'flex', flexDirection: 'column', gap: '14px'
          }}>
            <div style={{
  width: '80px', height: '80px', borderRadius: '8px',
  background: teamColor + '22',
  border: '1px solid ' + teamColor + '44',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  overflow: 'hidden', flexShrink: 0
}}>
  {TEAM_LOGOS[player.franchise] ? (
    <img
      src={TEAM_LOGOS[player.franchise]}
      alt={player.franchise}
      style={{ width: '60px', height: '60px', objectFit: 'contain' }}
      onError={function(e) {
        e.target.style.display = 'none'
        e.target.parentNode.innerHTML = '<span style="font-size:14px;font-weight:900;color:' + teamColor + ';font-family:Rajdhani,sans-serif">' + franchiseAbbr.slice(0,3) + '</span>'
      }}
    />
  ) : (
    <span style={{
      fontSize: '14px', fontWeight: 900, color: teamColor,
      fontFamily: 'Rajdhani, sans-serif'
    }}>
      {franchiseAbbr ? franchiseAbbr.slice(0, 3) : '?'}
    </span>
  )}
</div>
<div>
    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '2px' }}>
      FRANCHISE
    </div>
    <div style={{ fontSize: '13px', fontWeight: 600, color: teamColor, lineHeight: 1.2 }}>
      {player.franchise || 'Released'}
    </div>
  </div>
            <div style={{ height: '1px', background: teamColor + '22' }} />

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '4px' }}>MARKET VALUE</div>
              <div style={{ fontSize: '34px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
                {player.price ? '\u20B9' + player.price + ' Cr' : 'N/A'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                {player.acquisition}
              </div>
            </div>
          </div>
        </div>
        
        {/* Career Path */}
        {player.franchiseHistory && player.franchiseHistory.length > 0 && (
          <div style={{
            padding: '12px 28px', borderTop: '1px solid ' + teamColor + '22',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginRight: '4px', fontFamily: 'DM Mono, monospace' }}>
              CAREER PATH
            </span>
            {player.franchiseHistory.map(function(h, i) {
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>&rarr;</span>}
                  <span style={{
                    background: (TEAM_ABBR_COLORS[h.team] || '#666') + '22',
                    color: TEAM_ABBR_COLORS[h.team] || '#aaa',
                    border: '1px solid ' + (TEAM_ABBR_COLORS[h.team] || '#666') + '44',
                    borderRadius: '5px', padding: '3px 10px', fontSize: '12px', fontWeight: 600
                  }}>
                    {h.years}: {h.team}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        background: 'var(--bg-secondary)', borderRadius: '10px',
        padding: '4px', width: 'fit-content'
      }}>
        {[['overview', 'Overview'], ['venues', 'Venues']].map(function(item) {
          const isActive = activeTab === item[0]
          return (
            <button key={item[0]} className="tab-btn" onClick={function() { setActiveTab(item[0]) }}
              style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s',
                background: isActive ? 'var(--accent-gold)' : 'transparent',
                color: isActive ? '#000' : 'var(--text-muted)'
              }}>
              {item[1]}
            </button>
          )
        })}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {player.batting && (
            <div>
              <SectionTitle>BATTING STATISTICS</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <StatCard label="RUNS" value={player.batting.runs ? player.batting.runs.toLocaleString() : '—'} />
                <StatCard label="AVERAGE" value={player.batting.avg} />
                <StatCard label="STRIKE RATE" value={player.batting.sr} />
                <StatCard label={'HS (' + (player.batting.hs_balls || '—') + 'b)'} value={player.batting.hs} color="var(--accent-purple)" />
                <StatCard label="FOURS" value={player.batting.fours ? player.batting.fours.toLocaleString() : '—'} color="var(--accent-blue)" />
                <StatCard label="SIXES" value={player.batting.sixes} color="var(--accent-green)" />
              </div>
            </div>
          )}

          {player.bowling && (
            <div>
              <SectionTitle>BOWLING STATISTICS</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <StatCard label="WICKETS" value={player.bowling.wickets} color="var(--accent-red)" />
                <StatCard label="AVERAGE" value={player.bowling.avg} color="var(--accent-red)" />
                <StatCard label="ECONOMY" value={player.bowling.economy} color="var(--accent-red)" />
                <StatCard label="STRIKE RATE" value={player.bowling.sr} color="var(--accent-purple)" />
                <StatCard label="DOT BALL %" value={player.bowling.dotPct + '%'} color="var(--accent-blue)" />
                <StatCard label="BEST FIGURES" value={player.bowling.best} color="var(--accent-green)" />
              </div>
            </div>
          )}

          <div>
            <SectionTitle>{player.isBowler ? 'WICKETS PER SEASON' : 'RUNS PER SEASON'}</SectionTitle>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={player.seasonStats} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="season" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={player.isBowler ? 'wickets' : 'runs'} fill={teamColor} radius={[3, 3, 0, 0]} opacity={0.85} name={player.isBowler ? 'Wickets' : 'Runs'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <SectionTitle>{player.isBowler ? 'ECONOMY BY PHASE' : 'STRIKE RATE BY PHASE'}</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {player.phaseStats && player.phaseStats.map(function(p, i) {
                const colors = ['var(--accent-gold)', 'var(--accent-blue)', 'var(--accent-red)']
                const val = player.isBowler ? p.economy : p.sr
                const sub = player.isBowler ? (p.wickets + ' wickets') : (p.runs + ' runs')
                return (
                  <div key={i} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '20px', textAlign: 'center',
                    borderTop: '2px solid ' + colors[i]
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'DM Mono, monospace' }}>
                      {p.phase ? p.phase.toUpperCase() : ''}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: colors[i], fontFamily: 'Rajdhani, sans-serif' }}>{val}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {player.isBowler ? 'Economy Rate' : 'Strike Rate'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* VENUES */}
      {activeTab === 'venues' && (
          <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionTitle>CURRENT SEASON VENUES · RANKED</SectionTitle>
          {player.venueStats && player.venueStats.length > 0 ? (
            player.venueStats.map(function(v, i) {
              const typeColor = v.type === 'happy' ? 'var(--accent-green)' : v.type === 'bogey' ? 'var(--accent-red)' : 'var(--text-muted)'
              const typeLabel = v.type === 'happy' ? 'Happy Ground' : v.type === 'bogey' ? 'Bogey Ground' : 'Neutral'
              return (
                <div key={i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '16px 20px',
                  display: 'grid', gridTemplateColumns: '44px 220px 1fr',
                  gap: '24px', alignItems: 'center', borderLeft: '3px solid ' + typeColor,
                  minHeight: '80px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (i === 0 ? 'var(--accent-gold)' : 'var(--border)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700,
                    color: i === 0 ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontFamily: 'Rajdhani, sans-serif'
                  }}>
                    #{i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.venue}</div>
                    <div style={{ fontSize: '11px', color: typeColor, marginTop: '3px' }}>{typeLabel}</div>
                  </div>
                  <div style={{
                    display: 'flex', gap: '36px', flexWrap: 'nowrap',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    {player.isBowler ? (
                      <>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>MATCHES</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{v.matches}</div>
                        </div>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>WICKETS</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'Rajdhani, sans-serif' }}>{v.wickets}</div>
                        </div>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>ECONOMY</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif' }}>{v.economy}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>INNINGS</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{v.innings}</div>
                        </div>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>RUNS</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'Rajdhani, sans-serif' }}>{v.runs}</div>
                        </div>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>AVG</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{v.avg}</div>
                        </div>
                        <div style={{ minWidth: '64px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>SR</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-primary)' }}>{v.sr}</div>
                        </div>
                        <div style={{ minWidth: '80px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>
                            HS {v.hs_balls ? '(' + v.hs_balls + 'b)' : ''}
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'Rajdhani, sans-serif' }}>
                            {v.hs ? (v.hs + (v.hs_notout ? '*' : '')) : '—'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No venue data available
            </div>
          )}
        </div>
      )}

      {/* PREDICTION */}
      {activeTab === 'prediction' && (
        <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {player.prediction ? (
            <>
              <SectionTitle>NEXT MATCH PERFORMANCE PREDICTION</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '28px', borderTop: '3px solid var(--accent-gold)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'DM Mono, monospace' }}>
                    PREDICTED RUNS
                  </div>
                  <div style={{ fontSize: '72px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--accent-gold)', lineHeight: 1 }}>
                    {player.prediction.predicted}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                    Range: {player.prediction.lower} &ndash; {player.prediction.upper} runs
                  </div>
                  <div style={{ marginTop: '16px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(to right, var(--accent-red), var(--accent-gold), var(--accent-green))',
                      width: Math.min(100, player.prediction.predicted / 80 * 100) + '%',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['P(Duck)', player.prediction.probDuck + '%', 'var(--accent-red)'],
                    ['P(30+ runs)', player.prediction.prob30 + '%', 'var(--accent-gold)'],
                    ['P(50+ runs)', player.prediction.prob50 + '%', 'var(--accent-green)'],
                  ].map(function(item) {
                    return (
                      <div key={item[0]} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '10px', padding: '14px 18px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item[0]}</span>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: item[2], fontFamily: 'Rajdhani, sans-serif' }}>{item[1]}</span>
                      </div>
                    )
                  })}
                  <div style={{
                    background: player.prediction.prob30 > 50 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    border: '1px solid ' + (player.prediction.prob30 > 50 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'),
                    borderRadius: '10px', padding: '14px 18px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>
                      RECOMMENDATION
                    </div>
                    <div style={{
                      fontSize: '20px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                      color: player.prediction.prob30 > 50 ? 'var(--accent-green)' : 'var(--accent-gold)'
                    }}>
                      {player.prediction.prob30 > 50 ? 'PLAY' : player.prediction.prob30 > 35 ? 'CONSIDER' : 'RISK'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px 18px', background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6
              }}>
                <strong style={{ color: 'var(--accent-blue)' }}>Model:</strong> Gradient Boosting trained on 17,336 innings (IPL 2008-2025). Features include rolling form, venue history and opposition matchup data. Test MAE: 14.45 runs.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Batting predictions not applicable for specialist bowlers</div>
              <div style={{ fontSize: '13px' }}>Bowling performance predictor coming soon</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



export default function PlayerIntelligence() {
  var params = new URLSearchParams(window.location.search)
  var _s = useState(params.get('player') || null); var selectedPlayer = _s[0]; var setSelectedPlayer = _s[1]

  function handleSelectPlayer(name) {
    // If it looks like a player name, try to search first
    if (!isAnalyticsQuery(name)) {
      // Try exact match or just navigate
      setSelectedPlayer(name)
    }
  }

  if (!selectedPlayer) {
    return <ChatInterface onSelectPlayer={setSelectedPlayer} />
  }
  return <PlayerProfile playerName={selectedPlayer} onBack={function() { setSelectedPlayer(null); window.history.replaceState({}, '', '/') }} />
}
