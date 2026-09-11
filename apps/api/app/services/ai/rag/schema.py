from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.schemas.ai import ChunkRecord, SourceCitation

class SourceMetadata(BaseModel):
    source_id: str
    title: str
    authors: Optional[List[str]] = None
    publication_year: Optional[int] = None
    source_type: Literal["textbook", "quantumlab", "curated_web", "documentation"]
    knowledge_domain: Literal["math_code", "theory_history", "curriculum", "api_docs"]
    authority: Literal["primary", "primary_for_history", "project_curated", "authoritative_docs"]
    description: str

class RetrievalQuery(BaseModel):
    query: str
    category: Optional[str] = "mixed"
    knowledge_domain: Optional[str] = None
    top_k: int = 4
    min_score: float = 0.2
