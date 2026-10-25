# 💼 Employee Payroll Management System (MERN Stack)

A production-grade, enterprise-ready **Employee Payroll Management System** built with the **MERN** stack (**M**ongoDB, **E**xpress.js, **R**eact.js with Vite & Tailwind CSS, **N**ode.js). Designed for HR departments and payroll administrators to manage employee records, track daily attendance, automate complex payroll calculations with attendance-linked deductions, download vector PDF payslips, export financial reports, and monitor key HR analytics.

---

## 🌟 Highlights & Key Features

- **🔐 Secure Admin Authentication**:
  - Protected with JWT (JSON Web Tokens) and 12-round bcrypt password hashing.
  - No insecure public signups. Admin account created exclusively via a protected CLI seed script.
  - Express rate limiting (10 requests/15 mins for login) against brute-force attacks.
  - Session persistence with auto-attach `Authorization: Bearer <token>` Axios interceptors and auto-logout on token expiration (401).

- **👥 Employee Directory (CRUD & Profiles)**:
  - Auto-generated sequential Employee IDs (e.g., `EMP-1001`, `EMP-1002`).
  - Search by Name, Email, or Employee ID with real-time debouncing.
  - Filtering by Department (Engineering, HR, Finance, Marketing, Sales, Operations) and Status (Active/Inactive).
  - Server-side and client-side pagination.
  - Quick status toggle (Active/Inactive) with confirmation modal.
  - Full employee detail view showing personal details, department, bank account, and salary structure.

- **📅 Attendance Management**:
  - Daily check-in & status logger (`Present`, `Absent`, `Half-Day`, `Leave`).
  - Compound MongoDB unique index `{ employee: 1, date: 1 }` strictly preventing duplicate attendance records on the same day.
  - Monthly attendance summary calculating Total Calendar Days, Total Working Days, Present Days, Half-Days, Approved Leaves, Unpaid Absences, and Net Payable Days (`Present + Leave + (Half-Day * 0.5)`).
  - Employee attendance history modal with date filtering.

- **💰 Robust Payroll Engine**:
  - Dynamic monthly payroll generation from active employee base salaries and attendance records.
  - **Decimal-Safe Monetary Arithmetic**: Zero floating-point rounding bugs using 2-decimal safe rounding helper.
  - **Attendance-Linked Deductions**: Automatically calculates unpaid leave penalties:
    $$\text{Deduction} = \left(\frac{\text{Basic Salary}}{\text{Working Days}}\right) \times \text{Unpaid Days}$$
  - Full breakdown of Earnings (Basic, HRA, Medical, Conveyance, Allowances, Overtime, Bonus) and Deductions (Tax, PF, ESI, Unpaid Leave).
  - **Strict 3-Stage Approval Lifecycle**: `Draft` ➔ `Finalized` ➔ `Paid`.
  - Accidental modification protection: `Finalized` and `Paid` records are locked. Edits require explicit admin audit unlocking.

- **📄 Vector Payslips & Business Reports**:
  - Professional, crisp PDF payslips generated with `jsPDF` and `jspdf-autotable`. Includes company header, employee details, working days, itemized earnings, itemized deductions, net pay in bold, and admin signature block.
  - 4 exportable business reports:
    1. **Monthly Payroll Summary Report** (Total gross, deductions, net paid).
    2. **Employee Roster Report** (Staff master list with employment details).
    3. **Department Budget Report** (Headcount, average salary, total monthly expenditure by department).
    4. **Attendance Summary Report** (Working days, present rate, payable days).
  - Direct 1-click **CSV spreadsheet exports** (`?format=csv`) and client-side download capabilities.

- **📊 Modern Admin Dashboard & Analytics**:
  - Real-time KPI summary cards: Total Employees, Active Staff, Monthly Payroll Expense, Today's Attendance count.
  - Interactive **Recharts 6-Month Payroll Expense Trend** chart.
  - Today's Live Attendance breakdown (Present, Absent, Leave, Half-Day).
  - Quick-action shortcuts and recent activity feed.

- **⚙️ Configurable Company Settings**:
  - Company profile (Company Name, Address, Contact Email, Currency Symbol).
  - Payroll rules (Default Standard Working Days, Default Tax Deduction Rate).
  - Secure in-app Admin Password Change with current password verification.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                 REACT 18 SINGLE PAGE APP                    │
