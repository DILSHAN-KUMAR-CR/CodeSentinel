from flask import request

password = "admin123"

def calculate():
    expression = request.args.get("expression")
    return eval(expression)