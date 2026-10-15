import os
from pathlib import Path
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import yake
from pypdf import PdfReader
import docx
from pptx import Presentation

app = FastAPI(title="Document Keyword Extraction API", version="1.0")

# Enable CORS (so frontend apps or external clients can talk to it)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_file(file_path: str) -> str:
    """Detects file extension and extracts text accordingly."""
    ext = Path(file_path).suffix.lower()
    text = ""
    
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
            
    elif ext == ".pdf":
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
                
    elif ext in [".docx", ".doc"]:
        doc = docx.Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    paragraphs.append(cell.text)
        text = "\n".join(paragraphs)
        
    elif ext == ".pptx":
        prs = Presentation(file_path)
        slide_texts = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        slide_texts.append(paragraph.text)
        text = "\n".join(slide_texts)
        
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    return text

import json

@app.post("/extract-keywords")
async def extract_keywords_api(file: UploadFile = File(...), unwanted_words_json: str = Form(default="[]")):
    supported_extensions = ['.txt', '.pdf', '.docx', '.doc', '.pptx']
    ext = Path(file.filename).suffix.lower()
    
    if ext not in supported_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")
    
    # Build filter list from UI bubbles + hardcoded defaults
    try:
        extra_unwanted = json.loads(unwanted_words_json)
        if isinstance(extra_unwanted, list):
            unwanted_words = [
                'chapter', 'summary', 'overview', 'slep', 'contents',
                'introduction', 'conclusion', 'declaration', 'acknowledgement'
            ] + [str(w).lower() for w in extra_unwanted]
        else:
            unwanted_words = [
                'chapter', 'summary', 'overview', 'slep', 'contents',
                'introduction', 'conclusion', 'declaration', 'acknowledgement'
            ]
    except Exception:
        unwanted_words = [
            'chapter', 'summary', 'overview', 'slep', 'contents',
            'introduction', 'conclusion', 'declaration', 'acknowledgement'
        ]
    
    # Save the uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
        
    try:
        # Extract text
        document_text = extract_text_from_file(temp_file_path)
        
        if not document_text.strip():
            return {"filename": file.filename, "keywords": [], "message": "Document is empty or text could not be extracted."}
        
        # Configure YAKE
        custom_kw_extractor = yake.KeywordExtractor(
            lan="en",
            n=3,
            dedupLim=0.9,
            top=20  # Extract top 20 to allow room for filtering
        )
        
        # unwanted_words already set from form input above
        
        raw_keywords = custom_kw_extractor.extract_keywords(document_text)
        
        # Filter results
        filtered_keywords = []
        for kw, score in raw_keywords:
            if not any(unwanted in kw.lower() for unwanted in unwanted_words):
                filtered_keywords.append({"keyword": kw, "score": round(float(score), 4)})
                
        filtered_keywords = filtered_keywords[:10]
        
        return {
            "filename": file.filename,
            "keywords": filtered_keywords
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up the temporary file from disk
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
