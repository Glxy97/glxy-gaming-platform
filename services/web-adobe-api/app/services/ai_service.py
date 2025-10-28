"""AI-assisted field labeling and suggestions."""

from __future__ import annotations

import json
from typing import List, Dict, Any, Optional

import httpx

from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas import FormFieldCreate, FormFieldUpdate

logger = get_logger(__name__)


class AIService:
    """Produce heuristic/AI suggestions for field metadata."""

    def __init__(self, settings: Settings) -> None:
        self.enabled = bool(settings.ai_provider and settings.ai_api_key)
        self.provider = settings.ai_provider
        self.api_key = settings.ai_api_key
        self.model = settings.ai_model

        logger.info(
            "AI Service initialized",
            enabled=self.enabled,
            provider=self.provider or "heuristic"
        )

    async def suggest_labels(self, fields: List[FormFieldCreate]) -> List[FormFieldUpdate]:
        """Generate label suggestions for PDF fields."""
        if not self.enabled:
            return self._heuristic_suggestions(fields)

        try:
            if self.provider == "openai":
                return await self._openai_suggestions(fields)
            elif self.provider == "anthropic":
                return await self._anthropic_suggestions(fields)
            elif self.provider == "gemini":
                return await self._gemini_suggestions(fields)
            else:
                logger.warning(f"Unknown AI provider: {self.provider}, using heuristic")
                return self._heuristic_suggestions(fields)

        except Exception as e:
            logger.error(f"AI suggestion error: {e}, falling back to heuristic")
            return self._heuristic_suggestions(fields)

    def _heuristic_suggestions(self, fields: List[FormFieldCreate]) -> List[FormFieldUpdate]:
        """Fallback heuristic-based suggestions."""
        suggestions: List[FormFieldUpdate] = []

        for field in fields:
            # Use existing label or generate from field name
            label = field.display_label or self._humanize_field_name(field.pdf_name)
            group = field.group_name or self._infer_group_heuristic(field.pdf_name)

            # Infer validation patterns
            validation = self._infer_validation(field.pdf_name, field.field_type)

            suggestions.append(
                FormFieldUpdate(
                    display_label=label,
                    group_name=group,
                    validation_pattern=validation,
                )
            )

        return suggestions

    async def _openai_suggestions(self, fields: List[FormFieldCreate]) -> List[FormFieldUpdate]:
        """Get suggestions from OpenAI API."""
        field_data = [{"name": f.pdf_name, "type": f.field_type} for f in fields]

        prompt = f"""Analyze these PDF form fields and suggest user-friendly labels and groupings.
Return JSON array with objects containing: displayLabel (German), groupName (German), validationPattern (regex if applicable).

Fields: {json.dumps(field_data, ensure_ascii=False)}

Example response:
[
  {{"displayLabel": "Vorname", "groupName": "Persönliche Daten", "validationPattern": null}},
  {{"displayLabel": "E-Mail", "groupName": "Kontaktdaten", "validationPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{{2,}}$"}}
]
"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model or "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that analyzes PDF forms."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                },
                timeout=30.0
            )
            response.raise_for_status()

            result = response.json()
            suggestions_data = json.loads(result["choices"][0]["message"]["content"])

            return [
                FormFieldUpdate(
                    display_label=s.get("displayLabel"),
                    group_name=s.get("groupName"),
                    validation_pattern=s.get("validationPattern")
                )
                for s in suggestions_data
            ]

    async def _anthropic_suggestions(self, fields: List[FormFieldCreate]) -> List[FormFieldUpdate]:
        """Get suggestions from Anthropic Claude API."""
        field_data = [{"name": f.pdf_name, "type": f.field_type} for f in fields]

        prompt = f"""Analyze these PDF form fields and suggest user-friendly labels and groupings in German.
Return only valid JSON array.

Fields: {json.dumps(field_data, ensure_ascii=False)}

