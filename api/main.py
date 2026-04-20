from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
from scipy import stats
from pydantic import BaseModel
from typing import Optional
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="IPL Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LOAD DATA ──────────────────────────────────────────
print("Loading data...")
master = pd.read_csv('../data/master_ipl.csv')
batting_features = pd.read_csv('../data/batting_features.csv')
bowling_features = pd.read_csv('../data/bowling_features.csv')
venue_stats = pd.read_csv('../data/venue_player_stats.csv')
venue_bowl_stats = pd.read_csv('../data/venue_player_bowling_stats.csv')
player_career = pd.read_csv('../data/player_career_info.csv')
player_metadata = pd.read_csv('../data/player_metadata.csv')
opposition_stats = pd.read_csv('../data/opposition_stats.csv')

# Fix column names
if 'avg' in venue_stats.columns:
    venue_stats = venue_stats.rename(columns={'avg': 'venue_avg', 'sr': 'venue_sr'})

# Load model
with open('../models/performance_predictor.pkl', 'rb') as f:
    gbm = pickle.load(f)
# ── CURRENT-SEASON VENUES (13 grounds in use this IPL) ────────
# Each entry holds the canonical display name, the home team, and a list
# of lowercase substrings used to match variants in `venue_short`.
# IMPORTANT: patterns must be specific enough not to cross-match. e.g.
# 'delhi' alone would also hit nothing useful so we use 'arun jaitley'
# and 'feroz shah kotla' to merge the Delhi variants.
CURRENT_VENUES = [
    {'name': 'Narendra Modi Stadium',            'city': 'Ahmedabad',
     'home': 'Gujarat Titans',
     'patterns': ['narendra modi', 'motera']},
    {'name': 'M. Chinnaswamy Stadium',           'city': 'Bengaluru',
     'home': 'Royal Challengers Bengaluru',
     'patterns': ['chinnaswamy']},
    {'name': 'MA Chidambaram Stadium',           'city': 'Chennai',
     'home': 'Chennai Super Kings',
     'patterns': ['chidambaram', 'chepauk']},
    {'name': 'Arun Jaitley Stadium',             'city': 'Delhi',
     'home': 'Delhi Capitals',
     'patterns': ['arun jaitley', 'feroz shah kotla']},
    {'name': 'ACA Stadium',                      'city': 'Guwahati',
     'home': 'Rajasthan Royals',
     'patterns': ['guwahati', 'barsapara']},
    {'name': 'Rajiv Gandhi International Stadium','city': 'Hyderabad',
     'home': 'Sunrisers Hyderabad',
     'patterns': ['rajiv gandhi', 'uppal']},
    {'name': 'Sawai Mansingh Stadium',           'city': 'Jaipur',
     'home': 'Rajasthan Royals',
     'patterns': ['sawai mansingh', 'jaipur']},
    {'name': 'Eden Gardens',                     'city': 'Kolkata',
     'home': 'Kolkata Knight Riders',
     'patterns': ['eden gardens']},
    {'name': 'BRSABV Ekana Stadium',             'city': 'Lucknow',
     'home': 'Lucknow Super Giants',
     'patterns': ['ekana', 'brsabv']},
    {'name': 'Wankhede Stadium',                 'city': 'Mumbai',
     'home': 'Mumbai Indians',
     'patterns': ['wankhede']},
    {'name': 'Maharaja Yadavindra Singh Stadium','city': 'Mullanpur',
     'home': 'Punjab Kings',
     'patterns': ['mullanpur', 'maharaja yadavindra', 'new chandigarh']},
    {'name': 'HPCA Stadium',                     'city': 'Dharamsala',
     'home': 'Punjab Kings',
     'patterns': ['dharamsala', 'hpca']},
    {'name': 'Shaheed Veer Narayan Singh Stadium','city': 'Raipur',
     'home': 'Royal Challengers Bengaluru',
     'patterns': ['raipur', 'shaheed veer narayan']},
]
def _match_canonical_venue(venue_short_str):
    """Return the canonical-venue dict whose pattern matches, else None."""
    if not isinstance(venue_short_str, str):
        return None
    v = venue_short_str.lower()
    for cv in CURRENT_VENUES:
        for p in cv['patterns']:
            if p in v:
                return cv
    return None

