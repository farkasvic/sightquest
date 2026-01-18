import os
from google import genai

# ⚠️ PASTE YOUR REAL KEY HERE
os.environ["GEMINI_API_KEY"] = "AIzaSyBPD8DDpIRGbAbNMqKJy7Spq-cYa5DFeh4" 

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

print("--- FETCHING MODEL LIST ---")
try:
    # Just print the name directly
    for model in client.models.list():
        print(f"found: {model.name}")
except Exception as e:
    print(f"Error: {e}")