│   Vite 5 • Tailwind CSS 3 • Lucide React • Recharts • jsPDF │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (Axios + JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 NODE.JS & EXPRESS.JS SERVER                 │
│  Helmet • CORS • Morgan • Rate Limiting • Express Validator │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM 8
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       MONGODB DATABASE                      │
│   Admins • Employees • Attendances • Payrolls • Settings    │
│   (Built-in Memory Server Fallback for instant evaluation)  │
└─────────────────────────────────────────────────────────────┘
```

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | v18+ / v20+ | Backend runtime environment |
| **Framework** | Express.js | 4.19.2 | RESTful API server & static SPA host |
| **Database** | MongoDB & Mongoose | 8.3.1 | Primary NoSQL document database |
| **Database Fallback**| `mongodb-memory-server` | 9.1.8 | In-memory dev fallback when no local daemon is running |
| **Frontend Core** | React.js & Vite | 18.2.0 / 5.2.0 | Ultra-fast client SPA framework & bundler |
| **Styling** | Tailwind CSS | 3.4.3 | Responsive modern utility-first styling |
| **Routing** | React Router DOM | 6.23.0 | Client-side declarative routing & protected routes |
| **Data Viz** | Recharts | 2.12.6 | Interactive SVG charts & historical trend analytics |
| **PDF Generation** | jsPDF + autotable | 2.5.1 / 3.8.2 | Client-side vector payslip document renderer |
| **Security** | bcryptjs & jsonwebtoken | 2.4.3 / 9.0.2 | Password hashing & stateless admin authentication |

---

## 📁 Repository Directory Structure

```text
employee_payroll_system/
├── client/                           # React 18 + Vite frontend
│   ├── public/                       # Favicons, logo, static assets
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── DataTable.jsx         # Generic table with search, filter, pagination
│   │   │   ├── Navbar.jsx            # Top navigation header & user menu
│   │   │   ├── ProtectedRoute.jsx    # Client auth gate for private routes
│   │   │   ├── Sidebar.jsx           # Responsive admin navigation sidebar
│   │   │   └── StatCard.jsx          # KPI analytics card with trend badge
│   │   ├── context/                  # React Context providers
│   │   │   └── AuthContext.jsx       # Global admin auth state & session methods
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx       # Common layout wrapping sidebar & header
│   │   ├── pages/                    # Application page views
│   │   │   ├── AddEmployee.jsx       # Employee creation form
│   │   │   ├── Attendance.jsx        # Attendance check-in & monthly summaries
│   │   │   ├── Dashboard.jsx         # Executive analytics dashboard
│   │   │   ├── EditEmployee.jsx      # Employee record modifier
│   │   │   ├── EmployeeDetails.jsx   # Detailed employee profile view
│   │   │   ├── Employees.jsx         # Employee directory with filters
│   │   │   ├── Login.jsx             # Admin login form
│   │   │   ├── NotFound.jsx          # 404 error page
│   │   │   ├── Payroll.jsx           # Payroll generator & lifecycle manager
│   │   │   ├── Payslips.jsx          # Payslip viewer & PDF downloader
│   │   │   ├── Reports.jsx           # 4 business reports with CSV export
│   │   │   ├── SalaryDetails.jsx     # Detailed individual payslip breakdown
│   │   │   └── Settings.jsx          # Company & payroll preferences & password
│   │   ├── services/                 # Centralized Axios API services
│   │   │   ├── api.js                # Axios instance with auth interceptor
│   │   │   ├── attendanceService.js  # Attendance endpoints
│   │   │   ├── authService.js        # Auth & password change endpoints
│   │   │   ├── employeeService.js    # Employee CRUD endpoints
│   │   │   ├── payrollService.js     # Payroll calculation & status endpoints
│   │   │   └── reportService.js      # Reports, CSV export & dashboard endpoints
│   │   ├── utils/                    # Client utility helpers
│   │   │   ├── formatCurrency.js     # Localized currency formatter
│   │   │   ├── formatDate.js         # Date formatting utilities
│   │   │   └── generatePayslipPdf.js # Vector PDF payslip layout generator
│   │   ├── App.jsx                   # React Router routing tree
│   │   ├── index.css                 # Tailwind CSS styles & custom badges
│   │   └── main.jsx                  # React DOM root entry
│   ├── index.html                    # Single Page Application HTML root
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── postcss.config.js             # PostCSS Tailwind config
│   ├── tailwind.config.js            # Tailwind typography & colors
│   └── vite.config.js                # Vite build & proxy config
│
├── server/                           # Express.js REST API server
│   ├── config/
│   │   └── db.js                     # Mongoose connection with Memory fallback
│   ├── controllers/                  # Express route controllers
│   │   ├── attendanceController.js   # Attendance check-in & summary logic
│   │   ├── authController.js         # Login, verification & password update
│   │   ├── employeeController.js     # Employee CRUD & status toggle logic
│   │   ├── payrollController.js      # Payroll generate, update, status workflow
│   │   ├── reportController.js       # Reports aggregation & CSV export logic
│   │   └── settingsController.js     # Company settings retrieve & update
│   ├── middleware/                   # Express middlewares
│   │   ├── authMiddleware.js         # JWT verification & admin extraction
│   │   └── errorMiddleware.js        # 404 handler & centralized error handler
│   ├── models/                       # Mongoose schemas
│   │   ├── Admin.js                  # Admin user model
│   │   ├── Attendance.js             # Daily attendance record model
│   │   ├── Employee.js               # Employee master model
│   │   ├── Payroll.js                # Monthly payroll ledger model
│   │   └── Settings.js               # Company & payroll configuration model
│   ├── routes/                       # Express route declarations
│   │   ├── attendanceRoutes.js       # /api/attendance
│   │   ├── authRoutes.js             # /api/auth
│   │   ├── employeeRoutes.js         # /api/employees
│   │   ├── payrollRoutes.js          # /api/payroll
│   │   ├── reportRoutes.js           # /api/reports
│   │   └── settingsRoutes.js         # /api/settings
│   ├── services/
│   │   ├── payrollService.js         # Decimal-safe payroll computation engine
│   │   └── reportService.js          # Aggregation pipelines for CSV reports
│   ├── utils/
│   │   ├── e2eTest.js                # Automated 32-step end-to-end test runner
│   │   ├── generateEmployeeId.js     # EMP-1001 sequential ID generator
│   │   ├── generatePayslip.js        # Server-side payslip text generator
│   │   ├── seedAdmin.js              # Dedicated admin seeding CLI utility
│   │   └── seedData.js               # Full realistic demo dataset generator
│   ├── .env                          # Server environment configuration
│   ├── .env.example                  # Server environment template
│   ├── app.js                        # Express app setup, routes, static SPA serving
│   ├── package.json                  # Backend dependencies & scripts
│   └── server.js                     # HTTP server bootstrapper
│
├── .gitignore                        # Git exclusion rules
├── package.json                      # Workspace root scripts
└── README.md                         # Comprehensive documentation manual
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js**: `v18.0.0` or higher (`v20.18.0` recommended). Verify with `node -v`.
2. **npm**: `v9.0.0` or higher. Verify with `npm -v`.
3. **MongoDB**:
   - *Option A*: Local MongoDB service running at `mongodb://127.0.0.1:27017`.
   - *Option B*: Remote MongoDB Atlas connection URI.
   - *Option C (Zero Setup)*: If no MongoDB instance is detected, the server **automatically starts a high-performance in-memory MongoDB database** (`mongodb-memory-server`). The system works out-of-the-box immediately without installing MongoDB!

---

### Step 1: Environment Configuration

The application includes pre-configured `.env` files. You can customize them or verify them:

**Backend (`server/.env`)**:
```ini
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/employee_payroll_db
JWT_SECRET=super_secret_jwt_key_payroll_system_2026_antigravity
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env`)**:
```ini
VITE_API_URL=http://localhost:5000/api
```