def _match_canonical_venue(venue_short_str):
    """Return the canonical-venue dict whose pattern matches, else None."""
    if not isinstance(venue_short_str, str):
        return None
    v = venue_short_str.lower()
    for cv in CURRENT_VENUES:
        for p in cv['patterns']:
            if p in v:
                return cv
    return None
master['date'] = pd.to_datetime(master['date'])
batting_features['date'] = pd.to_datetime(batting_features['date'])

print(f"Data loaded! Players in career info: {len(player_career)}")
print(f"Sample players: {player_career['player'].tolist()[:5]}")

scouting_profiles = pd.read_csv('../data/scouting_profiles.csv')
dna_scaled = np.load('../data/dna_matrix_scaled.npy')
player_names_idx = np.load('../data/player_names_index.npy', allow_pickle=True)
 
scout_sim_matrix = cosine_similarity(dna_scaled)
scout_player_index = {name: i for i, name in enumerate(player_names_idx)}
 
SCOUT_TEAM_FULL = {
    'RCB': 'Royal Challengers Bengaluru', 'MI': 'Mumbai Indians',
    'CSK': 'Chennai Super Kings', 'KKR': 'Kolkata Knight Riders',
    'DC': 'Delhi Capitals', 'SRH': 'Sunrisers Hyderabad',
    'PBKS': 'Punjab Kings', 'RR': 'Rajasthan Royals',
    'GT': 'Gujarat Titans', 'LSG': 'Lucknow Super Giants',
}
 
print(f"✅ Scouting loaded! {len(scouting_profiles)} profiles, "
      f"DNA matrix {dna_scaled.shape}")

# ── HELPER FUNCTIONS ───────────────────────────────────

def get_player_batting_stats(player_name):
    bat = master[(master['batsman'] == player_name) & (master['is_wide'] == 0)]
    if len(bat) == 0:
        return None
    runs = int(bat['batsman_runs'].sum())
    balls = len(bat)
    innings = int(bat['matchId'].nunique())
    dismissals = int(bat['is_wicket'].sum())
    fours = int((bat['batsman_runs'] == 4).sum())
    sixes = int((bat['batsman_runs'] == 6).sum())
    avg = round(runs / max(dismissals, 1), 2)
    sr = round(runs / max(balls, 1) * 100, 2)
    hs_by_match = bat.groupby('matchId')['batsman_runs'].sum()
    hs_match_id = hs_by_match.idxmax()
    hs = int(hs_by_match.max())
    hs_balls = int(len(bat[bat['matchId'] == hs_match_id]))
    return {
        'runs': runs, 'avg': avg, 'sr': sr,
        'hs': hs, 'hs_balls': hs_balls,
        'fours': fours, 'sixes': sixes, 'innings': innings
    }


def get_player_bowling_stats(player_name):
    bowl = master[master['bowler'] == player_name]
    bowl_legal = bowl[bowl['is_wide'] == 0]
    wickets = int(bowl['is_wicket'].sum())
    if wickets < 5:
        return None
    balls = len(bowl_legal)
    runs = int(bowl['total_runs'].sum())
    economy = round(runs / max(balls/6, 0.1), 2)
    avg = round(runs / max(wickets, 1), 2)
    sr = round(balls / max(wickets, 1), 2)
    dot_pct = round((bowl_legal['total_runs'] == 0).sum() / max(balls, 1) * 100, 1)
    if wickets > 0:
        best_match = bowl.groupby('matchId').agg(
            w=('is_wicket', 'sum'),
            r=('total_runs', 'sum')
        ).reset_index()
        best_match = best_match[best_match['w'] > 0]
        best_row = best_match.loc[best_match['w'].idxmax()]
        best = f"{int(best_row['w'])}/{int(best_row['r'])}"
    else:
        best = "0/0"
    return {
        'wickets': wickets, 'avg': avg, 'economy': economy,
        'sr': sr, 'dotPct': dot_pct, 'best': best
    }


