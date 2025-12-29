from fastapi import FastAPI, Depends, HTTPException, Security, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import base64
import os
import json
import bcrypt
import jwt
import qrcode
import io
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers import (
    bytes_to_base64url,
    base64url_to_bytes,
)
from database import init_db, get_db, User

app = FastAPI(title="FIDO2 Passkey Auth API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebAuthn configuration (can be overridden by environment variables)
RP_ID = os.getenv("RP_ID", "localhost")
RP_ORIGINS = os.getenv("RP_ORIGINS", "http://localhost:3000,http://localhost").split(",")

# Base URL for QR code generation (can be overridden by environment variable)
BASE_URL = os.getenv("BASE_URL", "http://localhost")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()

# Store active WebSocket connections and pending registrations
active_websockets: Dict[str, WebSocket] = {}
pending_registrations: Dict[str, dict] = {}


class UsernameRequest(BaseModel):
    username: str


class PasswordLoginRequest(BaseModel):
    username: str
    password: str


class RegisterStartRequest(BaseModel):
    username: str
    display_name: str


class QRRegisterRequest(BaseModel):
    username: str
    display_name: str


class CredentialResponse(BaseModel):
    username: str
    credential: dict
    challenge: str
    session_id: Optional[str] = None


class AssertionResponse(BaseModel):
    username: str
    assertion: dict
    challenge: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    display_name: str


# JWT Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Verify JWT token and return username"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(username: str = Depends(verify_token), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
def read_root():
    return {"message": "FIDO2 Passkey Authentication API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Password authentication endpoints
@app.post("/auth/password/login")
def password_login(request: PasswordLoginRequest, db: Session = Depends(get_db)):
    """Login with username/password (fallback)"""
    user = db.query(User).filter(User.username == request.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    access_token = create_access_token({"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "display_name": user.display_name
    }


# Passkey registration endpoints
@app.post("/auth/register/start")
def register_start(
    request: RegisterStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start WebAuthn registration - requires authentication"""
    user = db.query(User).filter(User.username == current_user.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate registration options
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name="FIDO2 Demo",
        user_id=user.username.encode('utf-8'),
        user_name=user.username,
        user_display_name=request.display_name,
        attestation="none",
        authenticator_selection=None,
    )

    # Convert options to JSON-compatible format
    options_dict = {
        "rp": {
            "id": options.rp.id,
            "name": options.rp.name,
        },
        "user": {
            "id": bytes_to_base64url(options.user.id),
            "name": options.user.name,
            "displayName": options.user.display_name,
        },
        "challenge": bytes_to_base64url(options.challenge),
        "pubKeyCredParams": [{"type": "public-key", "alg": alg.alg} for alg in options.pub_key_cred_params],
        "timeout": options.timeout,
        "attestation": options.attestation,
        "authenticatorSelection": {
            "userVerification": "preferred",
        }
    }

    return {
        "challenge": bytes_to_base64url(options.challenge),
        "options": options_dict
    }


@app.post("/auth/register/finish")
def register_finish(
    request: CredentialResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete WebAuthn registration - requires authentication"""
    username = request.username
    credential = request.credential
    challenge = base64url_to_bytes(request.challenge)

    user = db.query(User).filter(User.username == current_user.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # The webauthn library expects JSON-serialized credential
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGINS[0],
        )

        # Get credential ID from the verified credential
        credential_id_bytes = verification.credential_id
        credential_id = bytes_to_base64url(credential_id_bytes)

        # Update user's passkey
        user.credential_id = credential_id
        user.public_key = bytes_to_base64url(verification.credential_public_key)
        user.sign_count = verification.sign_count
        db.commit()

        return {
            "message": "Passkey registered successfully",
            "credential_id": user.credential_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")


# Cross-device passkey registration with QR code
@app.post("/auth/register/qr/start")
def register_qr_start(
    request: QRRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start QR code registration for cross-device passkey"""
    user = db.query(User).filter(User.username == current_user.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate unique session ID
    session_id = str(uuid.uuid4())

    # Generate registration options
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name="FIDO2 Demo",
        user_id=user.username.encode('utf-8'),
        user_name=user.username,
        user_display_name=request.display_name,
        attestation="none",
        authenticator_selection=None,
    )

    # Store pending registration
    pending_registrations[session_id] = {
        "username": user.username,
        "display_name": request.display_name,
        "challenge": bytes_to_base64url(options.challenge),
        "options": {
            "rp": {
                "id": options.rp.id,
                "name": options.rp.name,
            },
            "user": {
                "id": bytes_to_base64url(options.user.id),
                "name": options.user.name,
                "displayName": options.user.display_name,
            },
            "challenge": bytes_to_base64url(options.challenge),
            "pubKeyCredParams": [{"type": "public-key", "alg": alg.alg} for alg in options.pub_key_cred_params],
            "timeout": options.timeout,
            "attestation": options.attestation,
        },
        "completed": False,
        "created_at": datetime.utcnow().isoformat()
    }

    # Generate QR code data (URL that mobile device will open)
    # Point to backend endpoint where mobile registration page is hosted
    # Use BASE_URL from environment variable for production deployment
    qr_data = f"{BASE_URL}/mobile/register/{session_id}"

    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return {
        "session_id": session_id,
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "qr_data": qr_data,
        "expires_in": 300  # 5 minutes
    }


@app.get("/auth/register/qr/{session_id}")
def get_qr_status(session_id: str):
    """Get QR registration status (for polling)"""
    if session_id not in pending_registrations:
        raise HTTPException(status_code=404, detail="Session not found")

    registration = pending_registrations[session_id]

    return {
        "session_id": session_id,
        "completed": registration["completed"],
        "created_at": registration["created_at"]
    }


# Mobile-friendly endpoint for QR code registration
@app.get("/mobile/register/{session_id}")
def mobile_register_page(session_id: str):
    """Mobile-friendly HTML page for completing registration"""
    if session_id not in pending_registrations:
        return JSONResponse(status_code=404, content={"error": "Session not found or expired"})

    registration = pending_registrations[session_id]

    if registration["completed"]:
        return JSONResponse(content={"success": True, "message": "Registration completed!"})

    # Return HTML page
    html_content = r"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Register Passkey</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 30px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 1.5rem;
            }
            p {
                color: #666;
                margin-bottom: 20px;
            }
            .user-info {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .user-info p {
                margin: 5px 0;
            }
            button {
                width: 100%;
                padding: 15px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            }
            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            }
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .success {
                color: #28a745;
                text-align: center;
                padding: 20px;
            }
            .error {
                color: #dc3545;
                text-align: center;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Register Passkey</h1>
            <div class="user-info">
                <p><strong>Username:</strong> """ + registration['username'] + r"""</p>
                <p><strong>Display Name:</strong> """ + registration['display_name'] + r"""</p>
            </div>
            <p>Tap the button below to register a passkey on this device.</p>
            <button id="registerBtn" onclick="registerPasskey()">Register Passkey</button>
            <div id="result"></div>
        </div>

        <script>
            const sessionId = '""" + session_id + r"""';
            const options = """ + json.dumps(registration['options']) + r""";

            function base64urlToBytes(base64url) {
                const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
                const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
            }

            function bytesToBase64url(bytes) {
                let binary = '';
                for (const byte of bytes) {
                    binary += String.fromCharCode(byte);
                }
                return btoa(binary)
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
            }

            async function registerPasskey() {
                const btn = document.getElementById('registerBtn');
                const result = document.getElementById('result');
                btn.disabled = true;
                btn.textContent = 'Registering...';

                try {
                    const credential = await navigator.credentials.create({
                        publicKey: {
                            challenge: base64urlToBytes(options.challenge),
                            rp: options.rp,
                            user: {
                                id: base64urlToBytes(options.user.id),
                                name: options.user.name,
                                displayName: options.user.displayName,
                            },
                            pubKeyCredParams: options.pubKeyCredParams,
                            timeout: options.timeout,
                            attestation: options.attestation,
                            authenticatorSelection: options.authenticatorSelection,
                        },
                    });

                    const credentialData = {
                        id: credential.id,
                        rawId: bytesToBase64url(new Uint8Array(credential.rawId)),
                        type: credential.type,
                        response: {
                            clientDataJSON: bytesToBase64url(new Uint8Array(credential.response.clientDataJSON)),
                            attestationObject: bytesToBase64url(new Uint8Array(credential.response.attestationObject)),
                        },
                    };

                    const response = await fetch('/api/mobile/register/finish/' + sessionId, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentialData)
                    });

                    if (response.ok) {
                        result.innerHTML = '<div class="success">✓ Passkey registered successfully!<br><br>You can close this page.</div>';
                        btn.style.display = 'none';
                    } else {
                        const error = await response.json();
                        result.innerHTML = '<div class="error">✗ Registration failed: ' + (error.detail || 'Unknown error') + '</div>';
                        btn.disabled = false;
                        btn.textContent = 'Try Again';
                    }
                } catch (error) {
                    result.innerHTML = '<div class="error">✗ Error: ' + error.message + '</div>';
                    btn.disabled = false;
                    btn.textContent = 'Try Again';
                }
            }
        </script>
    </body>
    </html>
    """

    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)


@app.post("/api/mobile/register/finish/{session_id}")
async def mobile_register_finish(session_id: str, credential: dict, db: Session = Depends(get_db)):
    """Complete registration from mobile device"""
    if session_id not in pending_registrations:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    registration = pending_registrations[session_id]

    if registration["completed"]:
        raise HTTPException(status_code=400, detail="Registration already completed")

    username = registration["username"]
    challenge = base64url_to_bytes(registration["challenge"])

    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Verify registration
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGINS[0],
        )

        # Get credential ID
        credential_id_bytes = verification.credential_id
        credential_id = bytes_to_base64url(credential_id_bytes)

        # Update user's passkey
        user.credential_id = credential_id
        user.public_key = bytes_to_base64url(verification.credential_public_key)
        user.sign_count = verification.sign_count
        db.commit()

        # Mark as completed
        registration["completed"] = True

        # Notify via WebSocket if connected
        if session_id in active_websockets:
            websocket = active_websockets[session_id]
            try:
                await websocket.send_json({"success": True, "message": "Passkey registered successfully!"})
            except:
                pass

        return {
            "success": True,
            "message": "Passkey registered successfully"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")


# WebSocket endpoint for QR registration
@app.websocket("/ws/register/{session_id}")
async def websocket_register(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time updates during QR registration"""
    await websocket.accept()
    active_websockets[session_id] = websocket

    try:
        # Send initial status
        if session_id in pending_registrations:
            await websocket.send_json({
                "status": "waiting",
                "message": "Waiting for passkey registration..."
            })

        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()

            # Check if registration is completed
            if session_id in pending_registrations:
                if pending_registrations[session_id]["completed"]:
                    await websocket.send_json({
                        "status": "completed",
                        "message": "Passkey registered successfully!"
                    })
                    break

    except WebSocketDisconnect:
        pass
    finally:
        if session_id in active_websockets:
            del active_websockets[session_id]


# Passkey authentication endpoints
@app.post("/auth/login/start")
def login_start(request: UsernameRequest, db: Session = Depends(get_db)):
    """Start WebAuthn authentication"""
    user = db.query(User).filter(User.username == request.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.credential_id:
        raise HTTPException(status_code=400, detail="No passkey registered. Please register a passkey first.")

    # Import PublicKeyCredentialDescriptor
    from webauthn.helpers.structs import PublicKeyCredentialDescriptor

    # Generate authentication options
    options = generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=[
            PublicKeyCredentialDescriptor(
                id=base64url_to_bytes(user.credential_id),
                type="public-key"
            )
        ],
    )

    options_dict = {
        "challenge": bytes_to_base64url(options.challenge),
        "rpId": options.rp_id,
        "timeout": options.timeout,
        "allowCredentials": [
            {
                "id": user.credential_id,
                "type": "public-key"
            }
        ],
        "userVerification": options.user_verification.value if options.user_verification else "preferred"
    }

    return {
        "challenge": bytes_to_base64url(options.challenge),
        "options": options_dict
    }


@app.post("/auth/login/finish")
def login_finish(request: AssertionResponse, db: Session = Depends(get_db)):
    """Complete WebAuthn authentication"""
    username = request.username
    assertion = request.assertion
    challenge = base64url_to_bytes(request.challenge)

    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.credential_id:
        raise HTTPException(status_code=400, detail="No passkey registered")

    try:
        # The webauthn library expects JSON-serialized assertion
        verification = verify_authentication_response(
            credential=assertion,
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGINS[0],
            credential_public_key=base64url_to_bytes(user.public_key),
            credential_current_sign_count=user.sign_count,
        )

        # Update sign count
        user.sign_count = verification.new_sign_count
        db.commit()

        # Create JWT token
        access_token = create_access_token({"sub": user.username})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Authentication successful",
            "username": user.username,
            "display_name": user.display_name
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


# Passkey management endpoints
@app.get("/auth/passkeys")
def list_passkeys(current_user: User = Depends(get_current_user)):
    """List all passkeys for current user"""
    passkeys = []

    if current_user.credential_id:
        passkeys.append({
            "credential_id": current_user.credential_id,
            "created_at": "N/A"
        })

    return {
        "username": current_user.username,
        "passkeys": passkeys,
        "has_passkey": current_user.credential_id is not None
    }


@app.delete("/auth/passkeys")
def delete_passkey(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete passkey for current user"""
    if not current_user.credential_id:
        raise HTTPException(status_code=404, detail="No passkey found")

    current_user.credential_id = None
    current_user.public_key = None
    current_user.sign_count = 0
    db.commit()

    return {
        "message": "Passkey deleted successfully. You can now login with password."
    }


@app.get("/auth/user/{username}")
def get_user(username: str, db: Session = Depends(get_db)):
    """Get user info (public endpoint)"""
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "display_name": user.display_name,
        "has_passkey": user.credential_id is not None
    }


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "username": current_user.username,
        "display_name": current_user.display_name,
        "has_passkey": current_user.credential_id is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
