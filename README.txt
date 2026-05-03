==========================================================
  TEAM TASK MANAGER — Full-Stack Web Application
==========================================================

LIVE URL: [Deploy to Railway and paste URL here]
GITHUB:   [Your GitHub repo link]

----------------------------------------------------------
  OVERVIEW
----------------------------------------------------------
A full-stack team task manager with role-based access control
(Admin / Member), real-time task tracking, Kanban boards,
and a dashboard with live statistics.

----------------------------------------------------------
  TECH STACK
----------------------------------------------------------
Backend:
  - Node.js + Express.js
  - MongoDB + Mongoose
  - JWT Authentication
  - bcryptjs for password hashing

Frontend:
  - React 18 + Vite
  - React Router v6
  - Axios (API calls)
  - Tailwind CSS
  - react-hot-toast (notifications)
  - date-fns (date formatting)

----------------------------------------------------------
  KEY FEATURES
----------------------------------------------------------
✓ Auth: Register/Login with JWT tokens (7-day expiry)
✓ Role-based access: Admin and Member roles
✓ Projects: Create, view, delete projects (admin only)
✓ Members: Add/remove project members (admin only)
✓ Tasks: Full CRUD with priority, due date, assignee
✓ Kanban board: To Do / In Progress / Done columns
✓ Task completion flow:
    - Member marks task as complete → submits for review
    - Admin sees completed tasks on dashboard for review
✓ Dashboard: Live stats (total, completed, pending, overdue)
✓ My Tasks: Members see only their assigned tasks grouped by status
✓ Filters: Filter tasks by status, priority, project
✓ Overdue detection: Tasks past due date are flagged

----------------------------------------------------------
  ROLES & PERMISSIONS
----------------------------------------------------------
ADMIN:
  - View all projects and all tasks globally
  - Create / delete projects
  - Add / remove project members
  - Create tasks, assign to any project member
  - Update any task (status, priority, due date, assignee)
  - Delete any task
  - See dashboard with global stats + completed task review

MEMBER:
  - View only projects they are a member of
  - View only tasks assigned to them
  - Update status of their OWN assigned tasks
  - Mark tasks as complete (triggers review prompt)
  - See personal dashboard with their task stats

----------------------------------------------------------
  PROJECT STRUCTURE
----------------------------------------------------------
team-task-manager/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/db.js           # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   └── middleware/
│       ├── authMiddleware.js   # JWT protect
│       └── roleMiddleware.js   # adminOnly
└── frontend/
    └── src/
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── ProjectsPage.jsx
        │   ├── ProjectDetailPage.jsx
        │   ├── TasksPage.jsx
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        ├── components/
        │   ├── layout/
        │   └── tasks/
        ├── context/AuthContext.jsx
        └── api/axiosInstance.js

----------------------------------------------------------
  API ENDPOINTS
----------------------------------------------------------
Auth:
  POST /api/auth/register     — Register (name, email, password, role)
  POST /api/auth/login        — Login
  GET  /api/auth/me           — Get current user

Users (admin only):
  GET  /api/users             — List all users

Projects:
  GET    /api/projects        — List projects (admin: all, member: theirs)
  POST   /api/projects        — Create project (admin only)
  GET    /api/projects/:id    — Get project
  PUT    /api/projects/:id    — Update project (admin only)
  DELETE /api/projects/:id    — Delete project + tasks (admin only)
  POST   /api/projects/:id/members         — Add member (admin only)
  DELETE /api/projects/:id/members/:userId — Remove member (admin only)

Tasks:
  GET    /api/tasks                 — All tasks (admin) / project tasks
  GET    /api/tasks/my-tasks        — My assigned tasks (member)
  GET    /api/tasks/dashboard/stats — Dashboard stats
  POST   /api/tasks                 — Create task (admin only)
  GET    /api/tasks/:id             — Get task
  PUT    /api/tasks/:id             — Update (admin: all fields; member: status only, own tasks)
  DELETE /api/tasks/:id             — Delete (admin or task creator)

----------------------------------------------------------
  LOCAL SETUP
----------------------------------------------------------
Prerequisites: Node.js 18+, MongoDB Atlas or local MongoDB

1. Clone the repository
   git clone <repo-url>
   cd team-task-manager

2. Backend setup:
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and set:
   #   MONGO_URI=mongodb+srv://...
   #   JWT_SECRET=your_secret_key_here
   #   JWT_EXPIRES_IN=7d
   #   PORT=5000
   npm run dev

3. Frontend setup (new terminal):
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env:
   #   VITE_API_URL=http://localhost:5000/api
   npm run dev

4. Open http://localhost:5173

----------------------------------------------------------
  RAILWAY DEPLOYMENT
----------------------------------------------------------
Backend:
  1. Create new Railway project → Deploy from GitHub
  2. Select the /backend folder as root
  3. Set environment variables in Railway dashboard:
     MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN=7d, PORT=5000
  4. Railway auto-deploys on git push

Frontend:
  1. Create another Railway service → Deploy from /frontend
  2. Set VITE_API_URL=https://your-backend-url.railway.app/api
  3. Build command: npm run build
  4. Start command: npx serve dist

----------------------------------------------------------
  FIRST-TIME SETUP (After Deployment)
----------------------------------------------------------
1. Register a user with role "admin" → this is the admin account
2. Register more users with role "member"
3. Login as admin → Create a project → Add members
4. Create tasks and assign them to members
5. Login as a member → Go to "My Tasks" → Mark tasks complete

==========================================================
