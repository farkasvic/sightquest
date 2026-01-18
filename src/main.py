import json
import os
import base64
import warnings
from datetime import datetime
from google import genai
from google.genai import types 
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pymongo import MongoClient

from .geocalc import calculate_distance 

warnings.simplefilter(action='ignore', category=FutureWarning)

app = FastAPI()

# --- CONFIG ---
os.environ["GEMINI_API_KEY"] = "AIzaSyBNKDESITu88D-YyW8OzZrEZCq8HIJGfXo"
ai_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Global cache to save money/quota
current_riddle_cache = {
    "target_name": None,
    "riddle_text": None
}

# MongoDB Config
MONGO_URI = "mongodb+srv://farkasv_db_user:SW3aDB0E91ARyPdz@513cluster.lyvt3gy.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["cityquest_db"]
users_collection = db["users"]

TARGET_POI = {
    "lat": 49.2666, 
    "lon": 123.2499, 
    "name": "UBC Blue Chip", 
    "category": "Food"
} 
UNLOCK_RADIUS_METERS = 50 
GOD_MODE = False 
DB_FILE = "src/db.json"

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

class ImageRequest(BaseModel):
    image_b64: str
    lat: float
    lon: float

# --- DATABASE HELPERS ---
def get_current_user():
    user = users_collection.find_one({"_id": "demo_user"})
    if not user:
        user = {"_id": "demo_user", "stamps": [], "badges": []}
        users_collection.insert_one(user)
    return user

def update_user_data(user_data):
    users_collection.replace_one({"_id": "demo_user"}, user_data)

# --- MISSING HELPER FUNCTION RESTORED ---
def process_stamp_logic(poi_name, category):
    """
    Reusable logic to add a stamp and check for badges.
    Used by both /collect-stamp and /verify-image.
    """
    user = get_current_user()
    
    # Check duplicate
    for s in user["stamps"]:
        if s["name"] == poi_name:
            return {"success": True, "message": "Stamp already collected!", "new_badge": None}

    new_stamp = {
        "name": poi_name,
        "category": category,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    user["stamps"].append(new_stamp)
    
    # Check Badges
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
    return FileResponse('src/static/index.html')

@app.get("/get-riddle")
def get_riddle():
    global current_riddle_cache
    
    if current_riddle_cache["target_name"] == TARGET_POI["name"] and current_riddle_cache["riddle_text"]:
        print("Returning Cached Riddle (Saving Quota!)")
        return {"riddle": current_riddle_cache["riddle_text"]}
    
    try:
        print("Fetching fresh riddle from Gemini...")
        prompt = (
            f"""
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
            Place name: {TARGET_POI['name']}
            Category: {TARGET_POI['category']}
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
        
        if response.text:
            current_riddle_cache["target_name"] = TARGET_POI["name"]
            current_riddle_cache["riddle_text"] = response.text
            return {"riddle": response.text}
        
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"riddle": "I stand tall with hands on my face,\nCounting the moments in this open place."}
    

@app.post("/verify-image")
def verify_image(req: ImageRequest):
    # 1. Location Check
    dist = calculate_distance(req.lat, req.lon, TARGET_POI["lat"], TARGET_POI["lon"])
    if dist > UNLOCK_RADIUS_METERS and not GOD_MODE:
        return {"success": False, "message": f"Too far! Get closer to {TARGET_POI['name']}."}

    try:
        # 2. Decode Base64 Image
        image_bytes = base64.b64decode(req.image_b64.split(",")[-1]) 
        
        # 3. Ask Gemini Vision
        prompt = f"Look at this image. Is this a picture of {TARGET_POI['name']}? Answer YES or NO. If unsure, say NO."
        
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ]
        )
        
        ai_reply = response.text.strip().upper()
        print(f"AI Vision Verdict: {ai_reply}")

        # 4. Handle Verdict
        if "YES" in ai_reply:
            # Now calling the function that actually exists!
            result = process_stamp_logic(TARGET_POI["name"], TARGET_POI["category"])
            return result
        else:
            return {"success": False, "message": "That doesn't look like the target. Try again!"}

    except Exception as e:
        print(f"Vision Error: {e}")
        if GOD_MODE:
             result = process_stamp_logic(TARGET_POI["name"], TARGET_POI["category"])
             return result
        return {"success": False, "message": "AI couldn't verify image."}

@app.post("/check-proximity")
def check_proximity(user_loc: UserLocation):
    dist = calculate_distance(
        user_loc.lat, user_loc.lon, 
        TARGET_POI["lat"], TARGET_POI["lon"]
    )
    
    can_verify = dist <= UNLOCK_RADIUS_METERS or GOD_MODE

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

@app.post("/collect-stamp")
def collect_stamp(stamp: StampRequest):
    # Simplified to use the helper function
    return process_stamp_logic(stamp.poi_name, stamp.category)

@app.get("/my-profile")
def get_profile():
    return get_current_user()

@app.post("/reset-db")
def reset_db():
    users_collection.delete_one({"_id": "demo_user"})
    return {"message": "Passport reset successfully!"}