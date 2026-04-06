# Member 4: Function Signatures & Implementation Checklist

## Backend Implementation (Java/Spring Boot)

### AuthController.java

```java
@RestController @RequestMapping("/api/auth")
public class AuthController {

    // ✅ POST – Public registration endpoint
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request)
    → 400 (invalid input) | 409 (duplicate email) | 201 (created)

    // ✅ POST – Public login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request)
    → 400 (missing fields) | 401 (invalid credentials) | 200 (success)

    // ✅ GET – Get current OAuth2 user (auto-create on first login)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 200 (user object)

    // ✅ POST – Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout()
    → 200 (success message)

    // ✅ GET – ADMIN-ONLY: List all users
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 403 (not admin) | 200 (user list)

    // ✅ PATCH – ADMIN-ONLY: Update user role
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
        @PathVariable String id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 403 (not admin) | 400 (invalid role) | 404 (user not found) | 200 (updated user)

    // Helper methods:
    private Optional<User> resolveCurrentUser(OAuth2User principal)
    private boolean isAdmin(User user)
}
```

### NotificationController.java

```java
@RestController @RequestMapping("/api/notifications")
public class NotificationController {

    // ✅ GET – Get my notifications (owner access)
    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 200 (notifications list)

    // ✅ GET – ADMIN-ONLY: Get another user's notifications
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserNotifications(
        @PathVariable String userId,
        @AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 403 (not admin) | 200 (notifications)

    // ✅ PATCH – Mark notification as read (owner/admin)
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
        @PathVariable String id,
        @AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 403 (not owner/admin) | 200 (updated notification)

    // ✅ DELETE – Delete notification (owner/admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
        @PathVariable String id,
        @AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 403 (not owner/admin) | 204 (deleted)

    // ✅ GET – Get unread notification count (owner only)
    @GetMapping("/me/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal OAuth2User principal)
    → 401 (not authenticated) | 200 (count number)

    // Helper methods:
    private Optional<User> getCurrentUser(OAuth2User principal)
    private boolean isAdmin(User user)
}
```

### NotificationService.java

```java
@Service
public class NotificationService {

    // ✅ Create notification (called by other modules)
    public Notification createNotification(
        String userId, 
        String type, 
        String message, 
        String referenceId)
    → Notification (saved to DB)

    // ✅ Get notifications by user
    public List<Notification> getUserNotifications(String userId)
    → List<Notification>

    // ✅ Get notification by ID (for ownership check)
    public Notification getNotificationById(String notificationId)
    → Notification | throws RuntimeException

    // ✅ Mark as read
    public Notification markAsRead(String notificationId)
    → Notification (isRead=true)

    // ✅ Delete notification
    public void deleteNotification(String notificationId)
    → void

    // ✅ Count unread
    public long getUnreadCount(String userId)
    → long (count)
}
```

### SecurityConfig.java

```java
@Configuration @EnableWebSecurity
public class SecurityConfig {

    // ✅ Main security filter chain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
    → Allows: /api/auth/register, /api/auth/login, /oauth2/**, /login/**
    → Requires auth: /api/auth/me, /api/auth/logout, /api/auth/users/**, /api/notifications/**
    → Returns 401 for missing auth on /api/** endpoints

    // ✅ Password encoder bean
    @Bean
    public PasswordEncoder passwordEncoder()
    → BCryptPasswordEncoder instance

    // ✅ CORS configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource()
    → Allows: http://localhost:5173 with credentials
    → Methods: GET, POST, PATCH, DELETE, OPTIONS
    → Headers: * (all)
}
```

### AccessControlTest.java

```java
@WebMvcTest(controllers = { AuthController.class, NotificationController.class })
@Import(SecurityConfig.class)
class AccessControlTest {

    // ✅ Test 1: Unauthenticated access returns 401
    @Test
    void getUsersWithoutAuthenticationReturns401()
    → GET /api/auth/users [no auth] → 401

    // ✅ Test 2: Non-admin access returns 403
    @Test
    void getUsersAsNonAdminReturns403()
    → GET /api/auth/users [USER role] → 403

    // ✅ Test 3: Unauthenticated notification access returns 401
    @Test
    void markNotificationReadWithoutAuthenticationReturns401()
    → PATCH /api/notifications/n-1/read [no auth] → 401

    // ✅ Test 4: Non-owner notification access returns 403
    @Test
    void markNotificationReadAsNonOwnerReturns403()
    → PATCH /api/notifications/n-1/read [different user] → 403
}
```

---

## Frontend Implementation (React/JavaScript)

### ProtectedRoute.jsx

```javascript
export default function ProtectedRoute({ allowedRoles }) {
    // ✅ Feature: Check cached user in localStorage
    // ✅ Feature: Call /api/auth/me to verify session
    // ✅ Feature: Redirect to /login if not authenticated
    // ✅ Feature: Redirect to /dashboard if role mismatch
    // ✅ Feature: Show null during auth check (no flashing)
    
    return <Outlet />  // Render child route if authorized
}
```

### LoginPage.jsx

```javascript
export default function LoginPage() {
    // ✅ Feature: Email/password login form
    const handleSubmit = (event) => {
        axios.post("http://localhost:8080/api/auth/login", { email, password })
        → Store user in localStorage
        → Navigate to /dashboard
    }

    // ✅ Feature: OAuth2 Google button
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google"
        // Spring Security handles redirect flow
    }
}
```