def get_phase_stats(player_name, is_bowler=False):
    phases = ['Powerplay', 'Middle', 'Death']
    result = []
    for phase in phases:
        if is_bowler:
            bowl = master[(master['bowler'] == player_name) & (master['phase'] == phase)]
            bowl_legal = bowl[bowl['is_wide'] == 0]
            w = int(bowl['is_wicket'].sum())
            r = int(bowl['total_runs'].sum())
            b = len(bowl_legal)
            eco = round(r / max(b/6, 0.1), 2)
            result.append({'phase': phase, 'economy': eco, 'wickets': w})
        else:
            bat = master[
                (master['batsman'] == player_name) &
                (master['phase'] == phase) &
                (master['is_wide'] == 0)
            ]
            r = int(bat['batsman_runs'].sum())
            b = len(bat)
            sr = round(r / max(b, 1) * 100, 1)
            result.append({'phase': phase, 'sr': sr, 'runs': r})
    return result


def get_season_stats(player_name, is_bowler=False):
    result = []
    if is_bowler:
        season_data = (master[master['bowler'] == player_name]
                       .groupby('season')
                       .agg(wickets=('is_wicket', 'sum'),
                            runs=('total_runs', 'sum'),
                            balls=('is_wicket', 'count'))
                       .reset_index())
        for _, row in season_data.iterrows():
            if pd.notna(row['season']):
                eco = round(row['runs'] / max(row['balls']/6, 0.1), 2)
                result.append({
                    'season': str(int(row['season'])),
                    'wickets': int(row['wickets']),
                    'economy': eco
                })
    else:
        bat = master[(master['batsman'] == player_name) & (master['is_wide'] == 0)]
        season_data = bat.groupby('season').agg(
            runs=('batsman_runs', 'sum'),
            balls=('batsman_runs', 'count')
        ).reset_index()
        for _, row in season_data.iterrows():
            if pd.notna(row['season']):
                sr = round(row['runs'] / max(row['balls'], 1) * 100, 1)
                result.append({
                    'season': str(int(row['season'])),
                    'runs': int(row['runs']),
                    'sr': sr
                })
    return sorted(result, key=lambda x: x['season'])


