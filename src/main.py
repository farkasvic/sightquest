import json
import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse
from pydantic import BaseModel
# Ensure this matches your actual filename (geo_calc.py vs geocalc.py)
from .geocalc import calculate_distance 

app = FastAPI()

# --- CONFIG ---
TARGET_POI = {"lat": 49.2606, "lon": -123.2460} # UBC clock tower
UNLOCK_RADIUS_METERS = 50 
GOD_MODE = False 
DB_FILE = "src/db.json"

# Rules: Collect 3 of a category to win a badge
BADGE_RULES = {
    "Ranger": {"category": "Park", "count": 3},
    "Historian": {"category": "History", "count": 3},
    "Foodie": {"category": "Food", "count": 3}
}

app.mount("/static", StaticFiles(directory="src/static"), name="static")

# --- DATA MODELS ---
class UserLocation(BaseModel):
    lat: float
    lon: float

class StampRequest(BaseModel):
    poi_name: str
    category: str 

# --- DATABASE HELPERS ---
def load_db():
    # If file doesn't exist, start with empty lists
    if not os.path.exists(DB_FILE):
        return {"stamps": [], "badges": []}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# --- ROUTES ---

@app.get("/")
async def read_index():
    return FileResponse('src/static/index.html')

@app.post("/check-proximity")
def check_proximity(user_loc: UserLocation):
    dist = calculate_distance(
        user_loc.lat, user_loc.lon, 
        TARGET_POI["lat"], TARGET_POI["lon"]
    )
    
    can_verify = False
    if dist <= UNLOCK_RADIUS_METERS:
        can_verify = True
    
    if GOD_MODE:
        can_verify = True

    return {
        "distance_remaining": round(dist, 1),
        "can_verify": can_verify,
        "message": "You are close! Look for the target." if can_verify else "Keep walking..."
    }

@app.post("/toggle-god-mode")
def toggle_god_mode(enable: bool):
    global GOD_MODE
    GOD_MODE = enable
    return {"status": "success", "god_mode": GOD_MODE}

# --- NEW: STAMP LOGIC ---

@app.post("/collect-stamp")
def collect_stamp(stamp: StampRequest):
    db = load_db()
    
    # 1. Prevent Duplicates (Optional)
    for s in db["stamps"]:
        if s["name"] == stamp.poi_name:
            return {"message": "Stamp already collected!", "new_badge": None}

    # 2. Add New Stamp
    new_stamp = {
        "name": stamp.poi_name,
        "category": stamp.category,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    db["stamps"].append(new_stamp)
    
    # 3. Check for Badges
    new_badge = None
    count = sum(1 for s in db["stamps"] if s["category"] == stamp.category)
    
    for badge_name, rule in BADGE_RULES.items():
        if rule["category"] == stamp.category and count == rule["count"]:
            if badge_name not in db["badges"]:
                db["badges"].append(badge_name)
                new_badge = badge_name

    save_db(db)
    
    return {
        "message": "Stamp Collected!",
        "new_badge": new_badge
    }

@app.get("/my-profile")
def get_profile():
    return load_db()

@app.post("/reset-db")
def reset_db():
    empty_db = {"stamps": [], "badges": []}
    save_db(empty_db)
    return {"message": "Passport reset successfully!"}