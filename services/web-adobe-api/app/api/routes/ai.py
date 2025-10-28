"""Routes for AI-assisted field labeling."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_ai_service, get_settings
from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.form import (
    AISuggestionRequest,
    AISuggestionResponse,
    FormFieldCreate,
    FormFieldUpdate,
)
from app.services.ai_service import AIService

logger = get_logger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/suggest-labels", response_model=AISuggestionResponse)
async def suggest_field_labels(
    request: AISuggestionRequest,
    ai_service: AIService = Depends(get_ai_service),
    settings: Settings = Depends(get_settings),
) -> AISuggestionResponse:
    """
    Generate AI-powered label suggestions for PDF field names.

    Supports multiple AI providers:
    - OpenAI (GPT-4)
    - Anthropic (Claude)
    - Google (Gemini)
    - Fallback: Heuristic-based suggestions

    Request body:
    - field_names: List of field names to analyze
    - provider: Optional AI provider override
    """
    if not request.field_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No field names provided"
        )

    logger.info(
        f"AI suggestion request",
        field_count=len(request.field_names),
        provider=request.provider or settings.ai_provider or "heuristic"
    )

    # Temporarily override provider if requested
    if request.provider:
        original_provider = ai_service.provider
        ai_service.provider = request.provider
        ai_service.enabled = bool(ai_service.api_key)

    try:
        # Convert field names to FormFieldCreate objects
        fields = [
            FormFieldCreate(
                pdf_name=name,
                field_type="text",  # Default, can be refined later
            )
            for name in request.field_names
        ]

        # Get suggestions
        suggestions = await ai_service.suggest_labels(fields)

        return AISuggestionResponse(
            suggestions=suggestions,
            provider=ai_service.provider or "heuristic"
        )

    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate suggestions: {str(e)}"
        )

    finally:
        # Restore original provider if overridden
        if request.provider:
            ai_service.provider = original_provider


@router.get("/providers", response_model=dict)
def list_ai_providers(
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    List available AI providers and current configuration.
    """
    return {
        "current_provider": settings.ai_provider or "heuristic",
        "ai_enabled": bool(settings.ai_provider and settings.ai_api_key),
        "available_providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                "description": "OpenAI GPT models for high-quality field analysis"
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
                "description": "Anthropic Claude models with strong reasoning capabilities"
            },
            {
                "id": "gemini",
                "name": "Google Gemini",
                "models": ["gemini-pro", "gemini-pro-vision"],
                "description": "Google Gemini models for multimodal analysis"
            },
            {
                "id": "heuristic",
                "name": "Heuristic (Fallback)",
                "models": ["rule-based"],
                "description": "Rule-based field detection without external API"
            }
        ]
    }


@router.post("/validate-config", response_model=dict)
async def validate_ai_configuration(
    ai_service: AIService = Depends(get_ai_service),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Validate current AI configuration.
    Tests API connectivity if provider is configured.
    """
    result = {
        "provider": settings.ai_provider,
        "enabled": ai_service.enabled,
        "api_key_configured": bool(settings.ai_api_key),
        "model": settings.ai_model,
        "valid": False,
        "error": None
    }

    if not ai_service.enabled:
        result["error"] = "AI provider not configured or API key missing"
        return result

    try:
        # Test with a simple field
        test_field = FormFieldCreate(pdf_name="test_name_field", field_type="text")
        suggestions = await ai_service.suggest_labels([test_field])

        if suggestions:
            result["valid"] = True
            result["test_result"] = {
                "input": "test_name_field",
                "suggestion": suggestions[0].model_dump(exclude_unset=True)
            }
        else:
            result["error"] = "No suggestions returned"

    except Exception as e:
        result["error"] = str(e)
        logger.error(f"AI config validation failed: {e}")

    return result