---

### Step 2: Install Dependencies

From the project root directory:
```bash
npm run install:all
```
*(Or install separately inside `server/` and `client/` using `npm install`)*.

---

### Step 3: Seed Database

#### A. Seed the Default Admin Account
To create or update the default administrator account:
```bash
npm run seed:admin
```
**Default Administrator Credentials**:
- **Email**: `admin@payroll.com`
- **Password**: `Admin@12345`

#### B. Seed Full Realistic Demo Data (Optional but Recommended)
To populate 6 realistic employees across different departments, generate a full month of daily attendance logs, and compute draft payroll records:
```bash
npm run seed
```

---

### Step 4: Run the Application

#### Mode 1: Development Mode (with Hot Reload / HMR)
Run both backend and frontend concurrently in two separate terminal windows:

**Terminal 1 (Backend API Server)**:
```bash
npm run dev:server
```
*API server runs at `http://localhost:5000` with nodemon auto-restart.*

**Terminal 2 (Frontend React App)**:
```bash
npm run dev:client
```
*Vite dev server opens at `http://localhost:5173` with instant Hot Module Replacement.*

Open your browser at **`http://localhost:5173`** and log in!

---

#### Mode 2: Production Mode (Unified Single-Port Deployment)
In production, Express serves both the backend API **and** the optimized React SPA bundle from `client/dist` on a single port (`5000`):

