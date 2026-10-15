# Kraft

Flask backend + HTML/CSS/JS frontend. Extracts keywords from `.txt`, `.pdf`, `.docx`, `.doc`, `.pptx` using YAKE. Filter bubbles from the UI feed into the filtering system. Scores shown as % with relevance legend; repeated PPTX header words cleaned automatically.

---

## Project Structure

```
.
├── app.py              # Flask server
├── Dockerfile
├── requirements.txt
├── index.html          # UI: upload + results + theme toggle + filter bubbles + file icon preview
├── style.css           # Dark (tech) / Light (editorial) palettes
├── app.js              # Fetch (configurable API_URL), bubbles, theme, drag/drop, cleanKeyword
└── README.md           # This file
```

---

## Quick Commands Reference

| Task | Command |
|---|---|
| Build | `docker build -t kraft .` |
| Start (Docker) | `docker run -d --name kraft -p 8000:8000 kraft` |
| Start (local) | `pip install -r requirements.txt && python app.py` |
| Status | `docker ps` |
| Logs | `docker logs kraft` |
| Stop (end of day) | `docker stop kraft` |
| Remove | `docker rm kraft` |
| Restart same | `docker start kraft` |

---

## Running (Local)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start server
python app.py
# → http://localhost:8000

# 3. Open UI (serve static files)
python -m http.server 8080
# Then open http://localhost:8080/index.html in browser
```

---

## Running (Docker)

```bash
# Build
 docker build -t kraft .

# Start
 docker rm -f kraft 2>/dev/null; docker run -d --name kraft -p 8000:8000 kraft

# View logs
docker logs -f kraft

# Stop / remove
docker stop kraft; docker rm kraft
```

---

## Features

- **Drag & drop** file upload with visual file icon + filename preview.
- **Click to open** file picker (works on mobile / desktop).
- **Clear previous results** when a new file is uploaded.
- **Score %** shown with `*` and bottom legend explaining relevance.
- **Filter bubbles** (type keyword + Enter) feed `unwanted_words_json` to backend.
- **CleanKeyword** removes repetitive PPTX header patterns (e.g., "Modelling STATISTICAL MODELLING" → "Modelling STATISTICAL").

---

## Accessing the App

- **API endpoint:** `POST http://localhost:8000/extract-keywords` (FormData: `file`, `unwanted_words_json`)
- **UI:** open `index.html` in browser, or serve with `python -m http.server 8080`
- The UI posts to the endpoint using `FormData`; `app.js` uses `API_URL = window.API_URL || 'http://localhost:8000/extract-keywords'` for easy deployment.

---

## Filter Bubbles (UI Feature)

In the UI:
1. Type a keyword to exclude (e.g., `chapter`).
2. Hit **Enter** — it becomes a visual bubble tag.
3. Upload a document and submit.
4. The bubbles are sent as JSON to `unwanted_words_json`; the backend filters them from results.

> Note: persistence (documents staying between restarts) requires backend storage; currently backend uses temporary files cleaned after each request. Bubble filter is session-level per request.

---

## PythonAnywhere / Cloud Deployment Notes

For PythonAnywhere (WSGI):
- Source code: `/home/ravijaanthony/Kraft/`
- WSGI file (`/var/www/..._wsgi.py`):
```python
import sys
sys.path.insert(0, '/home/ravijaanthony/Kraft')
from app import app as application
```
- Set static files URL `/` → `/home/ravijaanthony/Kraft/` if serving UI from root.

For Cloudflare Tunnel (no code change): use `cloudflared tunnel` to expose local `localhost:8000`.

---

## Requirements

- Python 3.9+
- Docker (optional, for container)
- Browser with JavaScript enabled (bubbles + theme toggle)
