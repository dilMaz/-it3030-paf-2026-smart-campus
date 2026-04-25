# Resource Booking System - Testing Guide

## Quick Test Scenarios

### Scenario 1: Admin Adds a Resource
1. Login as **ADMIN** user
2. Go to **Resources** page
3. Click **Add New Resource**
4. Fill in:
   - Name: "Meeting Room A"
   - Type: "MEETING_ROOM"
   - Capacity: 10
   - Location: "Building 1, Floor 2"
   - Status: ACTIVE
5. Click **Save**
✅ Resource should appear in resources list

### Scenario 2: User Books Available Resource
1. Login as **USER1**
2. Go to **Bookings** page
3. In "Create Booking" form:
   - Select **Meeting Room A**
   - Set Start Time: Tomorrow 2:00 PM
   - Set End Time: Tomorrow 3:00 PM
   - Purpose: "Team standup meeting"
4. Click **Submit Booking Request**
✅ Booking appears with status **PENDING**
✅ Success message: "Booking request submitted successfully"

### Scenario 3: Admin Approves Booking
1. Login as **ADMIN**
2. Go to **Bookings** page (admin sees all bookings)
3. Find User1's PENDING booking for Meeting Room A
4. Click **Approve** button
✅ Booking status changes to **APPROVED**
✅ Success message: "Booking approved"
✅ User1 receives notification

### Scenario 4: Another User Cannot Book Same Time (FRONTEND VALIDATION)
1. Login as **USER2**
2. Go to **Bookings** page
3. Try to book Meeting Room A for Tomorrow 2:30 PM - 3:30 PM
4. Click **Submit Booking Request**
✅ Error message appears: "This resource is already booked for the selected time. Please choose a different time slot."
✅ Booking is NOT created
✅ No database entry is made

### Scenario 5: Another User Cannot Book Same Time (BACKEND VALIDATION)
1. Use API client (Postman/curl) to test backend validation
2. Call: `POST /api/bookings`
```json
{
  "resourceId": "[Meeting Room A ID]",
  "startTime": "2026-04-26T14:15:00",
  "endTime": "2026-04-26T15:45:00",
  "purpose": "Conflict test"
}
```
✅ Response: 400 Bad Request
✅ Error message: "This resource is already booked for the selected time..."

### Scenario 6: Cannot Select Past Date
1. Login as any USER
2. Go to **Bookings** page
3. Click on Start Time input
✅ Past dates are disabled/greyed out in date picker
✅ Cannot select dates before today

### Scenario 7: Cannot Book for Past Times
1. Try to manually input past time in datetime field
2. Click **Submit Booking Request**
✅ Error: "Booking date cannot be in the past"
✅ Booking not created

### Scenario 8: Book Available Time Slot (Different Time)
1. Login as **USER2**
2. Go to **Bookings** page
3. Try to book Meeting Room A for Tomorrow 4:00 PM - 5:00 PM
   (Different from User1's 2:00 PM - 3:00 PM booking)
4. Click **Submit Booking Request**
✅ Booking successfully created with status **PENDING**
✅ No conflict error displayed
✅ Both bookings can coexist if times don't overlap

### Scenario 9: Admin Rejects Booking
1. Login as **ADMIN**
2. Go to **Bookings** page
3. Select a PENDING booking
4. Click **Reject** button
✅ Booking status changes to **REJECTED**
✅ That time slot becomes available for booking again
✅ User receives notification

### Scenario 10: Check Booking Conflicts via API
1. Use API client to test conflict endpoint:
```
GET /api/bookings/conflict-check?resourceId=[id]&startTime=2026-04-26T14:00:00&endTime=2026-04-26T15:00:00
```
✅ Response: `{ "hasConflict": true }` (for approved bookings)
✅ Response: `{ "hasConflict": false }` (for available slots)

## Validation Rules to Test

### Date/Time Validation
- ✅ Past dates cannot be selected
- ✅ End time must be after start time
- ✅ Duration must be at least 30 minutes
- ✅ Duration must not exceed 24 hours
- ✅ Year must be between 2000-2099
- ✅ Month must be 1-12
- ✅ Day must be valid for selected month (no Feb 31)

### Booking Conflicts
- ✅ Cannot book exact same time: 10:00-12:00 vs 10:00-12:00
- ✅ Cannot book overlapping time: 10:00-12:00 vs 11:00-13:00
- ✅ Cannot book overlapping time: 10:00-12:00 vs 09:00-11:00
- ✅ CAN book back-to-back: 10:00-12:00 vs 12:00-14:00 ✓
- ✅ CAN book after: 10:00-12:00 vs 13:00-15:00 ✓
- ✅ CAN book before: 10:00-12:00 vs 08:00-09:30 ✓

### Status Behavior
- ✅ PENDING bookings don't block others from booking
- ✅ APPROVED bookings block conflicting bookings
- ✅ REJECTED bookings don't block future bookings
- ✅ Cannot delete APPROVED bookings
- ✅ CAN delete PENDING bookings
- ✅ CAN update PENDING bookings
- ✅ Cannot update APPROVED bookings

## Error Messages Expected

| Scenario | Error Message |
|----------|---------------|
| Past date | "Booking date cannot be in the past" |
| End before start | "End time must be after start time" |
| Too short | "Booking duration must be at least 30 minutes" |
| Too long | "Booking duration cannot exceed 24 hours" |
| Conflict (Frontend) | "This resource is already booked for the selected time. Please choose a different time slot." |
| Conflict (Backend) | "This resource is already booked for the selected time. Please choose a different time slot." |
| Invalid resource | "Resource not found" |
| Inactive resource | "Resource is not available for booking" |
| No resource selected | "Please select a resource" |

## Browser Console Checks
When testing, open DevTools (F12) and check:
- ✅ No JavaScript errors in console
- ✅ API calls show correct parameters
- ✅ Response times are reasonable (< 1s)

## Test Checklist
- [ ] Admin can create resources
- [ ] User can view active resources
- [ ] User can create booking for available time
- [ ] Booking appears as PENDING for admin
- [ ] Admin can approve booking
- [ ] User cannot book conflict time (frontend block)
- [ ] User receives error message for conflicts
- [ ] Another user cannot book same approved time
- [ ] Past dates cannot be selected
- [ ] Duration validation works (30 min - 24 hours)
- [ ] Admin can reject booking
- [ ] After rejection, slot becomes available
- [ ] Back-to-back bookings are allowed
- [ ] Can book before/after approved slots
