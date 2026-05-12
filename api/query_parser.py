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
        if any(p in query_lower for p in ['compare', ' v ']):
            mods['compare'] = True
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
        if mods.get('radar'):
            return 'radar'
        if mods.get('breakdown') and mods.get('group_by') != 'season':
            return 'pie'
        if mods.get('partnership'):
            return 'partnership'
        if mods.get('venue_all'):
            return 'venue_heatmap'
        if len(players) >= 2 or mods.get('compare'):
            return 'compare'
        if mods.get('career'):
            return 'career_summary'
        if 'last_n' in mods:
            return 'last_n_matches'
        if 'vs_team' in mods:
            return 'player_vs_team'
        if 'venue' in mods and 'group_by' not in mods:
            return 'player_at_venue'
        if mods.get('group_by') == 'phase':
            return 'player_by_phase'
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
            'compare': self._exec_compare,
            'leaderboard': self._exec_leaderboard,
            'last_n_matches': self._exec_last_n,
            'career_summary': self._exec_career_summary,
            'radar': self._exec_radar,
            'pie': self._exec_pie,
            'scatter': self._exec_scatter,
            'venue_heatmap': self._exec_venue_heatmap,
            'partnership': self._exec_partnership,
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