def get_venue_stats(player_name, is_bowler=False):
    """
    Player's performance at the 13 current-IPL venues only.
    Merges multi-name variants (e.g. 'Feroz Shah Kotla' + 'Arun Jaitley Stadium')
    into one row per canonical venue, then ranks venues best → worst.
      - Batters: ranked by `venue_score` (weighted by innings when merging)
      - Bowlers: ranked by wickets − 0.5 × economy
    """
    if is_bowler:
        src = venue_bowl_stats[venue_bowl_stats['bowler'] == player_name].copy()
    else:
        src = venue_stats[venue_stats['batsman'] == player_name].copy()

    if len(src) == 0:
        return []

    # Tag each source row with the canonical venue it belongs to (if any)
    src['_cv'] = src['venue_short'].apply(_match_canonical_venue)
    src = src[src['_cv'].notna()]
    if len(src) == 0:
        return []

    result = []
    for cv in CURRENT_VENUES:
        rows = src[src['_cv'].apply(lambda c: c is not None and c['name'] == cv['name'])]
        if len(rows) == 0:
            continue  # player has never played at this venue

        display_name = f"{cv['name']}, {cv['city']}"

        if is_bowler:
            matches  = int(rows['matches'].sum())
            wickets  = int(rows['wickets'].sum())
            total_m  = float(rows['matches'].sum())
            # weighted mean economy, weighted by matches (proxy for overs bowled)
            economy  = float((rows['economy'] * rows['matches']).sum() / max(total_m, 1))
            is_happy = bool(rows.get('is_happy_ground', pd.Series([False])).any())
            is_bogey = bool(rows.get('is_bogey_ground', pd.Series([False])).any())
            t = 'happy' if is_happy else 'bogey' if is_bogey else 'neutral'
            score = wickets - (economy * 0.5)
            result.append({
                'venue': display_name,
                'matches': matches,
                'wickets': wickets,
                'economy': round(economy, 2),
                'type': t,
                '_score': score,
            })
        else:
            innings   = int(rows['innings'].sum())
            runs      = int(rows['runs'].sum())
            total_inn = float(rows['innings'].sum())
            # weighted means of pre-aggregated stats, weighted by innings
            avg = float((rows['venue_avg']  * rows['innings']).sum() / max(total_inn, 1))
            sr  = float((rows['venue_sr']   * rows['innings']).sum() / max(total_inn, 1))
            if 'venue_score' in rows.columns:
                vscore = float((rows['venue_score'] * rows['innings']).sum() / max(total_inn, 1))
            else:
                vscore = avg * 0.5 + sr * 0.3
            is_happy = bool(rows.get('is_happy_ground', pd.Series([False])).any())
            is_bogey = bool(rows.get('is_bogey_ground', pd.Series([False])).any())
            t = 'happy' if is_happy else 'bogey' if is_bogey else 'neutral'

            # HS per venue — computed from ball-by-ball master frame.
            # Match any of this canonical venue's patterns against master.venue.
            # HS per venue — computed from ball-by-ball master frame.
            # Also determines balls faced in that HS innings and whether
            # the batter was not out.
            bat_all = master[(master['batsman'] == player_name) & (master['is_wide'] == 0)]
            venue_mask = False
            for p in cv['patterns']:
                venue_mask = venue_mask | bat_all['venue'].str.lower().str.contains(p, na=False, regex=False)
            bat_venue = bat_all[venue_mask]
            if len(bat_venue) > 0:
                hs_by_match = bat_venue.groupby('matchId')['batsman_runs'].sum()
                hs_match_id = hs_by_match.idxmax()
                hs_venue = int(hs_by_match.max())
                hs_innings = bat_venue[bat_venue['matchId'] == hs_match_id]
                hs_balls_venue = int(len(hs_innings))
                # Not out = batter was never the one dismissed in that innings.
                # In master, is_wicket=1 is attributed to the ball on which the
                # wicket fell; we check if the batter on strike was this player.
                hs_notout = bool(
                    (hs_innings['is_wicket'] == 1).sum() == 0
                )
            else:
                hs_venue = 0
                hs_balls_venue = 0
                hs_notout = False

            result.append({
                'venue': display_name,
                'innings': innings,
                'runs': runs,
                'avg': round(avg, 2),
                'sr': round(sr, 2),
                'hs': hs_venue,
                'hs_balls': hs_balls_venue,
                'hs_notout': hs_notout,
                'type': t,
                '_score': vscore,
            })

    result.sort(key=lambda x: x['_score'], reverse=True)
    for r in result:
        del r['_score']
    return result

def predict_performance(player_name, venue='', opponent=''):
    latest_form = batting_features[batting_features['batsman'] == player_name].tail(1)
    if len(latest_form) == 0:
        return None
    venue_key = venue.split(',')[0].strip() if venue else ''
    venue_data = venue_stats[
        (venue_stats['batsman'] == player_name) &
        (venue_stats['venue'].str.contains(venue_key, na=False, regex=False))
    ] if venue_key else pd.DataFrame()
    opp_data = opposition_stats[
        (opposition_stats['batsman'] == player_name) &
        (opposition_stats['bowling_team'] == opponent)
    ] if opponent else pd.DataFrame()
    career_avg = float(latest_form['career_avg'].values[0])
    career_sr = float(latest_form['career_sr'].values[0])
    consistency = float(latest_form['consistency'].values[0])
    std_dev = max(consistency * 0.8, 10)
    features = {
        'avg_last5': float(latest_form['avg_last5'].values[0]),
        'sr_last5': float(latest_form['sr_last5'].values[0]),
        'form_score': float(latest_form['form_score'].values[0]),
        'form_sr': float(latest_form['form_sr'].values[0]),
        'career_avg': career_avg,
        'career_sr': career_sr,
        'consistency': consistency,
        'venue_avg': float(venue_data['venue_avg'].mean()) if len(venue_data) > 0 else career_avg,
        'venue_sr': float(venue_data['venue_sr'].mean()) if len(venue_data) > 0 else career_sr,
        'venue_score': float(venue_data['venue_score'].mean()) if len(venue_data) > 0 else 50.0,
        'is_happy_ground': int(venue_data['is_happy_ground'].any()) if len(venue_data) > 0 else 0,
        'is_bogey_ground': int(venue_data['is_bogey_ground'].any()) if len(venue_data) > 0 else 0,
        'opp_avg': float(opp_data['opp_avg'].values[0]) if len(opp_data) > 0 else career_avg,
        'opp_sr': float(opp_data['opp_sr'].values[0]) if len(opp_data) > 0 else career_sr,
        'boundary_rate': float(latest_form['boundary_rate'].values[0]),
    }
    feature_cols = [
        'avg_last5', 'sr_last5', 'form_score', 'form_sr',
        'career_avg', 'career_sr', 'consistency',
        'venue_avg', 'venue_sr', 'venue_score',
        'is_happy_ground', 'is_bogey_ground',
        'opp_avg', 'opp_sr', 'boundary_rate'
    ]
    X = pd.DataFrame([features])[feature_cols]
    predicted = float(gbm.predict(X)[0])
    lower = max(0, predicted - std_dev)
    upper = predicted + std_dev
    return {
        'predicted': round(predicted, 1),
        'lower': round(lower, 1),
        'upper': round(upper, 1),
        'probDuck': round(stats.norm.cdf(5, predicted, std_dev) * 100, 1),
        'prob30': round((1 - stats.norm.cdf(30, predicted, std_dev)) * 100, 1),
        'prob50': round((1 - stats.norm.cdf(50, predicted, std_dev)) * 100, 1),
        'formScore': round(float(latest_form['form_score'].values[0]), 1),
    }


