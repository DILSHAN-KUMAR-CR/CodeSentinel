import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured.")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000
)

database = client["codesentinel"]

scan_history_collection = database["scan_history"]


def check_database_connection():
    client.admin.command("ping")
    return True