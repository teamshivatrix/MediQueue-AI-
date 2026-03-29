# MediQueue AI

MediQueue AI is an AI-assisted hospital queue management system for OPD workflows. It helps patients book appointments online, estimates waiting times, recommends departments from symptoms, and gives admins a live operational dashboard.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## Why This Project

Government hospitals often face long registration queues, uncertain waiting times, and limited visibility into doctor load. MediQueue AI digitizes this flow with:

- online appointment booking and tokening
- real-time queue insights
- AI triage assistance for symptom routing
- admin controls for doctor and queue operations

## Core Features

- Smart booking flow with department, doctor, date, and time slot selection
- Auto-generated token number and estimated waiting time
- AI symptom analyzer with provider support: Gemini, OpenAI, and built-in fallback
- AI chatbot for hospital guidance and booking help
- Admin login with token session verification
- Live dashboard stats: total, waiting, in-progress, completed, avg wait
- Doctor management (create, read, update, delete)
- Public queue display board for current and upcoming patients
- MongoDB persistence with automatic in-memory fallback

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript, Chart.js
- Backend: Node.js, Express
- Database: MongoDB + Mongoose (optional; in-memory fallback available)
- AI: Google Gemini, OpenAI, and rule-based fallback
- Auth: lightweight admin token session in server memory

## Project Structure

```text
.
|-- backend/
|   |-- server.js
|   |-- database/
|   |   `-- database-config.js
|   |-- models/
|   |   |-- Appointment.js
|   |   `-- Doctor.js
|   `-- routes/
|       |-- ai.js
|       |-- appointments.js
|       `-- doctors.js
|-- frontend/
|   |-- index.html
|   |-- booking.html
|   |-- symptom-analyzer.html
|   |-- chatbot.html
|   |-- admin-login.html
|   |-- admin-dashboard.html
|   |-- doctor-management.html
|   |-- queue-display.html
|   |-- css/
|   |   `-- styles.css
|   `-- js/
|       |-- main.js
|       |-- booking.js
|       |-- symptom-analyzer.js
|       |-- chatbot.js
|       |-- admin-dashboard.js
|       |-- doctor-management.js
|       `-- queue-display.js
|-- package.json
`-- README.md
```

## Getting Started

### 1) Clone and install

```bash
git clone https://github.com/<your-username>/mediqueue-ai.git
cd mediqueue-ai
npm install
```

### 2) Configure environment

Create a `.env` file in the project root:

```env
PORT=3000

# Optional: MongoDB Atlas URI. If missing/invalid, app runs in-memory mode.
MONGODB_URI=

# AI provider: gemini | openai | fallback
AI_PROVIDER=fallback

# Optional AI keys
GEMINI_API_KEY=
OPENAI_API_KEY=

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3) Run

```bash
npm start
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/admin-dashboard.html`

## API Overview

### Appointments

- `POST /api/appointments` - create appointment
- `GET /api/appointments` - l
- `PATCH /api/appointments/:id/status` - update appointment status
- `POST /api/appointments/predict-waiting-time` - estimate waiting time
- `GET /api/appointments/stats` - dashboard analytics
- `GET /api/appointments/queue` - queue display payloist appointments with optional filtersad

### Doctors

- `POST /api/doctors` - add doctor
- `GET /api/doctors` - list doctors (by department/availability)
- `GET /api/doctors/:id` - fetch doctor by id
- `PUT /api/doctors/:id` - update doctor
- `DELETE /api/doctors/:id` - remove doctor

### AI

- `POST /api/ai/analyze-symptoms` - symptom triage and priority suggestion
- `POST /api/ai/chat` - assistant chat for hospital-related help

### Admin

- `POST /api/admin/login` - login and get session token
- `POST /api/admin/verify` - verify token
- `POST /api/admin/logout` - logout and invalidate token

## Data and Runtime Notes

- If MongoDB is unavailable, the app automatically switches to in-memory storage.
- In-memory mode is demo-friendly but resets data on server restart.
- On startup, demo doctors and appointments are seeded for quick testing.
- Admin sessions are stored in memory and expire automatically.

## Demo User Flow

1. Patient uses symptom analyzer for department suggestion.
2. Patient books appointment, receives token and estimated wait.
3. Admin monitors queue and updates statuses.
4. Public queue display reflects current serving and upcoming tokens.

## Security Notes

- Do not commit real API keys or database credentials.
- Use environment variables and rotate keys if they are exposed.
- Replace default admin credentials before production use.

## Built For

Smart India Hackathon style OPD digitization use case: reducing queue friction, improving triage quality, and increasing admin visibility.

## License

MIT

