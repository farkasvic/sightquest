import json
import os
import warnings
from datetime import datetime
from google import genai
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pymongo import MongoClient

from .geocalc import calculate_distance 

warnings.simplefilter(action='ignore', category=FutureWarning)

app = FastAPI()

os.environ["GEMINI_API_KEY"] = "AIzaSyBPD8DDpIRGbAbNMqKJy7Spq-cYa5DFeh4"
ai_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

current_riddle_cache = {
    "target_name": None,
    "riddle_text": None
}


# --- CONFIG ---
MONGO_URI = "mongodb+srv://farkasv_db_user:SW3aDB0E91ARyPdz@513cluster.lyvt3gy.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["cityquest_db"]
users_collection = db["users"]

TARGET_POI = {
    "lat": 49.2606, 
    "lon": -123.2460, 
    "name": "UBC Clock Tower", 
    "category": "History"
} 
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
def get_current_user():
    """
    Fetch the 'demo_user'. If they don't exist, create them.
    """
    user = users_collection.find_one({"_id": "demo_user"})
    if not user:
        user = {"_id": "demo_user", "stamps": [], "badges": []}
        users_collection.insert_one(user)
    return user

def update_user_data(user_data):
    """
    Save the updated stamps/badges back to Mongo.
    """
    users_collection.replace_one({"_id": "demo_user"}, user_data)

# --- ROUTES ---

@app.get("/")
async def read_index():
    return FileResponse('src/static/index.html')

@app.get("/get-riddle")
def get_riddle():
    global current_riddle_cache
    
    # 1. Check Cache: If we already have a riddle for this specific target, return it!
    if current_riddle_cache["target_name"] == TARGET_POI["name"] and current_riddle_cache["riddle_text"]:
        print("Returning Cached Riddle (Saving Quota!)")
        return {"riddle": current_riddle_cache["riddle_text"]}
    
    try:
        print("Fetching fresh riddle from Gemini...")
        prompt = (
            "You are the 'Mysterious Pathfinder', a cryptic wayfinding bard. Your tone is ancient, concise, evocative and easy to understand. "
            f"Write a short, cryptic 4-line rhyming riddle for a location named '{TARGET_POI['name']}'. "
            f"It is a '{TARGET_POI['category']}' location. Include at least one concrete visual feature typical of the category."
            "Do not use the name of the location in the riddle. "
            "Include at least one spatial or structural anchor that would distinguish this place from others nearby."
        )
        
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt
        )
        
        if response.text:
            # SAVE TO CACHE
            current_riddle_cache["target_name"] = TARGET_POI["name"]
            current_riddle_cache["riddle_text"] = response.text
            return {"riddle": response.text}
        
    except Exception as e:
        print(f"Gemini Error: {e}")
        # Fallback is fine! It keeps the app working.
        return {"riddle": "I stand tall with hands on my face,\nCounting the moments in this open place."}

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
    # 1. Get User from Mongo
    user = get_current_user()
    
    # 2. Prevent Duplicates
    # (Mongo returns 'stamps' as a list of dicts, same as before)
    for s in user["stamps"]:
        if s["name"] == stamp.poi_name:
            return {"message": "Stamp already collected!", "new_badge": None}

    # 3. Add New Stamp
    new_stamp = {
        "name": stamp.poi_name,
        "category": stamp.category,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    user["stamps"].append(new_stamp)
    
    # 4. Check for Badges
    new_badge = None
    count = sum(1 for s in user["stamps"] if s["category"] == stamp.category)
    
    for badge_name, rule in BADGE_RULES.items():
        if rule["category"] == stamp.category and count == rule["count"]:
            if badge_name not in user["badges"]:
                user["badges"].append(badge_name)
                new_badge = badge_name

    # 5. Save changes to Mongo
    update_user_data(user)
    
    return {
        "message": "Stamp Collected!",
        "new_badge": new_badge
    }

@app.get("/my-profile")
def get_profile():
    return get_current_user()

@app.post("/reset-db")
def reset_db():
    # Delete the demo user completely so it regenerates empty next time
    users_collection.delete_one({"_id": "demo_user"})
    return {"message": "Passport reset successfully!"}