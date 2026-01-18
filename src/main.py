import json
import os
import time
import shutil
import base64
import warnings
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types 
from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pymongo import MongoClient

# Attempt to import geo calculator
try:
    from .geocalc import calculate_distance
except ImportError:
    from geocalc import calculate_distance 

import requests
warnings.simplefilter(action='ignore', category=FutureWarning)

app = FastAPI()

# --- FILE SYSTEM CONFIG ---
DATA_DIR = Path("src/data")
DATA_DIR.mkdir(parents=True, exist_ok=True) # Ensure dir exists

CURRENT_SESSION_FILE = DATA_DIR / "current_session_data.json"
SESSIONS_DIR = DATA_DIR / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# --- CONFIG ---
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not api_key:
    # Fail-safe for hackathon if .env breaks
    print("⚠️ WARNING: GEMINI_API_KEY missing.")
else:
    print("✅ API Key loaded successfully!")

# Initialize Client
ai_client = genai.Client(api_key=api_key)

# MongoDB Config
MONGO_URI = "mongodb+srv://farkasv_db_user:SW3aDB0E91ARyPdz@513cluster.lyvt3gy.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["cityquest_db"]
users_collection = db["users"]

# Game Constants
UNLOCK_RADIUS_METERS = 50
GOD_MODE = True 

BADGE_RULES = {
    "Ranger": {"category": "Park", "count": 3},
    "Historian": {"category": "History", "count": 3},
    "Foodie": {"category": "Food", "count": 3}
}

# ✅ FIX 2: Better Keywords so Google finds stuff
CATEGORY_KEYWORDS = {
    "Park": "park",
    "History": "history", # 'history' returns 0 results often
    "Food": "restaurant",
    "Cafe": "cafe",
    "Landmark": "landmark",
}

app.mount("/static", StaticFiles(directory="src/static"), name="static")

# --- DATA MODELS ---
class UserLocation(BaseModel):
    lat: float
    lon: float

class StampRequest(BaseModel):
    poi_name: str
    category: str 

class ImageRequest(BaseModel):
    image_b64: str
    lat: float
    lon: float
    