def build_franchise_history(history_val):
    abbr_map = {
        'Royal Challengers Bengaluru': 'RCB',
        'Mumbai Indians': 'MI', 'Chennai Super Kings': 'CSK',
        'Kolkata Knight Riders': 'KKR', 'Delhi Capitals': 'DC',
        'Sunrisers Hyderabad': 'SRH', 'Punjab Kings': 'PBKS',
        'Rajasthan Royals': 'RR', 'Gujarat Titans': 'GT',
        'Lucknow Super Giants': 'LSG', 'Rising Pune Supergiant': 'RPS',
        'Pune Warriors India': 'PWI', 'Deccan Chargers': 'DC2',
        'Delhi Daredevils': 'DC', 'Gujarat Lions': 'GL',
        'Kochi Tuskers Kerala': 'KTK',
    }

    if history_val is None:
        return []
    history_str = str(history_val).strip()
    if history_str in ['nan', 'None', '']:
        return []

    season_team = {}

    # Handle dict part: {2008: 'team', 2009: 'team', ...}
    if '{' in history_str:
        dict_part = history_str.split('}')[0] + '}'
        rest = history_str.split('}')[1] if '}' in history_str else ''
        try:
            import ast
            d = ast.literal_eval(dict_part)
            for yr, team in d.items():
                season_team[int(yr)] = team.strip()
        except:
            pass
    else:
        rest = history_str

    # Handle arrow part: → 2026:Rajasthan Royals
    if rest:
        for entry in rest.split('→'):
            entry = entry.strip()
            if ':' in entry:
                yr, team = entry.split(':', 1)
                yr = yr.strip()
                team = team.strip()
                if yr.isdigit():
                    season_team[int(yr)] = team

    if not season_team:
        return []

    # Group consecutive same teams
    grouped = []
    for yr in sorted(season_team.keys()):
        team = season_team[yr]
        abbr = abbr_map.get(team, team[:4])
        if grouped and grouped[-1]['team'] == abbr:
            start = grouped[-1]['years'].split('-')[0]
            grouped[-1]['years'] = f"{start}-{yr}"
        else:
            grouped.append({'years': str(yr), 'team': abbr})

    return grouped


# ── API ENDPOINTS ──────────────────────────────────────

@app.get("/")
def root():
    return {"message": "IPL Intelligence API", "status": "running"}


@app.get("/debug/players")
def debug_players():
    return {
        "total": len(player_career),
        "columns": list(player_career.columns),
        "sample": player_career['player'].tolist()[:10],
        "kohli": player_career[
            player_career['player'].str.contains('Kohli', case=False, na=False)
        ]['player'].tolist()
    }


