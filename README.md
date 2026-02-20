# Bhagavad Gita Class Attendance Tracker

<!-- Working Version v1 -->

A full-stack web application to track weekly attendance for families attending Bhagavad Gita classes.

## Tech Stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)

## Features

- Attendance submission with family autocomplete
- Duplicate detection (one submission per family per day)
- Admin dashboard with weekly reports
- Family attendance history and regularity tracking
- Absence alerts for families missing 2+ weeks
- CSV export for attendance data
- Mobile-responsive design

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in the details
3. Wait for the project to be provisioned
4. Go to **Settings > API** and copy:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon / public** key (this is your `SUPABASE_ANON_KEY`)

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `database/schema.sql` and click **Run**
4. This creates the `families` and `attendance` tables with proper constraints and RLS policies

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_PASSWORD=choose-a-secure-password
PORT=5000
```

### 4. Install Dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 5. Run Locally

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`. The Vite dev server proxies API requests to the Express backend on port 5000.

---

## Project Structure

```
gita-attendance-tracker/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── AbsenceAlerts.jsx
│   │   │   ├── FamilyHistory.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── WeeklyReport.jsx
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx
│   │   │   └── AttendancePage.jsx
│   │   ├── utils/
│   │   │   └── api.js       # API client functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/                  # Express backend
│   ├── routes/
│   │   ├── alerts.js        # Absence alert endpoints
│   │   ├── attendance.js    # Attendance submission
│   │   ├── families.js      # Family CRUD & search
│   │   └── reports.js       # Weekly reports & CSV export
│   ├── middleware/
│   │   └── auth.js          # Admin password auth
│   ├── utils/
│   │   └── supabase.js      # Supabase client
│   ├── index.js
│   └── package.json
├── database/
│   └── schema.sql           # Database migration script
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/attendance` | No | Submit attendance |
| GET | `/api/families/search?query=` | No | Search families (autocomplete) |
| GET | `/api/families/:id` | No | Get family details |
| POST | `/api/families` | No | Create/update a family |
| GET | `/api/reports/weekly?date=` | Admin | Weekly attendance report |
| GET | `/api/reports/family/:id` | Admin | Family attendance history |
| GET | `/api/reports/export` | Admin | Export CSV |
| GET | `/api/alerts/absent` | Admin | Families absent 2+ weeks |

Admin endpoints require the `x-admin-password` header.

---

## Deployment

### Frontend (Vercel)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Set **Root Directory** to `client`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable:
   - `VITE_API_URL` = your backend URL (e.g., `https://your-api.onrender.com`)

Then update `client/src/utils/api.js` to use:
```js
const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

### Backend (Render)

1. Go to [render.com](https://render.com), create a new **Web Service**
2. Connect your repo, set **Root Directory** to `server`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `npm start`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
6. Update the CORS config in `server/index.js` to allow your Vercel domain

---

## Notes

- All timestamps use AEDT (Australia/Sydney timezone)
- Duplicate attendance is prevented per family per day
- The admin password is checked via a simple header-based auth
