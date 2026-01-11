<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/🏆_SIH_2025-WINNERS-gold?style=for-the-badge" alt="SIH 2025 Winners">
</p>

<h1 align="center">🛡️ Defence Incident Sentinel</h1>

<p align="center">
  <strong>A comprehensive cyber incident reporting and analysis platform for defence-grade security operations</strong>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-services">Services</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 📋 Overview

**Defence Incident Sentinel** is an enterprise-grade cybersecurity platform designed to streamline cyber incident reporting, evidence analysis, and threat intelligence operations. The platform consists of multiple microservices that work together to provide:

- 🔐 **Secure User Registration & Authentication** — Multi-factor authentication with email verification
- 📝 **Incident Reporting Dashboard** — User-friendly complaint submission with file upload support
- 🤖 **AI-Powered Chatbot** — Intelligent assistance for complaint filing and support
- 🔬 **Advanced File Analysis Engine** — Deep forensic analysis of digital evidence using YARA rules, ClamAV, and ML models
- 📊 **Admin Command Center** — Comprehensive case management, playbooks, alerts, and reporting
- 🏢 **CERT Command Center** — Specialized workspace for security analysts to investigate incidents
- ⛓️ **Blockchain Integration** — Immutable risk analysis reports using smart contracts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEFENCE INCIDENT SENTINEL                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   User Registration │    │   User Dashboard    │    │   Admin Dashboard   │ │
│  │   (React + TS)      │    │   (React + JS)      │    │   (React + TS)      │ │
│  │   Port: 5173        │    │   Port: 5174        │    │   Port: 5175        │ │
│  └──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘ │
│             │                          │                          │             │
│             ▼                          ▼                          ▼             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   Auth Backend      │    │   Chatbot Backend   │    │   Admin Backend     │ │
│  │   (Express + JS)    │    │   (Express + JS)    │    │   (Express + TS)    │ │
│  │   Port: 3001        │    │   Port: 3000        │    │   Port: 3002        │ │
│  └──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘ │
│             │                          │                          │             │
│             └──────────────────────────┼──────────────────────────┘             │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      CERT Command Center (React + TS)                    │   │
│  │                              Port: 5176                                  │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                     │                                           │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                  File Scanning Microservice (FastAPI + Python)          │   │
│  │                              Port: 8000                                  │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │   │
│  │  │  ClamAV   │ │  YARA     │ │  OCR/NLP  │ │  ML/CV    │ │  Crypto   │  │   │
│  │  │  Scanner  │ │  Rules    │ │  Engine   │ │  Analysis │ │  Hashing  │  │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                     │                                           │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Blockchain Layer (Hardhat + Solidity)            │   │
│  │                     Immutable Risk Reports & Audit Trail                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            Data Layer                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │   MongoDB    │  │   Supabase   │  │  VirusTotal  │                   │   │
│  │  │   Database   │  │   Storage    │  │     API      │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology                                                                                          | Purpose                 |
| --------------------------------------------------------------------------------------------------- | ----------------------- |
| ![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)               | UI Framework            |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript) | Type Safety             |
| ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)                   | Build Tool              |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square&logo=tailwindcss) | Styling                 |
| ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000?style=flat-square)                | Component Library       |
| ![React Query](https://img.shields.io/badge/TanStack_Query-5.x-FF4154?style=flat-square)            | Server State Management |
| ![Recharts](https://img.shields.io/badge/Recharts-2.x-FF6384?style=flat-square)                     | Data Visualization      |

### Backend

| Technology                                                                                    | Purpose              |
| --------------------------------------------------------------------------------------------- | -------------------- |
| ![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express)    | Node.js Framework    |
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi) | Python API Framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb)    | NoSQL Database       |
| ![Mongoose](https://img.shields.io/badge/Mongoose-9.x-880000?style=flat-square)               | ODM                  |
| ![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)     | Authentication       |

### File Analysis & Security

| Technology                                                                               | Purpose                  |
| ---------------------------------------------------------------------------------------- | ------------------------ |
| ![YARA](https://img.shields.io/badge/YARA-4.x-FF0000?style=flat-square)                  | Malware Pattern Matching |
| ![ClamAV](https://img.shields.io/badge/ClamAV-Scanning-DD0000?style=flat-square)         | Antivirus Engine         |
| ![OpenCV](https://img.shields.io/badge/OpenCV-4.x-5C3EE8?style=flat-square&logo=opencv)  | Computer Vision          |
| ![Whisper](https://img.shields.io/badge/Whisper-AI-412991?style=flat-square&logo=openai) | Audio Transcription      |
| ![Tesseract](https://img.shields.io/badge/Tesseract-OCR-4285F4?style=flat-square)        | Text Extraction          |
| ![spaCy](https://img.shields.io/badge/spaCy-NLP-09A3D5?style=flat-square)                | NLP Analysis             |
| ![NudeNet](https://img.shields.io/badge/NudeNet-NSFW_Detection-FF69B4?style=flat-square) | Content Moderation       |
| ![YOLOv8](https://img.shields.io/badge/YOLOv8-Object_Detection-00FFFF?style=flat-square) | Object Detection         |

### Blockchain

| Technology                                                                                      | Purpose                |
| ----------------------------------------------------------------------------------------------- | ---------------------- |
| ![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636?style=flat-square&logo=solidity) | Smart Contracts        |
| ![Hardhat](https://img.shields.io/badge/Hardhat-2.x-FFF100?style=flat-square)                   | Development Framework  |
| ![Ethers.js](https://img.shields.io/badge/Ethers.js-6.x-3C3C3D?style=flat-square)               | Blockchain Interaction |

### Infrastructure

| Technology                                                                                        | Purpose             |
| ------------------------------------------------------------------------------------------------- | ------------------- |
| ![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=flat-square&logo=supabase) | File Storage & Auth |
| ![VirusTotal](https://img.shields.io/badge/VirusTotal-API-394EFF?style=flat-square)               | Hash Lookups        |
| ![Winston](https://img.shields.io/badge/Winston-Logging-231F20?style=flat-square)                 | Logging             |

---

## 📦 Services

### 1. User Registration Frontend & Backend

**`/user-registration-frontend-backend`**

Full-stack authentication service with secure user onboarding.

| Feature               | Description                                        |
| --------------------- | -------------------------------------------------- |
| 🔐 Login/Register     | Secure authentication with bcrypt password hashing |
| 📧 Email Verification | OTP-based email verification flow                  |
| 🔑 JWT Tokens         | Stateless session management                       |
| 🚦 Rate Limiting      | Protection against brute-force attacks             |
| 📱 Responsive UI      | Mobile-first design with shadcn/ui                 |

```bash
# Start development
cd user-registration-frontend-backend
npm install
npm run dev:all  # Runs both frontend and backend
```

---

### 2. User Dashboard Frontend & Backend

**`/user-dashboard-frontend-backend`**

Main portal for users to file complaints and track their cases.

| Feature              | Description                             |
| -------------------- | --------------------------------------- |
| 📝 New Complaint     | Step-by-step complaint filing wizard    |
| 📋 Manage Complaints | View and track submitted complaints     |
| 🤖 AI Chatbot        | Get assistance with complaint filing    |
| ⚙️ Settings          | User preferences and profile management |
| ❓ Help Center       | FAQs and support resources              |

```bash
cd user-dashboard-frontend-backend
npm install
npm run dev
```

---

### 3. User Chatbot Backend

**`/user-chatbot-backend`**

AI-powered conversational interface for user support.

| Feature           | Description                       |
| ----------------- | --------------------------------- |
| 💬 Chat Interface | Real-time messaging support       |
| 🔐 Auth Routes    | User authentication endpoints     |
| 📄 Complaint API  | Complaint submission through chat |
| 📁 File Uploads   | Evidence attachment support       |

```bash
cd user-chatbot-backend
npm install
npm start
```

---

### 4. Admin Dashboard (Frontend + Backend)

**`/admin-dashboard-frontend` & `/admin-dashboard-backend`**

Comprehensive administrative control panel for security operations.

| Feature            | Description                       |
| ------------------ | --------------------------------- |
| 📊 Dashboard       | Real-time statistics and KPIs     |
| 🗂️ Case Management | View, assign, and manage cases    |
| 📚 Playbooks       | Incident response procedures      |
| 📈 Reports         | Generate and export reports       |
| 🚨 Alerts          | Real-time threat notifications    |
| 🔍 Search          | Advanced case and evidence search |
| ⚙️ Settings        | System configuration              |

```bash
# Backend
cd admin-dashboard-backend
npm install
npm run dev

# Frontend
cd admin-dashboard-frontend
npm install
npm run dev
```

---

### 5. CERT Command Center

**`/cert-command-center`**

Specialized investigation workspace for CERT analysts.

| Feature             | Description                                 |
| ------------------- | ------------------------------------------- |
| 🔬 Workspace        | Detailed incident investigation environment |
| 📋 Complaints Queue | Prioritized complaint management            |
| 🖥️ Analysis Tools   | Integrated evidence analysis                |

```bash
cd cert-command-center
npm install
npm run dev
```

---

### 6. File Scanning Microservice

**`/file-scanning-microservice`**

Enterprise-grade forensic analysis engine for digital evidence.

| Processor          | Supported Formats              | Analysis Capabilities                                                                              |
| ------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| 🖼️ **Image**       | JPG, PNG, GIF, BMP, TIFF, WebP | EXIF extraction, Face detection, Object detection (YOLO), NSFW detection, OCR, QR/Barcode scanning |
| 🎬 **Video**       | MP4, AVI, MKV, MOV, WebM       | Frame extraction, Audio transcription (Whisper), Face detection, NSFW analysis                     |
| 🎵 **Audio**       | MP3, WAV, FLAC, OGG, M4A       | Speech-to-text (Whisper), Metadata extraction                                                      |
| 📄 **Document**    | PDF, DOCX, TXT, RTF            | Text extraction (PyMuPDF), OCR, NLP entity extraction                                              |
| 📊 **Spreadsheet** | XLSX, XLS, CSV, ODS            | Data parsing, Formula analysis                                                                     |
| 📦 **Archive**     | ZIP, RAR, 7z, TAR, GZ          | Recursive extraction, Nested file analysis                                                         |
| ⚙️ **Executable**  | EXE, DLL, SO, ELF              | Entropy analysis, Import/Export analysis                                                           |
| 📱 **APK**         | Android Packages               | Manifest parsing, Permission analysis, Certificate extraction                                      |

#### Security Scanning Services

| Service                 | Description                              |
| ----------------------- | ---------------------------------------- |
| 🦠 **ClamAV**           | Antivirus scanning for malware detection |
| 🎯 **YARA**             | Custom rule-based pattern matching       |
| 🔐 **Hash Lookup**      | VirusTotal integration for known threats |
| 📊 **Entropy Analysis** | Detect packed/encrypted content          |
| 🔍 **MIME Sniffing**    | Accurate file type detection             |

```bash
cd file-scanning-microservice
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### 7. Blockchain Module

**`/user-chatbot-backend/blockchain`**

Immutable audit trail using Ethereum smart contracts.

| Contract           | Purpose                                 |
| ------------------ | --------------------------------------- |
| `RiskAnalysis.sol` | Stores risk assessment reports on-chain |

**Report Structure:**

- Risk Score (0-100)
- Risk Category
- Attack Type Classification
- Priority Level
- User Alert Flag
- Summary Array

```bash
cd user-chatbot-backend/blockchain
npm install
npx hardhat compile
npx hardhat test
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Node.js 18+ & npm
node --version  # v18.x or higher

# Python 3.10+
python --version  # 3.10 or higher

# MongoDB (local or Atlas)
# Supabase account (for file storage)
# VirusTotal API key (optional, for hash lookups)
```

### Environment Variables

Create `.env` files in respective service directories:

#### File Scanning Microservice

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=defence_sentinel
MONGODB_READ_COLLECTION=complaints
MONGODB_WRITE_COLLECTION=scan_results

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_BUCKET=evidence

# VirusTotal
VIRUSTOTAL_API_KEY=your-api-key
```

#### User Registration Backend

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/defence_sentinel
JWT_SECRET=your-super-secret-key
NODE_ENV=development
```

#### Chatbot Backend

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/defence_sentinel
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/defence-incident-sentinel.git
cd defence-incident-sentinel

# Install all dependencies
npm run install:all  # or manually install each service

# Start all services (development)
npm run dev:all
```

### Manual Service Start

```bash
# Terminal 1: User Registration
cd user-registration-frontend-backend && npm run dev:all

# Terminal 2: User Dashboard
cd user-dashboard-frontend-backend && npm run dev

# Terminal 3: Chatbot Backend
cd user-chatbot-backend && npm start

# Terminal 4: Admin Backend
cd admin-dashboard-backend && npm run dev

# Terminal 5: Admin Frontend
cd admin-dashboard-frontend && npm run dev

# Terminal 6: CERT Command Center
cd cert-command-center && npm run dev

# Terminal 7: File Scanning Service
cd file-scanning-microservice && uvicorn main:app --reload
```

---

## 📁 Project Structure

```
defence-incident-sentinel/
│
├── 📂 admin-dashboard-backend/       # Admin API (TypeScript + Express)
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   ├── middleware/               # Auth, error handling
│   │   ├── models/                   # Mongoose schemas
│   │   ├── routes/                   # API endpoints
│   │   ├── services/                 # Business logic
│   │   └── utils/                    # Helpers
│   └── package.json
│
├── 📂 admin-dashboard-frontend/      # Admin UI (React + TypeScript)
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Route pages
│   │   ├── hooks/                    # Custom React hooks
│   │   └── lib/                      # Utilities
│   └── package.json
│
├── 📂 cert-command-center/           # CERT Analyst Workspace
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/            # Dashboard widgets
│   │   │   ├── workspace/            # Investigation tools
│   │   │   └── ui/                   # shadcn components
│   │   ├── pages/
│   │   └── types/                    # TypeScript definitions
│   └── package.json
│
├── 📂 file-scanning-microservice/    # Evidence Analysis Engine (Python)
│   ├── config/                       # Settings & configuration
│   ├── database/                     # MongoDB managers
│   ├── helpers/                      # ML model files
│   ├── models/                       # Pydantic schemas
│   ├── processors/                   # File type handlers
│   │   ├── image_processor.py
│   │   ├── video_processor.py
│   │   ├── audio_processor.py
│   │   ├── document_processor.py
│   │   ├── spreadsheet_processor.py
│   │   ├── archive_processor.py
│   │   ├── executable_processor.py
│   │   └── apk_processor.py
│   ├── rules/
│   │   ├── built_in/                 # Default YARA rules
│   │   └── custom/                   # Organization-specific rules
│   ├── services/                     # Analysis services
│   │   ├── clam_av.py
│   │   ├── yara_scan.py
│   │   ├── hash_lookup.py
│   │   └── ...
│   ├── workflows/
│   │   └── evidence_analysis.py      # Main orchestration
│   ├── main.py                       # FastAPI app
│   └── requirements.txt
│
├── 📂 user-chatbot-backend/          # Chatbot Service (Express)
│   ├── blockchain/                   # Smart contracts
│   │   ├── contracts/
│   │   │   └── RiskAnalysis.sol
│   │   └── hardhat.config.ts
│   ├── src/
│   │   ├── config/                   # DB connections
│   │   ├── routes/                   # API routes
│   │   └── ...
│   └── package.json
│
├── 📂 user-dashboard-frontend-backend/  # User Portal (React)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/                      # API client
│   │   └── utils/
│   └── package.json
│
├── 📂 user-registration-frontend-backend/  # Auth Service
│   ├── server/                       # Express backend
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── src/                          # React frontend
│   │   ├── components/
│   │   │   └── auth/
│   │   └── pages/
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### File Scanning Microservice

#### Analyze Evidence

```http
POST /analyze
Content-Type: application/json

{
  "complaint_id": "COMP-2025-001234"
}
```

**Response:**

```json
{
  "status": "processing",
  "message": "Evidence analysis started for 3 file(s)",
  "complaint_id": "COMP-2025-001234"
}
```

### Admin Backend

#### Health Check

```http
GET /api/health
```

#### Get Complaints

```http
GET /api/complaints
Authorization: Bearer <token>
```

### User Registration

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

---

## 🧪 Testing

```bash
# Admin Backend Tests
cd admin-dashboard-backend
npm test

# Blockchain Tests
cd user-chatbot-backend/blockchain
npx hardhat test

# Python Tests
cd file-scanning-microservice
pytest
```

---

## 🔒 Security Considerations

- **Authentication:** JWT-based with secure httpOnly cookies
- **Rate Limiting:** Protection against DDoS and brute-force attacks
- **Input Validation:** Pydantic (Python) & Zod (TypeScript) schemas
- **File Scanning:** Multi-layer malware detection
- **Blockchain Audit:** Immutable evidence chain for legal compliance
- **Environment Security:** No secrets in codebase, `.env` files for configuration

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team Black Order

<p align="center">
  <img src="https://img.shields.io/badge/🏆_Team-Black_Order-8B0000?style=for-the-badge&logo=marvel&logoColor=white" alt="Team Black Order">
  <img src="https://img.shields.io/badge/🥇_SIH_2025-WINNERS-FFD700?style=for-the-badge" alt="SIH 2025 Winners">
</p>

<table align="center">
  <tr>
    <td align="center" width="200">
      <a href="https://github.com/Soy-7">
        <img src="https://github.com/Soy-7.png" width="100" height="100" style="border-radius: 50%;" alt="SaiShravan P"/><br />
        <sub><b>SaiShravan P</b></sub>
      </a><br />
      <a href="https://github.com/Soy-7"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/sai-shravan-p/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/srihari-codes">
        <img src="https://github.com/srihari-codes.png" width="100" height="100" style="border-radius: 50%;" alt="Srihari P"/><br />
        <sub><b>Srihari P</b></sub>
      </a><br />
      <a href="https://github.com/srihari-codes"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/iamsrihari"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/rakavip2-bot">
        <img src="https://github.com/rakavip2-bot.png" width="100" height="100" style="border-radius: 50%;" alt="Rakavi P"/><br />
        <sub><b>Rakavi P</b></sub>
      </a><br />
      <a href="https://github.com/rakavip2-bot"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/iamrakavi"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
  </tr>
  <tr>
    <td align="center" width="200">
      <a href="https://github.com/BennyhinnTitus">
        <img src="https://github.com/BennyhinnTitus.png" width="100" height="100" style="border-radius: 50%;" alt="Bennyhinn Titus D"/><br />
        <sub><b>Bennyhinn Titus D</b></sub>
      </a><br />
      <a href="https://github.com/BennyhinnTitus"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/bennyhinn-titus"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/Rake-5105">
        <img src="https://github.com/Rake-5105.png" width="100" height="100" style="border-radius: 50%;" alt="Rakesh Kannan C K"/><br />
        <sub><b>Rakesh Kannan C K</b></sub>
      </a><br />
      <a href="https://github.com/Rake-5105"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/rakesh005/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/SaiMohanRam">
        <img src="https://github.com/SaiMohanRam.png" width="100" height="100" style="border-radius: 50%;" alt="Sai Mohana Ram D"/><br />
        <sub><b>Sai Mohana Ram D</b></sub>
      </a><br />
      <a href="https://github.com/SaiMohanRam"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github" alt="GitHub"/></a>
      <a href="https://www.linkedin.com/in/sai-mohana-ram-d-610a53267/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
    </td>
  </tr>
</table>

<p align="center">
  <sub>🏆 <strong>Smart India Hackathon 2025 Winners</strong> 🏆</sub>
</p>

---

<p align="center">
  <strong>Built with ❤️ for a safer digital India</strong>
</p>
