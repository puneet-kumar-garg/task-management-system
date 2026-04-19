# TaskFlow — Full-Stack Task Management System

> Made by **Puneet**, **Adarsh**, **Riya** and **Saurav**

A complete team task management app built with **React**, **Node.js/Express**, and **MySQL**.

---

## Folder Structure

```
task-manager/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth + validation
│   │   └── routes/         # Express routers
│   ├── schema.sql          # MySQL schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI (Layout, TaskCard, TaskModal)
│       ├── context/        # Auth + Theme context
│       ├── pages/          # Dashboard, Tasks, Teams, Activity, Profile
│       └── utils/          # API client, helpers
└── README.md
```

---

## Prerequisites

- Node.js >= 18
- MySQL >= 8.0
- npm or yarn

---

## Setup Instructions

### 1. Database

```bash
mysql -u root -p < backend/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT_SECRET
npm install
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

> The frontend proxies `/api` requests to `http://localhost:5000` via the `proxy` field in `package.json`.

---

## Environment Variables (backend/.env)

| Variable       | Description                        | Default         |
|----------------|------------------------------------|-----------------|
| PORT           | Server port                        | 5000            |
| DB_HOST        | MySQL host                         | localhost       |
| DB_USER        | MySQL user                         | root            |
| DB_PASSWORD    | MySQL password                     | —               |
| DB_NAME        | Database name                      | task_manager    |
| JWT_SECRET     | Secret key for JWT signing         | change this!    |
| JWT_EXPIRES_IN | Token expiry                       | 7d              |

---

## API Endpoints

### Auth
| Method | Endpoint          | Description        | Auth |
|--------|-------------------|--------------------|------|
| POST   | /api/auth/signup  | Register user      | No   |
| POST   | /api/auth/login   | Login              | No   |
| GET    | /api/auth/me      | Get current user   | Yes  |

### Tasks
| Method | Endpoint                  | Description              | Auth |
|--------|---------------------------|--------------------------|------|
| GET    | /api/tasks                | List tasks (filterable)  | Yes  |
| GET    | /api/tasks/stats          | Task statistics          | Yes  |
| GET    | /api/tasks/:id            | Get single task          | Yes  |
| POST   | /api/tasks                | Create task              | Yes  |
| PUT    | /api/tasks/:id            | Update task              | Yes  |
| PATCH  | /api/tasks/:id/status     | Update status only       | Yes  |
| DELETE | /api/tasks/:id            | Delete task              | Yes  |

**Query params for GET /api/tasks:** `status`, `priority`, `search`, `team_id`

### Teams
| Method | Endpoint                        | Description        | Auth |
|--------|---------------------------------|--------------------|------|
| GET    | /api/teams                      | List my teams      | Yes  |
| GET    | /api/teams/:id                  | Team + members     | Yes  |
| POST   | /api/teams                      | Create team        | Yes  |
| POST   | /api/teams/:id/members          | Add member         | Yes  |
| DELETE | /api/teams/:id/members/:userId  | Remove member      | Yes  |
| DELETE | /api/teams/:id                  | Delete team        | Yes  |

### Users
| Method | Endpoint            | Description       | Auth |
|--------|---------------------|-------------------|------|
| GET    | /api/users/search   | Search users      | Yes  |
| GET    | /api/users/profile  | Get profile       | Yes  |
| PUT    | /api/users/profile  | Update profile    | Yes  |

### Activity
| Method | Endpoint       | Description        | Auth |
|--------|----------------|--------------------|------|
| GET    | /api/activity  | Get activity logs  | Yes  |

---

## Database Schema

```
users          → id, name, email, password, avatar, created_at
teams          → id, name, description, owner_id, created_at
team_members   → id, team_id, user_id, role, joined_at
tasks          → id, title, description, status, priority, deadline,
                 creator_id, assignee_id, team_id, created_at, updated_at
activity_logs  → id, user_id, action, entity_type, entity_id, created_at
```

---

## Features

- JWT authentication with bcrypt password hashing
- Create / edit / delete tasks with title, description, priority, deadline
- Mark tasks complete / incomplete with one click
- Filter tasks by status, priority, keyword search
- Overdue task highlighting (red border + badge)
- Team creation, member management (add by email, remove)
- Assign tasks to team members
- Activity log for all task actions
- Dark mode toggle (persisted in localStorage)
- Responsive sidebar layout (mobile-friendly)
- Toast notifications for all actions
