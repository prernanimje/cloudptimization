"""Routes for analysis and recommendations"""
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Instance, User
from ..services.optimizer import OptimizerService
from ..schemas import AnalysisResult
from ..utils.security import get_optional_current_user
from ..config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

router = APIRouter()


class AIChatRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    file_data: Optional[str] = None


class AIChatResponse(BaseModel):
    response: str
    source: str = "gemini"


@router.post("/analyze/{instance_id}", response_model=AnalysisResult)
async def analyze_instance(instance_id: int, db: Session = Depends(get_db)):
    """
    Analyze a specific instance and get optimization recommendations
    
    Args:
        instance_id: ID of the instance to analyze
        
    Returns:
        Analysis result with AI-powered recommendations
    """
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    try:
        analysis = OptimizerService.analyze_instance(instance)
        logger.info(f"Analysis complete for instance: {instance.name}")
        return analysis
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.get("/analyze/instance/{instance_name}", response_model=AnalysisResult)
async def analyze_by_name(instance_name: str, db: Session = Depends(get_db)):
    """
    Analyze instance by name
    
    Args:
        instance_name: Name of the instance
        
    Returns:
        Analysis result
    """
    instance = db.query(Instance).filter(Instance.name == instance_name).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    try:
        analysis = OptimizerService.analyze_instance(instance)
        return analysis
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.post("/recommendations")
async def get_all_recommendations(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommendations for all instances for the current user
    """
    if not current_user:
        return {
            "total_instances": 0,
            "total_potential_savings": 0.0,
            "analyses": []
        }
    
    instances = db.query(Instance).filter(Instance.user_id == current_user.id).all()
    
    if not instances:
        return {
            "total_instances": 0,
            "total_potential_savings": 0.0,
            "analyses": []
        }
    
    try:
        analyses = []
        total_savings = 0
        
        for instance in instances:
            analysis = OptimizerService.analyze_instance(instance)
            analyses.append(analysis)
            total_savings += sum(r.savings for r in analysis.recommendations)
        
        logger.info(
            f"Analyzed {len(instances)} instances for user {current_user.username}. "
            f"Potential savings: ${total_savings:.2f}"
        )
        
        return {
            "total_instances": len(instances),
            "total_potential_savings": round(total_savings, 2),
            "analyses": analyses
        }
        
    except Exception as e:
        logger.error(f"Bulk analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Bulk analysis failed")


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    """
    AI Chatbot endpoint powered by Google Gemini using the secure backend GEMINI_API_KEY
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY in ("your-gemini-api-key-here", ""):
        raise HTTPException(
            status_code=503,
            detail="Gemini API Key is not configured on the backend. Please add GEMINI_API_KEY in your environment."
        )

    context = request.context or {}
    system_prompt = (
        "You are a helpful Real-Time Cloud Optimization AI Assistant and Predictor.\n"
        "You are integrated into a Cloud Cost Dashboard that simulates real-time metrics.\n\n"
        "Current Server Status Context:\n"
        f"- Server Name: {context.get('name', 'Unknown')}\n"
        f"- Environment Region: {context.get('region', 'Unknown')}\n"
        f"- Current CPU Usage: {context.get('cpu_usage', 0)}%\n"
        f"- Current RAM Usage: {context.get('ram_usage', 0)}%\n"
        f"- Current Storage Usage: {context.get('storage_usage', 0)}%\n"
        f"- Monthly Cost Tracking: ${context.get('monthly_cost', 0)}\n"
        f"- Overall Health Status: {context.get('status', 'Unknown')}\n\n"
        "Your Capabilities:\n"
        "1. Rightsizing: Analyze CPU/RAM trends to downsize overprovisioned instances.\n"
        "2. Scheduling: Propose stop schedules during non-business hours.\n"
        "3. Spot/Reserved instances: Recommend spot or commitment plans for cost savings.\n"
        "4. Storage cleanup: Recommend deleting unattached EBS volumes or snapshots.\n"
    )

    if request.file_data:
        system_prompt += f"\nAttached File Content:\n{request.file_data[:3000]}\n"

    full_prompt = f"{system_prompt}\nUser Question: {request.prompt}"

    models_to_try = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest"
    ]

    last_error = ""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {
                        "parts": [{"text": full_prompt}]
                    }
                ]
            }
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return AIChatResponse(response=parts[0]["text"], source=model)
                else:
                    last_error = f"{model}: HTTP {resp.status_code} - {resp.text[:150]}"
                    logger.warning(f"Gemini {model} returned HTTP {resp.status_code}")
            except Exception as e:
                last_error = f"{model} error: {str(e)}"
                logger.warning(f"Gemini {model} call error: {e}")

    logger.error(f"All Gemini models failed: {last_error}")
    raise HTTPException(status_code=502, detail=f"Gemini AI service unavailable: {last_error}")
