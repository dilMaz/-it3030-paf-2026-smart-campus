# Member 1 - Module A Endpoints (Facilities & Assets)

Base path: `/api/facilities`

## 1) List / Search Facilities
- Method: `GET`
- Path: `/api/facilities`
- Purpose: Returns facilities catalogue with filters.
- Roles: `USER`, `ADMIN`, `TECHNICIAN`, `MANAGER`
- Query params:
  - `search` (optional) - free text for name/location/description
  - `type` (optional) - `LECTURE_HALL | LAB | MEETING_ROOM | EQUIPMENT`
  - `location` (optional) - location contains filter
  - `minCapacity` (optional) - minimum capacity
  - `status` (optional) - `ACTIVE | OUT_OF_SERVICE`

Example:
`GET /api/facilities?type=LAB&location=Block%20B&minCapacity=30&status=ACTIVE`

## 2) Get Facility By ID
- Method: `GET`
- Path: `/api/facilities/{id}`
- Purpose: Fetch a single facility record.
- Roles: `USER`, `ADMIN`, `TECHNICIAN`, `MANAGER`

## 3) Create Facility
- Method: `POST`
- Path: `/api/facilities`
- Purpose: Add a new resource to the catalogue.
- Roles: `ADMIN`

Request body:
```json
{
  "name": "Lecture Hall A",
  "type": "LECTURE_HALL",
  "capacity": 120,
  "location": "Block A - Floor 1",
  "status": "ACTIVE",
  "description": "Main presentation hall",
  "availabilityWindows": [
    { "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "18:00" },
    { "dayOfWeek": "TUESDAY", "startTime": "08:00", "endTime": "18:00" }
  ]
}
```

## 4) Update Facility (Full Metadata)
- Method: `PUT`
- Path: `/api/facilities/{id}`
- Purpose: Replace facility metadata for resource management.
- Roles: `ADMIN`

## 5) Update Facility Status
- Method: `PATCH`
- Path: `/api/facilities/{id}/status`
- Purpose: Quickly switch resource status (`ACTIVE` / `OUT_OF_SERVICE`).
- Roles: `ADMIN`

Request body:
```json
{
  "status": "OUT_OF_SERVICE"
}
```

## 6) Delete Facility
- Method: `DELETE`
- Path: `/api/facilities/{id}`
- Purpose: Remove a facility from the catalogue.
- Roles: `ADMIN`

---

## Assignment Alignment
- Core metadata covered: `type`, `capacity`, `location`, `availabilityWindows`, `status`.
- Search/filter covered by `type`, `capacity` (`minCapacity`), `location`, and free text.
- HTTP methods satisfied for individual requirement: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
