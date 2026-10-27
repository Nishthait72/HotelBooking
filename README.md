# HotelPro – Hotel Management System

> 🌐 **Live Demo URL**: [https://nishthait72.github.io/HotelBooking/](https://nishthait72.github.io/HotelBooking/)  
> 🔗 **GitHub Repository**: [https://github.com/Nishthait72/HotelBooking](https://github.com/Nishthait72/HotelBooking)

HotelPro is a modern, minimal, and scalable MERN stack web application designed for boutique hotels and large hotel chains. It streamlines room reservations, real-time occupancy tracking, guest directory management, payment processing, and staff task workflows through an intuitive, responsive interface with robust role-based authentication.

---

## 🏗️ Tech Stack

- **Frontend**: React (JSX), Vite, Bootstrap 5, Bootstrap Icons, React Router v6
- **Backend**: Node.js, Express.js (REST API)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Security**: Role-Based Access Control (RBAC), sanitized inputs, conflict prevention algorithms

---

## 👥 User Roles & Access Control

| Feature / Page | Guest | Staff | Admin |
| :--- | :---: | :---: | :---: |
| Browse Rooms & Check Availability | ✅ | ✅ | ✅ |
| Book Room & View Own Reservations | ✅ | ✅ | ✅ |
| Manage All Reservations (Check-in/out) | ❌ | ✅ | ✅ |
| Room Inventory CRUD (Add / Edit / Delete) | ❌ | View / Edit Status | Full CRUD |
| Guest Directory & Stay History | ❌ | ✅ | ✅ |
| Process & Record Booking Payments | Own only | ✅ | ✅ |
| Staff Task & Workflow Management | ❌ | ✅ (Execute) | ✅ (Assign / CRUD) |
| Executive Performance Dashboard | Guest View | Operations View | Full Metrics |

---

## 🌟 Core Features & Modules

1. **Authentication & Security**
   - JWT-based authentication with protected frontend and backend routes.
   - Salted password hashing with `bcryptjs`.
   - Distinct roles: `Admin`, `Staff`, and `Guest`.
   - One-click demo credential filling on the login page for rapid testing.

2. **Room Inventory Management**
   - Room categorisation: Single, Double, Deluxe, and Presidential Suite.
   - Live status tracking: `available`, `booked`, and `maintenance`.
   - Pricing, capacity, floor, amenities, and high-resolution photo gallery.
   - Admin room creation, updating, and deletion with active reservation safeguards.

3. **Booking & Reservation Engine**
   - Real-time date availability checker with automatic double-booking conflict prevention.
   - Reservation creation with instant nights and total amount calculation.
   - Reservation lifecycle management: `confirmed` &rarr; `checked_in` &rarr; `checked_out` / `cancelled`.
   - Automatic room status synchronization upon guest check-in or checkout.

4. **Guest Profile & Stay Directory**
   - Centralized guest contact records (name, email, phone, address).
   - Identity document tracking (Passport, Driving License, National ID).
   - Complete historical stay timeline and past bookings per guest.

5. **Billing & Payment Processing**
   - Instant or front-desk payment recording (`Credit Card`, `Debit Card`, `Cash`, `UPI`, `Online Transfer`).
   - Partial payment tracking and automatic invoice status updates (`paid`, `partial`, `unpaid`).
   - Official receipt voucher viewer with print capability.

6. **Staff Task & Workflow Management**
   - Housekeeping, maintenance, and VIP guest service assignments.
   - Task priority flags: `Low`, `Medium`, and `High`.
   - Lifecycle progression: `Pending` &rarr; `In Progress` &rarr; `Completed`.

---

## 📁 Repository Structure

```text
HotelBooking/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB connection configuration
│   ├── middleware/
│   │   └── auth.js          # JWT verification & RBAC authorization
│   ├── models/
│   │   ├── User.js          # User model (Admin, Staff, Guest)
│   │   ├── Room.js          # Room inventory model
│   │   ├── Guest.js         # Guest profiles & identity documents
│   │   ├── Booking.js       # Booking model with conflict index
│   │   ├── Payment.js       # Transaction & payment records
│   │   └── Task.js          # Staff workflow task model
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Me, Staff list
│   │   ├── rooms.js         # Room inventory CRUD & filters
│   │   ├── bookings.js      # Availability search, booking lifecycle
│   │   ├── guests.js        # Guest registry & history
│   │   ├── payments.js      # Payment ledger & receipts
│   │   ├── tasks.js         # Staff task management
│   │   └── stats.js         # Dashboard aggregated metrics
│   ├── .env.example         # Environment template
│   ├── package.json
│   ├── seed.js              # Database seeder with demo accounts & rooms
│   └── server.js            # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Global responsive navigation
│   │   │   └── ProtectedRoute.jsx   # Role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication & session provider
│   │   ├── pages/
│   │   │   ├── Login.jsx            # User sign-in with 1-click test fill
│   │   │   ├── Register.jsx         # User registration
│   │   │   ├── Dashboard.jsx        # Role-tailored metrics & overview
│   │   │   ├── Rooms.jsx            # Room catalog & Admin management
│   │   │   ├── Bookings.jsx         # Availability search & reservations
│   │   │   ├── Guests.jsx           # Guest directory & stay records
│   │   │   ├── Payments.jsx         # Financial ledger & receipts
│   │   │   └── StaffTasks.jsx       # Housekeeping & staff task board
│   │   ├── services/
│   │   │   └── api.js               # Centralized HTTP client
│   │   ├── App.jsx                  # Main router setup
│   │   ├── index.css                # Custom modern styling
│   │   └── main.jsx                 # React root bootstrap
│   ├── index.html
│   ├── package.json
│   └── vite.config.js               # Vite config with API proxy
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: Local MongoDB instance (e.g. `mongodb://127.0.0.1:27017/hotelpro`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Nishthait72/HotelBooking.git
cd HotelBooking
```

---

### Step 2: Configure & Start Backend

1. Navigate into the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt: `copy .env.example .env`)*

   Default `.env` settings:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/hotelpro
   JWT_SECRET=hotelpro_super_secret_jwt_key_2026_secure
   NODE_ENV=development
   ```
   *(If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string).*

4. Seed the database with demo accounts, rooms, bookings, and tasks:
   ```bash
   npm run seed
   ```

5. Launch the backend API server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:5000`.*

---

### Step 3: Configure & Start Frontend

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000` (or `http://localhost:5173`).*

---

## 🔑 Demo Login Credentials

The `npm run seed` command automatically populates test accounts across all roles:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hotelpro.com` | `Admin@123` | Full administrative control (Rooms CRUD, Staff tasks, Analytics, Bookings, Guests, Payments) |
| **Staff** | `staff@hotelpro.com` | `Staff@123` | Front-desk operations (Check-in, Check-out, Housekeeping tasks, Guest directory, Payments) |
| **Guest** | `guest@hotelpro.com` | `Guest@123` | Customer portal (Browse rooms, Check availability, Book rooms, View stay history) |

*Tip: You can also use the one-click demo login buttons directly on the Login page.*

---

## 📡 API Reference Overview

### Auth (`/api/auth`)
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login & receive JWT token
- `GET /api/auth/me` – Retrieve authenticated user profile *(Private)*
- `GET /api/auth/staff` – List staff members *(Admin/Staff)*

### Rooms (`/api/rooms`)
- `GET /api/rooms` – List rooms with filtering (`type`, `status`, `search`)
- `GET /api/rooms/:id` – Retrieve single room details
- `POST /api/rooms` – Create new room *(Admin only)*
- `PUT /api/rooms/:id` – Update room information or status *(Admin/Staff)*
- `DELETE /api/rooms/:id` – Delete room *(Admin only)*

### Bookings (`/api/bookings`)
- `GET /api/bookings/check-availability` – Query real-time availability for date ranges
- `GET /api/bookings` – List bookings *(Filtered by user for Guests, all for Staff/Admin)*
- `GET /api/bookings/:id` – Get booking details with payment ledger
- `POST /api/bookings` – Create reservation with conflict checking
- `PUT /api/bookings/:id/status` – Update booking status (`checked_in`, `checked_out`, etc.)
- `PUT /api/bookings/:id/cancel` – Cancel reservation

### Guests (`/api/guests`)
- `GET /api/guests` – Search & list guest directory *(Staff/Admin)*
- `GET /api/guests/:id` – Guest profile with complete stay history
- `POST /api/guests` – Register a new guest profile
- `PUT /api/guests/:id` – Update guest details

### Payments (`/api/payments`)
- `GET /api/payments` – Payment history ledger
- `POST /api/payments` – Record payment for booking
- `GET /api/payments/:id` – View payment receipt voucher

### Tasks (`/api/tasks`)
- `GET /api/tasks` – Staff workflow task list
- `POST /api/tasks` – Create & assign staff task
- `PUT /api/tasks/:id` – Update task status (`in_progress`, `completed`, `pending`)
- `DELETE /api/tasks/:id` – Delete task *(Admin only)*

### Stats (`/api/stats`)
- `GET /api/stats/dashboard` – Real-time KPI metrics, occupancy percentages, and revenue data

---

## 🔒 Security & Data Integrity

- **Strict Date Validation**: Check-out date must always be after check-in date.
- **Double-Booking Prevention**: Compound index and interval overlap verification ensure a room is never booked twice for the same dates.
- **Password Encryption**: All passwords stored using bcrypt with 10 salt rounds.
- **JWT Protection**: Protected routes require valid Bearer token in the `Authorization` header.
