import pandas as pd
from rapidfuzz import fuzz
from pathlib import Path
 
DATA = Path("data")
CAREER_CSV      = DATA / "player_career_info.csv"
SOLD_CSV        = DATA /"auction" / "IPL_Mini_Auction_2026.csv"
REGISTERED_XLSX = DATA / "2026_players_list.xlsx"
 
# Manual overrides for tricky cases. Add to this if you spot wrong matches
# in the report at the end.
MANUAL_BRIDGE = {
    "V Kohli": "Virat Kohli",
    "RG Sharma": "Rohit Sharma",
    "JJ Bumrah": "Jasprit Bumrah",
    "HH Pandya": "Hardik Pandya",
    "KH Pandya": "Krunal Pandya",
    "SA Yadav": "Suryakumar Yadav",
    "AS Yadav": "Suryakumar Yadav",
    "RR Pant": "Rishabh Pant",
    "RA Jadeja": "Ravindra Jadeja",
    "YBK Jaiswal": "Yashasvi Jaiswal",
    "AR Patel": "Axar Patel",
    "MM Ali": "Moeen Ali",
    "GJ Maxwell": "Glenn Maxwell",
    "DA Miller": "David Miller",
    "JC Buttler": "Jos Buttler",
    "JM Bairstow": "Jonny Bairstow",
    "Q de Kock": "Quinton de Kock",
    "A Mishra": "Amit Mishra",
    "AK Markram": "Aiden Markram",
    "SS Iyer": "Shreyas Iyer",
    "VR Iyer": "Venkatesh Iyer",
    "JE Root": "Joe Root",
    "BA Stokes": "Ben Stokes",
}
 
# --- name parsing ------------------------------------------------------------
def parse_cricsheet(name: str):
    parts = name.strip().split()
    if len(parts) < 2:
        return ("", name.lower())
    return (parts[0], " ".join(parts[1:]).lower())
 
def parse_full(name: str):
    parts = name.strip().split()
    if len(parts) < 2:
        return ("", name.lower())
    return (parts[0], " ".join(parts[1:]).lower())
 
def first_initial_consistent(cricsheet_first: str, full_first: str) -> bool:
    if not cricsheet_first or not full_first:
        return True
    return cricsheet_first[0].lower() == full_first[0].lower()
 
def build_surname_index(full_names):
    idx = {}
    for fn in full_names:
        first, surname = parse_full(fn)
        idx.setdefault(surname, []).append((first, fn))
    return idx
 
def match_one(cricsheet_name: str, surname_idx: dict, all_full_names: list):
    if cricsheet_name in MANUAL_BRIDGE:
        target = MANUAL_BRIDGE[cricsheet_name]
        return target if target in all_full_names else None
 
    if cricsheet_name in all_full_names:
        return cricsheet_name
 
    cs_first, cs_surname = parse_cricsheet(cricsheet_name)
    if not cs_surname:
        return None
 
    candidates = surname_idx.get(cs_surname, [])
 
    if not candidates:
        best_surname = None
        best_score = 0
        for surname in surname_idx.keys():
            s = fuzz.ratio(cs_surname, surname)
            if s > best_score and s >= 90:
                best_score = s
                best_surname = surname
        if best_surname:
            candidates = surname_idx[best_surname]
 
    if not candidates:
        return None
 
    consistent = [
        (first, fn) for (first, fn) in candidates
        if first_initial_consistent(cs_first, first)
    ]
    if len(consistent) == 1:
        return consistent[0][1]
    if len(consistent) > 1:
        best = max(consistent, key=lambda c: fuzz.WRatio(cricsheet_name, c[1]))
        return best[1]
    return None
 
# --- load --------------------------------------------------------------------
career = pd.read_csv(CAREER_CSV)
sold = pd.read_csv(SOLD_CSV)
registered = pd.read_excel(REGISTERED_XLSX)
 
registered["full_name"] = (
    registered["First Name"].astype(str).str.strip()
    + " "
    + registered["Surname"].astype(str).str.strip()
)
registered_names = registered["full_name"].dropna().unique().tolist()
sold_names       = sold["Player"].dropna().unique().tolist()
 
reg_idx  = build_surname_index(registered_names)
sold_idx = build_surname_index(sold_names)
 
print(f"Matching {len(career)} career players against "
      f"{len(registered_names)} registered and {len(sold_names)} sold...")
 
career["_matched_registered"] = career["player"].apply(
    lambda n: match_one(n, reg_idx, registered_names)
)
career["_matched_sold"] = career["player"].apply(
    lambda n: match_one(n, sold_idx, sold_names)
)
 
def compute_status(row):
    has_acquisition = pd.notna(row.get("how_acquired"))
    is_sold_2026   = pd.notna(row["_matched_sold"])
    is_registered  = pd.notna(row["_matched_registered"])
    has_team       = pd.notna(row.get("current_franchise")) and str(row.get("current_franchise")).strip() != ""
    last_season    = row.get("last_season")
    played_2025    = pd.notna(last_season) and last_season == 2025
    plausibly_active = pd.notna(last_season) and last_season >= 2023
 
    # 1. Confirmed in 2026 squad via auction or manual annotation
    if has_acquisition or is_sold_2026:
        return "Active"
    # 2. Registered for auction but not bought.
    #    Reject ancient surname-collision false positives: a player whose last
    #    IPL appearance was before 2023 did not realistically enter the 2026 auction.
    if is_registered and plausibly_active:
        return "Unsold"
    # 3. Heuristic: played in 2025, has a current team, and did NOT register for
    #    the 2026 auction → almost certainly retained by their franchise.
    #    (Sitting out the entire 2025 season is a strong signal of retirement,
    #     so we require last_season == 2025, not >=2024.)
    if played_2025 and has_team:
        return "Active"
    return "Retired"
 
career["status"] = career.apply(compute_status, axis=1)
 
# --- report ------------------------------------------------------------------
print("\nNew status distribution:")
print(career["status"].value_counts())
 
recent_retired = career[(career["status"] == "Retired") & (career["last_season"] >= 2024)]
print(f"\n{len(recent_retired)} 'Retired' players who last played in 2024+ "
      "(should be 0 — review if any):")
print(recent_retired[["player", "last_season"]].head(30).to_string(index=False))
 
old_unsold = career[(career["status"] == "Unsold") & (career["last_season"] < 2023)]
print(f"\n{len(old_unsold)} 'Unsold' players whose last_season < 2023 "
      "(should be 0):")
print(old_unsold[["player", "last_season"]].head(20).to_string(index=False))
 
print("\nFirst 12 Active:")
print(career[career["status"] == "Active"][["player", "current_franchise"]].head(12).to_string(index=False))
print("\nFirst 12 Unsold:")
print(career[career["status"] == "Unsold"][["player", "last_season", "current_franchise"]].head(12).to_string(index=False))
 
career = career.drop(columns=["_matched_registered", "_matched_sold"])
career.to_csv(CAREER_CSV, index=False)
print(f"\nSaved -> {CAREER_CSV}")
 