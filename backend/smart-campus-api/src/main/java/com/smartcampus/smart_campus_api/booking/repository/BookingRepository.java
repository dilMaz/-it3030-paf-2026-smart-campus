package com.smartcampus.smart_campus_api.booking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.booking.entity.Booking;
import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;

// Repository interface for booking data access operations
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Booking> findByResourceIdAndStatus(String resourceId, BookingStatus status);
}
