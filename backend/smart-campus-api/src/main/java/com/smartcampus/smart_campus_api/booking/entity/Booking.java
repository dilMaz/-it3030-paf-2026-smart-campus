package com.smartcampus.smart_campus_api.booking.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;

import lombok.Data;

@Data
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String resourceId;
    private String resourceName;

    private String userId;
    private String userEmail;
    private String userName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;

    private BookingStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
}
