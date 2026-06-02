import os
import json
from typing import Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class AIEngine:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    def generate_insight(self, reading_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes a flat sensor reading using Groq AI.
        Determines the sector (Plant, Poultry, Pond) based on the device name.
        """
        device = reading_data.get('device', 'unknown')
        
        prompt = f"""
        You are an expert Agronomist and IoT specialist. Analyze the following sensor data from a farm device named "{device}".
        
        Sensor Data:
        - Temperature: {reading_data.get('temperature')}°C
        - Humidity: {reading_data.get('humidity')}%
        - Soil Moisture: {reading_data.get('soil_moisture')}%
        - Light Intensity (Lux): {reading_data.get('lux')}
        - UV Index: {reading_data.get('uvi')} ({reading_data.get('uv_status')})
        - Soil Status: {reading_data.get('soil_status')}
        
        Context: The device "{device}" is part of an integrated farm system (Plant, Poultry, or Pond). 
        Identify the likely sector based on the device name and data, and provide professional advice.
        
        Provide your response in strictly JSON format with the following keys:
        - category: (e.g., "Irrigation", "Ventilation", "Light Management", "Health Alert")
        - priority: ("Low", "Medium", "High")
        - recommendation: (A concise, actionable advice based on the data)
        - sector_identified: (The sector you identified: "Plant", "Poultry", or "Pond")
        - sector_breakdown: (A dictionary where keys are metrics like "temperature", "humidity", etc., and values are short status comments like "Optimal", "Too high", etc.)
        
        JSON Response:
        """
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a smart agriculture assistant. You always respond in valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(chat_completion.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"Groq API Error: {e}")
            return {
                "category": "System",
                "priority": "Low",
                "recommendation": "Data analyzed. AI insights temporarily unavailable.",
                "sector_identified": "Unknown"
            }
