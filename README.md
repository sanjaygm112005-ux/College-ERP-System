# Full-Stack College ERP Management System

A complete, modern, responsive College ERP Management System built with React, Node.js, Express, and Supabase.

---

## 🚀 Technologies

* **Frontend**: React.js, Vite, Tailwind CSS, Lucide React (Icons), Recharts (Visualizations), Canvas Confetti
* **Backend**: Node.js, Express.js, REST API
* **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth)

---

## 📂 Folder Structure

```text
college-erp/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── context/          # Authentication context
│   │   ├── layouts/          # Responsive Sidebar / Header
│   │   ├── pages/            # Role-based pages (Student, Faculty, Admin)
│   │   ├── services/         # Axios and Supabase client configs
│   │   ├── App.jsx           # Main routing definition
│   │   └── main.jsx
│   └── package.json
│
├── backend/                  # Node.js + Express API
│   ├── config/               # Supabase client instantiation
│   ├── middleware/           # JWT Verification & Role authorization
│   ├── routes/               # API endpoints
│   ├── scripts/              # DB seeding script
│   ├── server.js             # Express application entry
│   └── package.json
│
├── database/
│   └── schema.sql            # PostgreSQL DDL and DB triggers
│
├── .env.example              # Environment variables template
└── README.md                 # Setup instructions
```

---

## 🔒 User Roles & Features

### 👨‍💼 Admin
* Create, update, and delete Students & Faculty
* Configure Departments & Subjects
* Plan Weekly Timetable classes
* Review and override Student Leave requests
* Post targeted Announcements (notices)
* Manage billing & tuition Fees invoicing
* Create examination terms

### 👩‍🏫 Faculty
* Mark daily Student Attendance (PRESENT / ABSENT) with roster history edits
* Create examinations and upload student scores (automatic grades evaluation)
* View assigned subjects and class lists
* Audit today's teaching schedules
* Approve or decline student leaves in their department with remarks

### 👨‍🎓 Student
* Personal profile check
* Circular attendance progress metric gauge (presence rate analytics)
* Timetable slot lookup
* Mark sheets (internal & external exam results)
* Fee balance tracking (due payments)
* File Leave applications and check approval history
* Dashboard Announcements

---

## 🛠️ Configuration & Database Setup

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a free project.
2. Navigate to the **SQL Editor** tab in the Supabase Dashboard.
3. Paste the entire contents of [database/schema.sql](database/schema.sql) and run it. This will create all PostgreSQL tables, indexes, and sync triggers.

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```ini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
PORT=5000
```
> **IMPORTANT**: The backend Express API utilizes the `SUPABASE_SERVICE_ROLE_KEY` to securely trigger Admin Auth endpoints (like creating and deleting student/faculty login profiles) and bypassing RLS.

On the frontend, create `frontend/.env`:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:5000/api
```

---

## 📥 Installation & Seeding

### Backend API
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Seed the database with mock accounts (1 Admin, 3 Faculty, 10 Students, courses, timetables, and invoices):
   ```bash
   npm run seed
   ```

### Frontend Client
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

---

## 🚀 Running the Project

To start the servers:

### Start Backend API
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000` with hot-reloading via `nodemon`.

### Start Frontend Client
```bash
cd frontend
npm run dev
```
The client app will launch on `http://localhost:3000`.

---

## 🔑 Demo Account Credentials

Default passwords are formatted as `Role@123` (e.g. `Admin@123`, `Faculty@123` or `Student@123`):
* **Admin**: `admin@college.edu`
* **Faculty (CSE)**: `faculty1@college.edu`
* **Student (CSE)**: `student1@college.edu`
