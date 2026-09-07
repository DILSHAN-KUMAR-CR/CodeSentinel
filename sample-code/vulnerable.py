import sqlite3

password = "admin123"
api_key = "sk_test_123456789"

def login(user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    result = eval(user_id)
    return result

if password == "123456":
    print("login")
