# Member 4: Module D & E – Notifications & Authentication

**Student ID:** XXXXXXXX  
**Modules:** Module D (Notifications), Module E (Authentication & Authorization)  
**Assignment Deadline:** 27th April 2026

---

## 📋 Implemented Features & Endpoints

### **Module E – Authentication & Authorization**

#### **1. OAuth 2.0 Google Login**
- **Endpoint:** `GET /oauth2/authorization/google` (Spring OAuth2 flow)
- **Implementation:** [SecurityConfig.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/config/SecurityConfig.java#L31-L37)
- **How it works:**
  - User clicks "Continue with Google" button on Login/Signup page
  - Redirects to Google consent screen
  - Google redirects back to `http://localhost:8080/login/oauth2/code/google`
  - User stored in MongoDB with GOOGLE_CLIENT_ID/email association
  - Session redirects to `/dashboard`

#### **2. User Registration (Email/Password)**
- **Endpoint:** `POST /api/auth/register`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L71-L92)
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@campus.com",
    "password": "secure123",
    "confirmPassword": "secure123"
  }
  ```
- **Response:** 201 Created with User object (passwordHash is excluded)
- **Validations:** Name/email/password required, passwords must match, duplicate email check

#### **3. User Login (Email/Password)**
- **Endpoint:** `POST /api/auth/login`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L94-L108)
- **Request Body:**
  ```json
  {
    "email": "john@campus.com",
    "password": "secure123"
  }
  ```
- **Response:** 200 OK with User object
- **Process:** Bcrypt password comparison, returns full user record

#### **4. Get Current Authenticated User**
- **Endpoint:** `GET /api/auth/me`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L40-L69)
- **Authentication:** OAuth2 principal required
- **Response:** 200 OK with current user (auto-create if first Google login)
- **Security:** Returns 401 if not authenticated

#### **5. Get All Users (ADMIN only)**
- **Endpoint:** `GET /api/auth/users`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L110-L121)
- **Authentication:** Required (OAuth2)
- **Authorization:** ADMIN role only
- **Response:** 200 OK with all users, 403 if non-admin, 401 if not authenticated
- **Used by:** Admin Users page to list and manage roles

#### **6. Update User Role (ADMIN only)**
- **Endpoint:** `PATCH /api/auth/users/{id}/role`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L123-L150)
- **Authentication:** Required (OAuth2)
- **Authorization:** ADMIN role only
- **Request Body:**
  ```json
  {
    "role": "ADMIN|USER|TECHNICIAN|MANAGER"
  }
  ```
- **Validations:** Role must be in allowed set {USER, ADMIN, TECHNICIAN, MANAGER}
- **Response:** 200 OK with updated user object, 403 if non-admin, 401 if not authenticated
- **Frontend Usage:** Admin Users page role dropdown

#### **7. Logout**
- **Endpoint:** `POST /api/auth/logout`
- **Implementation:** [AuthController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java#L152-L154)
- **Response:** 200 OK with logout message
- **Frontend Implementation:** Dashboard sidebar logout button clears localStorage

---

### **Module D – Notifications**

#### **1. Get My Notifications**
- **Endpoint:** `GET /api/notifications/me`
- **Implementation:** [NotificationController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java#L32-L40)
- **Authentication:** Required (OAuth2)
- **Response:** 200 OK with list of notifications for current user, ordered by creation date DESC
- **Ownership:** Uses authenticated principal email to fetch only user's notifications
- **Used by:** NotificationsPage.jsx

#### **2. Mark Notification as Read**
- **Endpoint:** `PATCH /api/notifications/{id}/read`
- **Implementation:** [NotificationController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java#L52-L68)
- **Authentication:** Required (OAuth2)
- **Authorization:** Owner or ADMIN
- **Response:** 200 OK with updated notification, 403 if not owner/admin, 401 if not authenticated
- **Business Logic:**
  - Fetch notification from DB
  - Check if current user is owner or ADMIN
  - Set `isRead` flag to true
  - Save and return

#### **3. Delete Notification**
- **Endpoint:** `DELETE /api/notifications/{id}`
- **Implementation:** [NotificationController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java#L70-L86)
- **Authentication:** Required (OAuth2)
- **Authorization:** Owner or ADMIN
- **Response:** 204 No Content on success, 403 if not owner/admin, 401 if not authenticated

#### **4. Get Unread Notification Count**
- **Endpoint:** `GET /api/notifications/me/unread-count`
- **Implementation:** [NotificationController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java#L88-96)
- **Authentication:** Required (OAuth2)
- **Response:** 200 OK with count (number)
- **Feature:** Show notification badge in dashboard header

#### **5. Get User's Notifications (ADMIN only)**
- **Endpoint:** `GET /api/notifications/user/{userId}`
- **Implementation:** [NotificationController.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java#L42-50)
- **Authentication:** Required (OAuth2)
- **Authorization:** ADMIN role only
- **Response:** 200 OK with another user's notifications, 403 if non-admin, 401 if not authenticated
- **Admin Utility:** For support/auditing purposes

#### **6. Create Notification (Service Layer)**
- **Method:** `NotificationService.createNotification(userId, type, message, referenceId)`
- **Implementation:** [NotificationService.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/service/NotificationService.java#L15-27)
- **Called by:** Other modules (booking approvals, ticket status changes, etc.)
- **Fields Stored:**
  - `userId`: Recipient user ID
  - `type`: BOOKING_APPROVED | BOOKING_REJECTED | TICKET_STATUS_CHANGE | COMMENT_ADDED
  - `message`: Human-readable message
  - `referenceId`: Booking ID or Ticket ID (for linking)
  - `isRead`: false (default)
  - `createdAt`: Server timestamp

---

## 🔐 Security Implementation

### **Authentication Layers**

#### **Layer 1: Spring Security Configuration**
- **File:** [SecurityConfig.java](../backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/config/SecurityConfig.java)
- **Public Routes:** `/api/auth/register`, `/api/auth/login`, `/oauth2/**`, `/login/**`, `/error`
- **Authenticated Routes:** `/api/auth/me`, `/api/auth/logout`, `/api/auth/users/**`, `/api/notifications/**`
- **CORS:** Allows `http://localhost:5173` with credentials
- **OAuth2:** Configured for Google provider via `application-local.properties`

#### **Layer 2: Frontend Route Protection**
- **Component:** [ProtectedRoute.jsx](../frontend/smart-campus-ui/src/components/ProtectedRoute.jsx)
- **Usage:** Wraps protected routes in [App.jsx](../frontend/smart-campus-ui/src/App.jsx#L16-L19)
- **Behavior:**
  - Checks localStorage for cached user
  - Calls `/api/auth/me` to verify session
  - If 401 → redirect to `/login`
  - If role mismatch → redirect to `/dashboard`
  - Prevents unauthorized route access

#### **Layer 3: Endpoint Authorization**
- **Pattern:** Helper methods in each controller
  - `getCurrentUser(OAuth2User principal)` → Optional<User>
  - `isAdmin(User user)` → boolean checks ADMIN role
- **Enforcement:**
  - All protected endpoints check authentication
  - Sensitive endpoints (role update, user list) check admin role
  - Notification access enforces ownership (user can only access own notifications unless ADMIN)

### **403 vs 401 Responses**

| Scenario | Status | Controller Check |
|----------|--------|------------------|
| No authentication token | 401 | `principal == null` → return 401 |
| Authenticated but insufficient role | 403 | `!isAdmin(user)` → return 403 |
| Authenticated but not owner of resource | 403 | `!notification.userId.equals(currentUser.id) && !isAdmin(user)` → return 403 |

---

## 🧪 Testing Evidence

### **Backend Unit Tests**
- **File:** [AccessControlTest.java](../backend/smart-campus-api/src/test/java/com/smartcampus/smart_campus_api/controller/AccessControlTest.java)
- **Test Cases:**
  1. `getUsersWithoutAuthenticationReturns401()` – Tests unauthenticated access
  2. `getUsersAsNonAdminReturns403()` – Tests role-based denial
  3. `markNotificationReadWithoutAuthenticationReturns401()` – Tests notification endpoint auth
  4. `markNotificationReadAsNonOwnerReturns403()` – Tests notification ownership enforcement

**Test Results (Latest Run):**
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### **Manual Testing Checklist**

#### **OAuth Flow**
```
✅ User clicks "Continue with Google" on login page
✅ Redirected to Google consent screen
✅ Redirected back to dashboard after approval
✅ User stored in MongoDB with googleId
✅ Second login with same Google account fetches existing user
```

#### **Notifications**
```
✅ GET /api/notifications/me returns current user's notifications
✅ GET /api/notifications/me/unread-count returns correct count
✅ PATCH /api/notifications/{id}/read marks notification as read
✅ DELETE /api/notifications/{id} removes notification
✅ Non-owner cannot delete another user's notification (403)
✅ Admin can delete any notification
```

#### **Role Management**
```
✅ Admin can view all users via GET /api/auth/users
✅ Non-admin receives 403 when accessing GET /api/auth/users
✅ Admin can change user role via PATCH /api/auth/users/{id}/role
✅ Invalid role is rejected (e.g., "SUPERUSER")
✅ Frontend prevents admin from changing own role
```

---

## 🎯 Viva Demo Flow

### **Demo Path 1: OAuth Login**
1. Open http://localhost:5173/login
2. Click "Continue with Google"
3. Complete Google consent (or use cached credentials)
4. Observe redirect to http://localhost:5173/dashboard
5. Verify user profile shows in top-right corner

### **Demo Path 2: Notifications**
1. On Dashboard, click notification bell icon (🔔)
2. Verify NotificationsPage loads notifications from `/api/notifications/me`
3. Click "✓ Read" on an unread notification
4. Verify notification styling changes
5. Click "🗑️ Delete" to remove notification
6. Verify deleted notification disappears from list

### **Demo Path 3: Admin Role Management**
1. Ensure logged-in user has ADMIN role (or manually set via DB)
2. In Dashboard sidebar, observe "🛡️ Admin Roles" menu item (only for ADMIN users)
3. Click "Admin Roles"
4. Verify all users appear in table
5. Select a different role from dropdown (e.g., USER → TECHNICIAN)
6. Verify role changes in table and is persisted

### **Demo Path 4: Security (Breakdown Attempt)**
1. Open browser DevTools → Application → Local Storage
2. Remove `smartCampusUser` entry
3. Try to access http://localhost:5173/dashboard directly
4. Verify redirect to login page
5. Show protected route component in source code

---

## 📁 File Locations (Member 4 Owned)

### **Backend**
- `src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java` – Auth endpoints (7 methods)
- `src/main/java/com/smartcampus/smart_campus_api/controller/NotificationController.java` – Notification endpoints (5 methods)
- `src/main/java/com/smartcampus/smart_campus_api/service/NotificationService.java` – Notification logic
- `src/main/java/com/smartcampus/smart_campus_api/config/SecurityConfig.java` – Spring Security configuration
- `src/test/java/com/smartcampus/smart_campus_api/controller/AccessControlTest.java` – Security tests

### **Frontend**
- `src/pages/LoginPage.jsx` – Login form with OAuth button
- `src/pages/SignupPage.jsx` – Signup form with OAuth button
- `src/pages/Dashboard.jsx` – Main logged-in page with sidebar
- `src/pages/NotificationsPage.jsx` – Notifications list/management
- `src/pages/AdminUsersPage.jsx` – Admin role management UI
- `src/components/ProtectedRoute.jsx` – Route protection component
- `src/App.jsx` – Route definitions with protection

### **Configuration**
- `src/main/resources/application.properties` – Default profile (env vars)
- `src/main/resources/application-local.properties` – Local overrides with secrets
- `README.md` – Setup instructions with env var examples

---

## 📊 Required HTTP Methods Coverage

✅ **GET** – `/api/auth/me`, `/api/auth/users`, `/api/notifications/me`, `/api/notifications/me/unread-count`  
✅ **POST** – `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`  
✅ **PATCH** – `/api/auth/users/{id}/role`, `/api/notifications/{id}/read`  
✅ **DELETE** – `/api/notifications/{id}`

**Member 4 Minimum Requirement:** 4 endpoints with 4 different HTTP methods ✓ (far exceeded with 12 endpoints)

---

## 💡 Key Design Decisions

1. **Ownership-Based Access Control:** Notification DELETE/PATCH enforces user ownership to prevent users from modifying others' notifications
2. **Admin Override:** ADMIN role can access/modify any notification for support purposes
3. **Stateless Auth:** OAuth2 session stored in frontend localStorage; backend validates on each API call
4. **Role Enumeration:** Restricted to {USER, ADMIN, TECHNICIAN, MANAGER} to prevent invalid role injection
5. **Credentials in Requests:** All notifications/admin endpoints require `withCredentials: true` in axios calls

---

## 🚀 How to Run & Verify

### **Backend Setup**
```bash
cd backend/smart-campus-api

# Terminal 1: Set environment variables
export SPRING_PROFILES_ACTIVE=local
export MONGODB_URI="<connection_string>"
export JWT_SECRET="smartcampus-super-secret-key-2026"
export GOOGLE_CLIENT_ID="<your_google_client_id>"
export GOOGLE_CLIENT_SECRET="<your_google_client_secret>"

# Run backend
./mvnw spring-boot:run
```

### **Frontend Setup**
```bash
cd frontend/smart-campus-ui
npm install
npm run dev
```

### **Run Tests**
```bash
cd backend/smart-campus-api
mvn -Dtest=AccessControlTest test
# Or run full test suite: mvn test
```

---

## ✅ Assignment Requirements Met

| Requirement | Status | Evidence |
|-------------|--------|----------|
| OAuth 2.0 Login | ✅ Complete | SecurityConfig, LoginPage.jsx, AuthController.getCurrentUser() |
| Role-Based Access Control | ✅ Complete | isAdmin() checks, 403 responses, ProtectedRoute allowedRoles |
| Secure Endpoints | ✅ Complete | authenticated() rules in SecurityConfig, @AuthenticationPrincipal checks |
| 4+ Endpoints with Different HTTP Methods | ✅ Complete (12 total) | GET(4), POST(3), PATCH(2), DELETE(1) |
| Validation & Error Handling | ✅ Complete | 400/401/403/404 responses, input validation in register/login |
| Notification Module | ✅ Complete | Create, read, delete, unread count, ownership checks |
| Unit/Integration Tests | ✅ Complete | AccessControlTest covers auth/authz scenarios |
| Frontend Protection | ✅ Complete | ProtectedRoute component, route guards, localStorage cleanup |

