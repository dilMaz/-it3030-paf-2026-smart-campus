package com.smartcampus.smart_campus_api.booking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.booking.entity.Booking;
import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;

// Repository interface for booking data access operations
public interface BookingRepository extends MongoRepository<Booking, String> {
    // Find all bookings ordered by creation date (newest first)
    List<Booking> findAllByOrderByCreatedAtDesc();
    // Find bookings by user ordered by creation date
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
    // Find bookings by resource and status for conflict detection
    List<Booking> findByResourceIdAndStatus(String resourceId, BookingStatus status);
}
