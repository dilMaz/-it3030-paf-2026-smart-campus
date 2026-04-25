# Local Authentication Flow

This document describes local email/password authentication behavior for the Smart Campus API and UI.

## Endpoints

Base path: /api/auth

1. POST /register
- Purpose: Create a local user account.
- Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@campus.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```
- Success: 201 Created with user payload.
- Notes:
  - Email is normalized (trim + lowercase).
  - Password policy requires minimum 8 chars, uppercase, lowercase, number, and special character.

2. POST /login
- Purpose: Authenticate a local account.
- Request:
```json
{
  "email": "jane@campus.com",
  "password": "Password123!"
}
```
- Success: 200 OK with auth response.
```json
{
  "user": {
    "id": "...",
    "email": "jane@campus.com",
    "roles": ["USER"]
  },
  "token": "<jwt-token>"
}
```
- Failure: 401 Unauthorized with generic invalid credentials message.

3. GET /me
- Purpose: Resolve currently authenticated user from principal/session/token.
- Success: 200 OK with user payload.
- Failure: 401 Unauthorized when authentication is missing or unresolved.

4. POST /logout
- Purpose: Clear active authentication context.
- Success: 200 OK with logout message.

5. GET /users
- Purpose: Admin-only list of users.
- Success: 200 OK.
- Failure: 401/403 depending on authentication and role.

6. PATCH /users/{id}/role
- Purpose: Admin-only role update.
- Request:
```json
{
  "role": "ADMIN"
}
```
- Success: 200 OK with updated user.
- Failure: 400/401/403/404 depending on validation/auth/access/target user.

## Validation and Error Contract

Validation and access errors are normalized via global exception handling.

Typical error payload:
```json
{
  "timestamp": "2026-04-22T07:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/register",
  "details": [
    "email: Email must be valid"
  ]
}
```

Common statuses:
- 400: Validation or illegal argument
- 401: Not authenticated / invalid credentials
- 403: Role not allowed for endpoint
- 404: Target resource not found

## Frontend Storage Keys

Auth UI stores only minimal auth state:
- smartCampusUser
- smartCampusToken
- smartCampusPostLoginPath

These are centralized in frontend/smart-campus-ui/src/constants/authStorage.js.

## Frontend UX Notes

Login and signup pages provide:
- Client-side field validation
- Duplicate submit prevention while request is in flight
- Password visibility toggles
- Consistent API error parsing
- Accessible error regions and input accessibility attributes
