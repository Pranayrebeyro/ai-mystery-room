# 🕵️ AI Mystery Room

An AI-powered detective mystery game where players investigate fictional crime scenes, examine clues, request hints, identify suspects, and solve mysteries generated using Google's Gemini AI.

## 🚀 Project Overview

AI Mystery Room allows users to create and investigate unique detective mysteries based on their own story premises.

Players must carefully analyze suspects, discover hidden clues, use hints strategically, and identify the actual culprit before submitting their final accusation.

The application uses Gemini AI to dynamically generate mystery scenarios according to the selected difficulty level.

## ✨ Features

- **AI-Powered Mystery Generation:** Generate unique detective stories using Google Gemini.
- **Multiple Difficulty Levels:** Choose between Easy, Medium, and Hard.
- **Dynamic Suspect Generation:** Each mystery includes suspects with descriptions and alibis.
- **Interactive Clue Investigation:** Discover hidden clues to uncover important evidence.
- **Progressive Hint System:** Unlock hints when you need assistance.
- **Suspect Accusation:** Select and accuse the suspected culprit.
- **Automatic Score Calculation:** Earn points for discovering clues and solving mysteries.
- **Final Mystery Revelation:** View the actual culprit and the complete solution explanation.

## 🎮 Difficulty Levels

| Difficulty | Suspects | Clues | Hints | Correct Accusation Bonus |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

## 🧮 Scoring System

- Discovering a clue: +5 points.
- Using a hint: -10 points.
- Correct accusation: Difficulty-based bonus.
- Incorrect accusation: No additional bonus.
- Minimum score: 0 points.

All scoring calculations are handled by the backend.

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Google Gemini API
- Zod

## 📁 Project Structure

```text
ai-mystery-room/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-mystery-room.git
cd ai-mystery-room
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory.

Configure the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/cases` | Generate a new mystery |
| GET | `/api/cases/:id` | Retrieve an active mystery |
| POST | `/api/cases/:id/clues/:clueId/discover` | Discover a clue |
| POST | `/api/cases/:id/hints` | Request the next hint |
| POST | `/api/cases/:id/accuse` | Submit a suspect accusation |
| GET | `/api/health` | Check backend health |

## 🔐 Security

- Gemini API credentials are stored in backend environment variables.
- MongoDB connection credentials are not exposed in frontend code.
- Culprit information and solution explanations remain on the backend until the player submits an accusation.
- Environment files are excluded from Git tracking.

## 🧪 Testing

The application has been tested locally for:

- Mystery generation.
- Suspect and clue generation.
- Hidden clue descriptions.
- Clue discovery and score updates.
- Hint usage and score deductions.
- Suspect accusations.
- Final culprit revelation.
- Easy difficulty gameplay.

## 🌐 Deployment

Deployment configuration and live application links will be added after deployment.

**Frontend:** Coming soon.

**Backend:** Coming soon.

## 👨‍💻 Author

**Pranay Rebeyro**

Electronics and Communication Engineering Graduate | 2026

GitHub: https://github.com/Pranayrebeyro

---

*AI Mystery Room — Every clue matters. Every suspect has a secret. Can you solve the mystery?*