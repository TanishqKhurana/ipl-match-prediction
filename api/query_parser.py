"""
query_parser.py — Rule-based NLP parser for IPL analytics queries.

Supports: bar, grouped_bar, horizontal_bar, stat_card, radar, pie, line, scatter
"""

import pandas as pd
import numpy as np
import re
from rapidfuzz import process, fuzz

# ══════════════════════════════════════════════════════════════
# COMMON NAMES
# ══════════════════════════════════════════════════════════════
COMMON_NAMES = {
    'kohli': 'V Kohli', 'virat': 'V Kohli',
    'dhoni': 'MS Dhoni', 'msd': 'MS Dhoni', 'thala': 'MS Dhoni',
    'rohit': 'RG Sharma', 'hitman': 'RG Sharma',
    'bumrah': 'JJ Bumrah', 'jasprit': 'JJ Bumrah',
    'hardik': 'HH Pandya', 'sky': 'SA Yadav', 'surya': 'SA Yadav', 'suryakumar': 'SA Yadav',
    'jadeja': 'RA Jadeja', 'gaikwad': 'RD Gaikwad', 'ruturaj': 'RD Gaikwad',
    'pant': 'RR Pant', 'rishabh': 'RR Pant', 'rahul': 'KL Rahul',
    'russell': 'AD Russell', 'dre russ': 'AD Russell',
    'narine': 'SP Narine', 'archer': 'JC Archer', 'jofra': 'JC Archer',
    'rashid': 'Rashid Khan', 'rashid khan': 'Rashid Khan',
    'rabada': 'K Rabada', 'chahal': 'YS Chahal', 'yuzi': 'YS Chahal',
    'warner': 'DA Warner', 'gayle': 'CH Gayle', 'chris gayle': 'CH Gayle',
    'ab': 'AB de Villiers', 'abd': 'AB de Villiers', 'de villiers': 'AB de Villiers',
    'buttler': 'JC Buttler', 'jos': 'JC Buttler',
    'jaiswal': 'YBK Jaiswal', 'yashasvi': 'YBK Jaiswal',
    'gill': 'Shubman Gill', 'shubman': 'Shubman Gill',
    'samson': 'SV Samson', 'sanju': 'SV Samson',
    'iyer': 'SS Iyer', 'shreyas iyer': 'SS Iyer',
    'cummins': 'PJ Cummins', 'starc': 'MA Starc',
    'boult': 'TA Boult', 'siraj': 'Mohammed Siraj', 'shami': 'Mohammed Shami',
    'chahar': 'DL Chahar', 'curran': 'SM Curran',
    'klaasen': 'H Klaasen', 'head': 'TM Head', 'travis': 'TM Head',
    'parag': 'R Parag', 'tilak': 'Tilak Varma', 'rinku': 'Rinku Singh',
    'ashwin': 'R Ashwin', 'axar': 'AR Patel', 'arshdeep': 'Arshdeep Singh',
    'natarajan': 'T Natarajan', 'kuldeep': 'KY Yadav', 'varun': 'CV Varun',
    'maxwell': 'GJ Maxwell', 'miller': 'DA Miller', 'hetmyer': 'SO Hetmyer',
    'livingstone': 'LS Livingstone', 'salt': 'PD Salt',
    'green': 'C Green', 'cameron green': 'CJ Green',
    'stoinis': 'MP Stoinis', 'marcus stoinis': 'MP Stoinis',
    'bairstow': 'JM Bairstow', 'williamson': 'KS Williamson',
    'du plessis': 'F du Plessis', 'faf': 'F du Plessis',
    'pollard': 'KA Pollard', 'bravo': 'DJ Bravo',
    'raina': 'SK Raina', 'watson': 'SR Watson',
}

METRIC_MAP = {
    'runs': 'runs', 'run': 'runs', 'scored': 'runs', 'score': 'runs',
    'wickets': 'wickets', 'wicket': 'wickets', 'wkt': 'wickets', 'wkts': 'wickets',
    'economy': 'economy', 'eco': 'economy', 'econ': 'economy',
    'strike rate': 'strike_rate', 'sr': 'strike_rate', 'strikerate': 'strike_rate',
    'average': 'average', 'avg': 'average', 'batting average': 'average',
    'boundaries': 'boundaries', 'fours': 'fours', '4s': 'fours',
    'sixes': 'sixes', '6s': 'sixes', 'six': 'sixes',
    'dot': 'dot_pct', 'dots': 'dot_pct',
    'boundary rate': 'boundary_rate',
    'highest score': 'highest_score', 'hs': 'highest_score', 'best': 'highest_score',
}

TEAM_ALIASES = {
    'mi': 'Mumbai Indians', 'mumbai': 'Mumbai Indians',
    'csk': 'Chennai Super Kings', 'chennai': 'Chennai Super Kings',
    'rcb': 'Royal Challengers Bengaluru', 'bangalore': 'Royal Challengers Bengaluru',
    'bengaluru': 'Royal Challengers Bengaluru',
    'kkr': 'Kolkata Knight Riders', 'kolkata': 'Kolkata Knight Riders',
    'dc': 'Delhi Capitals', 'delhi': 'Delhi Capitals',
    'srh': 'Sunrisers Hyderabad', 'hyderabad': 'Sunrisers Hyderabad',
    'rr': 'Rajasthan Royals', 'rajasthan': 'Rajasthan Royals',
    'pbks': 'Punjab Kings', 'punjab': 'Punjab Kings',
    'gt': 'Gujarat Titans', 'gujarat': 'Gujarat Titans',
    'lsg': 'Lucknow Super Giants', 'lucknow': 'Lucknow Super Giants',
}

VENUE_ALIASES = {
    'wankhede': 'Wankhede', 'chinnaswamy': 'Chinnaswamy', 'chepauk': 'Chepauk',
    'eden': 'Eden Gardens', 'eden gardens': 'Eden Gardens',
    'kotla': 'Arun Jaitley', 'feroz shah': 'Arun Jaitley', 'arun jaitley': 'Arun Jaitley',
    'mohali': 'Mohali', 'rajiv gandhi': 'Rajiv Gandhi', 'uppal': 'Rajiv Gandhi',
    'narendra modi': 'Narendra Modi', 'motera': 'Narendra Modi', 'ahmedabad': 'Narendra Modi',
    'sawai': 'Sawai Mansingh', 'jaipur': 'Sawai Mansingh',
    'dharamsala': 'Dharamsala', 'lucknow': 'Ekana', 'ekana': 'Ekana',
}