@app.get("/players")
def get_all_players():
    players = []
    for _, row in player_career.iterrows():
        meta = player_metadata[player_metadata['player'] == row['player']]
        players.append({
            'id': row['player'],
            'name': row['player'],
            'role': meta['role'].values[0] if len(meta) > 0 else 'Unknown',
            'franchise': str(row.get('current_franchise', '')) if pd.notna(row.get('current_franchise')) else '',
            'status': str(row.get('current_status', '')),
            'debut': int(row['debut_season']) if pd.notna(row.get('debut_season')) else None,
            'seasons': int(row['seasons_played']) if pd.notna(row.get('seasons_played')) else None,
        })
    return players


@app.get("/players/search/{query}")
def search_players(query: str):
    matches = player_career[
        player_career['player'].str.contains(query, case=False, na=False)
    ]['player'].tolist()
    return matches[:20]


@app.get("/player/{player_name}")
def get_player_profile(player_name: str):
    career_row = player_career[player_career['player'] == player_name]
    if len(career_row) == 0:
        return {"error": f"Player {player_name} not found"}

    career = career_row.iloc[0]
    meta = player_metadata[player_metadata['player'] == player_name]
    role = meta['role'].values[0] if len(meta) > 0 else 'Unknown'
    is_bowler = role in ['Specialist Bowler', 'Bowling Allrounder', 'Bowler']

    batting = get_player_batting_stats(player_name)
    bowling = get_player_bowling_stats(player_name)
    phase = get_phase_stats(player_name, is_bowler)
    seasons = get_season_stats(player_name, is_bowler)
    venues = get_venue_stats(player_name, is_bowler)
    prediction = predict_performance(player_name) if batting else None
    franchise_history = build_franchise_history(career.get('franchise_history', ''))

    franchise = ''
    if pd.notna(career.get('current_franchise')):
        franchise = str(career['current_franchise'])
        if franchise in ['nan', 'None']:
            franchise = ''

    price = None
    if pd.notna(career.get('latest_price_cr')):
        try:
            price = float(career['latest_price_cr'])
        except:
            price = None

    acquisition = ''
    if pd.notna(career.get('how_acquired')):
        acquisition = str(career['how_acquired'])
        if acquisition in ['nan', 'None']:
            acquisition = ''

    return {
        'name': player_name,
        'role': role,
        'battingHand': meta['batting_hand'].values[0] if len(meta) > 0 else 'R',
        'bowlingStyle': meta['bowling_style'].values[0] if len(meta) > 0 else '',
        'bowlingType': meta['bowling_type'].values[0] if len(meta) > 0 else '',
        'franchise': franchise,
        'price': price,
        'acquisition': acquisition,
        'debut': int(career['debut_season']) if pd.notna(career.get('debut_season')) else None,
        'seasons': int(career['seasons_played']) if pd.notna(career.get('seasons_played')) else None,
        'franchiseHistory': franchise_history,
        'batting': batting,
        'bowling': bowling,
        'phaseStats': phase,
        'seasonStats': seasons,
        'venueStats': venues,
        'prediction': prediction,
        'isBowler': is_bowler,
    }


@app.get("/player/{player_name}/predict")
def predict_player(player_name: str, venue: str = '', opponent: str = ''):
    batting = get_player_batting_stats(player_name)
    if not batting:
        return {"error": "No batting data"}
    return predict_performance(player_name, venue, opponent)

@app.get("/debug/history/{player_name}")
def debug_history(player_name: str):
    row = player_career[player_career['player'] == player_name]
    if len(row) == 0:
        return {"error": "not found"}
    return {
        "raw_history": str(row.iloc[0].get('franchise_history', '')),
        "current_franchise": str(row.iloc[0].get('current_franchise', ''))
    }
