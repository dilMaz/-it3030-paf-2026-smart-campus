package com.smartcampus.smart_campus_api.booking.dto;

import java.time.LocalDateTime;

import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BookingResponse {
    String id;
    String resourceId;
    String resourceName;
    String userId;
    String userEmail;
    String userName;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String purpose;
    BookingStatus status;
    LocalDateTime createdAt;
    LocalDateTime reviewedAt;
    String reviewedBy;
}
