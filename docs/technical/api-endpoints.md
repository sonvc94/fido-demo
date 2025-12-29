# API Endpoints - Technical Specification

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-29
- **Author:** Technical Lead
- **Project:** FIDO2 Passkey Authentication Demo

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Passkey Registration Endpoints](#passkey-registration-endpoints)
4. [Passkey Management Endpoints](#passkey-management-endpoints)
5. [WebSocket Endpoints](#websocket-endpoints)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)

---

## API Overview

### Base URL
- **Development:** `http://localhost:8091`
- **Production:** `https://your-domain.com`

### Protocol
- **Transport:** HTTP/1.1
- **Future:** HTTP/2 support

### Data Format
- **Request:** JSON
- **Response:** JSON
- **Encoding:** UTF-8

### Authentication
- **Mechanism:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Expiry:** 24 hours

---

## Authentication Endpoints

### 1. Password Login

Authenticates user with username and password.

**Endpoint:** `POST /auth/password/login`

**Request Body:**
```json
{
  "username": "string (required, 3-50 chars)",
  "password": "string (required, min 6 chars)"
}
```

**Example:**
```bash
curl -X POST http://localhost:8091/auth/password/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "password": "user"
  }'
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "user",
  "display_name": "Default User",
  "has_passkey": false
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Invalid username or password"
}
```

**Implementation Details:**
```python
@app.post("/auth/password/login")
def password_login(request: PasswordRequest, db: Session = Depends(get_db)):
    # 1. Query user by username
    user = db.query(User).filter(User.username == request.username).first()

    # 2. Verify password hash
    if not bcrypt.checkpw(request.password.encode(), user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Generate JWT token
    access_token = create_access_token({"sub": user.username})

    # 4. Return token + user info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "display_name": user.display_name,
        "has_passkey": user.has_passkey
    }
```

---

### 2. Get Current User Info

Get authenticated user's information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -X GET http://localhost:8091/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200 OK):**
```json
{
  "username": "user",
  "display_name": "Default User",
  "has_passkey": true
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Token expired"
}
```

**Implementation Details:**
```python
@app.get("/auth/me")
def get_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify JWT token (from get_current_user dependency)
    # 2. Return user info
    return {
        "username": current_user.username,
        "display_name": current_user.display_name,
        "has_passkey": current_user.has_passkey
    }
```

---

## Passkey Registration Endpoints

### 3. Start Passkey Registration (Direct)

Initiates passkey registration on current device.

**Endpoint:** `POST /auth/register/start`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "string (required, for validation)",
  "display_name": "string (required, 2-50 chars)"
}
```

**Example:**
```bash
curl -X POST http://localhost:8091/auth/register/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "user",
    "display_name": "MacBook Pro Touch ID"
  }'
```

**Success Response (200 OK):**
```json
{
  "challenge": "rfpwe2nmPO1kJeCZzHKCTdzE9mC5pmlUwKq8zHXd0m84...",
  "options": {
    "rp": {
      "name": "FIDO2 Demo"
    },
    "user": {
      "id": "dXNlcg",
      "name": "user",
      "displayName": "Default User"
    },
    "challenge": "rfpwe2nmPO1kJeCZzHKCTdzE9mC5pmlUwKq8zHXd0m84...",
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {
      "userVerification": "preferred"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Token expired"
}
```

**Implementation Details:**
```python
@app.post("/auth/register/start")
def register_start(
    request: RegisterStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify user is authenticated
    # 2. Generate WebAuthn challenge
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name="FIDO2 Demo",
        user_id=current_user.username.encode('utf-8'),
        user_name=current_user.username,
        user_display_name=request.display_name,
        attestation="none",
        authenticator_selection=None,
    )

    # 3. Store challenge (5-minute expiry)
    challenges[bytes_to_base64url(options.challenge)] = {
        "challenge": options.challenge,
        "timestamp": datetime.utcnow().isoformat()
    }

    # 4. Return options to client
    return {
        "challenge": bytes_to_base64url(options.challenge),
        "options": options_dict
    }
```

---

### 4. Finish Passkey Registration (Direct)

Completes passkey registration by storing the credential.

**Endpoint:** `POST /auth/register/finish`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "string (required)",
  "display_name": "string (required)",
  "credential": {
    "id": "string (credential ID)",
    "rawId": "string (same as id)",
    "response": {
      "clientDataJSON": "base64url-encoded",
      "attestationObject": "base64url-encoded"
    },
    "type": "public-key"
  },
  "challenge": "string (from /register/start)"
}
```

**Example:**
```bash
curl -X POST http://localhost:8091/auth/register/finish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "user",
    "display_name": "MacBook Pro Touch ID",
    "credential": {...},
    "challenge": "rfpwe2nm..."
  }'
```

**Success Response (200 OK):**
```json
{
  "message": "Passkey registered successfully!"
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Invalid credential"
}
```

**Implementation Details:**
```python
@app.post("/auth/register/finish")
def register_finish(
    request: CredentialResponse,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify challenge
    challenge = base64url_to_bytes(request.challenge)
    if bytes_to_base64url(challenge) not in challenges:
        raise HTTPException(status_code=400, detail="Invalid challenge")

    # 2. Verify registration
    verification = verify_registration_response(
        credential=request.credential,
        expected_challenge=challenge,
        expected_rp_id=RP_ID,
        expected_origin=origin,
    )

    # 3. Extract public key & credential ID
    credential_id = verification.credential_id
    public_key = verification.public_key
    sign_count = verification.sign_count

    # 4. Store in database
    passkey = Passkey(
        user_id=current_user.id,
        credential_id=credential_id,
        public_key=bytes_to_base64url(public_key),
        sign_count=sign_count,
        aaguid=str(verification.aaguid),
        created_at=datetime.utcnow()
    )
    db.add(passkey)

    # 5. Update user
    current_user.has_passkey = True
    db.commit()

    return {"message": "Passkey registered successfully!"}
```

---

### 5. Start QR Code Registration

Initiates cross-device passkey registration via QR code.

**Endpoint:** `POST /auth/register/qr/start`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "string (required)",
  "display_name": "string (required)"
}
```

**Example:**
```bash
curl -X POST http://localhost:8091/auth/register/qr/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "user",
    "display_name": "iPhone 14 Pro Face ID"
  }'
```

**Success Response (200 OK):**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "session_id": "abc-123-def-456",
  "expires_in": 300
}
```

**Implementation Details:**
```python
@app.post("/auth/register/qr/start")
def register_qr_start(
    request: RegisterStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Generate unique session ID
    session_id = str(uuid.uuid4())

    # 2. Create registration session
    pending_registrations[session_id] = {
        "username": current_user.username,
        "display_name": request.display_name,
        "created_at": datetime.utcnow(),
        "status": "waiting",
        "challenge": None
    }

    # 3. Generate QR code URL
    registration_url = f"{BASE_URL}/mobile/register/{session_id}"

    # 4. Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(registration_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # 5. Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

    # 6. Return QR code
    return {
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "session_id": session_id,
        "expires_in": 300
    }
```

---

### 6. Get QR Code Registration Status

Check status of QR code registration session.

**Endpoint:** `GET /auth/register/qr/{session_id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -X GET http://localhost:8091/auth/register/qr/abc-123-def-456 \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**
```json
{
  "session_id": "abc-123-def-456",
  "status": "waiting",
  "created_at": "2025-12-29T10:00:00Z"
}
```

**Or (Completed):**
```json
{
  "session_id": "abc-123-def-456",
  "status": "completed",
  "created_at": "2025-12-29T10:00:00Z",
  "completed_at": "2025-12-29T10:01:30Z"
}
```

---

### 7. Mobile Registration Start (Called by Mobile Device)

Mobile device calls this to get WebAuthn challenge.

**Endpoint:** `POST /api/mobile/register/start/{session_id}`

**Request Body:** Empty

**Example:**
```bash
curl -X POST http://localhost:8091/api/mobile/register/start/abc-123-def-456
```

**Success Response (200 OK):**
```json
{
  "challenge": "rfpwe2nm...",
  "options": {
    "rp": {"name": "FIDO2 Demo"},
    "user": {...},
    "challenge": "rfpwe2nm...",
    "pubKeyCredParams": [...],
    "timeout": 60000
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Session not found or expired"
}
```

---

### 8. Mobile Registration Finish (Called by Mobile Device)

Mobile device completes registration.

**Endpoint:** `POST /api/mobile/register/finish/{session_id}`

**Request Body:**
```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "credential-id",
    "response": {
      "clientDataJSON": "base64url",
      "attestationObject": "base64url"
    },
    "type": "public-key"
  }
}
```

**Success Response (200 OK):**
```json
{
  "message": "Registration successful",
  "username": "user"
}
```

**Implementation Details:**
```python
@app.post("/api/mobile/register/finish/{session_id}")
async def mobile_register_finish(
    session_id: str,
    credential: dict,
    http_request: Request,
    db: Session = Depends(get_db)
):
    # 1. Look up session
    if session_id not in pending_registrations:
        raise HTTPException(status_code=404, detail="Session not found")

    session = pending_registrations[session_id]
    username = session["username"]
    display_name = session["display_name"]
    challenge = session["challenge"]

    # 2. Get user
    user = db.query(User).filter(User.username == username).first()

    # 3. Verify registration (same as direct)
    verification = verify_registration_response(...)

    # 4. Store passkey
    passkey = Passkey(
        user_id=user.id,
        credential_id=verification.credential_id,
        public_key=bytes_to_base64url(verification.public_key),
        sign_count=verification.sign_count,
        aaguid=str(verification.aaguid),
        created_at=datetime.utcnow()
    )
    db.add(passkey)
    db.commit()

    # 5. Update session status
    session["status"] = "completed"

    # 6. Emit WebSocket event to primary device
    await manager.broadcast(f"register_{session_id}", {
        "status": "completed",
        "success": True,
        "username": username
    })

    return {"message": "Registration successful", "username": username}
