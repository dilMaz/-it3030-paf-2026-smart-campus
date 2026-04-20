# Member 1 - Facilities & Assets Catalogue (Module A)

## 1) Folder Structure (Feature Scope)

### Backend
```
backend/smart-campus-api/src/main/java/com/smartcampus/smart_campus_api/
  exception/
    ApiErrorResponse.java
    ForbiddenOperationException.java
    GlobalExceptionHandler.java
    ResourceNotFoundException.java
    UnauthorizedAccessException.java
  service/
    UserAuthorizationService.java
  resource/
    controller/
      ResourceController.java
    dto/
      ResourceRequest.java
      ResourceResponse.java
    entity/
      Resource.java
    enums/
      ResourceStatus.java
      ResourceType.java
    repository/
      ResourceRepository.java
    service/
      ResourceService.java
      ResourceServiceImpl.java
```

### Frontend
```
frontend/smart-campus-ui/src/
  components/resources/
    AddResourceForm.jsx
    EditResourceForm.jsx
    ResourceFilterBar.jsx
    ResourceForm.jsx
  pages/
    ResourceListPage.jsx
  services/
    resourceService.js
```

---

## 2) API Endpoints

Base path: `/api/resources`

1. `GET /api/resources`
2. `GET /api/resources/{id}`
3. `GET /api/resources/search?type=&location=&minCapacity=&status=`
4. `POST /api/resources`
5. `PUT /api/resources/{id}`
6. `DELETE /api/resources/{id}`

Role rules:
- `USER`: view/search (`GET`)
- `ADMIN`: view/search/create/update/delete

---

## 3) Sample JSON

### Create Request
```json
{
  "name": "Lecture Hall A",
  "type": "LECTURE_HALL",
  "capacity": 120,
  "location": "Block A - Floor 1",
  "availableFrom": "08:00:00",
  "availableTo": "18:00:00",
  "status": "ACTIVE",
  "description": "Main lecture hall with smart projector"
}
```

### Success Response (201/200)
```json
{
  "id": 1,
  "name": "Lecture Hall A",
  "type": "LECTURE_HALL",
  "capacity": 120,
  "location": "Block A - Floor 1",
  "availableFrom": "08:00:00",
  "availableTo": "18:00:00",
  "status": "ACTIVE",
  "description": "Main lecture hall with smart projector",
  "createdAt": "2026-04-20T18:30:15.000",
  "updatedAt": "2026-04-20T18:30:15.000"
}
```

### Error Response (validation example)
```json
{
  "timestamp": "2026-04-20T18:35:00.000",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/resources",
  "details": [
    "capacity: capacity must be at least 1",
    "timeRangeValid: availableFrom must be before availableTo"
  ]
}
```

---

## 4) How Components Connect

- `ResourceController` accepts HTTP requests and delegates business logic to `ResourceService`.
- `ResourceServiceImpl` validates role access via `UserAuthorizationService`, performs CRUD/search through `ResourceRepository`, and maps entity to DTO response.
- `GlobalExceptionHandler` converts runtime/validation exceptions to consistent API error payloads.
- `ResourceListPage` calls backend via `resourceService.js`.
- `ResourceFilterBar` sends filter values.
- `AddResourceForm` and `EditResourceForm` both reuse `ResourceForm` with client-side validation.
- Admin-only UI actions are shown using the authenticated role from `useAuth()`.

---

## 5) Run Steps

### Backend (MySQL)
1. Create MySQL database:
   - `smart_campus_db`
2. Set env vars (PowerShell):
   - `$env:MYSQL_URL="jdbc:mysql://localhost:3306/smart_campus_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"`
   - `$env:MYSQL_USERNAME="root"`
   - `$env:MYSQL_PASSWORD="your_password"`
3. Run backend:
   - `cd backend/smart-campus-api`
   - `./mvnw.cmd spring-boot:run`

### Frontend
1. `cd frontend/smart-campus-ui`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:5173`

---

## 6) Test Sample Data (SQL)

```sql
INSERT INTO resources
  (name, type, capacity, location, available_from, available_to, status, description, created_at, updated_at)
VALUES
  ('Lecture Hall A', 'LECTURE_HALL', 120, 'Block A - Floor 1', '08:00:00', '18:00:00', 'ACTIVE', 'Main lecture hall', NOW(), NOW()),
  ('Computer Lab 3', 'LAB', 45, 'Engineering Building', '09:00:00', '17:00:00', 'ACTIVE', 'Lab with 45 workstations', NOW(), NOW()),
  ('Meeting Room M2', 'MEETING_ROOM', 14, 'Admin Building', '08:30:00', '16:30:00', 'ACTIVE', 'Department meetings', NOW(), NOW()),
  ('Projector Unit P-12', 'EQUIPMENT', 1, 'Media Store', '08:00:00', '17:00:00', 'OUT_OF_SERVICE', 'Lamp issue under maintenance', NOW(), NOW());
```
