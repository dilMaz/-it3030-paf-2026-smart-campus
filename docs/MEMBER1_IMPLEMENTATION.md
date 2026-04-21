# Member 1 - Module A Implementation Notes

## Backend (Spring Boot)

Implemented files:
- `model/Facility.java`
- `model/AvailabilityWindow.java`
- `model/enums/FacilityType.java`
- `model/enums/FacilityStatus.java`
- `dto/FacilityRequest.java`
- `dto/AvailabilityWindowRequest.java`
- `dto/FacilityStatusUpdateRequest.java`
- `repository/FacilityRepository.java`
- `service/FacilityService.java`
- `controller/FacilityController.java`

### Key implementation details
- MongoDB collection: `facilities`
- Validation:
  - Required metadata fields enforced via Bean Validation
  - `capacity >= 1`
  - day-of-week validated against `MONDAY..SUNDAY`
  - time format validated as `HH:mm`
  - availability window checks `startTime < endTime`
- Filtering:
  - In-service filtering for `type`, `status`, `location`, `minCapacity`, free-text `search`
- Role access:
  - Read endpoints: authenticated users with allowed operational roles
  - Write endpoints (`POST/PUT/PATCH/DELETE`): `ADMIN` only

## Frontend (React)

Implemented files:
- `src/pages/FacilitiesPage.jsx`
- `src/services/facilityService.js`
- `src/App.jsx` (route now points `/facilities` to real page)

### UI capabilities
- Facilities sidebar button now opens a fully functional page
- Search/filter controls:
  - text search, type, location, min capacity, status
- Facility cards show:
  - name, type, capacity, location, status, description, availability windows
- Admin actions:
  - create, edit, delete, quick status toggle

## Test Coverage

Added:
- `src/test/java/com/smartcampus/smart_campus_api/controller/FacilityControllerAccessTest.java`

Coverage focus:
- unauthenticated access returns `401`
- `USER` can read facilities
- non-admin cannot create (`403`)
- `ADMIN` can create (`201`)
