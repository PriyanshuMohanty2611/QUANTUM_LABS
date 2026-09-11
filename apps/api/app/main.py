import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_v1_router

app = FastAPI(
    title="Quantum Lab Engine API",
    description="AI-powered interactive quantum computing engine and simulation backend.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS origins safely (Fix #19)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)

@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "online",
        "service": "quantum-lab-api",
        "version": "0.1.0",
        "backend": "qiskit-aer"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
