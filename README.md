# 🏥 MediQueue AI — AI-Powered Government Hospital Check-up Scheduler

> Smart digital platform that revolutionizes hospital queue management using AI-powered scheduling, symptom analysis, and real-time predictions.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Express](https://img.shields.io/badge/Express-4.x-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen) ![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI-purple)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

The project runs **out of the box** with in-memory storage and a built-in AI fallback — no database or API keys needed for demo!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Online Appointment Booking** | Book appointments with doctor selection, time slots, and instant confirmation |
| 🧠 **AI Symptom Analyzer** | Enter symptoms → AI recommends department & priority level |
| ⏱️ **Smart Queue Prediction** | Real-time waiting time calculation based on queue data |
| 🔔 **Browser Notifications** | Instant booking confirmations via browser notifications |
| 🤖 **AI Helpdesk Chatbot** | Ask about doctors, timings, bookings, and hospital services |
| 📊 **Admin Dashboard** | Live charts showing patient flow, department load, and queue stats |
| 👨‍⚕️ **Doctor Management** | Add/edit doctors, set schedules, manage availability |
| 📺 **Real-Time Queue Display** | Live queue board showing currently serving and waiting patients |

---

## 🧱 Tech Stack

- **Frontend:** HTML5, TailwindCSS (custom), Vanilla JavaScript, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (with in-memory fallback)
- **AI:** Google Gemini API / OpenAI API (with built-in rule-based fallback)
- **Notifications:** Browser Notification API

---

## 📁 Project Structure

```
mediqueue-ai/
├── backend/
│   ├── server.js              # Main Express server
│   ├── database/
│   │   └── database-config.js # MongoDB connection
│   ├── models/
│   │   ├── Appointment.js     # Appointment schema
│   │   └── Doctor.js          # Doctor schema
│   └── routes/
│       ├── appointments.js    # Appointment API
│       ├── doctors.js         # Doctor API
│       └── ai.js              # AI endpoints
├── frontend/
│   ├── index.html             # Home page
│   ├── booking.html           # Appointment booking
│   ├── symptom-analyzer.html  # AI symptom analyzer
│   ├── chatbot.html           # AI chatbot
│   ├── admin-dashboard.html   # Admin dashboard
│   ├── doctor-management.html # Doctor management
│   ├── queue-display.html     # Queue display board
│   ├── css/
│   │   └── styles.css         # Custom styles & animations
│   └── js/
│       ├── main.js            # Shared utilities
│       ├── booking.js         # Booking logic
│       ├── symptom-analyzer.js
│       ├── chatbot.js
│       ├── admin-dashboard.js
│       ├── doctor-management.js
│       └── queue-display.js
├── package.json
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/appointments` | Create new appointment |
| `GET` | `/api/appointments` | Get all appointments (with filters) |
| `GET` | `/api/appointments/stats` | Dashboard statistics |
| `GET` | `/api/appointments/queue` | Queue display data |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status |
| `POST` | `/api/appointments/predict-waiting-time` | Predict waiting time |
| `POST` | `/api/doctors` | Add new doctor |
| `GET` | `/api/doctors` | Get all doctors |
| `PUT` | `/api/doctors/:id` | Update doctor |
| `DELETE` | `/api/doctors/:id` | Delete doctor |
| `POST` | `/api/ai/analyze-symptoms` | AI symptom analysis |
| `POST` | `/api/ai/chat` | AI chatbot |

---

## 🤖 AI Configuration (Optional)

The project works with a built-in rule-based AI. For enhanced AI responses:

### Google Gemini (Recommended — Free tier)
1. Get API key: https://aistudio.google.com/apikey
2. Edit `.env`:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   ```

### OpenAI
1. Get API key: https://platform.openai.com/api-keys
2. Edit `.env`:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_key_here
   ```

---

## 🗃️ MongoDB Configuration (Optional)

Default: runs with in-memory storage (data resets on restart).

For persistent storage:
1. Create free MongoDB Atlas cluster: https://www.mongodb.com/atlas
2. Edit `.env`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mediqueue
   ```

---

## 🎯 Demo Flow

1. **Patient visits** → Opens home page
2. **Enters symptoms** → AI Symptom Analyzer suggests department
3. **Books appointment** → Selects doctor, time, confirms booking
4. **Gets confirmation** → Token number, wait time prediction, browser notification
5. **Admin monitors** → Dashboard shows real-time charts and statistics
6. **Queue display** → Shows currently serving and waiting patients

---

## 📱 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with features overview |
| Book Appointment | `/booking.html` | Multi-field booking form with AI assist |
| Symptom Analyzer | `/symptom-analyzer.html` | AI-powered department recommendation |
| AI Chatbot | `/chatbot.html` | Conversational hospital assistant |
| Admin Dashboard | `/admin-dashboard.html` | Analytics with Chart.js visualizations |
| Doctor Management | `/doctor-management.html` | CRUD operations for doctors |
| Queue Display | `/queue-display.html` | Real-time queue board (dark theme) |

---

## 🎨 Design

- Hospital theme: Blue/Teal/Green gradient palette
- Glassmorphism UI components
- Smooth CSS animations & transitions
- Fully responsive (Mobile → Desktop)
- Chart.js visualizations (Bar, Line, Pie, Doughnut)
- Toast notifications with slide-in animation
- Animated counters and progress bars

---

## 👥 Team

Built for **Smart India Hackathon** — MediQueue AI Team

---

## 📄 License

MIT License
