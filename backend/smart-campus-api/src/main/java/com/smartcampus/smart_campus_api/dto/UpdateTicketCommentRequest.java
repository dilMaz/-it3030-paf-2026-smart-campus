package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTicketCommentRequest(
        @NotBlank(message = "content is required")
        @Size(max = 1200, message = "content must not exceed 1200 characters")
        String content) {
}

