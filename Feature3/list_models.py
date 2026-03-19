import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../Backend/.env'))

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
    api_key = os.environ.get("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
print(response.json())
