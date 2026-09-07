# CodeSentinel

CodeSentinel is an AI-assisted code security scanner with a FastAPI backend and React frontend.

## Features

- Hardcoded credential detection
- API key and secret detection
- SQL injection pattern detection
- Dangerous Python function detection
- Weak authentication pattern detection
- Security score
- AI-style vulnerability explanations
- JSON API
- React dashboard
- Automated tests

## Run

### Backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## API

POST `/scan`

```json
{
  "code": "password = \"admin123\"\nquery = \"SELECT * FROM users WHERE id=\" + user_id"
}
```

GET `/health`

## Tests

```powershell
cd backend
pytest
```
