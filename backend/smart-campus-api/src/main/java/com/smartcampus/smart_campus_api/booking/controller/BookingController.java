package com.smartcampus.smart_campus_api.booking.controller;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.booking.dto.BookingResponse;
import com.smartcampus.smart_campus_api.booking.dto.CreateBookingRequest;
import com.smartcampus.smart_campus_api.booking.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

// REST controller for booking management operations
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class BookingController {

    private final BookingService bookingService;

    // Get all bookings for authenticated user
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getBookings(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(bookingService.getBookings(principal));
    }

    // Create new booking request
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, principal));
    }

    // Approve pending booking request
    @PatchMapping("/{bookingId}/approve")
    public ResponseEntity<BookingResponse> approveBooking(
            @PathVariable String bookingId,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(bookingService.approveBooking(bookingId, principal));
    }

    // Reject pending booking request
    @PatchMapping("/{bookingId}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable String bookingId,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(bookingService.rejectBooking(bookingId, principal));
    }

    // Get booking by ID with authorization check
    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(
            @PathVariable String bookingId,
            @AuthenticationPrincipal Object principal) {
        try {
            return ResponseEntity.ok(bookingService.getBookingById(bookingId, principal));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        }
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<?> updateBooking(
            @PathVariable String bookingId,
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal Object principal) {
        try {
            return ResponseEntity.ok(bookingService.updateBooking(bookingId, request, principal));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> deleteBooking(
            @PathVariable String bookingId,
            @AuthenticationPrincipal Object principal) {
        try {
            bookingService.deleteBooking(bookingId, principal);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/conflict-check")
    public ResponseEntity<Map<String, Boolean>> checkBookingConflict(
            @RequestParam String resourceId,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) String excludeBookingId,
            @AuthenticationPrincipal Object principal) {
        boolean hasConflict = bookingService.hasBookingConflict(resourceId, startTime, endTime, excludeBookingId);
        return ResponseEntity.ok(Map.of("hasConflict", hasConflict));
    }
}
