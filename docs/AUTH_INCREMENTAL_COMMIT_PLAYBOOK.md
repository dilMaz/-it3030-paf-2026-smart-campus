# Auth Feature Incremental Commit Playbook

Project: Smart Campus Operations Hub  
Scope: Local authentication hardening and UX improvements  
Stack: Spring Boot + React

This playbook gives 20 small, meaningful commits in a realistic order.
Each commit includes:
- Conventional Commit message
- What to change
- Example code-level change

---

1. feat(backend-auth): add bean validation annotations to auth request DTOs
- What changed:
  - Add validation constraints to login and register request records.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/dto/LoginRequest.java
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/dto/RegisterRequest.java
- Example:
  - Add `@NotBlank @Email` on email and `@Size(min = 8)` on password.

2. feat(backend-auth): enforce @Valid in auth controller endpoints
- What changed:
  - Enable automatic request payload validation in register and login endpoints.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - Update endpoint signatures to use `@Valid @RequestBody`.

3. fix(backend-auth): normalize email consistently before repository lookups
- What changed:
  - Ensure every auth path uses a common normalized email value.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - Reuse one `normalizeEmail(...)` flow in register/login/me.

4. fix(backend-auth): prevent user enumeration on login failures
- What changed:
  - Keep login failure response generic regardless of account existence.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - Return only `Invalid email or password` for all invalid credentials.

5. feat(backend-security): enforce password policy at registration
- What changed:
  - Add server-side complexity requirements for local password signup.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - Reject password lacking uppercase/lowercase/number/symbol.

6. fix(backend-auth): reject blank-after-trim names during signup
- What changed:
  - Trim and validate display name to avoid whitespace-only input.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - `String cleanedName = request.name() == null ? null : request.name().trim();`

7. refactor(backend-auth): extract principal-to-user resolution utility
- What changed:
  - Move repeated principal parsing logic into a reusable service.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/service/UserAuthorizationService.java
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
- Example:
  - Replace inline principal parsing with `userAuthorizationService.requireAuthenticatedUser(...)` where appropriate.

8. feat(backend-auth): throw typed auth exceptions for consistent error shape
- What changed:
  - Replace ad hoc map errors with exception-based flow handled globally.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/controller/AuthController.java
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/exception/GlobalExceptionHandler.java
- Example:
  - Throw `UnauthorizedAccessException` and `IllegalArgumentException` from controller branches.

9. feat(backend-security): make bcrypt strength configurable via properties
- What changed:
  - Add BCrypt work factor config in security bean.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/config/SecurityConfig.java
  - backend/smart-campus-api/src/main/resources/application.properties
- Example:
  - `@Value("${security.bcrypt.strength:10}") int strength` and `new BCryptPasswordEncoder(strength)`.

10. fix(backend-security): fail fast when jwt secret is default in non-local profile
- What changed:
  - Add guard for insecure JWT secret defaults in non-development profiles.
- Files:
  - backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/service/JwtService.java
- Example:
  - Throw startup exception if secret is blank/default and profile is not local.

11. feat(backend-test): add controller tests for register validation failures
- What changed:
  - Cover missing fields, invalid email, and weak password paths.
- Files:
  - backend/smart-campus-api/src/test/java/.../controller/AccessControlTest.java
  - or backend/smart-campus-api/src/test/java/.../controller/AuthControllerTest.java (new)
- Example:
  - Assert HTTP 400 and validation messages.

12. feat(backend-test): add login tests for invalid and successful auth
- What changed:
  - Verify password mismatch returns 401 and valid credentials return user+token.
- Files:
  - backend/smart-campus-api/src/test/java/.../controller/AuthControllerTest.java
- Example:
  - Seed test user with password hash and assert successful login payload.

13. feat(frontend-auth): add client-side validation for login form
- What changed:
  - Validate email format and required password before API call.
- Files:
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
- Example:
  - Early return with inline message if email is malformed.

