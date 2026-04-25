# 🎓 Smart Campus Operations Hub
**IT3030 – PAF Assignment 2026 | Group XX**

## 📌 Project Overview
A web platform to manage university facility bookings 
and maintenance/incident handling.

## 🛠️ Tech Stack
- **Backend:** Java Spring Boot REST API
- **Frontend:** React.js
- **Database:** MongoDB
- **Auth:** Local email/password auth with Google OAuth support

## 👥 Team Members & Modules

| Member | Student ID | Module |
|--------|-----------|--------|
| Member 1 | XXXXXXXX | Module A – Facilities & Assets |
| Member 2 | XXXXXXXX | Module B – Booking Management |
| Member 3 | XXXXXXXX | Module C – Maintenance & Tickets |
| Member 4 | XXXXXXXX | Module D & E – Notifications & Auth |

## 🚀 Setup Instructions

### Backend
```bash
cd backend/smart-campus-api
set SPRING_PROFILES_ACTIVE=local
set MONGODB_URI=<your_mongodb_connection_string>
set JWT_SECRET=<your_jwt_secret>
set GOOGLE_CLIENT_ID=<your_google_client_id>
set GOOGLE_CLIENT_SECRET=<your_google_client_secret>
set APP_ADMIN_EMAIL=<admin_email_to_bootstrap>
./mvnw spring-boot:run
```

PowerShell alternative:
```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:MONGODB_URI="<your_mongodb_connection_string>"
$env:JWT_SECRET="<your_jwt_secret>"
$env:GOOGLE_CLIENT_ID="<your_google_client_id>"
$env:GOOGLE_CLIENT_SECRET="<your_google_client_secret>"
$env:APP_ADMIN_EMAIL="<admin_email_to_bootstrap>"
./mvnw.cmd spring-boot:run
```

If `APP_ADMIN_EMAIL` is set, that email is automatically created or promoted as `ADMIN` the first time it registers or signs in through Google OAuth.

Google OAuth redirect URI:
```text
http://localhost:8080/login/oauth2/code/google
```

### Frontend
```bash
cd frontend/smart-campus-ui
npm install
npm run dev
```

## 📁 Repository Structure
```
├── backend/      → Spring Boot REST API
├── frontend/     → React Web Application
├── docs/         → Report & Diagrams
└── .github/      → CI/CD Workflows
```

---

## 🛡️ Member 4: Module D & E Implementation Details

### **Modules Implemented**
- **Module D:** Notifications (CRUD + ownership checks)
- **Module E:** Authentication & Authorization (OAuth2 + roles)

### **Key Achievements**
✅ **OAuth 2.0 Google Login** with auto user creation  
✅ **12 API Endpoints** with 4 HTTP methods (GET, POST, PATCH, DELETE)  
✅ **Role-Based Access Control** (USER, ADMIN, TECHNICIAN, MANAGER)  
✅ **Notification Ownership Enforcement** – Users can only manage their own  
✅ **Admin Role Management UI** – Change user roles from dashboard  
✅ **Frontend Route Protection** – ProtectedRoute component blocks unauthorized access  
✅ **Comprehensive Security Tests** – 401/403 scenarios covered  

### **Quick Reference**
- **API Endpoints:** [MEMBER4_ENDPOINTS.md](docs/MEMBER4_ENDPOINTS.md)
- **Full Implementation Guide:** [MEMBER4_IMPLEMENTATION.md](docs/MEMBER4_IMPLEMENTATION.md)
- **Local Auth Flow:** [AUTH_LOCAL_FLOW.md](docs/AUTH_LOCAL_FLOW.md)
- **Test Evidence:** Run `mvn -Dtest=AccessControlTest test` in backend/

### **API Statistics**
- **Authentication Endpoints:** 6 (register, login, logout, me, users list, role update)
- **Notification Endpoints:** 5 (my notifications, unread count, mark read, delete, admin access)
- **Total Methods:** GET(4), POST(3), PATCH(2), DELETE(1) = **Exceeds 4-method requirement**

### **Security Layers**
1. Spring Security with OAuth2 + role-based rules
2. Frontend ProtectedRoute component
3. Endpoint-level authorization checks (401/403 responses)
4. Ownership validation for resource access

### **Running Member 4 Features**

```bash
# Backend
cd backend/smart-campus-api
export SPRING_PROFILES_ACTIVE=local
./mvnw spring-boot:run

# Frontend
cd frontend/smart-campus-ui
npm run dev

# Demo: http://localhost:5173/login
# - Sign in with Google or email/password
# - Access notifications & admin role management
# - Try breaking auth to see 401/403 responses
```
