from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse
from pydantic import BaseModel
from .geocalc import calculate_distance

app = FastAPI()

# --- CONFIG ---
TARGET_POI = {"lat": 49.2606, "lon": -123.2460} # Sample coordinates, rn UBC clock tower
UNLOCK_RADIUS_METERS = 50 #50 m within target
GOD_MODE = False # For demo purposes, will say we are close to target if True

app.mount("/static", StaticFiles(directory="src/static"), name="static")

class UserLocation(BaseModel):
    lat: float
    lon: float

@app.get("/")
async def read_index():
    return FileResponse('src/static/index.html')

@app.post("/check-proximity")

def check_proximity(user_loc: UserLocation):

    # Calculate distance using geocalc function and user lat/lon
    dist = calculate_distance(
        user_loc.lat, user_loc.lon, 
        TARGET_POI["lat"], TARGET_POI["lon"]
    )
    
    # If user us within 50m, can verify status
    can_verify = False
    
    if dist <= UNLOCK_RADIUS_METERS:
        can_verify = True
    
    # "God Mode" (Override for Demo)
    if GOD_MODE:
        can_verify = True

    return {
        "distance_remaining": round(dist, 1),
        "can_verify": can_verify,
        "message": "You are close! Look for the target." if can_verify else "Keep walking..."
    }

# Endpoint to toggle God Mode during  presentation
@app.post("/admin/toggle-god-mode")
def toggle_god_mode(enabled: bool):
    global GOD_MODE
    GOD_MODE = enabled
    return {"status": f"God Mode is now {GOD_MODE}"}