CANONICAL_VENUES = {
    'M Chinnaswamy Stadium': {'city': 'Bengaluru', 'patterns': ['chinnaswamy']},
    'Wankhede Stadium': {'city': 'Mumbai', 'patterns': ['wankhede']},
    'MA Chidambaram Stadium': {'city': 'Chennai', 'patterns': ['chidambaram', 'chepauk']},
    'Eden Gardens': {'city': 'Kolkata', 'patterns': ['eden garden']},
    'Arun Jaitley Stadium': {'city': 'Delhi', 'patterns': ['arun jaitley', 'feroz shah', 'kotla']},
    'Rajiv Gandhi Intl Stadium': {'city': 'Hyderabad', 'patterns': ['rajiv gandhi', 'uppal']},
    'Narendra Modi Stadium': {'city': 'Ahmedabad', 'patterns': ['narendra modi', 'motera']},
    'Sawai Mansingh Stadium': {'city': 'Jaipur', 'patterns': ['sawai', 'mansingh']},
    'IS Bindra Stadium': {'city': 'Mohali', 'patterns': ['bindra', 'mohali']},
    'HPCA Stadium': {'city': 'Dharamsala', 'patterns': ['hpca', 'dharamsala', 'dharamshala']},
    'Ekana Sports City': {'city': 'Lucknow', 'patterns': ['ekana', 'lucknow']},
    'Maharashtra Cricket Assn Stadium': {'city': 'Pune', 'patterns': ['maharashtra', 'pune']},
    'Barsapara Stadium': {'city': 'Guwahati', 'patterns': ['barsapara', 'guwahati']},
}

def canonicalize_venue(raw_venue):
    """Map any venue string to its canonical name, or None if not a current venue."""
    if not isinstance(raw_venue, str):
        return None
    raw_lower = raw_venue.lower()
    for canonical, info in CANONICAL_VENUES.items():
        for pattern in info['patterns']:
            if pattern in raw_lower:
                return canonical
    return None

