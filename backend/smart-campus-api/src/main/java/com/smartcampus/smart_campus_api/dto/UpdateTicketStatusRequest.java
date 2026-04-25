package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.TicketStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTicketStatusRequest(
        @NotNull(message = "status is required")
        TicketStatus status,
        @Size(max = 600, message = "rejectionReason must not exceed 600 characters")
        String rejectionReason,
        @Size(max = 1200, message = "resolutionNotes must not exceed 1200 characters")
        String resolutionNotes,
        @Size(max = 80, message = "assignedTechnicianId must not exceed 80 characters")
        String assignedTechnicianId) {
}
