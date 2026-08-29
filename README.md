# 💰 FinTrack — AI-Powered Personal Finance Tracker

A full-stack, AI-driven personal finance management application that helps users track income and expenses, manage budgets, generate financial reports, and receive intelligent spending insights — all in one place.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Pages & Components](#pages--components)
- [Database Models](#database-models)
- [AI Features](#ai-features)
- [Reports & PDF Export](#reports--pdf-export)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**FinTrack** is a MERN-stack web application designed to simplify personal finance tracking. Users can sign up, log their daily transactions, set monthly budgets, view interactive charts, and leverage an AI layer (powered by OpenAI GPT) to get personalised spending insights and expense predictions.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Authentication | Secure JWT-based signup / login with bcrypt password hashing |
| 📊 Dashboard | Visual summary of income, expenses, savings, and budget status |
| 💳 Transactions | Add, edit, delete, and filter income/expense transactions |
| 🗂️ Budget Management | Set and track monthly budgets with real-time remaining balance |
| 🤖 AI Insights | GPT-powered analysis of spending habits and personalised tips |
| 🔮 Expense Prediction | AI-based forecast of upcoming spending patterns |
| 📄 Reports | Monthly financial reports with category breakdown |
| 📥 PDF Export | Download a formatted A4 PDF report for any month |
| 👤 Profile | View and update user profile information |

---

## 🛠️ Tech Stack

### Frontend (Client)

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **React Router DOM v7** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Recharts** | Interactive charts and graphs |
| **Tailwind CSS v4** | Utility-first styling |

### Backend (Server)

| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcrypt** | Password hashing |
| **OpenAI SDK** | GPT-based AI features |
| **PDFKit** | PDF report generation |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting (300 req / 15 min) |

---

## 📁 Project Structure

```
Finance-Tracker/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ai/             # AI insight components
│   │   │   ├── budget/         # Budget UI components
│   │   │   ├── common/         # Shared / generic components
│   │   │   ├── dashboard/      # Dashboard widgets
│   │   │   ├── layout/         # Navbar, Sidebar, etc.
│   │   │   ├── reports/        # Report components
│   │   │   └── transactions/   # Transaction list & form
│   │   ├── config/             # API base URL & Axios config
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── redux/              # Redux slices & store
│   │   ├── routes/             # Route definitions & guards
│   │   ├── services/           # API service functions
│   │   └── utils/              # Helper utilities
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                     # Express backend
    ├── config/                 # Database config
    ├── controllers/            # Route handler logic
    │   ├── authController.js
    │   ├── transactionController.js
    │   ├── budgetController.js
    │   ├── dashboardController.js
    │   ├── reportController.js
    │   └── aiController.js
    ├── middleware/             # Auth & error middleware
    ├── models/                 # Mongoose schemas
    │   ├── User.js
    │   ├── Transaction.js
    │   └── Budget.js
    ├── routes/                 # Express route files
    ├── services/               # Business logic (AI service, etc.)
    ├── utils/                  # Shared utility functions
    ├── app.js                  # Express app setup
    ├── server.js               # Entry point
    └── .env.example            # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** — A running local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

---

### Environment Variables

The server uses a `.env` file. Copy the example and fill in your values:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and configure:

```env
NODE_ENV=development
PORT=5000

# Your MongoDB connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fintrack

# A long, random secret string for signing JWTs
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Your OpenAI API key
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# The URL where your frontend runs (used for CORS)
FRONTEND_URL=http://localhost:5173
```

> **Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

### Installation

Install dependencies for **both** the client and server.

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

---

### Running the App

You need to run the **server** and **client** in two separate terminals.

**Terminal 1 — Start the backend:**
```bash
cd server
npm run dev
```
The API server starts at `http://localhost:5000`.

**Terminal 2 — Start the frontend:**
```bash
cd client
npm run dev
```
The React app opens at `http://localhost:5173`.

---

## 🔌 API Reference

All API routes are prefixed with `/api`. Authentication routes are public; all others require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and receive a JWT |

### Transactions — `/api/transactions`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all transactions (supports filters) |
| `POST` | `/` | Create a new transaction |
| `PUT` | `/:id` | Update a transaction |
| `DELETE` | `/:id` | Delete a transaction |

### Budget — `/api/budget`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get current budget settings |
| `POST` | `/` | Create or update the monthly budget |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get aggregated dashboard summary data |

### Reports — `/api/reports`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/monthly` | Get monthly report as JSON |
| `GET` | `/monthly/download` | Download monthly report as PDF |

### AI — `/api/ai`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/insights` | Generate AI spending insights |
| `GET` | `/predict` | Predict next month's expenses |

---

## 📱 Pages & Components

| Page | Route | Description |
|---|---|---|
| **Login** | `/login` | User login form |
| **Signup** | `/signup` | New user registration form |
| **Dashboard** | `/` | Overview — charts, summary cards, recent activity |
| **Transactions** | `/transactions` | Full transaction list with add / edit / delete and filtering |
| **Budget** | `/budget` | Set monthly budget; view spending vs. budget progress |
| **Reports** | `/reports` | Monthly financial report with PDF download |
| **Insights** | `/insights` | AI-generated spending analysis and recommendations |
| **Profile** | `/profile` | User account information and settings |

---

## 🗄️ Database Models

### User

| Field | Type | Description |
|---|---|---|
| `name` | String | Full name of the user |
| `email` | String | Unique email address |
| `password` | String | Bcrypt-hashed password |
| `createdAt` | Date | Account creation timestamp |

### Transaction

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Reference to the owning user |
| `type` | String | `"income"` or `"expense"` |
| `title` | String | Short description of the transaction |
| `amount` | Number | Monetary value (non-negative) |
| `category` | String | Category label (e.g., Food, Rent, Salary) |
| `paymentMethod` | String | `cash`, `card`, `upi`, `bank_transfer`, `wallet`, `other` |
| `description` | String | Optional longer note |
| `transactionDate` | Date | When the transaction occurred |

### Budget

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Reference to the owning user |
| `monthlyBudget` | Number | Total monthly spending limit |

---

## 🤖 AI Features

FinTrack integrates with the **OpenAI API** (default model: `gpt-4o-mini`) to provide two AI-powered features:

### Spending Insights (`/api/ai/insights`)

Sends the user's full transaction history and current budget to GPT. The model returns:
- A summary of spending patterns across categories
- Categories where overspending is detected
- Personalised saving recommendations and actionable tips

### Expense Prediction (`/api/ai/predict`)

Analyses historical transaction data to forecast upcoming expenses, helping users plan their budget proactively before the month ends.

> **Cost note:** AI features consume OpenAI API credits. Monitor usage on the [OpenAI dashboard](https://platform.openai.com/usage).

---

## 📄 Reports & PDF Export

The **Reports** page lets users select any month and year to view:

- Total Income, Total Expense, and Net Savings
- Remaining monthly budget
- Category-wise expense breakdown (sorted highest to lowest)
- Complete transaction list for the selected period

Clicking **Download PDF** calls `/api/reports/monthly/download`, which streams a professionally formatted **A4 PDF** document — built server-side with **PDFKit** — directly to the browser. The PDF includes:

- FinTrack header with month/year
- Colour-coded financial summary
- Category breakdown table with alternating row shading
- Full transaction table with dates, titles, categories, and amounts
- Auto page-break support for long transaction lists
- Generated-on timestamp footer

---

## ☁️ Deployment

### Frontend — Vercel (Recommended)

The client folder includes a `vercel.json` for single-page app routing support.

1. Push the repo to GitHub.
2. Import the project on [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `client`.
4. Add the environment variable `VITE_API_BASE_URL` pointing to your deployed backend URL.
5. Deploy.

### Backend — Render / Railway / any Node.js host

1. Deploy the `server/` folder to your preferred Node.js hosting provider.
2. Set all environment variables from `.env.example` in the host's dashboard.
3. Ensure `FRONTEND_URL` is set to your deployed frontend origin so CORS is correctly configured.
4. The health check endpoint `GET /health` can be used for uptime monitoring.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request.

Please ensure your code follows the existing style and that ESLint passes:

```bash
# In the client directory
npm run lint
```

---

## 📜 License

This project is licensed under the **ISC License**.

---

<div align="center">
  Built with ❤️ using React, Node.js, MongoDB & OpenAI
</div>