def scout_recommend(team=None, playstyle=None, budget_max=None,
                    min_matches=5, top_n=15):
    result = scouting_profiles.copy()
    result = result[result['status'].isin(['Active', 'Unsold', 'International'])]
 
    if team:
        full_name = SCOUT_TEAM_FULL.get(team, team)
        result = result[result['current_franchise'] != full_name]
 
    if playstyle and playstyle != 'All':
        result = result[result['playstyle'] == playstyle]
 
    if budget_max is not None and budget_max > 0:
        result = result[
            (result['price_cr'].isna()) | (result['price_cr'] <= budget_max)
        ]
 
    if 'matches_played' in result.columns:
        result = result[result['matches_played'] >= min_matches]
 
    result = result[result['scouting_score'] > 15]
    result = result.nlargest(top_n, 'scouting_score')
 
    players = []
    for _, row in result.iterrows():
        player = {
            'name': str(row['player']),
            'scoutingScore': round(float(row['scouting_score']), 1) if pd.notna(row['scouting_score']) else 0,
            'performanceRating': round(float(row['performance_rating']), 1) if pd.notna(row['performance_rating']) else 0,
            'formRating': round(float(row['form_rating']), 1) if pd.notna(row['form_rating']) else 0,
            'consistencyRating': round(float(row['consistency_rating']), 1) if pd.notna(row['consistency_rating']) else 0,
            'impactRating': round(float(row['impact_rating']), 1) if pd.notna(row['impact_rating']) else 0,
            'pressureRating': round(float(row['pressure_rating']), 1) if pd.notna(row['pressure_rating']) else 0,
            'playstyle': str(row['playstyle']) if pd.notna(row['playstyle']) else 'Utility',
            'careerAvg': round(float(row['career_avg']), 1) if pd.notna(row['career_avg']) else 0,
            'careerSR': round(float(row['career_sr']), 1) if pd.notna(row['career_sr']) else 0,
            'price': round(float(row['price_cr']), 2) if pd.notna(row['price_cr']) else None,
            'valueScore': round(float(row['value_score']), 1) if pd.notna(row['value_score']) else None,
            'status': str(row['status']) if pd.notna(row['status']) else '',
            'franchise': str(row['current_franchise']) if pd.notna(row['current_franchise']) else '',
            'seasons': int(row['seasons_played']) if pd.notna(row.get('seasons_played')) else None,
            'matchesPlayed': int(row['matches_played']) if pd.notna(row.get('matches_played')) else 0,
            'isBowler': bool(row.get('is_bowler', False)) if pd.notna(row.get('is_bowler')) else False,
            'isAllrounder': bool(row.get('is_allrounder', False)) if pd.notna(row.get('is_allrounder')) else False,
        }
        if pd.notna(row.get('bowl_wickets')) and row.get('bowl_wickets', 0) > 0:
            player['bowlWickets'] = int(row['bowl_wickets'])
            player['bowlEconomy'] = round(float(row['bowl_economy']), 1) if pd.notna(row.get('bowl_economy')) else None
            player['bowlDotPct'] = round(float(row['bowl_dot_pct']), 1) if pd.notna(row.get('bowl_dot_pct')) else None
        players.append(player)
    return players
 
 
def scout_find_similar(player_name, top_n=8, status_filter=None,
                       budget_max=None, same_type=True):
    if player_name not in scout_player_index:
        return None
 
    idx = scout_player_index[player_name]
    sims = scout_sim_matrix[idx]
    source_row = scouting_profiles.iloc[idx]
 
    results = scouting_profiles.copy()
    results['similarity'] = (sims * 100).round(1)
    results = results[results['player'] != player_name]
 
    if same_type:
        is_ar = bool(source_row.get('is_allrounder', False)) if pd.notna(source_row.get('is_allrounder')) else False
        is_bowl = bool(source_row.get('is_bowler', False)) if pd.notna(source_row.get('is_bowler')) else False
        if is_ar:
            results = results[results['is_allrounder'] == True]
        elif is_bowl:
            results = results[results['is_bowler'] == True]
        else:
            has_bowl = 'is_bowler' in results.columns
            has_ar = 'is_allrounder' in results.columns
            if has_bowl and has_ar:
                results = results[(results['is_bowler'] == False) & (results['is_allrounder'] == False)]
 
    if status_filter and status_filter != 'All':
        if status_filter == 'Available':
            results = results[results['status'].isin(['Active', 'Unsold', 'International'])]
        else:
            results = results[results['status'] == status_filter]
 
    if budget_max is not None and budget_max > 0:
        results = results[
            (results['price_cr'].isna()) | (results['price_cr'] <= budget_max)
        ]
 
    results = results.nlargest(top_n, 'similarity')
 
    players = []
    for _, row in results.iterrows():
        p = {
            'name': str(row['player']),
            'similarity': float(row['similarity']),
            'scoutingScore': round(float(row['scouting_score']), 1) if pd.notna(row['scouting_score']) else 0,
            'playstyle': str(row['playstyle']) if pd.notna(row['playstyle']) else 'Utility',
            'careerAvg': round(float(row['career_avg']), 1) if pd.notna(row['career_avg']) else 0,
            'careerSR': round(float(row['career_sr']), 1) if pd.notna(row['career_sr']) else 0,
            'price': round(float(row['price_cr']), 2) if pd.notna(row['price_cr']) else None,
            'status': str(row['status']) if pd.notna(row['status']) else '',
            'franchise': str(row['current_franchise']) if pd.notna(row['current_franchise']) else '',
        }
        if pd.notna(row.get('bowl_wickets')) and row.get('bowl_wickets', 0) > 0:
            p['bowlWickets'] = int(row['bowl_wickets'])
            p['bowlEconomy'] = round(float(row['bowl_economy']), 1) if pd.notna(row.get('bowl_economy')) else None
        players.append(p)
 
    source = {
        'name': player_name,
        'playstyle': str(source_row['playstyle']) if pd.notna(source_row['playstyle']) else 'Utility',
        'careerAvg': round(float(source_row['career_avg']), 1) if pd.notna(source_row['career_avg']) else 0,
        'careerSR': round(float(source_row['career_sr']), 1) if pd.notna(source_row['career_sr']) else 0,
        'isBowler': bool(source_row.get('is_bowler', False)) if pd.notna(source_row.get('is_bowler')) else False,
        'isAllrounder': bool(source_row.get('is_allrounder', False)) if pd.notna(source_row.get('is_allrounder')) else False,
    }
 
    return {'source': source, 'similar': players}
 
 
