package com.smartcampus.smart_campus_api.notification.dto;

import com.smartcampus.smart_campus_api.model.NotificationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
        @NotBlank String userId,
        @NotNull NotificationType type,
        @NotBlank String message,
        String referenceId) {
}
