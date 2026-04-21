package com.smartcampus.smart_campus_api.dto;

import java.time.Instant;

public record UserProfileResponse(
        String id,
        String name,
        String email,
        String role,
        String profileImageUrl,
        String bio,
        Instant createdAt,
        Instant updatedAt) {
}