14. feat(frontend-auth): add client-side validation for signup form
- What changed:
  - Validate required name, email, password length, and confirmation match.
- Files:
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - Show immediate message when confirmation does not match.

15. fix(frontend-auth): prevent duplicate submit while auth request is pending
- What changed:
  - Harden submit handlers against rapid repeated clicks and Enter presses.
- Files:
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - `if (loading) return` at top of submit handler.

16. feat(frontend-auth): add password visibility toggle controls
- What changed:
  - Improve usability by allowing users to view entered passwords.
- Files:
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - Add `showPassword` state and toggle button near password field.

17. fix(frontend-auth): normalize API error parsing into reusable helper
- What changed:
  - Centralize extraction of `message`, `error`, and `details` from backend responses.
- Files:
  - frontend/smart-campus-ui/src/utils/authError.js (new)
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - Replace inline `err.response?.data...` chains with `getAuthErrorMessage(err)`.

18. refactor(frontend-auth): centralize auth storage keys in a shared constant module
- What changed:
  - Remove duplicate hardcoded storage key strings across auth files.
- Files:
  - frontend/smart-campus-ui/src/constants/authStorage.js (new)
  - frontend/smart-campus-ui/src/context/AuthContext.jsx
  - frontend/smart-campus-ui/src/services/api.js
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - Import `TOKEN_STORAGE_KEY` from one place.

19. style(frontend-auth): improve auth form accessibility and focus states
- What changed:
  - Add a11y attributes and improve keyboard/focus clarity for inputs and errors.
- Files:
  - frontend/smart-campus-ui/src/pages/LoginPage.jsx
  - frontend/smart-campus-ui/src/pages/SignupPage.jsx
- Example:
  - Add `aria-invalid`, `aria-describedby`, and `aria-live="polite"` for error region.

20. docs(auth): document local auth API flow and error contracts
- What changed:
  - Add clear docs for register/login/me/logout, validation behavior, and token storage.
- Files:
  - docs/AUTH_LOCAL_FLOW.md (new)
  - optionally README.md (link section)
- Example:
  - Include request/response examples and common 400/401/409 cases.

---

## Suggested commit command sequence

Run each command after applying only the changes for that step.

```powershell
git commit -m "feat(backend-auth): add bean validation annotations to auth request DTOs"
git commit -m "feat(backend-auth): enforce @Valid in auth controller endpoints"
git commit -m "fix(backend-auth): normalize email consistently before repository lookups"
git commit -m "fix(backend-auth): prevent user enumeration on login failures"
git commit -m "feat(backend-security): enforce password policy at registration"
git commit -m "fix(backend-auth): reject blank-after-trim names during signup"
git commit -m "refactor(backend-auth): extract principal-to-user resolution utility"
git commit -m "feat(backend-auth): throw typed auth exceptions for consistent error shape"
git commit -m "feat(backend-security): make bcrypt strength configurable via properties"
git commit -m "fix(backend-security): fail fast when jwt secret is default in non-local profile"
git commit -m "feat(backend-test): add controller tests for register validation failures"
git commit -m "feat(backend-test): add login tests for invalid and successful auth"
git commit -m "feat(frontend-auth): add client-side validation for login form"
git commit -m "feat(frontend-auth): add client-side validation for signup form"
git commit -m "fix(frontend-auth): prevent duplicate submit while auth request is pending"
git commit -m "feat(frontend-auth): add password visibility toggle controls"
git commit -m "fix(frontend-auth): normalize API error parsing into reusable helper"
git commit -m "refactor(frontend-auth): centralize auth storage keys in a shared constant module"
git commit -m "style(frontend-auth): improve auth form accessibility and focus states"
git commit -m "docs(auth): document local auth API flow and error contracts"
```

Tip:
- Use `git add -p` before each commit to keep commits atomic.
- Run backend and frontend tests after every 2-3 commits.