Format:
[
  {{"displayLabel": "Vorname", "groupName": "Persönliche Daten", "validationPattern": null}},
  {{"displayLabel": "E-Mail", "groupName": "Kontaktdaten", "validationPattern": "email_pattern"}}
]
"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model or "claude-3-sonnet-20240229",
                    "max_tokens": 2048,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                },
                timeout=30.0
            )
            response.raise_for_status()

            result = response.json()
            suggestions_data = json.loads(result["content"][0]["text"])

            return [
                FormFieldUpdate(
                    display_label=s.get("displayLabel"),
                    group_name=s.get("groupName"),
                    validation_pattern=s.get("validationPattern")
                )
                for s in suggestions_data
            ]

    async def _gemini_suggestions(self, fields: List[FormFieldCreate]) -> List[FormFieldUpdate]:
        """Get suggestions from Google Gemini API."""
        field_data = [{"name": f.pdf_name, "type": f.field_type} for f in fields]

        prompt = f"""Analyze these PDF form fields and suggest German labels and groupings.
Return JSON array only.

Fields: {json.dumps(field_data, ensure_ascii=False)}
"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model or 'gemini-pro'}:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key
                },
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3}
                },
                timeout=30.0
            )
            response.raise_for_status()

            result = response.json()
            text_response = result["candidates"][0]["content"]["parts"][0]["text"]

            # Extract JSON from markdown code blocks if present
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0].strip()

            suggestions_data = json.loads(text_response)

            return [
                FormFieldUpdate(
                    display_label=s.get("displayLabel"),
                    group_name=s.get("groupName"),
                    validation_pattern=s.get("validationPattern")
                )
                for s in suggestions_data
            ]

    @staticmethod
    def _humanize_field_name(field_name: str) -> str:
        """Convert field name to human-readable label."""
        # Remove common prefixes
        label = field_name.replace("form1[0].", "").replace("topmostSubform[0].", "")
        label = label.replace("_", " ").replace(".", " ")

        # Split camelCase
        import re
        label = re.sub(r'([a-z])([A-Z])', r'\1 \2', label)

        # Capitalize
        return label.title().strip()

    @staticmethod
    def _infer_group_heuristic(field_name: str) -> str:
        """Infer field group from name."""
        name_lower = field_name.lower()

        patterns = {
            "Persönliche Daten": ['name', 'vorname', 'nachname', 'anrede', 'titel', 'geburtsdatum', 'birth'],
            "Adresse": ['strasse', 'plz', 'ort', 'stadt', 'address', 'adresse', 'street', 'city', 'zip'],
            "Kontaktdaten": ['email', 'mail', 'telefon', 'phone', 'fax', 'mobil', 'mobile'],
            "Zeitangaben": ['datum', 'date', 'zeit', 'time', 'von', 'bis', 'from', 'until'],
            "Unterschrift": ['unterschrift', 'signature', 'sign'],
            "Bankdaten": ['iban', 'bic', 'bank', 'konto', 'account'],
            "Versicherung": ['versicherung', 'insurance', 'police', 'vertrag'],
        }

        for group, keywords in patterns.items():
            if any(keyword in name_lower for keyword in keywords):
                return group

        return "Allgemein"

    @staticmethod
    def _infer_validation(field_name: str, field_type: str) -> Optional[str]:
        """Infer validation pattern from field name and type."""
        name_lower = field_name.lower()

        # Email validation
        if any(x in name_lower for x in ['email', 'mail', 'e-mail']):
            return r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        # Phone validation (German format)
        if any(x in name_lower for x in ['telefon', 'phone', 'tel', 'fax', 'mobil']):
            return r'^[\d\s\-\+\(\)\/]+$'

        # PLZ validation (German postal code)
        if any(x in name_lower for x in ['plz', 'postleitzahl', 'postal']):
            return r'^\d{5}$'

        # IBAN validation
        if 'iban' in name_lower:
            return r'^[A-Z]{2}\d{2}[A-Z\d]{1,30}$'

        # Date validation (DD.MM.YYYY or YYYY-MM-DD)
        if any(x in name_lower for x in ['datum', 'date', 'geburtsdatum']):
            return r'^(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})$'

        return None
