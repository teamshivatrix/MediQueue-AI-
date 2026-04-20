# 🏥 MediQueue AI — Autonomous Hospital Healthcare & Resources Allocation System

> **AI-powered smart OPD management system** for government hospitals — automates appointment scheduling, queue management, and resource allocation with real-time precision.

🔗 **Live Demo:** [https://mediqueue-ai.vercel.app](https://mediqueue-ai.vercel.app)

---

## 📸 Screenshots

| Landing Page | Admin Dashboard | Patient Queue |
|---|---|---|
| Light UI with hospital background | Real-time charts & analytics | Live token tracking |

---

## ✨ Key Features

### 👤 Patient Panel
- 🔐 Secure login / signup with OTP password reset
- 📅 Smart appointment booking with AI department suggestion
- 🤖 AI Chatbot (Meera) — Hinglish conversational assistant
- 🧠 AI Symptom Analyzer — suggests department from symptoms
- 🎫 Live Queue Board — real-time token tracking
- 📋 My Records — appointments, prescriptions, billing
- 🚑 Emergency booking — no login required
- 🚨 Ambulance request with GPS location
- 🔔 Real-time notifications when appointment is cancelled
- 🎙️ Voice input for symptoms (Web Speech API)

### 🛡️ Admin Panel
- 📊 Real-time dashboard with charts (Chart.js)
- 👨‍⚕️ Doctor management — schedule, slots, availability
- 🏥 Patient appointment management with priority queue
- 💊 Prescription management with AI drug interaction checker
- 🧪 Hospital reports (Diagnostic / Lab / Ward)
- 🛏️ Bed management with occupancy tracking
- 📺 TV Display mode for hospital queue boards
- 🚑 Ambulance request management with SSE alerts
- ⭐ Patient feedback & doctor ratings
- 📤 CSV export of daily appointments
- 🔔 Real-time new appointment & cancellation alerts

### 🤖 AI Features
- Groq LLaMA 3.3 70B — chatbot + symptom analysis
- Patient risk scoring (low/medium/high/emergency)
- Smart appointment scheduling
- Medicine interaction checker
- Automated SMS reminders (queue position)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS, Chart.js, GSAP |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (with in-memory fallback) |
| **AI** | Groq API (LLaMA 3.3 70B) |
| **File Storage** | Cloudinary |
| **SMS** | Twilio / Fast2SMS |
| **Deployment** | Vercel (Serverless) |
| **Real-time** | SSE (Server-Sent Events) + Polling fallback |

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/mediqueue-ai.git
cd mediqueue-ai

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your MongoDB URI, Groq API key, Cloudinary credentials

# Start server
npm start
```

Open: `http://localhost:3000`

- **Patient Portal:** `http://localhost:3000/patient/index.html`
- **Admin Panel:** `http://localhost:3000/admin/admin-login.html`
- **Admin Login:** `admin` / `admin123`

---

## 📁 Project Structure

```
mediqueue-ai/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # SMS, AI services
│   └── server.js        # Express app
├── frontend-patient/    # Patient portal
├── frontend-admin/      # Admin panel
├── api/
│   └── index.js         # Vercel serverless entry
└── vercel.json          # Deployment config
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/queue` | Live queue data |
| POST | `/api/ai/analyze-symptoms` | AI symptom analysis |
| POST | `/api/ai/chat` | AI chatbot |
| POST | `/api/ai/risk-score` | Patient risk scoring |
| POST | `/api/ambulance/request` | Request ambulance |
| GET | `/api/appointments/stats` | Dashboard statistics |

---

## 👥 Team

Built for **Smart India Hackathon / College Project Competition**

---

## 📄 License

MIT License — Free to use for educational purposes.
