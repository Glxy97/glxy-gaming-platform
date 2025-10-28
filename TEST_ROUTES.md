# API Routes Testing

## Created Routes

### 1. `/api/profile` (Already Existed)
- GET: Returns user profile data
- Auth: NextAuth session required
- Returns: User object without password

### 2. `/api/web-adobe/upload` (NEW)
- POST: Upload PDF file
- GET: API documentation
- Auth: NextAuth session required
- Accepts: multipart/form-data
- Max Size: 10MB
- Creates: PdfDocument in database

### 3. `/api/web-adobe/datapad/health` (NEW)
- GET: Health check for DataPad integration
- Auth: NextAuth session required
- Returns: Health status, database connectivity, field mappings

### 4. `/api/web-adobe/ai/status` (NEW)
- GET: AI service status and capabilities
- Auth: NextAuth session required
- Returns: AI provider status, capabilities, models, limits

## Test Commands

### Test Profile (curl)
```bash
curl -X GET http://localhost:3001/api/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Test Upload Info
```bash
curl -X GET http://localhost:3001/api/web-adobe/upload
```

### Test DataPad Health
```bash
curl -X GET http://localhost:3001/api/web-adobe/datapad/health
```

### Test AI Status
```bash
curl -X GET http://localhost:3001/api/web-adobe/ai/status
```

## Expected Results

All routes return:
- 401 if not authenticated
- 200 with JSON data if authenticated
- Proper error handling with try/catch blocks

## Security Features

- NextAuth session validation
- Input validation
- Error messages don't leak sensitive info
- Password excluded from profile responses
