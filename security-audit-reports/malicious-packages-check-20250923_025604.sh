#!/bin/bash

# Known malicious package patterns (examples)
MALICIOUS_PATTERNS=(
    "event-stream@3.3.6"
    "eslint-scope@3.7.2"
    "flatmap-stream"
    "getcookies"
    "http-fetch-cookies"
)

echo "Checking for known malicious packages..."
for pattern in "${MALICIOUS_PATTERNS[@]}"; do
    if npm list "$pattern" 2>/dev/null; then
        echo "⚠️  CRITICAL: Potential malicious package detected: $pattern"
    fi
done
