# 🚀 TaskFlow – Team Task Manager

A full-stack team task management application where users can collaborate on projects, assign tasks, and track progress in real time. Designed with role-based access control and a clean dashboard experience.

---

## 🌐 Live Demo

🔗 https://taskflow-frontend-production-0bf2.up.railway.app/login

---

## ✨ Features

### 🔐 Authentication

* User signup & login using JWT
* Secure password hashing with bcrypt
* Persistent login sessions

### 👥 Role-Based Access Control

* **Admin**

  * Create projects
  * Add members
  * Assign tasks
* **Member**

  * View assigned tasks
  * Update task status
  * Cannot create tasks or projects

### 📁 Project Management

* Create and manage multiple projects
* Assign team members to projects

### ✅ Task Management

* Create, assign, update, and delete tasks
* Task status: `To Do`, `In Progress`, `Done`
* Priority levels: High, Medium, Low

### 📊 Dashboard

* Total tasks
* Completed tasks
* Pending tasks
* Overdue tasks
* Recent activity overview

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

### Deployment

* Railway (Frontend + Backend)

---

## 📂 Project Structure

```bash
TaskFlow_Team_Task_Manager/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   └── index.html
```

---

## ⚙️ Environment Variables

### Backend (`.env`)

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_secret
PORT=5000
```

### Frontend (`.env`)

```env
VITE_API_URL=https://your-backend-url/api
```

---

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/shantanumohod23/TaskFlow_Team_Task_Manager.git
cd TaskFlow_Team_Task_Manager
```

---

### 2. Setup Backend

```bash
cd backend
npm install
npm run dev
```

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Admin Access

To create an admin account:

* Enter the correct **Admin Secret** during signup
* Admin Secret is stored securely in backend environment variables

---

## 🧠 Key Highlights

* Secure role-based authorization system
* Defensive frontend coding to prevent runtime crashes
* RESTful API design
* Fully deployed and production-ready application

---

## 📸 Demo Flow

* Register (Admin / Member)
* Login
* Create Project (Admin)
* Add Members
* Assign Tasks
* Update Task Status
* View Dashboard

---

## 👨‍💻 Author

**Shantanu Mohod**
🔗 https://github.com/shantanumohod23

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and feel free to contribute!

---
