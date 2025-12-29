# FIDO2 Passkey Authentication Demo

A complete WebAuthn/FIDO2 passkey authentication system with React frontend, Python FastAPI backend, and SQLite database.

## Features

- **Passwordless Authentication**: Login using FIDO2/WebAuthn passkeys
- **Password Fallback**: Traditional username/password authentication
- **Passkey Registration**: Register security keys for passwordless login
- **Default User**: Pre-configured user `user/user` for testing
- **Docker Ready**: Complete Docker and docker-compose setup

## Tech Stack

- **Frontend**: React.js with WebAuthn API
- **Backend**: Python FastAPI with py_webauthn
- **Database**: SQLite with SQLAlchemy
- **Deployment**: Docker & Docker Compose

## Quick Start with Docker

### Prerequisites

- Docker
- Docker Compose

### Run the Application

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:8000

### Stop the Application

```bash
docker-compose down
```

## Default User

```
Username: user
Password: user
```

## Usage Guide

### 1. Login with Password

First, log in using the default credentials:
- Username: `user`
- Password: `user`

### 2. Register a Passkey

After logging in, go to the "Register Passkey" tab:
- Enter username: `user`
- Enter display name (e.g., `Demo User`)
- Click "Register Passkey"
- Follow your browser's prompts to create a passkey

### 3. Login with Passkey

Once registered, you can login using just your passkey:
- Enter username: `user`
- Click "Login with Passkey"
- Authenticate using your registered passkey

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/password/login` | Login with username/password |
| POST | `/auth/register/start` | Start passkey registration |
| POST | `/auth/register/finish` | Complete passkey registration |
| POST | `/auth/login/start` | Start passkey authentication |
| POST | `/auth/login/finish` | Complete passkey authentication |
| GET | `/auth/user/{username}` | Get user information |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root |
| GET | `/health` | Health check |

## Project Structure

```
fido/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database models and initialization
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend Docker configuration
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Application styles
│   │   ├── webauthnService.js  # WebAuthn API service
│   │   └── index.js         # React entry point
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── package.json         # Node dependencies
│   ├── nginx.conf           # Nginx configuration
│   └── Dockerfile           # Frontend Docker configuration
└── docker-compose.yml       # Docker Compose configuration
```

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

## Notes

- Passkey/WebAuthn requires **HTTPS** in production. For local development, `localhost` is supported by modern browsers.
- The database file (`fido.db`) is created automatically on first run.
- The default user is created automatically when the application starts.

## Security Considerations

- This is a demonstration application. For production use, implement proper:
  - HTTPS/TLS
  - Session management
  - Rate limiting
  - CSRF protection
  - Input validation
  - User registration flow
  - Password policies

## License

MIT License
