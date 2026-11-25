import json
from pathlib import Path

import asyncio
import edge_tts

import hashlib

project_folder = Path(__file__).resolve().parent

dialogue_path = project_folder / "Dialogue" / "en.json"

with open(dialogue_path, "r", encoding="utf-8") as file:
    dialogue = json.load(file)

for key, message in dialogue.items():
    print(f"{key}: {message}")

voice = "en-GB-RyanNeural"

title_rate = "-25%"
title_pitch = "-5Hz"

audio_folder = project_folder / "Audio" / "en"
audio_folder.mkdir(parents=True, exist_ok=True)

manifest_path = project_folder / "Audio" / "audio_manifest.json"

if manifest_path.exists():
    with open(manifest_path, "r", encoding="utf-8") as file:
        manifest = json.load(file)
else:
    manifest = {}

async def generate_audio(message, filename, rate, pitch):
    output_path = audio_folder / filename

    communicate = edge_tts.Communicate(
        message,
        voice,
        rate=rate,
        pitch=pitch
    )

    await communicate.save(str(output_path))

    print(f"Generated: {filename}")


for key, message in dialogue.items():
    filename = f"{key}.mp3"

    if key == "title":
        rate = title_rate
        pitch = title_pitch
        fingerprint_data = voice + message + rate + pitch
    else:
        rate = "+0%"
        pitch = "+0Hz"
        fingerprint_data = voice + message

    fingerprint = hashlib.sha256(
        fingerprint_data.encode("utf-8")
    ).hexdigest()

    saved_fingerprint = manifest.get(key)

    if fingerprint == saved_fingerprint and (audio_folder / filename).exists():
        print(f"Skipped: {filename}")
    else:
        asyncio.run(generate_audio(message, filename, rate, pitch))
        manifest[key] = fingerprint

with open(manifest_path, "w", encoding="utf-8") as file:
    json.dump(manifest, file, indent=4)