# Kraft

FastAPI backend + basic HTML/CSS/JS frontend. Extracts keywords from `.txt`, `.pdf`, `.docx`, `.doc`, `.pptx` using YAKE. Filter bubbles from the UI feed directly into the filtering system.

---

## Project Structure

```
.
├── app.py              # FastAPI server (patched for UI filter list)
├── DockerFile          # Container build
├── requirements.txt
├── index.html          # UI: upload + results + theme toggle + filter bubbles
├── style.css           # Dark (tech) / Light (editorial) palettes
├── app.js              # Fetch, bubble tags, theme switch
└── README.md           # This file
```

---
## Quick Commands Reference

| Task | Command |
|---|---|
| Build | `docker build -t kraft .` |
| Start | `docker run -d --name kraft -p 8000:8000 kraft` |
| Start server | `python3 -m http.server 3000` |
| Status | `docker ps` |
| Logs | `docker logs kraft` |
| Stop (end of day) | `docker stop kraft` |
| Remove | `docker rm kraft` |
| Restart same | `docker start kraft` |

---

## Initializing Docker (First Time / After Changes)

```bash
# 1. Build image (run from project root)
docker build -t kraft .

# 2. Confirm image exists
docker images | grep kraft

# 3. Clean up old containers (optional)
docker rm -f kraft 2>/dev/null; echo "cleaned"
```

---

## Running Docker (Day-to-Day / End of Day)

```bash
# Start container (port 8000 mapped to host)
docker run -d --name kraft -p 8000:8000 kraft

# start server 
python3 -m http.server 3000 

# web page
localhost:3000

# Check it is running
docker ps

# View logs (live)
docker logs -f kraft

# Stop at end of day
docker stop kraft

# Remove after stop (clean slate)
docker rm kraft
```

---

## Accessing the App

- **API docs:** http://localhost:8000/docs
- **UI:** open `index.html` in browser (or serve with `python -m http.server 8080`)
- The UI posts to `http://localhost:8000/extract-keywords` using `FormData` (file + `unwanted_words_json`).

---

## Filter Bubbles (UI Feature)

In the UI:
1. Type a keyword to exclude (e.g., `chapter`).
2. Hit **Enter** — it becomes a visual bubble tag.
3. Upload a document and submit.
4. The bubbles are sent as JSON to `unwanted_words_json`; the backend filters them from results.

> Note: persistence (documents staying in system between restarts) requires backend storage; currently backend uses temporary files cleaned after each request. Bubble filter is session-level per request.

---

## Requirements

- Docker installed and running
- Browser with JavaScript enabled (for UI bubbles + theme toggle)
