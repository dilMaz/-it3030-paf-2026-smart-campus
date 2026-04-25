# Resource Booking System - Implementation Summary

## Overview
The resource booking system has been enhanced to prevent double-booking and ensure proper time validation. Only one user can book each resource at a time, and users cannot select past booking times.

## Changes Made

### 1. Backend Validation (Java/Spring Boot)

#### File: `BookingServiceImpl.java`

**Change 1: Added conflict checking to `createBooking()` method**
- Validates that booking start time is not in the past
- Checks if the requested time slot conflicts with existing approved bookings
- Throws `IllegalArgumentException` with message: "This resource is already booked for the selected time. Please choose a different time slot."
- Only approved bookings are considered for conflict detection (pending bookings don't block availability)

```java
// Check for booking conflicts with approved bookings
if (hasBookingConflict(resource.getId(), request.startTime().toString(), request.endTime().toString(), null)) {
    throw new IllegalArgumentException("This resource is already booked for the selected time. Please choose a different time slot.");
}
```

**Change 2: Added conflict checking to `updateBooking()` method**
- Added past date validation for edited bookings
- Added conflict checking that excludes the current booking from the conflict check
- Prevents updating a booking to a time that conflicts with other approved bookings

### 2. Frontend Updates (React/JavaScript)

#### File: `bookingService.js`
**Added new method: `checkBookingConflict()`**
- Calls the `/api/bookings/conflict-check` endpoint
- Accepts: resourceId, startTime, endTime, and optional excludeBookingId
- Returns: `{ hasConflict: true/false }`

```javascript
async checkBookingConflict(resourceId, startTime, endTime, excludeBookingId = null) {
  const params = new URLSearchParams({
    resourceId,
    startTime,
    endTime,
  })
  if (excludeBookingId) {
    params.append('excludeBookingId', excludeBookingId)
  }
  const response = await api.get(`/api/bookings/conflict-check?${params.toString()}`)
  return response.data
}
```

#### File: `BookingsPage.jsx`
**Enhanced `handleCreateBooking()` function**
- Before submitting the booking, calls the conflict check API
- Displays user-friendly error message if a conflict is detected
- Prevents booking submission when conflict detected
- Error message: "This resource is already booked for the selected time. Please choose a different time slot."

### 3. Existing Features Confirmed

✅ **Time Picker Constraints**
- `min` attribute prevents selecting past dates in HTML5 datetime-local input
- Frontend validation prevents end time before start time
- Frontend validation prevents booking duration > 24 hours
- Frontend validation prevents booking duration < 30 minutes

✅ **Booking Status Flow**
- New bookings created as PENDING
- Only APPROVED bookings block future bookings
- PENDING and REJECTED bookings don't prevent other users from booking

✅ **Authorization**
- Users can only see and manage their own bookings
- Admins can see all bookings
- Admin approval triggers notification to user

## Booking Status Logic

- **PENDING**: Initial state when user creates booking (visible to admin for approval)
- **APPROVED**: Admin approves the booking (blocks other users from booking that time)
- **REJECTED**: Admin rejects the booking (time slot becomes available again)
- **DELETED**: User or admin can delete PENDING bookings (cannot delete APPROVED)

## How It Works - User Flow

1. **User selects resource and time range**
   - HTML5 date picker prevents selecting past dates
   - Frontend validates: end time > start time, duration between 30 min - 24 hours

2. **User submits booking**
   - Frontend calls `checkBookingConflict()` API
   - If conflict detected → Display error and prevent submission
   - If no conflict → Create booking in PENDING status

3. **Admin reviews booking**
   - Admin sees PENDING bookings in management interface
   - Approves or rejects the booking
   - Approval sends notification to user
   - APPROVED booking now blocks that time slot for other users

4. **Other users try to book same time**
   - Frontend conflict check prevents submission
   - If somehow bypassed, backend validation also prevents it
   - User gets error: "This resource is already booked for the selected time..."

## Technical Details

### Conflict Detection Algorithm
The `isTimeOverlap()` method checks if two time ranges overlap:
```java
private boolean isTimeOverlap(LocalDateTime start1, LocalDateTime end1, 
                              LocalDateTime start2, LocalDateTime end2) {
    return start1.isBefore(end2) && start2.isBefore(end1);
}
```

This handles all overlap scenarios:
- Booking1: 10:00-12:00, Booking2: 09:00-10:30 → CONFLICT ✗
- Booking1: 10:00-12:00, Booking2: 12:00-14:00 → NO CONFLICT ✓
- Booking1: 10:00-12:00, Booking2: 11:00-13:00 → CONFLICT ✗
- Booking1: 10:00-12:00, Booking2: 10:00-12:00 → CONFLICT ✗

### Database Queries
The `BookingRepository` queries only APPROVED bookings:
```java
List<Booking> findByResourceIdAndStatus(String resourceId, BookingStatus status);
```

This ensures PENDING bookings don't interfere with availability checks.

## Error Handling

### Frontend
- Displays user-friendly error messages
- Prevents form submission on conflict
- Shows validation errors in red below input fields

### Backend
- Throws `IllegalArgumentException` with descriptive messages
- Returns 400 Bad Request for validation errors
- Returns 404 Not Found for missing resources
- Returns 403 Forbidden for unauthorized access

## API Endpoints

### Check Booking Conflict (Existing)
```
GET /api/bookings/conflict-check?resourceId={id}&startTime={iso}&endTime={iso}&excludeBookingId={id}
```
Response:
```json
{
  "hasConflict": true/false
}
```

### Create Booking
```
POST /api/bookings
Content-Type: application/json

{
  "resourceId": "123",
  "startTime": "2026-04-25T14:00:00",
  "endTime": "2026-04-25T15:30:00",
  "purpose": "Team meeting (optional)"
}
```

## Testing Scenarios

1. **Happy Path**: User books available time slot → PENDING → Admin approves → Booking confirmed
2. **Conflict Detected**: User tries to book occupied time → Error message → No booking created
3. **Past Date**: User tries to select past date → HTML5 picker prevents it
4. **Short Duration**: User tries to book < 30 min → Frontend validation error
5. **Long Duration**: User tries to book > 24 hours → Frontend validation error

## Future Enhancements (Optional)

- Show available time slots in calendar view
- Display booked times differently (greyed out)
- Allow admins to force-book even if conflict exists
- Add booking cancellation requests
- Send reminder notifications before approved bookings
- Add resource availability schedule (operating hours)
