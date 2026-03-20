from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
import json
from scipy import stats

app = FastAPI(title="IPL Intelligence API", version="1.0.0")

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LOAD DATA ON STARTUP ───────────────────────────────
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
venue_stats = venue_stats.rename(columns={'avg': 'venue_avg', 'sr': 'venue_sr'})

# Load model
with open('../models/performance_predictor.pkl', 'rb') as f:
    gbm = pickle.load(f)

master['date'] = pd.to_datetime(master['date'])
batting_features['date'] = pd.to_datetime(batting_features['date'])

print("✅ Data loaded!")

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
    hs = int(bat.groupby('matchId')['batsman_runs'].sum().max())
    return {'runs': runs, 'avg': avg, 'sr': sr, 'hs': hs,
            'fours': fours, 'sixes': sixes, 'innings': innings}

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
    best = int(bowl[bowl['is_wicket']==1].groupby('matchId')['is_wicket'].sum().max()) if wickets > 0 else 0
    return {'wickets': wickets, 'avg': avg, 'economy': economy,
            'sr': sr, 'dotPct': dot_pct, 'best': best}

def get_phase_stats(player_name, is_bowler=False):
    phases = ['Powerplay', 'Middle', 'Death']
    result = []
    for phase in phases:
        if is_bowler:
            bowl = master[(master['bowler'] == player_name) &
                         (master['phase'] == phase)]
            bowl_legal = bowl[bowl['is_wide'] == 0]
            w = int(bowl['is_wicket'].sum())
            r = int(bowl['total_runs'].sum())
            b = len(bowl_legal)
            eco = round(r / max(b/6, 0.1), 2)
            result.append({'phase': phase, 'economy': eco, 'wickets': w})
        else:
            bat = master[(master['batsman'] == player_name) &
                        (master['phase'] == phase) &
                        (master['is_wide'] == 0)]
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
                result.append({'season': str(int(row['season'])),
                               'wickets': int(row['wickets']),
                               'economy': eco})
    else:
        bat = master[(master['batsman'] == player_name) & (master['is_wide'] == 0)]
        season_data = bat.groupby('season').agg(
            runs=('batsman_runs', 'sum'),
            balls=('batsman_runs', 'count')).reset_index()
        for _, row in season_data.iterrows():
            if pd.notna(row['season']):
                sr = round(row['runs'] / max(row['balls'], 1) * 100, 1)
                result.append({'season': str(int(row['season'])),
                               'runs': int(row['runs']), 'sr': sr})
    return sorted(result, key=lambda x: x['season'])

def get_venue_stats(player_name, is_bowler=False):
    result = []
    if is_bowler:
        venues = venue_bowl_stats[venue_bowl_stats['bowler'] == player_name]
        for _, row in venues.nlargest(6, 'wickets').iterrows():
            t = 'happy' if row.get('is_happy_ground') else \
                'bogey' if row.get('is_bogey_ground') else 'neutral'
            result.append({
                'venue': row['venue_short'],
                'matches': int(row['matches']),
                'wickets': int(row['wickets']),
                'economy': round(row['economy'], 2),
                'type': t
            })
    else:
        venues = venue_stats[venue_stats['batsman'] == player_name]
        for _, row in venues.nlargest(6, 'runs').iterrows():
            t = 'happy' if row.get('is_happy_ground') else \
                'bogey' if row.get('is_bogey_ground') else 'neutral'
            result.append({
                'venue': row['venue_short'],
                'innings': int(row['innings']),
                'runs': int(row['runs']),
                'avg': round(row['venue_avg'], 2),
                'sr': round(row['venue_sr'], 2),
                'type': t
            })
    return result

def predict_performance(player_name, venue='', opponent=''):
    latest_form = batting_features[batting_features['batsman'] == player_name].tail(1)
    if len(latest_form) == 0:
        return None
    
    venue_key = venue.split(',')[0].strip()
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
        'career_avg': career_avg, 'career_sr': career_sr,
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

    feature_cols = ['avg_last5','sr_last5','form_score','form_sr','career_avg',
                    'career_sr','consistency','venue_avg','venue_sr','venue_score',
                    'is_happy_ground','is_bogey_ground','opp_avg','opp_sr','boundary_rate']
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

# ── API ENDPOINTS ──────────────────────────────────────
@app.get("/")
def root():
    return {"message": "IPL Intelligence API", "status": "running"}

@app.get("/players")
def get_all_players():
    """Get list of all players with basic info"""
    players = []
    for player in player_career['player'].tolist():
        career = player_career[player_career['player'] == player].iloc[0]
        meta = player_metadata[player_metadata['player'] == player]
        players.append({
            'id': player,
            'name': player,
            'role': meta['role'].values[0] if len(meta) > 0 else 'Unknown',
            'franchise': str(career.get('current_franchise', '')),
            'status': str(career.get('current_status', '')),
            'debut': int(career['debut_season']) if pd.notna(career['debut_season']) else None,
            'seasons': int(career['seasons_played']) if pd.notna(career['seasons_played']) else None,
        })
    return players

@app.get("/player/{player_name}")
def get_player_profile(player_name: str):
    """Get complete player profile"""
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

    # Franchise history
    history_str = str(career.get('franchise_history', ''))
    franchise_history = []
    if history_str and history_str != 'nan':
        entries = history_str.split(' → ')
        grouped = []
        for entry in entries:
            if ':' in entry:
                yr, team = entry.split(':', 1)
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
                abbr = abbr_map.get(team, team[:4])
                if grouped and grouped[-1]['team'] == abbr:
                    grouped[-1]['years'] = f"{grouped[-1]['years'].split('–')[0]}–{yr}"
                else:
                    grouped.append({'years': yr, 'team': abbr})
        franchise_history = grouped

    return {
        'name': player_name,
        'role': role,
        'battingHand': meta['batting_hand'].values[0] if len(meta) > 0 else 'R',
        'bowlingStyle': meta['bowling_style'].values[0] if len(meta) > 0 else '',
        'bowlingType': meta['bowling_type'].values[0] if len(meta) > 0 else '',
        'franchise': str(career.get('current_franchise', '')),
        'price': float(career['latest_price_cr']) if pd.notna(career.get('latest_price_cr')) else None,
        'acquisition': str(career.get('how_acquired', '')),
        'debut': int(career['debut_season']) if pd.notna(career['debut_season']) else None,
        'seasons': int(career['seasons_played']) if pd.notna(career['seasons_played']) else None,
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
    """Predict player performance for specific match"""
    batting = get_player_batting_stats(player_name)
    if not batting:
        return {"error": "No batting data"}
    return predict_performance(player_name, venue, opponent)

@app.get("/players/search/{query}")
def search_players(query: str):
    """Search players by name"""
    matches = player_career[
        player_career['player'].str.contains(query, case=False, na=False)
    ]['player'].tolist()
    return matches[:20]