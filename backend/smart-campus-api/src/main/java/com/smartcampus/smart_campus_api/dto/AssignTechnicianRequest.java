package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignTechnicianRequest(
        @NotBlank(message = "technicianId is required")
        @Size(max = 80, message = "technicianId must not exceed 80 characters")
        String technicianId) {
}