```bash
# 1. Build the React frontend
npm run build

# 2. Start the unified production server
npm run start
```
Open your browser at **`http://localhost:5000`**. The entire application is hosted from port 5000!

---

## 🧪 Automated End-to-End Testing

The project includes a comprehensive, automated 32-step test suite in [`server/utils/e2eTest.js`](file:///d:/employee_payroll_system/server/utils/e2eTest.js) that validates the full stack without requiring a browser:

```bash
npm run test:e2e
```

### What the Test Suite Verifies:
1. **API Health & Database Connectivity** (`GET /api/health`).
2. **Admin Authentication**:
   - Unauthorized access rejection (401).
   - Invalid password rejection (401).
   - Valid JWT token generation on login (200).
   - Current admin identity extraction (`GET /api/auth/me`).
3. **Employee Management CRUD**:
   - Validation failures on missing required fields (400).
   - Successful creation of employee with auto-generated ID `EMP-1001` (201).
   - Duplicate email rejection (400).
   - Fetching employee directory with pagination & search (200).
   - Updating employee salary and department details (200).
   - Toggling active/inactive status (200).
4. **Attendance Management**:
   - Daily attendance logging with `Present`, `Absent`, `Half-Day`, and `Leave` (201).
   - **Compound Unique Index Test**: Verifies that logging attendance twice on the same day for an employee is blocked with 400.
   - Monthly attendance summary calculation with net payable days computation (200).
5. **Payroll Engine & Math Verification**:
   - Dynamic payroll generation for active employees (201).
   - Attendance-linked unpaid leave deduction formula verification:
     $$\text{Deduction} = \left(\frac{\text{Basic Salary}}{\text{Working Days}}\right) \times \text{Unpaid Days}$$
   - Net pay calculation: $\text{Gross} - \text{Total Deductions}$.
   - Decimal-safe monetary arithmetic checks.
   - Approval lifecycle transitions: `Draft` ➔ `Finalized` ➔ `Paid` (200).
   - **Immutability Lock Test**: Verifies that editing a `Finalized` or `Paid` payroll record is blocked with 400.
   - Audit re-open feature: authorized transition back to `Draft` (200).
6. **Reports & Exports**:
   - Monthly Payroll Summary Report in JSON (200).
   - Department Budget Expenditure Report in JSON (200).
   - Direct CSV export with proper MIME type `text/csv` and header attachments (200).
7. **Settings & Admin Security**:
   - Fetching system configuration (200).
   - Updating company title, currency, and standard working days (200).
   - Password change with old password verification (200).
   - Login verification with updated credentials.

**Test Run Output**:
```text
==================================================
  🏁 E2E TEST SUMMARY: 32 / 32 Passed (100%)
==================================================
🎉 ALL 32 E2E TESTS COMPLETED SUCCESSFULLY!
```

---

## 📡 REST API Reference

All protected endpoints require the following HTTP Header:
```http
Authorization: Bearer <your_jwt_token>
```

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login. Returns JWT token and admin info. (Rate limited) |
| `GET` | `/api/auth/me` | Admin | Get currently authenticated admin details |
| `PUT` | `/api/auth/change-password` | Admin | Change admin password (requires `currentPassword`) |

### 2. Employees (`/api/employees`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Admin | List employees with `search`, `department`, `status`, `page`, `limit` |
| `POST` | `/api/employees` | Admin | Create employee (auto-assigns sequential ID `EMP-xxxx`) |
| `GET` | `/api/employees/:id` | Admin | Get single employee profile by MongoDB `_id` |
| `PUT` | `/api/employees/:id` | Admin | Update employee details |
| `PATCH`| `/api/employees/:id/status` | Admin | Toggle active/inactive employment status |
| `DELETE`| `/api/employees/:id` | Admin | Soft/Hard delete employee record |

### 3. Attendance (`/api/attendance`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance` | Admin | Record or update daily attendance log |
| `GET` | `/api/attendance/daily` | Admin | Get all employee attendance records for a specific `?date=YYYY-MM-DD` |
| `GET` | `/api/attendance/summary` | Admin | Get monthly attendance metrics (`?month=1-12&year=YYYY`) |
| `GET` | `/api/attendance/employee/:id` | Admin | Get an employee's historical attendance records |

### 4. Payroll (`/api/payroll`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payroll/generate` | Admin | Compute monthly payroll batch for active employees |
| `GET` | `/api/payroll` | Admin | List payroll records with `month`, `year`, `department`, `status` filters |
| `GET` | `/api/payroll/:id` | Admin | Get detailed payroll calculation breakdown |
| `PUT` | `/api/payroll/:id` | Admin | Edit draft allowances/bonuses/deductions (Locked if Finalized/Paid) |
| `PATCH`| `/api/payroll/:id/status` | Admin | Transition status (`Draft` ➔ `Finalized` ➔ `Paid` or re-open to `Draft`) |
| `POST` | `/api/payroll/bulk-status` | Admin | Bulk update statuses (e.g. approve entire month) |

### 5. Reports & Analytics (`/api/reports`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | Admin | Get live dashboard KPI stats, today's attendance, 6-month budget trends |
| `GET` | `/api/reports/monthly-payroll` | Admin | Get monthly payroll summary (`?month=&year=&format=json|csv`) |
| `GET` | `/api/reports/employee-roster` | Admin | Master employee roster with department and salaries (`?format=json|csv`) |
| `GET` | `/api/reports/department-budget`| Admin | Departmental budget breakdown and headcounts (`?format=json|csv`) |
| `GET` | `/api/reports/attendance-summary`| Admin | Monthly attendance metrics report (`?month=&year=&format=json|csv`) |

### 6. Settings (`/api/settings`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Admin | Retrieve company profile and payroll defaults |
| `PUT` | `/api/settings` | Admin | Update company name, address, tax rate, standard working days |

---

## 🧮 Payroll Mathematical Formulae

The system implements strict financial rounding to 2 decimal places using `Math.round(val * 100) / 100` to prevent IEEE 754 floating-point errors (e.g., `0.1 + 0.2 !== 0.3`).

1. **Gross Salary**:
   $$\text{Gross} = \text{Basic} + \text{HRA} + \text{Medical} + \text{Conveyance} + \text{Other Allowances} + \text{Overtime Pay} + \text{Bonus}$$

2. **Unpaid Leave Deduction**:
   $$\text{Per Day Rate} = \frac{\text{Basic Salary}}{\text{Standard Working Days}}$$
   $$\text{Unpaid Days} = \text{Absent Days} + (\text{Half-Days} \times 0.5) + \text{Unapproved Leaves}$$
   $$\text{Leave Deduction} = \text{Per Day Rate} \times \text{Unpaid Days}$$

3. **Total Deductions**:
   $$\text{Total Deductions} = \text{Tax (TDS)} + \text{Provident Fund (PF)} + \text{Health Insurance (ESI)} + \text{Leave Deduction} + \text{Other Deductions}$$

4. **Net Payable Salary**:
   $$\text{Net Pay} = \text{Gross Salary} - \text{Total Deductions}$$

---

## 🚢 Deployment Strategies

### Option 1: Single Docker Container

Create a `Dockerfile` in the root:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=build /app/client/dist ../client/dist
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```
Build and run:
```bash
docker build -t employee-payroll-system .
docker run -p 5000:5000 -e MONGO_URI="mongodb+srv://..." employee-payroll-system
```

### Option 2: Cloud Platforms (Render / Railway)
1. **Build Command**: `npm install && npm run build:client && cd server && npm install`
2. **Start Command**: `node server/server.js`
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=<your_mongodb_atlas_connection_string>`
   - `JWT_SECRET=<your_strong_random_secret>`

### Option 3: Traditional Linux VPS with PM2 & NGINX
```bash
# 1. Install dependencies & build
npm run install:all
npm run build

# 2. Run under PM2 process manager
pm2 start server/server.js --name "payroll-system" --env production
pm2 save
pm2 startup
```

---

## 🔒 Security Best Practices Implemented

- **Password Protection**: Salting and hashing via `bcryptjs` with a cost factor of 12.
- **Stateless Tokens**: Signed JSON Web Tokens with strict expiration (`JWT_EXPIRE`).
- **HTTP Header Hardening**: Secured with `helmet` for DNS prefetch control, frameguard (anti-clickjacking), HSTS, no-sniff, and XSS filtering.
- **CORS Restricted**: Controlled origin whitelisting preventing unauthorized cross-site scripting.
- **Brute-Force Rate Limiting**: Express rate limit on sensitive routes.
- **Immutability of Finalized Financial Records**: Payroll records marked `Finalized` or `Paid` reject payload changes to safeguard against tampering.
- **Auditing**: Authorized transition back to `Draft` is explicitly tracked.

---

## 📄 License & Attribution

Developed with ❤️ by the **Antigravity Senior MERN Stack Team**.
Licensed under the [ISC License](LICENSE). Free for enterprise and commercial use.
