"""PDF processing utilities with PyMuPDF and OCR support."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

import fitz  # PyMuPDF
from PIL import Image
import pytesseract

from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas import FormFieldCreate

logger = get_logger(__name__)


class PDFAnalysisService:
    """Extract structural information and form fields from PDFs."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.ocr_enabled = settings.ocr_enabled
        self.ocr_language = settings.ocr_language
        self.pdf_dpi = settings.pdf_dpi

    def compute_checksum(self, pdf_path: Path) -> str:
        """Compute SHA256 checksum of PDF file."""
        digest = hashlib.sha256()
        with pdf_path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def get_pdf_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract basic PDF metadata."""
        try:
            doc = fitz.open(pdf_path)
            metadata = {
                "page_count": len(doc),
                "file_size": pdf_path.stat().st_size,
                "pdf_version": doc.metadata.get("format", ""),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creator": doc.metadata.get("creator", ""),
                "producer": doc.metadata.get("producer", ""),
            }
            doc.close()
            return metadata
        except Exception as e:
            logger.error(f"Error extracting PDF metadata: {e}", pdf_path=str(pdf_path))
            return {"page_count": 0, "file_size": pdf_path.stat().st_size}

    def extract_form_fields(self, pdf_path: Path) -> List[FormFieldCreate]:
        """Extract interactive form fields from PDF using PyMuPDF."""
        fields: List[FormFieldCreate] = []

        try:
            doc = fitz.open(pdf_path)

            for page_num in range(len(doc)):
                page = doc[page_num]
                widgets = page.widgets()

                if not widgets:
                    logger.debug(f"No form widgets found on page {page_num + 1}")
                    continue

                # Get page dimensions for normalization
                page_rect = page.rect
                page_width = page_rect.width
                page_height = page_rect.height

                for widget in widgets:
                    try:
                        # Extract widget properties
                        field_name = widget.field_name or f"field_{page_num}_{widget.xref}"
                        field_type = self._map_field_type(widget.field_type)
                        field_rect = widget.rect

                        # Normalize coordinates (0-1 range)
                        x = field_rect.x0 / page_width if page_width > 0 else 0
                        y = field_rect.y0 / page_height if page_height > 0 else 0
                        width = (field_rect.x1 - field_rect.x0) / page_width if page_width > 0 else 0
                        height = (field_rect.y1 - field_rect.y0) / page_height if page_height > 0 else 0

                        # Extract additional properties
                        field_value = widget.field_value or ""
                        field_flags = widget.field_flags or 0
                        is_required = bool(field_flags & 2)  # Required flag

                        # Create field schema
                        field = FormFieldCreate(
                            pdf_name=field_name,
                            display_label=self._generate_label(field_name),
                            group_name=self._infer_group(field_name),
                            field_type=field_type,
                            required=is_required,
                            x=x,
                            y=y,
                            width=width,
                            height=height,
                            page_number=page_num + 1,
                        )
                        fields.append(field)

                        logger.debug(
                            f"Extracted field: {field_name}",
                            field_type=field_type,
                            page=page_num + 1,
                            position=(x, y)
                        )

                    except Exception as e:
                        logger.warning(f"Error processing widget: {e}", widget_xref=widget.xref)
                        continue

            doc.close()
            logger.info(f"Extracted {len(fields)} form fields from PDF", pdf_path=str(pdf_path))

        except Exception as e:
            logger.error(f"Error extracting form fields: {e}", pdf_path=str(pdf_path))

        return fields

    def extract_text_fields_via_ocr(self, pdf_path: Path) -> List[FormFieldCreate]:
        """Extract potential text fields using OCR (fallback for non-interactive PDFs)."""
        if not self.ocr_enabled:
            logger.info("OCR is disabled, skipping text extraction")
            return []

        fields: List[FormFieldCreate] = []

        try:
            doc = fitz.open(pdf_path)

            for page_num in range(len(doc)):
                page = doc[page_num]

                # Render page to image
                mat = fitz.Matrix(self.pdf_dpi / 72, self.pdf_dpi / 72)
                pix = page.get_pixmap(matrix=mat)

                # Convert to PIL Image
                img_data = pix.tobytes("ppm")
                img = Image.frombytes("RGB", (pix.width, pix.height), img_data)

                # Perform OCR with bounding box data
                ocr_data = pytesseract.image_to_data(
                    img,
                    lang=self.ocr_language,
                    output_type=pytesseract.Output.DICT
                )

                # Extract potential field labels and positions
                page_rect = page.rect
                page_width = page_rect.width
                page_height = page_rect.height

                for i, text in enumerate(ocr_data['text']):
                    confidence = int(ocr_data['conf'][i])

                    # Filter low-confidence results
                    if confidence < 60 or not text.strip():
                        continue

                    # Check if text looks like a field label (ends with :, *, etc.)
                    if self._is_field_label(text):
                        x = ocr_data['left'][i] / (pix.width / page_width) / page_width
                        y = ocr_data['top'][i] / (pix.height / page_height) / page_height
                        width = ocr_data['width'][i] / (pix.width / page_width) / page_width
                        height = ocr_data['height'][i] / (pix.height / page_height) / page_height

                        field = FormFieldCreate(
                            pdf_name=f"ocr_{page_num}_{i}",
                            display_label=text.strip().rstrip(':*'),
                            group_name="OCR Detected",
                            field_type="text",
                            required=text.endswith('*'),
                            x=x,
                            y=y,
                            width=width * 3,  # Estimated input field width
                            height=height,
                            page_number=page_num + 1,
                        )
                        fields.append(field)

                logger.debug(f"OCR extracted {len(fields)} potential fields from page {page_num + 1}")

            doc.close()
            logger.info(f"OCR extracted {len(fields)} total fields from PDF", pdf_path=str(pdf_path))

        except Exception as e:
            logger.error(f"Error during OCR extraction: {e}", pdf_path=str(pdf_path))

        return fields

    def extract_fields(self, pdf_path: Path) -> List[FormFieldCreate]:
        """
        Main extraction method - tries form fields first, falls back to OCR.
        """
        # Try extracting interactive form fields
        form_fields = self.extract_form_fields(pdf_path)

        if form_fields:
            logger.info(f"Using {len(form_fields)} interactive form fields")
            return form_fields

        # Fallback to OCR
        logger.info("No interactive form fields found, using OCR fallback")
        ocr_fields = self.extract_text_fields_via_ocr(pdf_path)

        return ocr_fields

    @staticmethod
    def _map_field_type(fitz_type: int) -> str:
        """Map PyMuPDF field types to our schema."""
        # PyMuPDF field types:
        # 1: Button, 2: Text, 3: Choice (dropdown/listbox), 4: Signature
        mapping = {
            1: "checkbox",
            2: "text",
            3: "select",
            4: "signature",
            5: "text",  # Unknown
            6: "checkbox",  # Radio button
            7: "text",  # Unknown
        }
        return mapping.get(fitz_type, "text")

    @staticmethod
    def _generate_label(field_name: str) -> str:
        """Generate human-readable label from field name."""
        # Remove common prefixes
        label = field_name.replace("form1[0].", "").replace("topmostSubform[0].", "")

        # Replace underscores and camelCase
        label = label.replace("_", " ").replace(".", " ")

        # Split camelCase
        import re
        label = re.sub(r'([a-z])([A-Z])', r'\1 \2', label)

        # Capitalize words
        label = label.title()

        return label.strip()

    @staticmethod
    def _infer_group(field_name: str) -> str:
        """Infer field group from name patterns."""
        name_lower = field_name.lower()

        # Common group patterns
        if any(x in name_lower for x in ['name', 'vorname', 'nachname', 'anrede']):
            return "Persönliche Daten"
        elif any(x in name_lower for x in ['strasse', 'plz', 'ort', 'address', 'adresse']):
            return "Adresse"
        elif any(x in name_lower for x in ['email', 'telefon', 'phone', 'fax']):
            return "Kontaktdaten"
        elif any(x in name_lower for x in ['datum', 'date', 'zeit', 'time']):
            return "Zeitangaben"
        elif any(x in name_lower for x in ['unterschrift', 'signature']):
            return "Unterschrift"
        else:
            return "Allgemein"

    @staticmethod
    def _is_field_label(text: str) -> bool:
        """Check if OCR text looks like a field label."""
        text = text.strip()

        # Check for common patterns
        if text.endswith(':') or text.endswith('*'):
            return True

        # Check for common label keywords (German/English)
        label_keywords = [
            'name', 'vorname', 'nachname', 'strasse', 'plz', 'ort',
            'email', 'telefon', 'datum', 'geburtsdatum', 'unterschrift',
            'first', 'last', 'street', 'city', 'zip', 'postal', 'phone'
        ]

        return any(keyword in text.lower() for keyword in label_keywords)
