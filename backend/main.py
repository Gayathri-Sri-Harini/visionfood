from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import os
import io
import json
import base64
import httpx
from PIL import Image
from dotenv import load_dotenv

load_dotenv()  # Loads the key from your .env file automatically!

app = FastAPI(title="AI Image-Powered Health & Fitness Coach API")

# Setup CORS for your React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Gemini API Configuration Verification ---
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    print("✅ Gemini API Key detected for direct network routing integration.")
else:
    print("⚠️ Warning: GEMINI_API_KEY is missing. Running in fail-safe simulation mode.")

# Helper to validate image files
def validate_image(file: UploadFile):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

# Helper to process image directly via Google REST API
async def call_gemini_vision(file: UploadFile, prompt: str, fallback_data: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback_data
    
    try:
        # Reset file stream cursor to the beginning
        await file.seek(0)
        image_bytes = await file.read()
        
        if not image_bytes:
            print("Error: Empty image bytes received.")
            return fallback_data
            
        # Convert image to base64 structure
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # 📍 BULLETPROOF URL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        # 📍 STRUCTURED PAYLOAD (Tells Gemini explicitly to return JSON)
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": file.content_type,
                            "data": base64_image
                        }
                    }
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        # Async HTTP Call to Google Cloud
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            
        if response.status_code == 200:
            result_json = response.json()
            raw_text = result_json["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text.strip())
        else:
            print(f"Gemini API Error: {response.status_code} - {response.text}")
            return fallback_data
            
    except Exception as e:
        print(f"Direct Network Processing Error: {str(e)}")
        return fallback_data


# --- FEATURE 1: Advanced Diet & Allergen Analyzer ---
@app.post("/api/diet/analyze")
async def analyze_meal(file: UploadFile = File(...)):
    validate_image(file)
    
    prompt = """
    Analyze this food photo. Provide the meal name, total calories, macronutrients, an overall health score (1-10), and any potential common allergens found in it.
    You MUST reply using ONLY a strict JSON payload matching this exact format:
    {
      "food_item": "Meal Name",
      "calories": 450,
      "macronutrients": {"protein": "30g", "carbs": "45g", "fats": "12g"},
      "health_score": 8,
      "allergens": ["Gluten", "Dairy"]
    }
    """
    
    fallback = {
        "food_item": "Avocado Toast with Poached Egg (Simulated)",
        "calories": 380,
        "macronutrients": {"protein": "16g", "carbs": "32g", "fats": "22g"},
        "health_score": 8,
        "allergens": ["Gluten", "Egg"]
    }
    
    result = await call_gemini_vision(file, prompt, fallback)
    return result


# --- FEATURE 2: Calorie-Matcher Workout Generator ---
@app.post("/api/fitness/burn-workout")
async def generate_burn_workout(file: UploadFile = File(...)):
    validate_image(file)
    
    prompt = """
    Analyze the meal in this image. Estimate its calories, and then design a tailored, high-intensity home workout routine (no equipment required) specifically structured to burn off roughly that amount of calories.
    You MUST reply using ONLY a strict JSON payload matching this exact format:
    {
      "detected_meal": "Meal Name",
      "estimated_calories": 500,
      "workout_name": "Calorie Crusher Circuit",
      "duration_minutes": 35,
      "exercises": [
        {"name": "Burpees", "duration_or_reps": "3 sets of 12 reps", "tip": "Explode off the ground"},
        {"name": "Bodyweight Squats", "duration_or_reps": "4 sets of 20 reps", "tip": "Keep your chest upright"}
      ]
    }
    """
    
    fallback = {
        "detected_meal": "Pepperoni Pizza Slice (Simulated)",
        "estimated_calories": 290,
        "workout_name": "Pizza Burner HIIT Circuit",
        "duration_minutes": 25,
        "exercises": [
            {"name": "Jumping Jacks", "duration_or_reps": "5 minutes warm-up", "tip": "Maintain a steady pace"},
            {"name": "Mountain Climbers", "duration_or_reps": "4 sets of 45 seconds", "tip": "Keep your core tight"},
            {"name": "High Knees", "duration_or_reps": "3 sets of 1 minute", "tip": "Drive knees up to hip height"}
        ]
    }
    
    result = await call_gemini_vision(file, prompt, fallback)
    return result


# --- FEATURE 3: Healthy Recipe Transformer ---
@app.post("/api/diet/healthy-swap")
async def upgrade_recipe(file: UploadFile = File(...)):
    validate_image(file)
    
    prompt = """
    Identify the meal in this photo. Give us a 'Healthy Swap Alternative'—a clean, lower-calorie, high-protein recipe variation that replicates this exact meal style cleanly.
    You MUST reply using ONLY a strict JSON payload matching this exact format:
    {
      "original_meal": "Meal Name",
      "healthy_swap_name": "Upgraded Clean Alternative Name",
      "calorie_savings": 250,
      "ingredients": ["100g Chicken Breast", "1 cup Spinach"],
      "instructions": ["Step 1 directions...", "Step 2 directions..."]
    }
    """
    
    fallback = {
        "original_meal": "Beef Burger and Fries (Simulated)",
        "healthy_swap_name": "Air-Fried Turkey Burger & Sweet Potato Wedges",
        "calorie_savings": 340,
        "ingredients": [
            "150g Lean Ground Turkey Patty",
            "1 Whole Wheat Bun",
            "1 Medium Sweet Potato (sliced into wedges)",
            "Lettuce, Tomato, and Mustard"
        ],
        "instructions": [
            "Season turkey patty with garlic powder and grill for 5-6 mins per side.",
            "Toss sweet potato wedges in 1 tsp olive oil and air-fry at 200°C for 18 minutes.",
            "Assemble burger on the whole wheat bun with fresh vegetables and enjoy guilt-free."
        ]
    }
    
    result = await call_gemini_vision(file, prompt, fallback)
    return result


@app.get("/")
async def root():
    return {"status": "Image Health Engine Operational", "database_required": False}