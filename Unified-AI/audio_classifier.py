import whisper
import os

whisper_model = None

def load_audio_model():
    global whisper_model
    print("Loading Whisper 'base.en' model...")
    whisper_model = whisper.load_model("base.en")

def transcribe_audio(audio_path: str):
    if not audio_path or not os.path.exists(audio_path):
        return None
    
    try:
        print(f"Transcribing audio...")
        result = whisper_model.transcribe(audio_path, fp16=False)
        return result["text"].strip()
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None
