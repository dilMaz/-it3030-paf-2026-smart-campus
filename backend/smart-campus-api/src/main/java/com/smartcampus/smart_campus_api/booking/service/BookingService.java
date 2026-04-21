package com.smartcampus.smart_campus_api.booking.service;

import java.util.List;

import com.smartcampus.smart_campus_api.booking.dto.BookingResponse;
import com.smartcampus.smart_campus_api.booking.dto.CreateBookingRequest;

public interface BookingService {
    List<BookingResponse> getBookings(Object principal);
    BookingResponse createBooking(CreateBookingRequest request, Object principal);
    BookingResponse approveBooking(String bookingId, Object principal);
    BookingResponse rejectBooking(String bookingId, Object principal);
    BookingResponse getBookingById(String bookingId, Object principal);
    BookingResponse updateBooking(String bookingId, CreateBookingRequest request, Object principal);
    void deleteBooking(String bookingId, Object principal);
    boolean hasBookingConflict(String resourceId, String startTime, String endTime, String excludeBookingId);
}