### SignupPage.jsx

```javascript
export default function SignupPage() {
    // ✅ Feature: Registration form (name/email/password/confirm)
    const handleSubmit = (event) => {
        axios.post("http://localhost:8080/api/auth/register", 
            { name, email, password, confirmPassword })
        → Store user in localStorage
        → Navigate to /dashboard
    }

    // ✅ Feature: OAuth2 Google button (same as login)
}
```

### Dashboard.jsx

```javascript
export default function Dashboard() {
    // ✅ Feature: Fetch current user on mount
    useEffect(() => {
        axios.get('http://localhost:8080/api/auth/me', 
            { withCredentials: true })
        → setCurrentUser(response.data)
        → Redirect to / if 401
    })

    // ✅ Feature: Show "Admin Roles" menu only if ADMIN
    const isAdmin = currentUser?.roles?.includes("ADMIN")
    const menuItems = [
        ...(isAdmin ? [{ icon: "🛡️", label: "Admin Roles", 
            action: () => navigate("/admin/users") }] : [])
    ]

    // ✅ Feature: Logout clears localStorage
    onClick={() => {
        localStorage.removeItem("smartCampusUser")
        navigate("/")
    }}

    // ✅ Feature: Notification icon with unread badge
    onClick={() => navigate("/notifications")}
}
```

### NotificationsPage.jsx

```javascript
export default function NotificationsPage() {
    // ✅ Feature: Fetch notifications from /api/notifications/me
    useEffect(() => {
        axios.get('http://localhost:8080/api/notifications/me', 
            { withCredentials: true })
        → setNotifications(response.data)
    })

    // ✅ Feature: Mark as read
    const markAsRead = (id) => {
        axios.patch(`http://localhost:8080/api/notifications/${id}/read`, 
            {}, { withCredentials: true })
        → Update local state
    }

    // ✅ Feature: Delete notification
    const deleteNotification = (id) => {
        axios.delete(`http://localhost:8080/api/notifications/${id}`, 
            { withCredentials: true })
        → Remove from local state
    }
}
```

### AdminUsersPage.jsx

```javascript
export default function AdminUsersPage() {
    // ✅ Feature: Fetch all users from /api/auth/users (ADMIN only)
    useEffect(() => {
        axios.get('http://localhost:8080/api/auth/users', 
            { withCredentials: true })
        → setUsers(response.data)
    })

    // ✅ Feature: Role dropdown with validation
    const updateRole = (userId, role) => {
        // Validate role in {USER, ADMIN, TECHNICIAN, MANAGER}
        axios.patch(`http://localhost:8080/api/auth/users/${userId}/role`,
            { role }, { withCredentials: true })
        → Update table immediately
        → Handle 403 if not admin (shouldn't reach here due to route protection)
    }

    // ✅ Feature: Prevent self-role change
    disabled={isCurrentUser}
}
```

### App.jsx

```javascript
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ✅ Public routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* ✅ Protected routes (any authenticated user) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>

                {/* ✅ ADMIN-only routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
```

---

## Database Models

### User

```javascript
{
    _id: ObjectId,
    name: String,
    email: String (unique),
    passwordHash: String | null (null for OAuth users),
    picture: String | null (OAuth avatar),
    googleId: String | null,
    roles: [String] // e.g., ["USER"], ["ADMIN"], ["TECHNICIAN"]
}
```

### Notification

```javascript
{
    _id: ObjectId,
    userId: String,
    type: String, // BOOKING_APPROVED | BOOKING_REJECTED | TICKET_STATUS_CHANGE | COMMENT_ADDED
    message: String,
    referenceId: String, // Booking ID or Ticket ID
    isRead: Boolean,
    createdAt: Date
}
```

---

## Implementation Checklist for Viva

### Code Quality
- ✅ Controllers use `@AuthenticationPrincipal OAuth2User` for auth checks
- ✅ Helper methods for ownership/role validation (DRY principle)
- ✅ Consistent error responses (Map.of("error", "..."))
- ✅ No hardcoded secrets in source code (use application-local.properties)

### Security
- ✅ Spring Security configuration explicitly lists public/protected routes
- ✅ 401 for missing auth, 403 for insufficient role/ownership
- ✅ Frontend ProtectedRoute prevents unauthorized access before API call
- ✅ CORS configured for localhost:5173 only

### Testing
- ✅ AccessControlTest covers 401/403 scenarios
- ✅ Tests use `@MockitoBean` for dependency injection
- ✅ Test run command documented in README

### Documentation
- ✅ API endpoints documented in MEMBER4_ENDPOINTS.md
- ✅ Full implementation guide in MEMBER4_IMPLEMENTATION.md
- ✅ Function signatures in this file
- ✅ README points to all docs

### Demo Flow (5 minutes)
1. Open http://localhost:5173/login
2. Click "Continue with Google" → See OAuth flow
3. Redirect to dashboard → Show notifications bell
4. If ADMIN: Click "Admin Roles" → Show role management table
5. Show DevTools: Try accessing /admin/users without ADMIN role → 403
