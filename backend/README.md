# AI Research Paper Assistant - Backend

FastAPI RAG backend using PyMuPDF, ChromaDB, and Google Gemini models.

## Setup & Running

1. **Ensure Virtual Environment is Active**:
   ```powershell
   ..\.venv\Scripts\Activate.ps1
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your `GEMINI_API_KEY`:
   ```powershell
   cp .env.example .env
   ```

3. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Start the FastAPI Server**:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **API Documentation**:
   - Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