```

---

## Passkey Login Endpoints

### 9. Start Passkey Login (With Username)

Initiates authentication with username.

**Endpoint:** `POST /auth/login/start`

**Request Body:**
```json
{
  "username": "string (required)"
}
```

**Example:**
```bash
curl -X POST http://localhost:8091/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"username": "user"}'
```

**Success Response (200 OK):**
```json
{
  "challenge": "rfpwe2nm...",
  "options": {
    "challenge": "rfpwe2nm...",
    "rpId": "localhost",
    "timeout": 60000,
    "allowCredentials": [
      {
        "id": "abcd1234...",
        "type": "public-key"
      }
    ],
    "userVerification": "preferred"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "No passkeys registered for this user"
}
```

---

### 10. Finish Passkey Login (With Username)

Completes authentication with username.

**Endpoint:** `POST /auth/login/finish`

**Request Body:**
```json
{
  "username": "string (required)",
  "assertion": {
    "id": "credential-id",
    "rawId": "credential-id",
    "response": {
      "clientDataJSON": "base64url",
      "authenticatorData": "base64url",
      "signature": "base64url",
      "userHandle": "base64url"
    },
    "type": "public-key"
  },
  "challenge": "string (from /login/start)"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "user",
  "has_passkey": true
}
```

---

### 11. Start Usernameless Passkey Login

Initiates authentication WITHOUT username.

**Endpoint:** `POST /auth/login/usernameless/start`

**Request Body:** Empty

**Example:**
```bash
curl -X POST http://localhost:8091/auth/login/usernameless/start
```

**Success Response (200 OK):**
```json
{
  "challenge": "rfpwe2nm...",
  "options": {
    "challenge": "rfpwe2nm...",
    "rpId": "localhost",
    "timeout": 60000,
    "userVerification": "preferred"
  }
}
```

**Note:** No `allowCredentials` array - browser will show ALL passkeys

---

### 12. Finish Usernameless Passkey Login

Completes usernameless authentication.

**Endpoint:** `POST /auth/login/usernameless/finish`

**Request Body:**
```json
{
  "assertion": {
    "id": "credential-id",
    "rawId": "credential-id",
    "response": {
      "clientDataJSON": "base64url",
      "authenticatorData": "base64url",
      "signature": "base64url",
      "userHandle": "base64url"
    },
    "type": "public-key"
  },
  "challenge": "string (from /usernameless/start)"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "user",  # Server identified user!
  "has_passkey": true
}
```

**Implementation Details:**
```python
@app.post("/auth/login/usernameless/finish")
def login_usernameless_finish(
    request: AssertionResponseUsernameless,
    http_request: Request,
    db: Session = Depends(get_db)
):
    # 1. Extract credential ID from assertion
    credential_id = request.assertion.get("id", "")

    # 2. Find passkey by credential ID (server identifies user!)
    passkey = db.query(Passkey).filter(Passkey.credential_id == credential_id).first()

    # 3. Get user from passkey
    user = db.query(User).filter(User.id == passkey.user_id).first()

    # 4. Verify assertion signature
    verification = verify_authentication_response(
        credential=request.assertion,
        expected_challenge=challenge,
        expected_rp_id=RP_ID,
        expected_origin=origin,
        credential_public_key=base64url_to_bytes(passkey.public_key),
        credential_current_sign_count=passkey.sign_count,
    )

    # 5. Update sign count
    passkey.sign_count = verification.new_sign_count
    db.commit()

    # 6. Generate JWT token
    access_token = create_access_token({"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "has_passkey": True
    }
```

---

## Passkey Management Endpoints

### 13. Get User's Passkeys

Get all passkeys registered by current user.

**Endpoint:** `GET /auth/passkeys`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -X GET http://localhost:8091/auth/passkeys \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**
```json
{
  "passkeys": [
    {
      "credential_id": "abcd1234...",
      "created_at": "2025-12-29T10:00:00Z",
      "aaguid": "0900....",
      "last_used": null
    },
    {
      "credential_id": "xyz789...",
      "created_at": "2025-12-29T10:30:00Z",
      "aaguid": "0900....",
      "last_used": "2025-12-29T11:00:00Z"
    }
  ]
}
```

---

### 14. Delete Passkey

Delete a passkey (fallback to password required).

**Endpoint:** `DELETE /auth/passkeys`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Empty

**Example:**
```bash
curl -X DELETE http://localhost:8091/auth/passkeys \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**
```json
{
  "message": "Passkey deleted successfully!"
}
```

**Implementation Details:**
```python
@app.delete("/auth/passkeys")
def delete_passkey(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Delete all user's passkeys (or specific one)
    db.query(Passkey).filter(Passkey.user_id == current_user.id).delete()

    # 2. Update user
    current_user.has_passkey = False
    db.commit()

    return {"message": "Passkey deleted successfully!"}
```

---

## WebSocket Endpoints

### 15. QR Code Registration Updates

Real-time updates for QR code registration.

**Endpoint:** `WebSocket /ws/register/{session_id}`

**Connection:**
```javascript
const ws = new WebSocket(`ws://localhost:8091/ws/register/${session_id}`);
```

**Server → Client Messages:**

**Registration Completed:**
```json
{
  "status": "completed",
  "success": true,
  "username": "user",
  "display_name": "iPhone 14 Pro Face ID",
  "timestamp": "2025-12-29T10:01:30Z"
}
```

**Registration Failed:**
```json
{
  "status": "error",
  "success": false,
  "error": "Registration failed",
  "timestamp": "2025-12-29T10:01:30Z"
}
```

**Implementation Details:**
```python
@app.websocket("/ws/register/{session_id}")
async def websocket_register websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(10)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")

# When mobile completes registration:
await manager.broadcast(f"register_{session_id}", {
    "status": "completed",
    "success": True,
    "username": username
})
```

---

## HTML Page Endpoints

### 16. Mobile Registration Page

HTML page that mobile devices access after scanning QR code.

**Endpoint:** `GET /mobile/register/{session_id}`

**Response:** HTML page (not JSON)

**Implementation:**
```python
@app.get("/mobile/register/{session_id}")
def mobile_register_page(session_id: str):
    # Generate HTML page with embedded JavaScript
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Register Passkey</title>
        <script>
        const sessionId = "{session_id}";
        // ... registration code ...
        </script>
    </head>
    <body>
        <h1>Register Passkey</h1>
        <button id="registerBtn">Register Passkey</button>
        <div id="result"></div>
    </body>
    </html>
    """
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input, verification failed |
| 401 | Unauthorized | Invalid/expired token, wrong password |
| 404 | Not Found | User/passkey not found, session expired |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "detail": "Human-readable error message"
}
```

### Common Errors

| Error | Cause | Code | Message |
|-------|-------|------|---------|
| Invalid token | JWT expired/invalid | 401 | "Token expired" / "Invalid token" |
| Invalid credentials | Wrong password | 401 | "Invalid username or password" |
| Invalid challenge | Challenge mismatch/expired | 400 | "Invalid challenge" |
| Passkey not found | Credential ID not in database | 404 | "Passkey not found" |
| Registration failed | WebAuthn verification failed | 400 | "Registration failed" |
| Authentication failed | Signature verification failed | 400 | "Authentication failed" |
| Session not found | QR code session expired | 404 | "Session not found or expired" |
| No passkeys | User has no passkeys registered | 404 | "No passkeys registered yet" |

---

## Rate Limiting

### Current Status
⚠️ **NOT IMPLEMENTED** (TODO for production)

### Recommended Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /auth/password/login` | 5 requests | 1 minute |
| `POST /auth/login/start` | 10 requests | 1 minute |
| `POST /auth/register/start` | 10 requests | 1 minute |
| `POST /auth/register/qr/start` | 5 requests | 1 minute |
| `GET /auth/passkeys` | 20 requests | 1 minute |

### Implementation Example

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/auth/password/login")
@limiter.limit("5/minute")
def password_login(...):
    pass
```

---

## Security Headers

### Required Headers (Production)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing Examples

### Test Password Login
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8091/auth/password/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user"}' \
  | jq -r '.access_token')

# Use token
curl -X GET http://localhost:8091/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test Passkey Registration (Manual)
```python
# 1. Start registration
response = requests.post(
    "http://localhost:8091/auth/register/start",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"username": "user", "display_name": "Test Passkey"}
)
options = response.json()

# 2. Create credential (using WebAuthn simulator)
credential = webauthn_simulator.create(options)

# 3. Finish registration
requests.post(
    "http://localhost:8091/auth/register/finish",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={
        "username": "user",
        "display_name": "Test Passkey",
        "credential": credential,
        "challenge": options["challenge"]
    }
)
```

---

## OpenAPI/Swagger Documentation

FastAPI automatically generates OpenAPI documentation.

**Access:**
- Swagger UI: `http://localhost:8091/docs`
- ReDoc: `http://localhost:8091/redoc`
- OpenAPI JSON: `http://localhost:8091/openapi.json`

---

## Versioning

### Current Version: v1.0

### Breaking Changes Policy
- MAJOR version bump for incompatible changes
- MINOR version bump for backward-compatible additions
- PATCH version bump for backward-compatible bug fixes

### Changelog

#### v1.0 (2025-12-29)
- Initial release
- Password authentication
- Direct passkey registration
- QR code passkey registration
- Passkey login (with username)
- Usernameless passkey login
- Passkey management (list, delete)

---

*For database schema details, see [database-schema.md](database-schema.md). For architecture details, see [architecture.md](architecture.md).*