class QueryParser:
    def __init__(self, master_df, scouting_df=None):
        self.master = master_df
        self.scouting = scouting_df
        batsmen = master_df['batsman'].unique().tolist() if 'batsman' in master_df.columns else []
        bowlers = master_df['bowler'].unique().tolist() if 'bowler' in master_df.columns else []
        self.player_names = list(set(batsmen + bowlers))
        self.venues = master_df['venue'].unique().tolist() if 'venue' in master_df.columns else []
        self.match_col = 'matchId' if 'matchId' in master_df.columns else 'match_id'
        # Build bowling style and batting hand lookup for matchup queries
        self.bowler_style = {}
        self.batter_hand = {}
        if scouting_df is not None and 'player' in scouting_df.columns:
            if 'bowling_style' in scouting_df.columns:
                for _, r in scouting_df[scouting_df['bowling_style'].notna()].iterrows():
                    self.bowler_style[r['player']] = r['bowling_style']
            if 'batting_hand' in scouting_df.columns:
                for _, r in scouting_df[scouting_df['batting_hand'].notna()].iterrows():
                    self.batter_hand[r['player']] = r['batting_hand']
        # Also load from metadata if available
        try:
            import os
            meta_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'player_metadata.csv')
            if os.path.exists(meta_path):
                meta = pd.read_csv(meta_path)
                for _, r in meta[meta['bowling_style'].notna()].iterrows():
                    if r['player'] not in self.bowler_style:
                        self.bowler_style[r['player']] = str(r['bowling_style'])
                for _, r in meta[meta['batting_hand'].notna()].iterrows():
                    if r['player'] not in self.batter_hand:
                        self.batter_hand[r['player']] = str(r['batting_hand'])
        except:
            pass

    # ── ENTITY EXTRACTION ──

    def _extract_players(self, query_lower, tokens):
        players = []
        # Multi-word common names first
        for alias in sorted(COMMON_NAMES.keys(), key=len, reverse=True):
            if alias in query_lower and COMMON_NAMES[alias] not in players:
                players.append(COMMON_NAMES[alias])
                if len(players) >= 2:
                    break

        # Compare pattern
        if len(players) < 2:
            compare_match = re.search(r'(?:compare|vs)\s+(\w+)\s+(?:and|vs|with|&|,)\s+(\w+)', query_lower)
            if compare_match:
                for name in [compare_match.group(1), compare_match.group(2)]:
                    resolved = COMMON_NAMES.get(name)
                    if resolved and resolved not in players:
                        players.append(resolved)
                    elif not resolved:
                        r = process.extractOne(name, self.player_names, scorer=fuzz.WRatio, score_cutoff=70)
                        if r and r[0] not in players:
                            players.append(r[0])

        # Fuzzy fallback
        if not players:
            for n in [3, 2, 1]:
                for i in range(len(tokens) - n + 1):
                    chunk = ' '.join(tokens[i:i + n])
                    if chunk in METRIC_MAP or chunk in TEAM_ALIASES or chunk in VENUE_ALIASES:
                        continue
                    r = process.extractOne(chunk, self.player_names, scorer=fuzz.WRatio, score_cutoff=75)
                    if r and r[0] not in players:
                        players.append(r[0])
                        break
                if players:
                    break
        return players

    def _extract_metric(self, query_lower):
        for phrase in ['strike rate', 'boundary rate', 'dot ball', 'highest score', 'batting average']:
            if phrase in query_lower:
                return METRIC_MAP.get(phrase, 'runs')
        for token in query_lower.split():
            if token in METRIC_MAP:
                return METRIC_MAP[token]
        return 'runs'

    def _extract_modifiers(self, query_lower):
        mods = {}
        if any(p in query_lower for p in ['per season', 'by season', 'season wise', 'each season',
                                           'every season', 'per year', 'over the years', 'year by year']):
            mods['group_by'] = 'season'
        if any(p in query_lower for p in ['by phase', 'phase wise', 'phasewise', 'by overs']):
            mods['group_by'] = 'phase'
        if any(p in query_lower for p in ['trend', 'progression', 'over time', 'trajectory']):
            mods['trend'] = True
            mods['group_by'] = 'season'
        if any(p in query_lower for p in ['vs spin', 'against spin', 'vs spinners']):
            mods['vs_bowl_type'] = 'spin'
        if any(p in query_lower for p in ['vs pace', 'against pace', 'vs fast', 'against fast', 'vs seamers']):
            mods['vs_bowl_type'] = 'pace'
        if any(p in query_lower for p in ['to left hander', 'to lefties', 'to left-hand', 'vs left hand']):
            mods['vs_bat_hand'] = 'L'
        if any(p in query_lower for p in ['to right hander', 'to righties', 'to right-hand', 'vs right hand']):
            mods['vs_bat_hand'] = 'R'
        if any(p in query_lower for p in ['matchup', 'head to head', 'h2h', 'face off']):
            mods['matchup'] = True

        for alias, venue in VENUE_ALIASES.items():
            if alias in query_lower:
                mods['venue'] = venue
                break
        vm = re.search(r'at\s+(.+?)(?:\s+in|\s+vs|\s*$)', query_lower)
        if vm and 'venue' not in mods:
            r = process.extractOne(vm.group(1).strip(), self.venues, scorer=fuzz.WRatio, score_cutoff=65)
            if r:
                mods['venue'] = r[0]

        for alias, team in TEAM_ALIASES.items():
            if re.search(rf'(?:vs|versus|against)\s+{alias}', query_lower):
                mods['vs_team'] = team
                break

        tm = re.search(r'top\s+(\d+)', query_lower)
        if tm:
            mods['top_n'] = int(tm.group(1))
        lm = re.search(r'last\s+(\d+)', query_lower)
        if lm:
            mods['last_n'] = int(lm.group(1))
        ym = re.search(r'(?:in|during|of)\s+(20[0-2]\d)', query_lower)
        if ym:
            mods['season'] = int(ym.group(1))
        # Only set compare if no other vs-type modifier was set
        if any(p in query_lower for p in ['compare']):
            mods['compare'] = True
        # "vs" alone could mean compare, team, bowl type, or matchup — don't force compare
        if any(p in query_lower for p in ['career', 'overall', 'summary', 'profile']):
            mods['career'] = True
        if any(p in query_lower for p in ['dna', 'radar', 'spider', 'strengths', 'attributes']):
            mods['radar'] = True
        if any(p in query_lower for p in ['breakdown', 'distribution', 'split', 'pie', 'donut']):
            mods['breakdown'] = True
        if any(p in query_lower for p in ['scatter', 'plot', 'sr vs avg', 'avg vs sr']):
            mods['scatter'] = True
        if any(p in query_lower for p in ['venue stats', 'all venues', 'venue performance', 'venues']):
            mods['venue_all'] = True
        if any(p in query_lower for p in ['partnership', 'partnerships', 'pairs', 'combos']):
            mods['partnership'] = True
        return mods

    # ── ROUTER ──

    def _route(self, players, metric, mods):
        if mods.get('scatter'):
            return 'scatter'
        if 'top_n' in mods and not players:
            return 'leaderboard'
        if not players:
            return 'error'
        
        # Specific query types take priority over generic compare
        if mods.get('radar'):
            return 'radar'
        if mods.get('vs_bowl_type') and players:
            return 'vs_bowl_type'
        if mods.get('vs_bat_hand') and players:
            return 'vs_bat_hand'
        if mods.get('matchup') and len(players) >= 2:
            return 'matchup'
        if mods.get('breakdown') and mods.get('group_by') != 'season':
            return 'pie'
        if mods.get('partnership'):
            return 'partnership'
        if mods.get('venue_all'):
            return 'venue_heatmap'
        if mods.get('career'):
            return 'career_summary'
        if 'last_n' in mods:
            return 'last_n_matches'
        
        # vs_team checks
        if 'vs_team' in mods and mods.get('group_by') == 'season':
            return 'player_vs_team_seasons'
        if 'vs_team' in mods:
            return 'player_vs_team_detail'
        
        # Two players without specific modifier = compare
        if len(players) >= 2 or mods.get('compare'):
            return 'compare'
        
        # Single player queries
        if mods.get('group_by') == 'phase':
            return 'player_by_phase'
        if 'venue' in mods and 'group_by' not in mods:
            return 'player_at_venue'
        if mods.get('trend'):
            return 'trend_line'
        return 'player_per_season'

    # ── HELPERS ──

    def _get_phase(self, over):
        if over < 6: return 'Powerplay'
        elif over < 16: return 'Middle'
        else: return 'Death'

    def _is_bowling(self, metric):
        return metric in ['wickets', 'economy', 'dot_pct']

    def _get_data(self, player, metric):
        col = 'bowler' if self._is_bowling(metric) else 'batsman'
        return self.master[self.master[col] == player]

    def _bat_metric(self, df, metric):
        if metric == 'runs': return int(df['batsman_runs'].sum())
        elif metric == 'average':
            return round(df['batsman_runs'].sum() / max(df['is_wicket'].sum(), 1), 2)
        elif metric == 'strike_rate':
            balls = len(df[df['wide_runs'] == 0]) if 'wide_runs' in df.columns else len(df)
            return round(df['batsman_runs'].sum() / max(balls, 1) * 100, 2)
        elif metric == 'fours': return int((df['batsman_runs'] == 4).sum())
        elif metric == 'sixes': return int((df['batsman_runs'] == 6).sum())
        elif metric == 'boundaries': return int((df['batsman_runs'] >= 4).sum())
        elif metric == 'boundary_rate':
            return round((df['batsman_runs'] >= 4).sum() / max(len(df), 1) * 100, 2)
        elif metric == 'highest_score':
            return int(df.groupby(self.match_col)['batsman_runs'].sum().max()) if len(df) > 0 else 0
        return int(df['batsman_runs'].sum())

    def _bowl_metric(self, df, metric):
        if metric == 'wickets': return int(df['is_wicket'].sum())
        elif metric == 'economy':
            return round(df['total_runs'].sum() / max(len(df) / 6, 0.1), 2)
        elif metric == 'dot_pct':
            return round((df['total_runs'] == 0).sum() / max(len(df), 1) * 100, 2)
        return int(df['is_wicket'].sum())

    def _calc(self, df, metric):
        return self._bowl_metric(df, metric) if self._is_bowling(metric) else self._bat_metric(df, metric)

    def _label(self, metric):
        return {'runs': 'Runs', 'wickets': 'Wickets', 'economy': 'Economy',
                'strike_rate': 'Strike Rate', 'average': 'Average', 'fours': 'Fours',
                'sixes': 'Sixes', 'boundaries': 'Boundaries', 'boundary_rate': 'Boundary %',
                'dot_pct': 'Dot Ball %', 'highest_score': 'Highest Score'}.get(metric, metric.title())

    def _error(self, msg):
        return {'chart_type': 'error', 'title': 'Query Error', 'data': [], 'message': msg,
                'x_key': '', 'y_key': '', 'x_label': '', 'y_label': ''}

    # ── TEMPLATE EXECUTORS ──

    def _exec_player_per_season(self, players, metric, mods):
        player = players[0]
        df = self._get_data(player, metric)
        if df.empty: return self._error(f"No data found for {player}")
        results = []
        for s in sorted(df['season'].unique()):
            results.append({'season': int(s), 'value': self._calc(df[df['season'] == s], metric)})
        return {'chart_type': 'bar', 'title': f"{player} — {self._label(metric)} per Season",
                'data': results, 'x_key': 'season', 'y_key': 'value',
                'x_label': 'Season', 'y_label': self._label(metric)}

    def _exec_trend_line(self, players, metric, mods):
        result = self._exec_player_per_season(players, metric, mods)
        result['chart_type'] = 'line'
        result['title'] = result['title'].replace('per Season', 'Trend')
        return result

    def _exec_player_by_phase(self, players, metric, mods):
        player = players[0]
        df = self._get_data(player, metric)
        if df.empty: return self._error(f"No data found for {player}")
        df = df.copy()
        df['phase'] = df['over'].apply(self._get_phase)
        results = [{'phase': p, 'value': self._calc(df[df['phase'] == p], metric)}
                   for p in ['Powerplay', 'Middle', 'Death']]
        return {'chart_type': 'bar', 'title': f"{player} — {self._label(metric)} by Phase",
                'data': results, 'x_key': 'phase', 'y_key': 'value',
                'x_label': 'Phase', 'y_label': self._label(metric)}

    def _exec_player_at_venue(self, players, metric, mods):
        player = players[0]
        vf = mods.get('venue', '')
        df = self._get_data(player, metric)
        vdf = df[df['venue'].str.contains(vf, case=False, na=False)]
        if vdf.empty: return self._error(f"No data for {player} at '{vf}'")
        venue_name = vdf['venue'].mode().iloc[0]
        innings = vdf[self.match_col].nunique()
        val = self._calc(vdf, metric)
        return {'chart_type': 'stat_card', 'title': f"{player} at {venue_name}",
                'data': [{'metric': self._label(metric), 'value': val, 'sub': f'{innings} innings'}],
                'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    def _exec_player_vs_team(self, players, metric, mods):
        player = players[0]
        team = mods.get('vs_team', '')
        df = self._get_data(player, metric)
        col = 'batting_team' if self._is_bowling(metric) else 'bowling_team'
        vdf = df[df[col] == team]
        if vdf.empty: return self._error(f"No data for {player} vs {team}")
        innings = vdf[self.match_col].nunique()
        val = self._calc(vdf, metric)
        return {'chart_type': 'stat_card', 'title': f"{player} vs {team}",
                'data': [{'metric': self._label(metric), 'value': val, 'sub': f'{innings} innings'}],
                'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    def _exec_compare(self, players, metric, mods):
        if len(players) < 2: return self._error("Need two players to compare")
        p1, p2 = players[0], players[1]
        gb = mods.get('group_by', 'phase')
        if gb == 'phase':
            cats = ['Powerplay', 'Middle', 'Death']
            results = []
            for phase in cats:
                for p in [p1, p2]:
                    df = self._get_data(p, metric).copy()
                    df['phase'] = df['over'].apply(self._get_phase)
                    results.append({'category': phase, 'player': p,
                                    'value': self._calc(df[df['phase'] == phase], metric)})
        else:
            df1, df2 = self._get_data(p1, metric), self._get_data(p2, metric)
            seasons = sorted(set(df1['season'].unique()) | set(df2['season'].unique()))
            results = []
            for s in seasons:
                for p, df in [(p1, df1), (p2, df2)]:
                    results.append({'category': str(int(s)), 'player': p,
                                    'value': self._calc(df[df['season'] == s], metric)})
        return {'chart_type': 'grouped_bar', 'title': f"{p1} vs {p2} — {self._label(metric)}",
                'data': results, 'x_key': 'category', 'y_key': 'value',
                'x_label': gb.title(), 'y_label': self._label(metric), 'group_key': 'player'}

    def _exec_leaderboard(self, players, metric, mods):
        n = mods.get('top_n', 10)
        season = mods.get('season')
        df = self.master.copy()
        if season: df = df[df['season'] == season]
        is_b = self._is_bowling(metric)
        if is_b:
            g = df.groupby('bowler')
            if metric == 'wickets':
                agg = g['is_wicket'].sum().nlargest(n)
            elif metric == 'economy':
                balls, runs = g.size(), g['total_runs'].sum()
                q = balls[balls >= 60].index
                agg = (runs / (balls / 6)).loc[q].nsmallest(n)
            else:
                agg = g['is_wicket'].sum().nlargest(n)
        else:
            g = df.groupby('batsman')
            if metric == 'runs': agg = g['batsman_runs'].sum().nlargest(n)
            elif metric == 'strike_rate':
                balls, runs = g.size(), g['batsman_runs'].sum()
                q = balls[balls >= 120].index
                agg = (runs / balls * 100).loc[q].nlargest(n)
            elif metric == 'sixes': agg = df[df['batsman_runs'] == 6].groupby('batsman').size().nlargest(n)
            elif metric == 'fours': agg = df[df['batsman_runs'] == 4].groupby('batsman').size().nlargest(n)
            elif metric == 'average':
                runs, dis = g['batsman_runs'].sum(), g['is_wicket'].sum()
                q = dis[dis >= 10].index
                agg = (runs / dis).loc[q].nlargest(n)
            else: agg = g['batsman_runs'].sum().nlargest(n)
        results = [{'player': nm, 'value': round(float(v), 2)} for nm, v in agg.items()]
        sl = f" in {season}" if season else ""
        return {'chart_type': 'horizontal_bar', 'title': f"Top {n} — {self._label(metric)}{sl}",
                'data': results, 'x_key': 'value', 'y_key': 'player',
                'x_label': self._label(metric), 'y_label': 'Player'}

    def _exec_last_n(self, players, metric, mods):
        player = players[0]
        n = mods.get('last_n', 5)
        df = self._get_data(player, metric)
        if df.empty: return self._error(f"No data for {player}")
        matches = df.sort_values(self.match_col).groupby(self.match_col).first().sort_values('season').tail(n)
        results = []
        for mid in matches.index:
            mdf = df[df[self.match_col] == mid]
            opp = mdf['bowling_team'].iloc[0] if not self._is_bowling(metric) else mdf['batting_team'].iloc[0]
            results.append({'match': f"vs {opp} ({int(mdf['season'].iloc[0])})",
                            'value': self._calc(mdf, metric), 'opponent': opp})
        return {'chart_type': 'bar', 'title': f"{player} — Last {n} Matches",
                'data': results, 'x_key': 'match', 'y_key': 'value',
                'x_label': 'Match', 'y_label': self._label(metric)}
    # ── Enhanced: Player vs Team (detailed) ──
    def _exec_player_vs_team_detail(self, players, metric, mods):
        player = players[0]
        team = mods.get('vs_team', '')
        df = self._get_data(player, metric)
        is_b = self._is_bowling(metric)
        col = 'batting_team' if is_b else 'bowling_team'
        vdf = df[df[col] == team]
        if vdf.empty: return self._error(f"No data for {player} vs {team}")

        innings = vdf[self.match_col].nunique()
        bat_vdf = self.master[(self.master['batsman'] == player) & (self.master['bowling_team'] == team)]
        bowl_vdf = self.master[(self.master['bowler'] == player) & (self.master['batting_team'] == team)]

        stats = []
        if len(bat_vdf) > 0:
            runs = int(bat_vdf['batsman_runs'].sum())
            balls = len(bat_vdf)
            dis = int(bat_vdf['is_wicket'].sum())
            stats.append({'metric': 'Innings', 'value': bat_vdf[self.match_col].nunique()})
            stats.append({'metric': 'Runs', 'value': runs})
            stats.append({'metric': 'Average', 'value': round(runs / max(dis, 1), 1)})
            stats.append({'metric': 'Strike Rate', 'value': round(runs / max(balls, 1) * 100, 1)})
            stats.append({'metric': 'Fours', 'value': int((bat_vdf['batsman_runs'] == 4).sum())})
            stats.append({'metric': 'Sixes', 'value': int((bat_vdf['batsman_runs'] == 6).sum())})
            stats.append({'metric': 'Dismissed', 'value': dis})
        if len(bowl_vdf) > 0:
            wkts = int(bowl_vdf['is_wicket'].sum())
            bruns = int(bowl_vdf['total_runs'].sum())
            bballs = len(bowl_vdf)
            stats.append({'metric': 'Bowl Inn', 'value': bowl_vdf[self.match_col].nunique()})
            stats.append({'metric': 'Wickets', 'value': wkts})
            stats.append({'metric': 'Economy', 'value': round(bruns / max(bballs / 6, 0.1), 2)})

        return {'chart_type': 'stat_card', 'title': f"{player} vs {team}",
                'data': stats, 'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    # ── Enhanced: Player vs Team per season ──
    def _exec_player_vs_team_seasons(self, players, metric, mods):
        player = players[0]
        team = mods.get('vs_team', '')
        df = self._get_data(player, metric)
        is_b = self._is_bowling(metric)
        col = 'batting_team' if is_b else 'bowling_team'
        vdf = df[df[col] == team]
        if vdf.empty: return self._error(f"No data for {player} vs {team}")
        results = []
        for s in sorted(vdf['season'].unique()):
            results.append({'season': int(s), 'value': self._calc(vdf[vdf['season'] == s], metric)})
        return {'chart_type': 'bar', 'title': f"{player} vs {team} — {self._label(metric)} per Season",
                'data': results, 'x_key': 'season', 'y_key': 'value',
                'x_label': 'Season', 'y_label': self._label(metric)}

    # ── NEW: Player vs bowling type (spin/pace) ──
    def _exec_vs_bowl_type(self, players, metric, mods):
        player = players[0]
        bowl_type = mods.get('vs_bowl_type', 'spin')
        bat_df = self.master[self.master['batsman'] == player].copy()
        if bat_df.empty: return self._error(f"No data for {player}")

        # Map each bowler to their style
        pace_styles = {'RF', 'RFM', 'LF', 'LFM', 'LMF'}
        spin_styles = {'OB', 'LB', 'LBG', 'SLA', 'SLAC', 'LWS', 'ROB'}

        bat_df['bowl_style'] = bat_df['bowler'].map(self.bowler_style)
        bat_df = bat_df[bat_df['bowl_style'].notna()]

        if bowl_type == 'spin':
            filtered = bat_df[bat_df['bowl_style'].str.upper().isin(spin_styles)]
            type_label = 'Spin'
        else:
            filtered = bat_df[bat_df['bowl_style'].str.upper().isin(pace_styles)]
            type_label = 'Pace'

        if filtered.empty: return self._error(f"No {type_label} bowling data for {player}")

        balls = len(filtered)
        runs = int(filtered['batsman_runs'].sum())
        dis = int(filtered['is_wicket'].sum())
        fours = int((filtered['batsman_runs'] == 4).sum())
        sixes = int((filtered['batsman_runs'] == 6).sum())
        dots = int((filtered['batsman_runs'] == 0).sum())

        # Also break down by sub-type
        sub_types = {}
        for _, row in filtered.iterrows():
            st = row['bowl_style'].upper()
            if st not in sub_types:
                sub_types[st] = {'balls': 0, 'runs': 0, 'wickets': 0}
            sub_types[st]['balls'] += 1
            sub_types[st]['runs'] += row['batsman_runs']
            sub_types[st]['wickets'] += row['is_wicket']

        stats = [
            {'metric': 'Balls Faced', 'value': balls},
            {'metric': 'Runs', 'value': runs},
            {'metric': 'Average', 'value': round(runs / max(dis, 1), 1)},
            {'metric': 'Strike Rate', 'value': round(runs / max(balls, 1) * 100, 1)},
            {'metric': 'Dismissals', 'value': dis},
            {'metric': 'Dot %', 'value': round(dots / max(balls, 1) * 100, 1)},
            {'metric': 'Fours', 'value': fours},
            {'metric': 'Sixes', 'value': sixes},
        ]

        return {'chart_type': 'stat_card', 'title': f"{player} vs {type_label} Bowling",
                'data': stats, 'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    # ── NEW: Bowler vs batting hand ──
    def _exec_vs_bat_hand(self, players, metric, mods):
        player = players[0]
        hand = mods.get('vs_bat_hand', 'L')
        hand_label = 'Left-Handers' if hand == 'L' else 'Right-Handers'
        bowl_df = self.master[self.master['bowler'] == player].copy()
        if bowl_df.empty: return self._error(f"No bowling data for {player}")

        bowl_df['bat_hand'] = bowl_df['batsman'].map(self.batter_hand)
        filtered = bowl_df[bowl_df['bat_hand'] == hand]
        if filtered.empty: return self._error(f"No data for {player} vs {hand_label}")

        balls = len(filtered)
        runs = int(filtered['total_runs'].sum())
        wkts = int(filtered['is_wicket'].sum())
        dots = int((filtered['total_runs'] == 0).sum())

        stats = [
            {'metric': 'Balls Bowled', 'value': balls},
            {'metric': 'Runs Conceded', 'value': runs},
            {'metric': 'Wickets', 'value': wkts},
            {'metric': 'Economy', 'value': round(runs / max(balls / 6, 0.1), 2)},
            {'metric': 'Bowl SR', 'value': round(balls / max(wkts, 1), 1)},
            {'metric': 'Dot %', 'value': round(dots / max(balls, 1) * 100, 1)},
        ]

        return {'chart_type': 'stat_card', 'title': f"{player} vs {hand_label}",
                'data': stats, 'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}


    # ── Head-to-head matchup (rich) ──
    def _exec_matchup(self, players, metric, mods):
        if len(players) < 2: return self._error("Need two players for matchup")
        p1, p2 = players[0], players[1]

        df_bat = self.master[(self.master['batsman'] == p1) & (self.master['bowler'] == p2)]
        df_rev = self.master[(self.master['batsman'] == p2) & (self.master['bowler'] == p1)]

        if df_bat.empty and df_rev.empty:
            return self._error(f"No head-to-head data between {p1} and {p2}")

        stats = []
        insights = []

        # Determine who is batter, who is bowler (use larger dataset)
        if len(df_bat) >= len(df_rev):
            bat_name, bowl_name, df = p1, p2, df_bat
        else:
            bat_name, bowl_name, df = p2, p1, df_rev

        balls = len(df)
        runs = int(df['batsman_runs'].sum())
        dis = int(df['is_wicket'].sum())
        dots = int((df['batsman_runs'] == 0).sum())
        fours = int((df['batsman_runs'] == 4).sum())
        sixes = int((df['batsman_runs'] == 6).sum())
        sr = round(runs / max(balls, 1) * 100, 1)
        dot_pct = round(dots / max(balls, 1) * 100, 1)

        # Batter type info
        bat_hand = self.batter_hand.get(bat_name, '?')
        bowl_style = self.bowler_style.get(bowl_name, '?')
        bat_type = 'Left-hand bat' if bat_hand == 'L' else 'Right-hand bat'
        style_names = {'RF': 'Right-arm fast', 'RFM': 'Right-arm fast-medium', 'LF': 'Left-arm fast',
                       'LFM': 'Left-arm fast-medium', 'OB': 'Off spin', 'LB': 'Leg spin',
                       'SLA': 'Left-arm spin', 'SLAC': 'Left-arm wrist spin'}
        bowl_type = style_names.get(str(bowl_style).upper(), str(bowl_style))

        stats = [
            {'metric': 'Encounters', 'value': f"{balls} balls"},
            {'metric': f'{bat_name} Runs', 'value': runs},
            {'metric': 'Strike Rate', 'value': sr},
            {'metric': f'{bowl_name} Dismissals', 'value': dis},
            {'metric': 'Dot Ball %', 'value': f"{dot_pct}%"},
            {'metric': 'Boundaries', 'value': f"{fours} fours, {sixes} sixes"},
        ]

        # Generate insights
        insights.append(f"{bat_name} ({bat_type}) vs {bowl_name} ({bowl_type})")

        if dis > 0:
            balls_per_dis = round(balls / dis, 1)
            insights.append(f"{bowl_name} dismisses {bat_name} every {balls_per_dis} balls on average")
        else:
            insights.append(f"{bowl_name} has never dismissed {bat_name} in {balls} deliveries")

        # Compare SR to career
        career_bat = self.master[self.master['batsman'] == bat_name]
        if len(career_bat) > 0:
            career_sr = round(career_bat['batsman_runs'].sum() / max(len(career_bat), 1) * 100, 1)
            diff = round(sr - career_sr, 1)
            if diff > 10:
                insights.append(f"{bat_name}'s SR of {sr} is {diff} points ABOVE career SR ({career_sr}) — dominates this matchup")
            elif diff < -10:
                insights.append(f"{bat_name}'s SR of {sr} is {abs(diff)} points BELOW career SR ({career_sr}) — struggles in this matchup")
            else:
                insights.append(f"{bat_name}'s SR of {sr} is close to career SR ({career_sr}) — evenly matched")

        if dot_pct > 50:
            insights.append(f"Bowling dominance: {dot_pct}% dot balls suggests {bowl_name} controls this matchup")
        elif dot_pct < 30:
            insights.append(f"Batting dominance: only {dot_pct}% dots — {bat_name} scores freely")

        # Per-season breakdown for secondary chart
        season_data = []
        for s in sorted(df['season'].unique()):
            sdf = df[df['season'] == s]
            season_data.append({'season': int(s), 'value': int(sdf['batsman_runs'].sum()),
                                'balls': len(sdf), 'wickets': int(sdf['is_wicket'].sum())})

        return {
            'chart_type': 'matchup_card',
            'title': f"{bat_name} vs {bowl_name} — Head to Head",
            'data': stats,
            'insights': insights,
            'season_data': season_data,
            'batter': bat_name, 'bowler': bowl_name,
            'bat_type': bat_type, 'bowl_type': bowl_type,
            'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': '',
        }

    # ── Player vs bowling type (rich) ──
    def _exec_vs_bowl_type(self, players, metric, mods):
        player = players[0]
        bowl_type = mods.get('vs_bowl_type', 'spin')
        bat_df = self.master[self.master['batsman'] == player].copy()
        if bat_df.empty: return self._error(f"No data for {player}")

        pace_styles = {'RF', 'RFM', 'LF', 'LFM', 'LMF'}
        spin_styles = {'OB', 'LB', 'LBG', 'SLA', 'SLAC', 'LWS', 'ROB'}

        bat_df['bowl_style'] = bat_df['bowler'].map(self.bowler_style)
        bat_df = bat_df[bat_df['bowl_style'].notna()]

        if bowl_type == 'spin':
            filtered = bat_df[bat_df['bowl_style'].str.upper().isin(spin_styles)]
            other = bat_df[bat_df['bowl_style'].str.upper().isin(pace_styles)]
            type_label, other_label = 'Spin', 'Pace'
        else:
            filtered = bat_df[bat_df['bowl_style'].str.upper().isin(pace_styles)]
            other = bat_df[bat_df['bowl_style'].str.upper().isin(spin_styles)]
            type_label, other_label = 'Pace', 'Spin'

        if filtered.empty: return self._error(f"No {type_label} bowling data for {player}")

        def calc_stats(df):
            b = len(df); r = int(df['batsman_runs'].sum()); d = int(df['is_wicket'].sum())
            return {'balls': b, 'runs': r, 'dismissed': d,
                    'avg': round(r / max(d, 1), 1), 'sr': round(r / max(b, 1) * 100, 1),
                    'dot_pct': round((df['batsman_runs'] == 0).sum() / max(b, 1) * 100, 1),
                    'fours': int((df['batsman_runs'] == 4).sum()),
                    'sixes': int((df['batsman_runs'] == 6).sum())}

        main = calc_stats(filtered)
        comp = calc_stats(other) if len(other) > 0 else None

        stats = [
            {'metric': 'Balls Faced', 'value': main['balls']},
            {'metric': 'Runs', 'value': main['runs']},
            {'metric': 'Average', 'value': main['avg']},
            {'metric': 'Strike Rate', 'value': main['sr']},
            {'metric': 'Dismissals', 'value': main['dismissed']},
            {'metric': 'Dot %', 'value': main['dot_pct']},
        ]

        # Comparison data for chart
        comparison = [
            {'category': 'Average', type_label: main['avg'], other_label: comp['avg'] if comp else 0},
            {'category': 'Strike Rate', type_label: main['sr'], other_label: comp['sr'] if comp else 0},
            {'category': 'Dot %', type_label: main['dot_pct'], other_label: comp['dot_pct'] if comp else 0},
        ]

        # Sub-type breakdown
        sub_data = []
        style_names = {'OB': 'Off Spin', 'LB': 'Leg Spin', 'SLA': 'Left-arm Spin', 'SLAC': 'Wrist Spin',
                       'RF': 'Right Fast', 'RFM': 'Right Med-Fast', 'LF': 'Left Fast', 'LFM': 'Left Med-Fast'}
        target_styles = spin_styles if bowl_type == 'spin' else pace_styles
        for st in target_styles:
            sdf = filtered[filtered['bowl_style'].str.upper() == st]
            if len(sdf) >= 6:
                sub_data.append({
                    'type': style_names.get(st, st),
                    'sr': round(sdf['batsman_runs'].sum() / max(len(sdf), 1) * 100, 1),
                    'dismissed': int(sdf['is_wicket'].sum()),
                    'balls': len(sdf)
                })
        sub_data.sort(key=lambda x: x['sr'])

        # Insights
        insights = []
        if comp:
            sr_diff = main['sr'] - comp['sr']
            if sr_diff > 15:
                insights.append(f"{player} scores faster vs {type_label} (SR {main['sr']}) than {other_label} (SR {comp['sr']}) — comfortable matchup")
            elif sr_diff < -15:
                insights.append(f"{player} struggles vs {type_label} (SR {main['sr']}) compared to {other_label} (SR {comp['sr']}) — potential weakness")
            else:
                insights.append(f"{player} performs similarly vs {type_label} (SR {main['sr']}) and {other_label} (SR {comp['sr']})")

            avg_diff = main['avg'] - comp['avg']
            if avg_diff < -8:
                insights.append(f"Gets out more frequently vs {type_label} (avg {main['avg']}) than {other_label} (avg {comp['avg']})")

        if sub_data:
            worst = sub_data[0]
            best = sub_data[-1]
            if worst['sr'] < best['sr'] - 20:
                insights.append(f"Weakest against {worst['type']} (SR {worst['sr']}, {worst['dismissed']} dismissals)")
                insights.append(f"Strongest against {best['type']} (SR {best['sr']})")

        return {
            'chart_type': 'vs_type_card',
            'title': f"{player} vs {type_label} Bowling",
            'data': stats,
            'comparison': comparison,
            'sub_breakdown': sub_data,
            'insights': insights,
            'type_label': type_label, 'other_label': other_label,
            'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': '',
        }

    # ── Bowler vs batting hand (rich) ──
    def _exec_vs_bat_hand(self, players, metric, mods):
        player = players[0]
        hand = mods.get('vs_bat_hand', 'L')
        hand_label = 'Left-Handers' if hand == 'L' else 'Right-Handers'
        other_hand = 'R' if hand == 'L' else 'L'
        other_label = 'Right-Handers' if hand == 'L' else 'Left-Handers'

        bowl_df = self.master[self.master['bowler'] == player].copy()
        if bowl_df.empty: return self._error(f"No bowling data for {player}")

        bowl_df['bat_hand'] = bowl_df['batsman'].map(self.batter_hand)
        filtered = bowl_df[bowl_df['bat_hand'] == hand]
        other_df = bowl_df[bowl_df['bat_hand'] == other_hand]

        if filtered.empty: return self._error(f"No data for {player} vs {hand_label}")

        def calc_bowl(df):
            b = len(df); r = int(df['total_runs'].sum()); w = int(df['is_wicket'].sum())
            return {'balls': b, 'runs': r, 'wickets': w,
                    'eco': round(r / max(b / 6, 0.1), 2),
                    'sr': round(b / max(w, 1), 1),
                    'dot_pct': round((df['total_runs'] == 0).sum() / max(b, 1) * 100, 1)}

        main = calc_bowl(filtered)
        comp = calc_bowl(other_df) if len(other_df) > 0 else None

        stats = [
            {'metric': 'Balls Bowled', 'value': main['balls']},
            {'metric': 'Wickets', 'value': main['wickets']},
            {'metric': 'Economy', 'value': main['eco']},
            {'metric': 'Bowl SR', 'value': main['sr']},
            {'metric': 'Dot %', 'value': main['dot_pct']},
            {'metric': 'Runs Conceded', 'value': main['runs']},
        ]

        comparison = []
        if comp:
            comparison = [
                {'category': 'Economy', hand_label: main['eco'], other_label: comp['eco']},
                {'category': 'Bowl SR', hand_label: main['sr'], other_label: comp['sr']},
                {'category': 'Dot %', hand_label: main['dot_pct'], other_label: comp['dot_pct']},
            ]

        insights = []
        if comp:
            if main['eco'] < comp['eco'] - 0.5:
                insights.append(f"{player} is more economical vs {hand_label} (eco {main['eco']}) than {other_label} ({comp['eco']})")
            elif main['eco'] > comp['eco'] + 0.5:
                insights.append(f"{player} leaks more runs vs {hand_label} (eco {main['eco']}) than {other_label} ({comp['eco']}) — potential vulnerability")

            if main['wickets'] > 0 and comp['wickets'] > 0:
                main_rate = main['balls'] / main['wickets']
                comp_rate = comp['balls'] / comp['wickets']
                if main_rate < comp_rate - 5:
                    insights.append(f"Takes wickets more frequently vs {hand_label} (every {main_rate:.0f} balls vs {comp_rate:.0f})")

        return {
            'chart_type': 'vs_type_card',
            'title': f"{player} vs {hand_label}",
            'data': stats,
            'comparison': comparison,
            'sub_breakdown': [],
            'insights': insights,
            'type_label': hand_label, 'other_label': other_label,
            'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': '',
        }

    def _exec_career_summary(self, players, metric, mods):
        player = players[0]
        bat = self.master[self.master['batsman'] == player]
        bowl = self.master[self.master['bowler'] == player]
        stats = []
        if len(bat) > 0:
            inn = bat[self.match_col].nunique()
            runs = int(bat['batsman_runs'].sum())
            balls = len(bat)
            dis = int(bat['is_wicket'].sum())
            hs = int(bat.groupby(self.match_col)['batsman_runs'].sum().max())
            stats += [
                {'metric': 'Innings', 'value': inn},
                {'metric': 'Runs', 'value': runs},
                {'metric': 'Average', 'value': round(runs / max(dis, 1), 2)},
                {'metric': 'Strike Rate', 'value': round(runs / max(balls, 1) * 100, 2)},
                {'metric': 'Highest', 'value': hs},
                {'metric': 'Fours', 'value': int((bat['batsman_runs'] == 4).sum())},
                {'metric': 'Sixes', 'value': int((bat['batsman_runs'] == 6).sum())},
            ]
        if len(bowl) > 0:
            binn = bowl[self.match_col].nunique()
            wkts = int(bowl['is_wicket'].sum())
            bruns = int(bowl['total_runs'].sum())
            stats += [
                {'metric': 'Bowl Inn', 'value': binn},
                {'metric': 'Wickets', 'value': wkts},
                {'metric': 'Economy', 'value': round(bruns / max(len(bowl) / 6, 0.1), 2)},
            ]
        if not stats: return self._error(f"No data for {player}")
        return {'chart_type': 'stat_card', 'title': f"{player} — Career Summary",
                'data': stats, 'x_key': 'metric', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    # ── NEW: Radar chart (Player DNA) ──
    def _exec_radar(self, players, metric, mods):
        player = players[0]
        bat = self.master[self.master['batsman'] == player]
        bowl = self.master[self.master['bowler'] == player]
        if bat.empty and bowl.empty: return self._error(f"No data for {player}")

        axes = []
        if len(bat) > 0:
            runs = bat['batsman_runs'].sum()
            balls = len(bat)
            dis = max(bat['is_wicket'].sum(), 1)
            avg = runs / dis
            sr = runs / max(balls, 1) * 100
            boundaries = (bat['batsman_runs'] >= 4).sum()
            br = boundaries / max(balls, 1) * 100

            # Phase performance
            bat_c = bat.copy()
            bat_c['phase'] = bat_c['over'].apply(self._get_phase)
            death_runs = bat_c[bat_c['phase'] == 'Death']['batsman_runs'].sum()
            death_balls = len(bat_c[bat_c['phase'] == 'Death'])
            death_sr = death_runs / max(death_balls, 1) * 100

            # Normalize to 0-100 (approximate IPL ranges)
            axes.append({'axis': 'Average', 'value': min(round(avg / 50 * 100), 100)})
            axes.append({'axis': 'Strike Rate', 'value': min(round((sr - 80) / 100 * 100), 100)})
            axes.append({'axis': 'Boundary %', 'value': min(round(br / 25 * 100), 100)})
            axes.append({'axis': 'Death SR', 'value': min(round((death_sr - 80) / 120 * 100), 100)})
            axes.append({'axis': 'Experience', 'value': min(round(bat[self.match_col].nunique() / 200 * 100), 100)})

            if len(bowl) > 50:
                eco = bowl['total_runs'].sum() / max(len(bowl) / 6, 1)
                axes.append({'axis': 'Bowl Eco', 'value': min(round((12 - eco) / 6 * 100), 100)})

        elif len(bowl) > 0:
            wkts = bowl['is_wicket'].sum()
            bruns = bowl['total_runs'].sum()
            bballs = len(bowl)
            eco = bruns / max(bballs / 6, 1)
            bowl_sr = bballs / max(wkts, 1)
            dots = (bowl['total_runs'] == 0).sum()
            dot_pct = dots / max(bballs, 1) * 100

            bowl_c = bowl.copy()
            bowl_c['phase'] = bowl_c['over'].apply(self._get_phase)
            death_eco = 0
            db = bowl_c[bowl_c['phase'] == 'Death']
            if len(db) > 0:
                death_eco = db['total_runs'].sum() / max(len(db) / 6, 1)

            axes = [
                {'axis': 'Economy', 'value': min(round((12 - eco) / 6 * 100), 100)},
                {'axis': 'Wickets', 'value': min(round(wkts / 150 * 100), 100)},
                {'axis': 'Bowl SR', 'value': min(round((30 - bowl_sr) / 20 * 100), 100)},
                {'axis': 'Dot %', 'value': min(round(dot_pct / 55 * 100), 100)},
                {'axis': 'Death Eco', 'value': min(round((14 - death_eco) / 8 * 100), 100)},
                {'axis': 'Experience', 'value': min(round(bowl[self.match_col].nunique() / 150 * 100), 100)},
            ]

        return {'chart_type': 'radar', 'title': f"{player} — Player DNA",
                'data': axes, 'x_key': 'axis', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    # ── NEW: Pie chart (phase breakdown) ──
    def _exec_pie(self, players, metric, mods):
        player = players[0]
        df = self._get_data(player, metric)
        if df.empty: return self._error(f"No data for {player}")
        df = df.copy()
        df['phase'] = df['over'].apply(self._get_phase)
        results = [{'name': p, 'value': self._calc(df[df['phase'] == p], metric)}
                   for p in ['Powerplay', 'Middle', 'Death']]
        return {'chart_type': 'pie', 'title': f"{player} — {self._label(metric)} Breakdown",
                'data': results, 'x_key': 'name', 'y_key': 'value', 'x_label': '', 'y_label': ''}

    # ── NEW: Scatter plot ──
    def _exec_scatter(self, players, metric, mods):
        season = mods.get('season')
        df = self.master.copy()
        if season: df = df[df['season'] == season]
        g = df.groupby('batsman')
        balls = g.size()
        runs = g['batsman_runs'].sum()
        dis = g['is_wicket'].sum()
        qualified = balls[balls >= 120].index
        data = []
        for p in qualified:
            avg = runs[p] / max(dis[p], 1)
            sr = runs[p] / balls[p] * 100
            if avg > 10:
                data.append({'player': p, 'average': round(avg, 1), 'strike_rate': round(sr, 1),
                             'runs': int(runs[p])})
        data.sort(key=lambda x: x['runs'], reverse=True)
        data = data[:30]
        sl = f" in {season}" if season else ""
        return {'chart_type': 'scatter', 'title': f"Strike Rate vs Average{sl}",
                'data': data, 'x_key': 'average', 'y_key': 'strike_rate',
                'x_label': 'Average', 'y_label': 'Strike Rate'}

    # ── NEW: Venue heatmap ──
    def _exec_venue_heatmap(self, players, metric, mods):
        player = players[0]
        df = self._get_data(player, metric)
        if df.empty: return self._error(f"No data for {player}")
        
        # Canonicalize venues and filter to current grounds
        df = df.copy()
        df['canonical_venue'] = df['venue'].apply(canonicalize_venue)
        df = df[df['canonical_venue'].notna()]  # only current venues
        
        if df.empty: return self._error(f"No data for {player} at current venues")
        
        results = []
        for venue in df['canonical_venue'].unique():
            vdf = df[df['canonical_venue'] == venue]
            inn = vdf[self.match_col].nunique()
            if inn >= 1:
                val = self._calc(vdf, metric)
                city = CANONICAL_VENUES.get(venue, {}).get('city', '')
                display = f"{venue}, {city}" if city else venue
                results.append({'venue': display, 'value': val, 'innings': inn})
        
        results.sort(key=lambda x: x['value'], reverse=(metric != 'economy'))
        results = results[:13]
        
        return {'chart_type': 'horizontal_bar', 
                'title': f"{player} — {self._label(metric)} by Venue",
                'data': [{'player': r['venue'], 'value': r['value']} for r in results],
                'x_key': 'value', 'y_key': 'player',
                'x_label': self._label(metric), 'y_label': 'Venue'}

    # ── NEW: Partnership ──
    def _exec_partnership(self, players, metric, mods):
        player = players[0]
        df = self.master[self.master['batsman'] == player]
        if df.empty: return self._error(f"No data for {player}")
        if 'non_striker' not in df.columns:
            return self._error("Partnership data not available (no non_striker column)")
        partners = df.groupby('non_striker')['batsman_runs'].sum().nlargest(8)
        results = [{'player': p, 'value': int(v)} for p, v in partners.items()]
        return {'chart_type': 'horizontal_bar', 'title': f"{player} — Top Partnerships (Runs while batting)",
                'data': results, 'x_key': 'value', 'y_key': 'player',
                'x_label': 'Runs', 'y_label': 'Partner'}

    # ── MAIN PARSE ──

    def parse(self, query: str) -> dict:
        q = query.lower().strip()
        tokens = q.split()
        players = self._extract_players(q, tokens)
        metric = self._extract_metric(q)
        mods = self._extract_modifiers(q)
        template = self._route(players, metric, mods)

        executors = {
            'player_per_season': self._exec_player_per_season,
            'trend_line': self._exec_trend_line,
            'player_by_phase': self._exec_player_by_phase,
            'player_at_venue': self._exec_player_at_venue,
            'player_vs_team': self._exec_player_vs_team,
            'player_vs_team_detail': self._exec_player_vs_team_detail,
            'player_vs_team_seasons': self._exec_player_vs_team_seasons,
            'compare': self._exec_compare,
            'leaderboard': self._exec_leaderboard,
            'last_n_matches': self._exec_last_n,
            'career_summary': self._exec_career_summary,
            'radar': self._exec_radar,
            'pie': self._exec_pie,
            'scatter': self._exec_scatter,
            'venue_heatmap': self._exec_venue_heatmap,
            'partnership': self._exec_partnership,
            'vs_bowl_type': self._exec_vs_bowl_type,
            'vs_bat_hand': self._exec_vs_bat_hand,
            'matchup': self._exec_matchup,
        }

        fn = executors.get(template)
        if not fn: return self._error(f"Couldn't understand: '{query}'")
        try:
            result = fn(players, metric, mods)
            result['query'] = query
            result['parsed'] = {'players': players, 'metric': metric,
                                'modifiers': mods, 'template': template}
            return result
        except Exception as e:
            return self._error(f"Error: {str(e)}")


SUGGESTED_QUERIES = [
    "Kohli runs per season",
    "Bumrah wickets per season",
    "Dhoni strike rate by phase",
    "compare Kohli and Rohit runs by phase",
    "top 10 run scorers in 2024",
    "Kohli career stats",
    "Kohli DNA",
    "Bumrah radar",
    "Kohli runs breakdown",
    "Rohit sixes per season",
    "Kohli average at Chinnaswamy",
    "Bumrah last 5 matches",
    "SR vs average scatter plot in 2024",
    "compare Bumrah and Archer wickets per season",
    "Kohli venue stats",
    "top 5 sixes in 2025",
    "Dhoni runs trend",
    "Jadeja partnerships",
]