# --- SESSION HELPERS ---
def load_game_state():
    if not CURRENT_SESSION_FILE.exists():
        return None
    try:
        with open(CURRENT_SESSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading session: {e}")
        return None

def save_game_state(data):
    with open(CURRENT_SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_active_quest(game_data):
    if not game_data or "quests" not in game_data:
        return None
    for quest in game_data["quests"]:
        if quest["status"] == "active":
            return quest
    return None

def advance_quest_stage(game_data):
    quests = game_data.get("quests", [])
    for i, quest in enumerate(quests):
        if quest["status"] == "active":
            quest["status"] = "completed"
            if i + 1 < len(quests):
                quests[i+1]["status"] = "active"
                print(f"🔓 Unlocked Next Quest: {quests[i+1]['name']}")
            else:
                print("🎉 All Quests Completed!")
                game_data["session"]["completedAt"] = datetime.utcnow().isoformat()
            return True
    return False

# --- DATABASE HELPERS ---
def get_current_user():
    user = users_collection.find_one({"_id": "demo_user"})
    if not user:
        user = {"_id": "demo_user", "stamps": [], "badges": []}
        users_collection.insert_one(user)
    return user

def update_user_data(user_data):
    users_collection.replace_one({"_id": "demo_user"}, user_data)

def process_stamp_logic(poi_name, category):
    user = get_current_user()
    for s in user["stamps"]:
        if s["name"] == poi_name:
            return {"success": True, "message": "Stamp already collected!", "new_badge": None}

    new_stamp = {
        "name": poi_name,
        "category": category,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    user["stamps"].append(new_stamp)
    
    new_badge = None
    count = sum(1 for s in user["stamps"] if s["category"] == category)
    
    for badge_name, rule in BADGE_RULES.items():
        if rule["category"] == category and count == rule["count"]:
            if badge_name not in user["badges"]:
                user["badges"].append(badge_name)
                new_badge = badge_name

    update_user_data(user)
    return {"success": True, "message": "Stamp Collected!", "new_badge": new_badge}


# --- ROUTES ---

@app.get("/")
async def read_index():
    return FileResponse('src/static/index2.html')

@app.get("/get-riddle")
def get_riddle():
    game_data = load_game_state()
    if not game_data:
        return {"riddle": "No active session. Please start a new quest!"}

    active_quest = get_active_quest(game_data)
    if not active_quest:
        return {"riddle": "All quests completed! Check your passport."}

    if active_quest.get("riddle") == "Find the place where history whispers." or not active_quest.get("riddle"):
        try:
            print(f"🤖 Generating AI riddle for {active_quest['name']}...")
            prompt = (f"""
                <Role>
                You are the "Mysterious Pathfinder", a mischievous wayfinding bard.
                Your tone is ancient, playful, evocative, and easy to understand.
                You enjoy teasing explorers just enough to make the discovery fun.
                </Role>

                <Task>
                Write a short, cryptic, FOUR-line riddle for a real world location.
                The riddle should feel like part of a game and make the player curious to explore.
                </Task>

                <Location_Context>
                Place name: {active_quest['name']}
                Category: {active_quest['category']}
                </Location_Context>

                <Constraints>
                NEVER use the place name or obvious aliases. Do NOT mention the city, campus, or region. 
                The final words of all lines must clearly rhyme. Include at least ONE concrete visual feature typical of the category.
                Include at least ONE spatial or structural anchor that distinguishes this place nearby. 
                Do all reasoning silently; output ONLY the four lines. The riddle should narrow the search, not obscure it.
                </Constraints>
                """
            )
            response = ai_client.models.generate_content(
                model='gemini-2.5-flash', 
                contents=prompt
            )
            active_quest["riddle"] = response.text if response.text else "A mystery awaits..."
            save_game_state(game_data)
        except Exception as e:
            print(f"AI Error: {e}")
            active_quest["riddle"] = "A hidden gem awaits your steps,\nWhere secrets lie and memories slept."

    return {
        "riddle": active_quest["riddle"],
        "category": active_quest["category"],
        "quest_id": active_quest["id"]
    }

@app.post("/check-proximity")
def check_proximity(user_loc: UserLocation):
    game_data = load_game_state()
    if not game_data:
        return {"distance_remaining": 0, "can_verify": False, "message": "No active session."}

    active_quest = get_active_quest(game_data)
    if not active_quest:
        return {"distance_remaining": 0, "can_verify": False, "message": "All quests completed!"}

    target_lat = active_quest["location"]["lat"]
    target_lon = active_quest["location"]["lng"]
    dist = calculate_distance(user_loc.lat, user_loc.lon, target_lat, target_lon)
    can_verify = dist <= UNLOCK_RADIUS_METERS or GOD_MODE

    return {
        "distance_remaining": round(dist, 1),
        "can_verify": can_verify,
        "message": f"Near {active_quest['name']}!" if can_verify else "Keep exploring...",
        "target_id": active_quest["id"]
    }

@app.post("/verify-image")
def verify_image(req: ImageRequest):
    # 1. Load the Game State & Active Quest
    game_data = load_game_state()
    if not game_data:
        return {"success": False, "message": "No active session."}

    active_quest = get_active_quest(game_data)
    if not active_quest:
        return {"success": False, "message": "No active quest found."}

    # 2. Extract Target Coordinates (Fixing the JSON path)
    target_lat = active_quest["location"]["lat"]
    target_lon = active_quest["location"]["lng"]

    # 3. Location Check (With God Mode)
    dist = calculate_distance(req.lat, req.lon, target_lat, target_lon)
    
    # Check both Global God Mode AND the phone's request flag
    is_god_mode = GOD_MODE or req.force_god_mode

    if dist > UNLOCK_RADIUS_METERS and not is_god_mode:
        return {"success": False, "message": f"Too far! Get closer to {active_quest['name']}."}

    # 4. AI Verification
    success = False
    
    if is_god_mode:
        print(f"⚡️ GOD MODE: Auto-approving {active_quest['name']}")
        success = True
    else:
        try:
            # Decode Image
            image_bytes = base64.b64decode(req.image_b64.split(",")[-1]) 
            
            # Ask Gemini
            prompt = f"Look at this image. Is this a picture of {active_quest['name']}? Answer YES or NO. If unsure, say NO."
            
            response = ai_client.models.generate_content(
                model='gemini-2.5-flash', 
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )
            
            ai_reply = response.text.strip().upper()
            print(f"AI Vision Verdict: {ai_reply}")

            if "YES" in ai_reply:
                success = True
                
        except Exception as e:
            print(f"Vision Error: {e}")
            # If AI fails but God Mode is on, allow it. Otherwise fail.
            if is_god_mode:
                 success = True

    # 5. Handle Success
    if success:
        # Update JSON State (Unlock next quest)
        advance_quest_stage(game_data)
        save_game_state(game_data)
        
        # Add Stamp to User Profile
        return process_stamp_logic(active_quest["name"], active_quest["category"])
    else:
        return {"success": False, "message": "That doesn't look like the target. Try again!"}

# --- LANDMARKS & SESSION ---

@app.get("/get-landmarks")
def get_landmarks(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(2000),
    category: str = Query("Park")
):
    # ✅ FIX 3: Debug Prints to see what's happening
    keyword = CATEGORY_KEYWORDS.get(category, "tourist_attraction")
    print(f"🔍 Searching Google Maps: Loc={lat},{lng} | Key={keyword}")

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "keyword": keyword,
        "key": GOOGLE_API_KEY,
    }
    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        
        # ✅ FIX 4: Check if Google Denied the Request
        if "error_message" in data:
            print(f"❌ Google API Error: {data['error_message']}")
            return {"results": []} # Return empty so frontend handles it gracefully
            
        print(f"✅ Found {len(data.get('results', []))} results")
        return data
    except requests.RequestException as e:
        print(f"❌ Network Error: {e}")
        return {"error": str(e)}

@app.post("/start-session")
def start_session(data: dict = Body(...)):
    now = datetime.utcnow().isoformat() + "Z"
    hunt_id = f"hunt_{int(time.time())}"

    session = {
        "huntId": hunt_id,
        "startLocation": data["startLocation"],
        "radiusMeters": data["radiusMeters"],
        "category": data["category"],
        "currentQuestIndex": 0,
        "totalPoints": 0,
        "startedAt": now,
        "updatedAt": now,
    }

    quests = []
    for i, lm in enumerate(data["landmarks"]):
        status = "active" if i == 0 else "locked"
        quests.append({
            "id": f"quest_{lm['order']}",
            "sessionId": hunt_id,
            "name": lm["name"],
            "location": {"lat": lm["lat"], "lng": lm["lng"]},
            "category": data["category"],
            "riddle": None,
            "status": status,
            "points": 100,
            "order": lm["order"],
            "awardedPoints": 0,
        })

    output = {"session": session, "quests": quests}
    save_game_state(output)
    print(f"📜 Session Started! {len(quests)} quests loaded.")
    return {"status": "session_created", "huntId": hunt_id}

@app.post("/complete-session")
def complete_session():
    if not CURRENT_SESSION_FILE.exists():
        raise HTTPException(status_code=404, detail="No active session found")
    session_data = load_game_state()
    hunt_id = session_data.get("session", {}).get("huntId")
    if not hunt_id:
        raise HTTPException(status_code=400, detail="huntId missing from session")
    target_file = SESSIONS_DIR / f"{hunt_id}.json"
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2)
    return {"status": "completed", "huntId": hunt_id, "savedTo": str(target_file)}

@app.post("/collect-stamp")
def collect_stamp(stamp: StampRequest):
    return process_stamp_logic(stamp.poi_name, stamp.category)

@app.post("/toggle-god-mode")
def toggle_god_mode(enable: bool = Query(...)):
    global GOD_MODE
    GOD_MODE = enable
    print(f"⚡️ GOD MODE SET TO: {GOD_MODE}")
    return {"status": "success", "god_mode": GOD_MODE}

@app.get("/stats")
def get_stats():
    user = get_current_user()
    xp = (len(user["stamps"]) * 150) + (len(user["badges"]) * 500)
    leaderboard = [
        {"rank": 1, "name": "AtlasTheGuide", "xp": 5200, "avatar": "🦁"},
        {"rank": 2, "name": "CityWalker99", "xp": 3450, "avatar": "👟"},
        {"rank": 3, "name": "FoodFindr", "xp": 2800, "avatar": "🍕"},
        {"rank": 5, "name": "RookieDave", "xp": 800, "avatar": "🌱"},
    ]
    leaderboard.append({"name": "You", "xp": xp, "avatar": "🦄", "is_me": True})
    leaderboard.sort(key=lambda x: x["xp"], reverse=True)
    for index, player in enumerate(leaderboard):
        player["rank"] = index + 1
    return {"xp": xp, "total_badges": len(user["badges"]), "total_quests": len(user["stamps"]), "leaderboard": leaderboard}

@app.get("/my-profile")
def get_profile():
    return get_current_user()

@app.post("/reset-db")
def reset_db():
    users_collection.delete_one({"_id": "demo_user"})
    return {"message": "Passport reset successfully!"}