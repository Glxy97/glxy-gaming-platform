#!/bin/bash

# FastAPI Backend Test Script
# Testet die wichtigsten Endpoints

BASE_URL="http://localhost:8000"
API_URL="${BASE_URL}/api"

echo "==================================="
echo "FastAPI Backend API Test"
echo "==================================="
echo ""

# 1. Health Check
echo "1. Health Check..."
curl -X GET "${BASE_URL}/health" | jq '.'
echo ""

# 2. AI Providers List
echo "2. AI Providers..."
curl -X GET "${API_URL}/ai/providers" | jq '.'
echo ""

# 3. Upload PDF (requires PDF file)
if [ -f "test.pdf" ]; then
    echo "3. Upload PDF..."
    UPLOAD_RESPONSE=$(curl -X POST "${API_URL}/forms/upload" \
      -F "file=@test.pdf" \
      -F "title=Test PDF" \
      -F "user_id=test_user_123" \
      -F "auto_analyze=true")

    echo "$UPLOAD_RESPONSE" | jq '.'

    # Extract document ID
    DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.document.id')
    echo "Document ID: $DOC_ID"
    echo ""

    # 4. Get Document Details
    if [ "$DOC_ID" != "null" ]; then
        echo "4. Get Document Details..."
        curl -X GET "${API_URL}/forms/${DOC_ID}" | jq '.'
        echo ""

        # 5. Analyze PDF
        echo "5. Analyze PDF..."
        curl -X POST "${API_URL}/forms/${DOC_ID}/analyze" \
          -H "Content-Type: application/json" \
          -d '{
            "async_mode": false,
            "use_ocr": false,
            "use_ai": false
          }' | jq '.'
        echo ""

        # 6. Get Fields
        echo "6. Get Extracted Fields..."
        curl -X GET "${API_URL}/forms/${DOC_ID}/fields" | jq '.'
        echo ""
    fi
else
    echo "3. Skipping upload (test.pdf not found)"
    echo ""
fi

# 7. AI Suggestions Test
echo "7. AI Label Suggestions..."
curl -X POST "${API_URL}/ai/suggest-labels" \
  -H "Content-Type: application/json" \
  -d '{
    "field_names": [
      "form_first_name",
      "form_email_address",
      "form_plz",
      "form_iban"
    ]
  }' | jq '.'
echo ""

# 8. List Documents
echo "8. List All Documents..."
curl -X GET "${API_URL}/forms/?skip=0&limit=10" | jq '.'
echo ""

echo "==================================="
echo "Tests completed!"
echo "==================================="
