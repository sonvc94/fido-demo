# FIDO2 Passkey Authentication System - Documentation

## 📚 Documentation Overview

This directory contains comprehensive documentation for the FIDO2 Passkey Authentication System, including both Business Analyst (BA) and Technical perspectives.

---

## 📂 Directory Structure

```
docs/
├── README.md                       # This file - documentation index
├── ba/                             # Business Analyst documentation
│   ├── overview.md                 # Business overview & objectives
│   ├── login-flows.md              # Detailed login flow specifications
│   └── passkey-registration.md     # Passkey registration flow specifications
├── technical/                      # Technical documentation
│   ├── architecture.md             # System architecture & design
│   └── api-endpoints.md            # Complete API reference
└── diagrams/                       # Mermaid diagrams
    └── all-diagrams.md             # All system diagrams (20+ diagrams)
```

---

## 🎯 Quick Navigation

### For Business Stakeholders

1. **[Business Overview](ba/overview.md)** ⭐ Start Here
   - Executive summary
   - Business objectives and KPIs
   - User personas and use cases
   - Success criteria and roadmap

2. **[Login Flows](ba/login-flows.md)**
   - Password-based authentication
   - Passkey login (with username)
   - Usernameless passkey login
   - Flow comparisons and error handling

3. **[Passkey Registration](ba/passkey-registration.md)**
   - Direct device registration
   - QR code cross-device registration
   - Passkey management

### For Technical Team

1. **[System Architecture](technical/architecture.md)** ⭐ Start Here
   - Technology stack
   - Component details
   - Data flow diagrams
   - Security architecture
   - Scalability considerations

2. **[API Endpoints](technical/api-endpoints.md)**
   - Complete API reference
   - Request/response examples
   - Error codes
   - Testing examples
   - OpenAPI/Swagger documentation

3. **[System Diagrams](diagrams/all-diagrams.md)**
   - Architecture diagrams
   - Sequence diagrams for all flows
   - Database schema diagrams
   - Network diagrams
   - State machines
   - Deployment diagrams

---

## 📖 Reading Guide

### New to the Project?

1. Start with **[BA Overview](ba/overview.md)** to understand the business goals
2. Review **[BA Login Flows](ba/login-flows.md)** to understand user journeys
3. Check **[Technical Architecture](technical/architecture.md)** for system design
4. Explore **[Diagrams](diagrams/all-diagrams.md)** for visual understanding

### Implementing a Feature?

1. Read the **[BA documentation](ba/)** for requirements
2. Review **[API endpoints](technical/api-endpoints.md)** for integration points
3. Check **[Architecture](technical/architecture.md)** for design considerations
4. Reference **[Diagrams](diagrams/all-diagrams.md)** for flow visualization

### Deploying to Production?

1. Review **[Security Architecture](technical/architecture.md#security-architecture)**
2. Check **[Deployment Architecture](technical/architecture.md#deployment-architecture)**
3. Review **[Environment Setup](../.env.example)** configuration
4. Follow **[Rate Limiting](technical/api-endpoints.md#rate-limiting)** guidelines

---

## 🔑 Key Concepts

### Authentication Methods

| Method | Description | Documentation |
|--------|-------------|----------------|
| **Password** | Traditional username/password | [Login Flows → Password](ba/login-flows.md#1-password-based-login) |
| **Passkey + Username** | Passwordless with username | [Login Flows → Passkey](ba/login-flows.md#2-passkey-login-with-username) |
| **Usernameless** | Zero-input authentication | [Login Flows → Usernameless](ba/login-flows.md#3-usernameless-passkey-login) |

### Registration Methods

| Method | Description | Documentation |
|--------|-------------|----------------|
| **Direct** | Register on current device | [Registration → Direct](ba/passkey-registration.md#1-direct-passkey-registration-on-device) |
| **QR Code** | Register on different device | [Registration → QR Code](ba/passkey-registration.md#2-qr-code-passkey-registration-cross-device) |

---

## 📊 Metrics & KPIs

### Business Metrics (from BA docs)

- **Passkey Adoption Rate:** 80% of users register at least one passkey
- **Passkey Usage Rate:** 70% of logins use passkey (not password)
- **Login Success Rate:** >98% for passkey, >95% for password
- **Average Login Time:** <3 seconds for passkey, <10 seconds for password
- **Support Ticket Reduction:** 95% reduction in password reset tickets

### Technical Metrics (from Technical docs)

- **API Response Time:** p50 <100ms, p95 <500ms
- **Registration Time:** <10 seconds for direct, <60 seconds for QR code
- **Error Rate:** <2% for all endpoints
- **Uptime Target:** 99.9% availability

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **WebAuthn API** - Browser native authentication
- **Nginx** - Web server & reverse proxy
- **Docker** - Containerization

### Backend
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **py_webauthn** - FIDO2/WebAuthn library
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production recommended)

### Infrastructure
- **Docker Compose** - Multi-container orchestration
- **WebSocket** - Real-time communication
- **JWT** - Stateless authentication

---

## 🔐 Security Features

- ✅ **Phishing-Resistant:** Passkeys bound to domain
- ✅ **No Password Storage:** Only public keys stored on server
- ✅ **Biometric Protection:** Private keys in secure enclave
- ✅ **Replay Protection:** Challenge + sign count
- ✅ **Origin Validation:** Cryptographic signature verification
- ✅ **HTTPS Required:** Production deployment (WebAuthn requirement)

---

## 🚀 Deployment

### Development
```bash
git clone <repo>
cd fido-demo
docker compose up --build -d
```
Access at: http://localhost

### Staging
- Use PostgreSQL instead of SQLite
- Use Redis for session storage
- Enable HTTPS with Let's Encrypt
- Configure environment variables

### Production
- See [Deployment Architecture](technical/architecture.md#deployment-architecture)
- Use Kubernetes for horizontal scaling
- Enable rate limiting
- Set up monitoring and logging
- Configure backup and recovery

---

## 📝 Document Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-29 | Initial documentation release |

---

## 🤝 Contributing

When updating documentation:

1. **BA Documentation:** Update business requirements, user flows, use cases
2. **Technical Documentation:** Update architecture, API specs, deployment guides
3. **Diagrams:** Keep Mermaid diagrams in sync with code changes
4. **Version Control:** Commit documentation changes with code changes

---

## 📧 Contact

- **Project Repo:** [GitHub](https://github.com/sonvc94/fido-demo)
- **Issues:** Report bugs via GitHub Issues
- **Documentation:** See /docs folder for detailed documentation

---

## 🎓 Additional Resources

### External References
- [WebAuthn Specification (W3C)](https://w3c.github.io/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

### Internal Documentation
- [API Swagger UI](http://localhost:8091/docs) - When running locally
- [API ReDoc](http://localhost:8091/redoc) - When running locally
- [OpenAPI JSON](http://localhost:8091/openapi.json) - When running locally

---

**Last Updated:** 2025-12-29

**Document Maintainers:**
- Business Analyst Team (BA docs)
- Technical Lead (Technical docs)