# ── MODULE 2: Scouting endpoints ───────────────────────────
 
class ScoutingRequest(BaseModel):
    team: Optional[str] = None
    playstyle: Optional[str] = None
    budgetMax: Optional[float] = None
    topN: Optional[int] = 15
 
 
@app.get("/scouting/playstyles")
def get_playstyles():
    active = scouting_profiles[scouting_profiles['status'].isin(['Active', 'Unsold', 'International'])]
    counts = active['playstyle'].value_counts().to_dict()
    return [{'name': k, 'count': int(v)} for k, v in sorted(counts.items())]
 
 
@app.post("/scouting/recommend")
def scouting_recommend(req: ScoutingRequest):
    players = scout_recommend(
        team=req.team,
        playstyle=req.playstyle,
        budget_max=req.budgetMax,
        top_n=req.topN or 15,
    )
    return {
        'filters': {
            'team': req.team,
            'playstyle': req.playstyle,
            'budgetMax': req.budgetMax,
        },
        'count': len(players),
        'players': players,
    }
 
 
@app.get("/scouting/similar/{player_name}")
def scouting_similar(player_name: str, status: str = '', budget: float = 0):
    result = scout_find_similar(
        player_name,
        top_n=8,
        status_filter=status if status else None,
        budget_max=budget if budget > 0 else None,
    )
    if result is None:
        return {'error': f'Player {player_name} not found in scouting database'}
    return result
 
 
@app.get("/scouting/value-rankings")
def scouting_value_rankings(top_n: int = 20, min_matches: int = 10):
    df = scouting_profiles[
        (scouting_profiles['value_score'].notna()) &
        (scouting_profiles['status'].isin(['Active', 'Unsold'])) &
        (scouting_profiles['matches_played'] >= min_matches)
    ].nlargest(top_n, 'value_score')
 
    players = []
    for _, row in df.iterrows():
        players.append({
            'name': str(row['player']),
            'performanceRating': round(float(row['performance_rating']), 1),
            'price': round(float(row['price_cr']), 2),
            'valueScore': round(float(row['value_score']), 1),
            'playstyle': str(row['playstyle']),
            'careerAvg': round(float(row['career_avg']), 1) if pd.notna(row['career_avg']) else 0,
            'careerSR': round(float(row['career_sr']), 1) if pd.notna(row['career_sr']) else 0,
            'status': str(row['status']),
        })
    return {'count': len(players), 'players': players}
 
 
@app.get("/scouting/teams")
def get_teams():
    return [{'abbr': a, 'name': n} for a, n in SCOUT_TEAM_FULL.items()]