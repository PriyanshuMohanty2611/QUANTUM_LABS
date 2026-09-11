from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import AIChatRequest, AIChatResponse, TTSRequest, TTSResponse
from app.schemas.quantum import QuantumIR, SimulationOptions
from app.services.ai.agent import QuantumLabAgent
from app.services.ai.tts import TTSService

router = APIRouter(prefix="/ai", tags=["ai"])
agent = QuantumLabAgent()
tts_service = TTSService()

@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def ai_chat(request: AIChatRequest):
    """Processes student questions using source-grounded RAG, deterministic tools, and provider abstraction."""
    try:
        return await agent.answer_query(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "AI_AGENT_ERROR", "message": str(e)}
        )

@router.post("/explain", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def ai_explain(request: AIChatRequest):
    """Adaptive explanation endpoint with depth level tuning."""
    return await ai_chat(request)

@router.post("/tts", response_model=TTSResponse, status_code=status.HTTP_200_OK)
def prepare_tts(request: TTSRequest):
    """Converts quantum explanation text into clean, phonetic speech script for TTS."""
    return tts_service.prepare_speech(request)
