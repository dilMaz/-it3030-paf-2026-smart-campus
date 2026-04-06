## Member 4 Endpoints Quick Reference

### Authentication (Module E)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/auth/register` | ❌ | - | Register with email/password |
| POST | `/api/auth/login` | ❌ | - | Login with email/password |
| GET | `/api/auth/me` | ✅ | USER+ | Get current user profile |
| POST | `/api/auth/logout` | ✅ | USER+ | Logout (clears session) |
| GET | `/api/auth/users` | ✅ | ADMIN | List all users |
| PATCH | `/api/auth/users/{id}/role` | ✅ | ADMIN | Change user role |

**OAuth2 Flow** – `GET /oauth2/authorization/google` (Spring auto-handled)

---

### Notifications (Module D)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/notifications/me` | ✅ | USER+ | My notifications (paginated desc) |
| GET | `/api/notifications/me/unread-count` | ✅ | USER+ | Count unread notifications |
| PATCH | `/api/notifications/{id}/read` | ✅ | USER+ | Mark as read (owner/admin) |
| DELETE | `/api/notifications/{id}` | ✅ | USER+ | Delete notification (owner/admin) |
| GET | `/api/notifications/user/{userId}` | ✅ | ADMIN | Get another user's notifications |

---

### Response Codes

- **200 OK** – Successful GET/PATCH
- **201 Created** – Successful POST
- **204 No Content** – Successful DELETE
- **400 Bad Request** – Invalid input (e.g., duplicate email)
- **401 Unauthorized** – Missing authentication
- **403 Forbidden** – Auth OK but insufficient role/ownership
- **404 Not Found** – Resource not found
- **409 Conflict** – Email already registered

---

### Test Command

```bash
cd backend/smart-campus-api
mvn -Dtest=AccessControlTest test
```

**Coverage:** 401/403 scenarios (unauthenticated, non-admin, non-owner access)

---

### Frontend Routes (Member 4)

| Route | Protected | Role | Component |
|-------|-----------|------|-----------|
| `/login` | ❌ | - | LoginPage (OAuth+email/pwd) |
| `/signup` | ❌ | - | SignupPage (OAuth+register) |
| `/dashboard` | ✅ | USER+ | Dashboard (main logged-in page) |
| `/notifications` | ✅ | USER+ | NotificationsPage |
| `/admin/users` | ✅ | ADMIN | AdminUsersPage (role management) |

---

### OAuth2 Google Redirect URI

**Required in Google Cloud Console:**
```
http://localhost:8080/login/oauth2/code/google
```

---

### HTTP Methods Breakdown

- **GET** (4): `/api/auth/me`, `/api/auth/users`, `/api/notifications/me`, `/api/notifications/me/unread-count`
- **POST** (3): `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- **PATCH** (2): `/api/auth/users/{id}/role`, `/api/notifications/{id}/read`
- **DELETE** (1): `/api/notifications/{id}`

**Total: 10 API endpoints + OAuth2 flow = Exceeds 4-method minimum**

---

### Security Highlights

✅ OAuth2 integration with Google  
✅ JWT + role-based authorization  
✅ Ownership enforcement (users can't access/delete others' notifications)  
✅ Admin override capability  
✅ Frontend route protection via ProtectedRoute component  
✅ 401/403 HTTP status codes for different failure modes  
✅ CORS configured for frontend origin  

---

### Running Member 4 Demo

```bash
# Terminal 1: Backend
cd backend/smart-campus-api
export SPRING_PROFILES_ACTIVE=local
./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend/smart-campus-ui
npm run dev

# Then visit: http://localhost:5173/login
```

**Demo flow:**
1. Sign in with Google or email/password
2. Click notification bell on dashboard
3. If ADMIN, see "Admin Roles" in sidebar → manage user roles
4. Try direct URL access without auth → redirected to login
5. Try non-owner notification access (show 403 in DevTools)
