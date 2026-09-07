import os
import sqlite3

password = os.environ.get("APP_PASSWORD")
api_key = os.environ.get("API_KEY")

def login(user_id, connection):
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return cursor.fetchone()
